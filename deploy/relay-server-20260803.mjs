// Miaoclaw 中继(3.0.1,2026-07-28)—— 部署在 relay.miao-claw.com。
//
// ══ 这个进程的唯一职责:把 A 的包原样交给 B ══════════════════════
//
// 它【不理解】任何业务:看不到对话内容、不知道用户是谁、不碰模型也不碰文件。
// 收到什么就转什么,像个邮差 —— 只看信封上的路由号,不拆信。
//
//   手机 ──wss──▶ 中继 ──wss──▶ 用户自己的电脑
//                (只见 pairId 与密文)
//
// ══ 为什么中继不需要"强鉴权" ══════════════════════════════════════
//
// 真正的安全边界是**端到端加密**,不在这一层:
// 就算有人猜中了 pairId 连上来,他没有 pairSecret —— 发的东西对方解不开,
// 对方发来的他也读不懂。中继放行一个无效连接,后果只是浪费两个字节。
//
// 所以这里只做两件事:① 按 pairId 配对转发 ② 防滥用(限流/上限/超时)。
// 把安全职责集中在加密层,中继就能保持"什么都不懂"—— 这正是它该有的样子:
// 一个什么都不知道的组件,泄露不了任何东西。
//
// 唯一的例外是 agentProof:防止有人抢注别人的 pairId 把真机器挤下线(纯 DoS)。
// 中继只记住首次见到的证明值,之后必须一致才能接管 —— 它推不出 pairSecret。
//
// ══ 部署 ══════════════════════════════════════════════════════════
//   npm install && node server.mjs
//   环境变量:PORT(默认 8787)、MAX_PAIRS、MAX_CLIENTS_PER_PAIR
//   前面通常还有一层 TLS 终止(Caddy/Nginx),见 README。
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const MAX_PAIRS = Number(process.env.MAX_PAIRS || 5000);
const MAX_CLIENTS_PER_PAIR = Number(process.env.MAX_CLIENTS_PER_PAIR || 4);
const MAX_FRAME_BYTES = 5 * 1024 * 1024;          // 与协议层一致:只转文本与小文件
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;            // 静默超过这个时间就断开,回收资源
const PING_INTERVAL_MS = 30 * 1000;
// 单连接每秒帧数上限。一个用户不该能把中继吃满 —— 这是共享资源的底线。
const RATE_LIMIT_FRAMES_PER_SEC = 60;

/** pairId → { agent, agentProof, clients:Set, createdAt } */
const pairs = new Map();

const stats = { started: Date.now(), framesRelayed: 0, bytesRelayed: 0, rejected: 0 };

function log(...args) {
  // 刻意【不记录】任何帧内容 —— 中继看不到内容,日志里当然也不该出现。
  // 只记路由级信息,便于排障。
  console.log(new Date().toISOString(), ...args);
}

function closeWith(ws, code, reason) {
  try { ws.close(code, reason); } catch { /* 已经断了 */ }
}

function getPair(pairId) {
  let pair = pairs.get(pairId);
  if (!pair) {
    if (pairs.size >= MAX_PAIRS) return null;
    pair = { agent: null, agentProof: "", clients: new Set(), createdAt: Date.now() };
    pairs.set(pairId, pair);
  }
  return pair;
}

function dropPairIfEmpty(pairId) {
  const pair = pairs.get(pairId);
  if (pair && !pair.agent && pair.clients.size === 0) pairs.delete(pairId);
}

// 极简令牌桶:够用就好,不引入依赖。
function makeRateLimiter() {
  let tokens = RATE_LIMIT_FRAMES_PER_SEC;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(RATE_LIMIT_FRAMES_PER_SEC, tokens + ((now - last) / 1000) * RATE_LIMIT_FRAMES_PER_SEC);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

const server = createServer((req, res) => {
  // 一个不含任何用户信息的健康检查 —— 部署后用它确认服务活着。
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      uptimeSec: Math.round((Date.now() - stats.started) / 1000),
      pairs: pairs.size,
      framesRelayed: stats.framesRelayed,
      bytesRelayed: stats.bytesRelayed,
      rejected: stats.rejected
    }));
    return;
  }
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Miaoclaw relay");
});

const wss = new WebSocketServer({ server, maxPayload: MAX_FRAME_BYTES });

wss.on("connection", (ws, req) => {
  let url;
  try { url = new URL(req.url, "http://relay.local"); } catch { return closeWith(ws, 1008, "bad url"); }

  const role = url.searchParams.get("role");          // "agent"(电脑) | "client"(手机)
  const pairId = url.searchParams.get("pair") || "";
  const proof = url.searchParams.get("proof") || "";

  if (role !== "agent" && role !== "client") { stats.rejected += 1; return closeWith(ws, 1008, "bad role"); }
  if (!pairId || pairId.length < 16 || pairId.length > 128) { stats.rejected += 1; return closeWith(ws, 1008, "bad pair"); }

  const pair = getPair(pairId);
  if (!pair) { stats.rejected += 1; return closeWith(ws, 1013, "relay full"); }

  if (role === "agent") {
    // 防抢注:首次登记证明值,之后必须一致才能接管。
    // 中继不知道 pairSecret,只是比对同一个不透明字符串 —— 推不出任何东西。
    if (!proof) { stats.rejected += 1; return closeWith(ws, 1008, "proof required"); }
    if (pair.agentProof && pair.agentProof !== proof) {
      stats.rejected += 1;
      log("agent proof mismatch", pairId.slice(0, 8));
      return closeWith(ws, 1008, "proof mismatch");
    }
    pair.agentProof = proof;
    // 同一台电脑重连(网络切换、休眠唤醒)会走到这里 —— 让新连接接管,旧的断开。
    if (pair.agent && pair.agent !== ws) closeWith(pair.agent, 1012, "replaced");
    pair.agent = ws;
    log("agent up", pairId.slice(0, 8), `pairs=${pairs.size}`);
  } else {
    if (pair.clients.size >= MAX_CLIENTS_PER_PAIR) { stats.rejected += 1; return closeWith(ws, 1013, "too many devices"); }
    pair.clients.add(ws);
    log("client up", pairId.slice(0, 8), `clients=${pair.clients.size}`);
  }

  ws.__pairId = pairId;
  ws.__role = role;
  ws.__alive = true;
  ws.__lastSeen = Date.now();
  const allow = makeRateLimiter();

  // 电脑上线时告诉在线的手机一声,反之亦然 —— 前端据此显示"电脑在线/已离线"。
  // 这是路由级信号,不含任何内容。
  const notify = (targets, event) => {
    const text = JSON.stringify({ v: 1, t: "st", p: pairId, r: "", s: event });
    for (const t of targets) { if (t.readyState === 1) { try { t.send(text); } catch { /* 忽略 */ } } }
  };
  if (role === "agent") {
    notify(pair.clients, "agent-online");
    // 对称信号(2026-08-03):电脑此前【无从得知】手机在不在 —— 桌面横幅只能拿自己
    // 到中继的连接状态冒充"手机通道状态",两端各说各话。手机已在线时告诉刚上线的电脑。
    if (pair.clients.size > 0) notify([ws], "client-online");
  } else {
    if (pair.agent) notify([ws], "agent-online");
    else notify([ws], "agent-offline");
    // 第一台手机上线 → 告诉电脑(路由级信号,不含内容)
    if (pair.clients.size === 1 && pair.agent) notify([pair.agent], "client-online");
  }

  ws.on("message", (data, isBinary) => {
    ws.__lastSeen = Date.now();
    if (isBinary) { return; }                        // 协议是纯文本 JSON 帧
    // ⭐ 超速【丢这一帧】,不断连接。断连是灾难放大器:流式回复的 token 帧
    //    一旦超速,整条连接被踢,在飞的其它请求全部陪葬 —— 真机病例:电脑答完、
    //    手机等到超时。丢单帧的代价只是那一个 chunk 缺失,协议各层都有兜底。
    //    (客户端也已合帧把速率压下来;这里是最后防线,不是常规路径。)
    const text = data.toString();
    if (!allow()) {
      // ⭐ 小的控制帧(流终结 se/中止 ab)免于限速丢弃(2026-08-03):被丢的如果恰是
      //    终结帧,手机端那条流就永远等不到结束 = 占位永挂的触发器。控制帧只有几百字节,
      //    放行不影响限速目标(限的是数据洪峰);为防伪装,超过 2KB 的一律照丢。
      const isSmallControl = text.length <= 2048 && /"t"\s*:\s*"(se|ab)"/.test(text.slice(0, 160));
      if (!isSmallControl) { stats.rejected += 1; return; }
    }
    if (text.length > MAX_FRAME_BYTES) { stats.rejected += 1; return closeWith(ws, 1009, "frame too large"); }

    // ⭐ 中继在这里【只看信封】:确认这一帧属于本连接的 pairId,别的什么都不解析。
    // 刻意不 JSON.parse 整个帧去读业务字段 —— 少懂一点,就少一分泄露的可能。
    let envelope;
    try { envelope = JSON.parse(text); } catch { stats.rejected += 1; return; }
    if (!envelope || envelope.p !== pairId) {
      // 想借自己的连接把包发给别人的配对 —— 直接掐掉
      stats.rejected += 1;
      log("cross-pair attempt", pairId.slice(0, 8));
      return closeWith(ws, 1008, "pair mismatch");
    }

    // 应用层心跳回显(2026-08-02 长连接韧性):协议 FRAME_TYPES 早已定义 PING("pi")/PONG("po"),
    // 这里补上实现 —— 终端靠它检测【自己这半边】是否还活着(WS 协议层 ping 只保"中继看终端"
    // 方向,终端侧 API 看不见 pong)。只回给发送方、绝不转发、不含任何内容 —— 中继依旧什么
    // 都不懂。老客户端不发 pi,完全不受影响。
    if (envelope.t === "pi") {
      if (ws.readyState === 1) {
        try { ws.send(JSON.stringify({ v: 1, t: "po", p: pairId, r: envelope.r || "" })); }
        catch { /* 忽略 */ }
      }
      return;
    }

    const targets = role === "client"
      ? (pair.agent ? [pair.agent] : [])
      : [...pair.clients];

    if (targets.length === 0) {
      // 对端不在线:如实告诉发送方,别让它干等
      if (ws.readyState === 1) {
        try { ws.send(JSON.stringify({ v: 1, t: "st", p: pairId, r: envelope.r || "", s: "peer-offline" })); }
        catch { /* 忽略 */ }
      }
      return;
    }

    for (const target of targets) {
      if (target.readyState !== 1) continue;
      try {
        target.send(text);
        stats.framesRelayed += 1;
        stats.bytesRelayed += text.length;
      } catch { /* 单个目标发送失败不影响其它 */ }
    }
  });

  ws.on("pong", () => { ws.__alive = true; ws.__lastSeen = Date.now(); });

  ws.on("close", () => {
    if (role === "agent") {
      if (pair.agent === ws) {
        pair.agent = null;
        notify(pair.clients, "agent-offline");
        log("agent down", pairId.slice(0, 8));
      }
    } else {
      pair.clients.delete(ws);
      // 最后一台手机离线 → 告诉电脑(电脑据此收口为这台手机悬着的转发流,并更新界面)
      if (pair.clients.size === 0 && pair.agent) notify([pair.agent], "client-offline");
    }
    dropPairIfEmpty(pairId);
  });

  ws.on("error", () => { /* 关闭事件里统一清理 */ });
});

// 保活 + 回收:手机切后台、笔记本合盖都会留下半死连接,不清理会堆满内存。
const heartbeat = setInterval(() => {
  const now = Date.now();
  for (const ws of wss.clients) {
    if (now - (ws.__lastSeen || 0) > IDLE_TIMEOUT_MS) { closeWith(ws, 1001, "idle"); continue; }
    if (ws.__alive === false) { closeWith(ws, 1001, "no pong"); continue; }
    ws.__alive = false;
    try { ws.ping(); } catch { /* 忽略 */ }
  }
}, PING_INTERVAL_MS);
heartbeat.unref?.();

server.listen(PORT, () => {
  log(`Miaoclaw relay listening on :${PORT}`);
});

// 中继挂了整条远程链路就断了,所以任何未捕获异常都不能让进程退出。
process.on("uncaughtException", (err) => log("uncaughtException", err?.message || err));
process.on("unhandledRejection", (err) => log("unhandledRejection", err?.message || err));

export { server, wss, pairs, stats };
