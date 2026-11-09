/**
 * 本地登录页（由 Host 的 webServer 提供，Desktop 会用系统浏览器打开）。
 *
 * 页面完全自包含：没有外部字体、没有 CDN、没有远程请求 —— 内网/离线可用。
 * 页面只负责收集用户名与密码，校验与凭证写入都发生在 Host 端。
 */

/** 登录页 HTML。@param attemptId - 本次登录尝试的随机 id，提交时回传给 Host 校验。 */
export function renderLoginPage(attemptId) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>DSH · ACCESS GATEWAY</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --cyan:#22d3ee; --violet:#a78bfa; --indigo:#6366f1; --ink:#03060f;
    --line:rgba(99,102,241,.28); --text:#dbe3ff; --dim:#7c8bb8;
  }
  html,body{height:100%}
  body{
    background:var(--ink); color:var(--text); overflow:hidden;
    font-family:"Segoe UI","Microsoft YaHei",system-ui,-apple-system,sans-serif;
    display:grid; place-items:center;
    -webkit-font-smoothing:antialiased;
  }
  /* ── 背景层：极光 + 网格 + 星点 ── */
  .aurora{
    position:fixed; inset:-30%;
    background:
      radial-gradient(38% 42% at 22% 28%,rgba(34,211,238,.20),transparent 62%),
      radial-gradient(34% 38% at 78% 22%,rgba(167,139,250,.20),transparent 60%),
      radial-gradient(46% 46% at 55% 88%,rgba(99,102,241,.22),transparent 62%);
    filter:blur(28px); animation:drift 18s ease-in-out infinite alternate;
  }
  @keyframes drift{
    0%{transform:translate3d(-2%,-1%,0) scale(1)}
    100%{transform:translate3d(3%,2%,0) scale(1.08)}
  }
  .grid{
    position:fixed; inset:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(99,102,241,.07) 1px,transparent 1px),
      linear-gradient(90deg,rgba(99,102,241,.07) 1px,transparent 1px);
    background-size:64px 64px;
    mask-image:radial-gradient(ellipse at 50% 45%,#000 12%,transparent 72%);
    -webkit-mask-image:radial-gradient(ellipse at 50% 45%,#000 12%,transparent 72%);
  }
  #stars{position:fixed; inset:0; opacity:.55}

  /* ── 卡片 ── */
  .card{
    position:relative; width:min(440px,calc(100vw - 40px));
    padding:40px 36px 28px;
    border-radius:20px;
    background:linear-gradient(155deg,rgba(12,18,38,.92),rgba(8,12,26,.96));
    border:1px solid var(--line);
    box-shadow:
      0 0 0 1px rgba(139,92,246,.14),
      0 40px 90px -20px rgba(0,0,0,.9),
      0 0 120px -30px rgba(99,102,241,.55),
      inset 0 1px 0 rgba(255,255,255,.06);
    backdrop-filter:blur(22px) saturate(160%);
    animation:cardIn .7s cubic-bezier(.16,1,.3,1) both;
    overflow:hidden;
  }
  @keyframes cardIn{
    from{opacity:0; transform:translateY(26px) scale(.96); filter:blur(10px)}
    to{opacity:1; transform:none; filter:blur(0)}
  }
  /* 顶部扫光 */
  .card::before{
    content:''; position:absolute; top:0; left:-40%; width:40%; height:2px;
    background:linear-gradient(90deg,transparent,var(--cyan),var(--violet),transparent);
    animation:sweep 4.5s linear infinite;
  }
  @keyframes sweep{0%{left:-40%}100%{left:100%}}
  /* 代码流光 */
  .card::after{
    content:''; position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(180deg,transparent 0%,rgba(34,211,238,.045) 50%,transparent 100%);
    background-size:100% 220%; animation:scan 6s linear infinite;
  }
  @keyframes scan{0%{background-position:0 -120%}100%{background-position:0 220%}}

  header{position:relative; z-index:2; text-align:center; margin-bottom:30px}
  .logo{
    width:54px; height:54px; margin:0 auto 16px; border-radius:15px;
    display:grid; place-items:center; font-size:24px; color:#08111f;
    background:linear-gradient(140deg,var(--cyan),var(--violet));
    box-shadow:0 0 34px rgba(99,102,241,.65),inset 0 1px 0 rgba(255,255,255,.6);
    animation:hover 3.6s ease-in-out infinite;
  }
  @keyframes hover{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  h1{
    font-size:19px; letter-spacing:.22em; font-weight:700;
    background:linear-gradient(100deg,var(--cyan),#c7d2fe 45%,var(--violet));
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .sub{
    margin-top:9px; font-size:10.5px; letter-spacing:.2em; color:var(--dim);
    display:flex; align-items:center; justify-content:center; gap:7px;
  }
  .dot{
    width:6px; height:6px; border-radius:50%; background:#34d399;
    box-shadow:0 0 10px #34d399; animation:blink 2s ease-in-out infinite;
  }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}

  form{position:relative; z-index:2}
  label{
    display:block; font-size:10px; letter-spacing:.18em; color:#8fa0cc;
    margin:0 0 8px 2px; font-weight:600;
  }
  .field{position:relative; margin-bottom:20px}
  .field::after{
    content:''; position:absolute; left:12px; right:12px; bottom:-1px; height:1px;
    background:linear-gradient(90deg,transparent,var(--cyan),var(--violet),transparent);
    opacity:0; transition:opacity .35s;
  }
  .field:focus-within::after{opacity:1}
  input{
    width:100%; padding:13px 15px; font-size:14px; color:#e8eeff;
    background:rgba(3,7,18,.9); border:1px solid rgba(99,102,241,.32);
    border-radius:11px; outline:none; caret-color:var(--cyan);
    transition:border-color .3s,box-shadow .3s,transform .3s;
  }
  input::placeholder{color:rgba(124,139,184,.55)}
  input:focus{
    border-color:rgba(129,140,248,.9);
    box-shadow:0 0 0 3px rgba(99,102,241,.18),0 0 26px rgba(129,140,248,.28);
    transform:translateY(-1px);
  }
  .err{
    min-height:18px; margin:-8px 0 14px; font-size:12px; color:#fb7185;
    letter-spacing:.02em; opacity:0; transition:opacity .25s;
  }
  .err.on{opacity:1}
  button{
    position:relative; width:100%; padding:14px; cursor:pointer;
    font-size:12.5px; font-weight:700; letter-spacing:.2em; color:#fff;
    border:none; border-radius:11px; overflow:hidden;
    background:linear-gradient(110deg,var(--indigo),#8b5cf6 45%,#06b6d4);
    background-size:220% 220%;
    box-shadow:0 10px 34px -8px rgba(99,102,241,.85);
    transition:transform .25s,box-shadow .25s;
    animation:flow 5s ease infinite;
  }
  @keyframes flow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  button:hover{transform:translateY(-2px); box-shadow:0 16px 44px -10px rgba(139,92,246,1)}
  button:active{transform:translateY(0) scale(.985)}
  button:disabled{opacity:.65; cursor:progress; animation:none}
  button::after{
    content:''; position:absolute; inset:0;
    background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.4),transparent 70%);
    transform:translateX(-120%);
  }
  button:hover::after{animation:sheen .85s ease}
  @keyframes sheen{to{transform:translateX(120%)}}

  footer{
    position:relative; z-index:2; margin-top:24px; padding-top:16px;
    border-top:1px solid rgba(99,102,241,.14);
    text-align:center; font-size:9.5px; letter-spacing:.18em; color:#5c6a94;
  }
  .shake{animation:shake .42s cubic-bezier(.36,.07,.19,.97) both}
  @keyframes shake{
    10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}
    30%,50%,70%{transform:translateX(-5px)}40%,60%{transform:translateX(5px)}
  }

  /* ── 成功层 ── */
  .ok{
    position:fixed; inset:0; z-index:50; display:none;
    place-items:center; text-align:center;
    background:radial-gradient(circle at 50% 50%,rgba(6,182,212,.16),rgba(3,6,15,.97) 62%);
    backdrop-filter:blur(6px);
  }
  .ok.on{display:grid; animation:fadeIn .4s ease both}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .ok h2{
    font-size:26px; letter-spacing:.26em; margin:26px 0 12px;
    background:linear-gradient(100deg,#34d399,var(--cyan),var(--violet));
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .ok p{font-size:12.5px; color:#9fb0d8; letter-spacing:.06em}
  .ring{
    width:92px; height:92px; margin:0 auto; border-radius:50%;
    border:2px solid rgba(52,211,153,.25); position:relative;
    display:grid; place-items:center;
  }
  .ring::before,.ring::after{
    content:''; position:absolute; inset:0; border-radius:50%;
    border:2px solid transparent; border-top-color:#34d399;
    animation:spin 1.1s linear infinite;
  }
  .ring::after{border-top-color:var(--cyan); inset:9px; animation-duration:1.7s; animation-direction:reverse}
  @keyframes spin{to{transform:rotate(360deg)}}
  .ring span{font-size:30px; color:#34d399; animation:pop .5s cubic-bezier(.16,1,.3,1) .1s both}
  @keyframes pop{from{transform:scale(0); opacity:0}to{transform:scale(1); opacity:1}}
</style>
</head>
<body>
<canvas id="stars"></canvas>
<div class="aurora"></div>
<div class="grid"></div>

<main class="card" id="card">
  <header>
    <div class="logo">◆</div>
    <h1>ACCESS GATEWAY</h1>
    <p class="sub"><span class="dot"></span>SECURE CHANNEL · OFFLINE MODE</p>
  </header>
  <form id="form" autocomplete="on">
    <label for="u">OPERATOR ID</label>
    <div class="field"><input id="u" name="username" placeholder="请输入用户名" required autofocus></div>
    <label for="p">ACCESS KEY</label>
    <div class="field"><input id="p" name="password" type="password" placeholder="请输入密码" required></div>
    <div class="err" id="err"></div>
    <button id="btn" type="submit">INITIATE LOGIN</button>
  </form>
  <footer>DEEPSEEK HARNESS · CUSTOM AUTH v0.4.0</footer>
</main>

<div class="ok" id="ok">
  <div>
    <div class="ring"><span>✓</span></div>
    <h2>ACCESS GRANTED</h2>
    <p>身份验证通过，正在返回 DeepSeek Harness…</p>
  </div>
</div>

<script>
(function(){
  var ATTEMPT = "__ATTEMPT__";
  var form = document.getElementById('form');
  var btn = document.getElementById('btn');
  var err = document.getElementById('err');
  var card = document.getElementById('card');

  function fail(msg){
    err.textContent = msg;
    err.classList.add('on');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    err.classList.remove('on');
    btn.disabled = true;
    btn.textContent = 'AUTHENTICATING…';
    fetch('/custom-login/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        attempt: ATTEMPT,
        username: document.getElementById('u').value,
        password: document.getElementById('p').value
      })
    }).then(function(r){
      return r.json().then(function(j){ return { ok: r.ok, body: j }; });
    }).then(function(res){
      if (!res.ok || !res.body.ok) {
        btn.disabled = false;
        btn.textContent = 'INITIATE LOGIN';
        fail(res.body.error || '认证失败');
        return;
      }
      document.getElementById('ok').classList.add('on');
      setTimeout(function(){ window.close(); }, 2200);
    }).catch(function(){
      btn.disabled = false;
      btn.textContent = 'INITIATE LOGIN';
      fail('无法连接 DSH 服务，请确认客户端仍在运行');
    });
  });

  /* 星点背景 */
  var c = document.getElementById('stars');
  var x = c.getContext('2d');
  var pts = [];
  function resize(){
    c.width = innerWidth; c.height = innerHeight;
    pts = [];
    var n = Math.min(120, Math.round(innerWidth * innerHeight / 14000));
    for (var i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.5 + .3,
        a: Math.random() * .55 + .15,
        s: Math.random() * .28 + .05
      });
    }
  }
  function draw(){
    x.clearRect(0, 0, c.width, c.height);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.y -= p.s;
      if (p.y < -4) { p.y = c.height + 4; p.x = Math.random() * c.width; }
      x.beginPath();
      x.arc(p.x, p.y, p.r, 0, 6.2832);
      x.fillStyle = 'rgba(147,197,253,' + p.a + ')';
      x.fill();
    }
    requestAnimationFrame(draw);
  }
  resize();
  addEventListener('resize', resize);
  draw();
})();
</script>
</body>
</html>`

  return html.replace('"__ATTEMPT__"', JSON.stringify(String(attemptId)))
}

/**
 * 本地账户页：替换设置页里指向 platform.deepseek.com 的"账号信息/用量/充值"入口。
 *
 * @param account - 账户信息：用户名、登录方式、登录时间。
 */
export function renderAccountPage(account) {
  const name = escapeHtml(account?.name ?? '未登录')
  const method = escapeHtml(account?.method ?? '本地账户')
  const since = escapeHtml(account?.since ?? '—')
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>DSH · 账户信息</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--cyan:#22d3ee;--violet:#a78bfa;--ink:#03060f;--text:#dbe3ff;--dim:#7c8bb8}
  body{
    min-height:100%; background:var(--ink); color:var(--text);
    font-family:"Segoe UI","Microsoft YaHei",system-ui,-apple-system,sans-serif;
    display:grid; place-items:center; padding:32px 20px;
    -webkit-font-smoothing:antialiased;
  }
  .bg{
    position:fixed; inset:-30%; z-index:0;
    background:
      radial-gradient(38% 42% at 20% 26%,rgba(34,211,238,.18),transparent 62%),
      radial-gradient(34% 38% at 80% 20%,rgba(167,139,250,.18),transparent 60%),
      radial-gradient(46% 46% at 55% 88%,rgba(99,102,241,.20),transparent 62%);
    filter:blur(30px);
  }
  .grid{
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(99,102,241,.07) 1px,transparent 1px),
      linear-gradient(90deg,rgba(99,102,241,.07) 1px,transparent 1px);
    background-size:64px 64px;
    mask-image:radial-gradient(ellipse at 50% 40%,#000 10%,transparent 72%);
    -webkit-mask-image:radial-gradient(ellipse at 50% 40%,#000 10%,transparent 72%);
  }
  .card{
    position:relative; z-index:1; width:min(560px,100%);
    padding:34px 32px 26px; border-radius:18px;
    background:linear-gradient(155deg,rgba(12,18,38,.93),rgba(8,12,26,.97));
    border:1px solid rgba(99,102,241,.28);
    box-shadow:0 36px 80px -24px rgba(0,0,0,.9),0 0 110px -40px rgba(99,102,241,.6),
      inset 0 1px 0 rgba(255,255,255,.06);
    backdrop-filter:blur(20px) saturate(160%); overflow:hidden;
  }
  .card::before{
    content:''; position:absolute; top:0; left:-40%; width:40%; height:2px;
    background:linear-gradient(90deg,transparent,var(--cyan),var(--violet),transparent);
    animation:sweep 5s linear infinite;
  }
  @keyframes sweep{0%{left:-40%}100%{left:100%}}
  header{display:flex; align-items:center; gap:14px; margin-bottom:26px}
  .avatar{
    width:52px; height:52px; border-radius:15px; flex:0 0 auto;
    display:grid; place-items:center; font-size:21px; font-weight:700;
    color:#08111f; background:linear-gradient(140deg,var(--cyan),var(--violet));
    box-shadow:0 0 28px rgba(99,102,241,.6),inset 0 1px 0 rgba(255,255,255,.6);
  }
  .who{min-width:0}
  .name{
    font-size:19px; font-weight:700; letter-spacing:.06em;
    background:linear-gradient(100deg,var(--cyan),#c7d2fe 50%,var(--violet));
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .badge{
    display:inline-flex; align-items:center; gap:6px; margin-top:6px;
    font-size:10px; letter-spacing:.16em; color:#86efac;
  }
  .badge i{width:6px; height:6px; border-radius:50%; background:#34d399; box-shadow:0 0 9px #34d399}
  dl{display:grid; grid-template-columns:110px 1fr; gap:14px 18px; font-size:13px}
  dt{color:var(--dim); letter-spacing:.06em; font-size:11.5px; padding-top:1px}
  dd{color:#e6ecff; word-break:break-word}
  .note{
    margin-top:24px; padding:14px 16px; border-radius:11px;
    background:rgba(34,211,238,.05); border:1px solid rgba(34,211,238,.16);
    font-size:11.5px; line-height:1.75; color:#9fb0d8;
  }
  footer{
    margin-top:22px; padding-top:15px; border-top:1px solid rgba(99,102,241,.14);
    text-align:center; font-size:9.5px; letter-spacing:.18em; color:#5c6a94;
  }
</style>
</head>
<body>
<div class="bg"></div><div class="grid"></div>
<main class="card">
  <header>
    <div class="avatar">${name.slice(0, 1).toUpperCase()}</div>
    <div class="who">
      <div class="name">${name}</div>
      <div class="badge"><i></i>LOCAL ACCOUNT · VERIFIED</div>
    </div>
  </header>
  <dl>
    <dt>账户名称</dt><dd>${name}</dd>
    <dt>认证方式</dt><dd>${method}</dd>
    <dt>登录时间</dt><dd>${since}</dd>
    <dt>部署环境</dt><dd>内网 / 离线（不连接 DeepSeek 平台）</dd>
  </dl>
  <div class="note">
    当前账户由 DeepSeek Harness 本地登录插件签发，不依赖 DeepSeek 账号体系。
    余额、用量与充值等平台能力在此部署中不适用。
  </div>
  <footer>DEEPSEEK HARNESS · CUSTOM AUTH v0.4.2</footer>
</main>
</body>
</html>`
}

/** 最小 HTML 转义，页面只渲染来自本机账户表的数据。 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
