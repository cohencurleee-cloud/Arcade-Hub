(()=>{
  const ADMIN_SRC=document.currentScript?.src||location.href;
  const UNLOCK='arcadeAdminUnlocked',SETTINGS='arcadeAdminSettings',CODE='1299',AI_HISTORY='arcadeAIHistory';
  let panel=null,button=null,tries=[],aiPanel=null,aiButton=null,aiBusy=false;
  const defaults={god:false,speed:1,snakeAuto:false,flappyAuto:false,breakoutAuto:false};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function settings(){try{return{...defaults,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return{...defaults}}}
  function save(s){localStorage.setItem(SETTINGS,JSON.stringify(s));window.dispatchEvent(new CustomEvent('arcade-admin-change',{detail:{settings:s}}))}
  function command(name){window.dispatchEvent(new CustomEvent('arcade-admin-command',{detail:{command:name,settings:settings()}))}
  function unlocked(){return localStorage.getItem(UNLOCK)==='1'}
  function pageType(){const p=location.pathname.toLowerCase();if(p.includes('/games/snake.html'))return'snake';if(p.includes('/games/flappy-square.html'))return'flappy';if(p.includes('/games/breakout.html'))return'breakout';if(p.includes('/games/'))return'game';return'hub'}
  function speedText(v){v=Number(v);if(!Number.isFinite(v)||v<=0)return'1x';if(v>=1000000||v<.001)return v.toExponential(2)+'x';return String(v)+'x'}
  window.ArcadeAdmin={getSettings:settings,isUnlocked:unlocked,command};

  function css(){
    if(document.getElementById('arcade-admin-style'))return;
    const s=document.createElement('style');s.id='arcade-admin-style';
    s.textContent=`
#arcadeAdminBtn{position:fixed;z-index:99998;right:12px;top:max(12px,env(safe-area-inset-top));border:1px solid #3a4154;background:rgba(10,12,18,.9);color:#fff;border-radius:12px;padding:9px 12px;font:800 12px system-ui;backdrop-filter:blur(12px)}
#arcadeAdminPanel{position:fixed;z-index:99999;inset:0;background:rgba(0,0,0,.68);display:grid;place-items:center;padding:18px}
#arcadeAdminPanel .box{width:min(92vw,390px);max-height:86vh;overflow:auto;background:#11151f;border:1px solid #30384b;border-radius:22px;padding:18px;color:#fff;font:14px system-ui;box-shadow:0 24px 70px #0008}
#arcadeAdminPanel h2{margin:0 0 4px;font-size:22px}#arcadeAdminPanel .muted{color:#9da6ba;margin-bottom:16px}
#arcadeAdminPanel .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #242b3a}
#arcadeAdminPanel .row small{display:block;color:#8993aa;font-weight:500;margin-top:3px;max-width:220px}
#arcadeAdminPanel input[type=checkbox]{width:22px;height:22px;accent-color:#6de68b;flex:0 0 auto}
#arcadeAdminPanel input[type=range]{width:145px}
#arcadeAdminPanel input[type=text]{width:108px;border:1px solid #343d52;background:#090c12;color:#fff;border-radius:10px;padding:9px 8px;font:800 16px system-ui;text-align:center}
#arcadeAdminPanel button{border:1px solid #343d52;background:#1b2230;color:#fff;border-radius:12px;padding:10px 12px;font-weight:800}
#arcadeAdminPanel .speedCustom{display:flex;gap:7px;align-items:center}#arcadeAdminPanel .speedCustom button{padding:9px 10px}
#arcadeAdminPanel .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}
#arcadePin{position:fixed;z-index:100000;inset:0;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px}
#arcadePin .box{width:min(90vw,330px);background:#11151f;border:1px solid #30384b;border-radius:20px;padding:18px;color:#fff;font:14px system-ui}
#arcadePin input{width:100%;font-size:28px;letter-spacing:10px;text-align:center;padding:12px;border-radius:12px;border:1px solid #343d52;background:#090c12;color:#fff;margin:12px 0}
#arcadePin .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px}#arcadePin button{padding:11px;border-radius:12px;border:1px solid #343d52;background:#1b2230;color:#fff;font-weight:800}
#arcadeAIButton{position:fixed;z-index:99990;right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:54px;height:54px;border-radius:18px;border:1px solid #3b4660;background:rgba(17,22,32,.94);color:#fff;font:900 15px system-ui;box-shadow:0 12px 30px #0007;backdrop-filter:blur(12px)}
#arcadeAIPanel{position:fixed;z-index:100001;right:12px;bottom:max(76px,calc(env(safe-area-inset-bottom) + 76px));width:min(92vw,390px);height:min(68vh,520px);background:#0f141e;border:1px solid #30394d;border-radius:22px;box-shadow:0 26px 80px #0009;display:flex;flex-direction:column;overflow:hidden;color:#fff;font:14px system-ui}
#arcadeAIPanel .aiHead{padding:14px 14px 12px;border-bottom:1px solid #242c3b;display:flex;justify-content:space-between;align-items:center}#arcadeAIPanel .aiHead b{font-size:17px}#arcadeAIPanel .aiHead button{border:0;background:#1a2230;color:#fff;border-radius:10px;padding:7px 10px;font-weight:800}
#arcadeAIMessages{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px}#arcadeAIMessages .msg{max-width:86%;padding:10px 12px;border-radius:15px;line-height:1.38;white-space:pre-wrap;word-wrap:break-word}#arcadeAIMessages .user{align-self:flex-end;background:#eef3ff;color:#111827}#arcadeAIMessages .bot{align-self:flex-start;background:#1a2230;border:1px solid #2d374a}
#arcadeAIPanel .aiComposer{display:flex;gap:8px;padding:10px;border-top:1px solid #242c3b;background:#0c1119}#arcadeAIPanel textarea{flex:1;resize:none;min-height:44px;max-height:110px;border:1px solid #30394d;border-radius:13px;background:#151b27;color:#fff;padding:11px;font:16px system-ui;outline:none}#arcadeAIPanel .send{border:1px solid #4a5873;background:#e9efff;color:#101522;border-radius:13px;padding:0 15px;font-weight:900}#arcadeAIPanel .send:disabled{opacity:.5}
@media(max-width:520px){#arcadeAIPanel{left:8px;right:8px;width:auto;height:min(70vh,560px);bottom:max(74px,calc(env(safe-area-inset-bottom) + 74px))}}
`;
    document.head.appendChild(s)
  }

  function mountButton(){if(!unlocked()||button)return;css();button=document.createElement('button');button.id='arcadeAdminBtn';button.textContent='ADMIN';button.onclick=openPanel;document.body.appendChild(button)}
  function autoRow(id,title,desc,checked){return `<div class="row"><span><b>${title}</b><small>${desc}</small></span><input id="${id}" type="checkbox" ${checked?'checked':''}></div>`}
  function openPanel(){
    css();if(panel)panel.remove();
    const s=settings(),type=pageType();let autoRows='';
    if(type==='snake'||type==='hub')autoRows+=autoRow('aaSnakeAuto','Snake autopilot','Automatically hunts apples and tries to avoid trapping itself.',s.snakeAuto);
    if(type==='flappy'||type==='hub')autoRows+=autoRow('aaFlappyAuto','Flappy autopilot','Automatically times real jumps and aims for pipe openings.',s.flappyAuto);
    if(type==='breakout'||type==='hub')autoRows+=autoRow('aaBreakoutAuto','Breakout autopilot','Tracks the ball and catches falling power-ups.',s.breakoutAuto);
    const raw=Number(s.speed),current=Number.isFinite(raw)&&raw>0?raw:1,sliderCurrent=clamp(current,.5,20);
    panel=document.createElement('div');panel.id='arcadeAdminPanel';
    panel.innerHTML=`<div class="box"><h2>Admin Panel</h2><div class="muted">Unlocked for every Arcade Hub game.</div><div class="row"><b>God mode</b><input id="aaGod" type="checkbox" ${s.god?'checked':''}></div><div class="row"><span><b>Game speed</b><small>Slider is a quick 0.5x–20x control.</small></span><span><input id="aaSpeed" type="range" min="0.5" max="20" step="0.5" value="${sliderCurrent}"> <b id="aaSpeedText">${speedText(current)}</b></span></div><div class="row"><span><b>Custom speed</b><small>No maximum — type any positive number.</small></span><span class="speedCustom"><input id="aaCustomSpeed" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${current}"><button id="aaSetSpeed">Set</button></span></div>${autoRows}<div class="buttons"><button id="aaBoost">Boost</button><button id="aaReset">Reset game</button><button id="aaClose">Close</button><button id="aaLock">Lock admin</button></div></div>`;
    document.body.appendChild(panel);
    const god=panel.querySelector('#aaGod'),speed=panel.querySelector('#aaSpeed'),label=panel.querySelector('#aaSpeedText'),custom=panel.querySelector('#aaCustomSpeed');
    const applySpeed=v=>{v=Number(String(v).trim());if(!Number.isFinite(v)||v<=0){custom.value=String(settings().speed||1);return}save({...settings(),speed:v});label.textContent=speedText(v);custom.value=String(v);speed.value=String(clamp(v,.5,20))};
    god.onchange=()=>save({...settings(),god:god.checked});
    speed.oninput=()=>applySpeed(speed.value);
    panel.querySelector('#aaSetSpeed').onclick=()=>applySpeed(custom.value);
    custom.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applySpeed(custom.value);custom.blur()}});
    const snake=panel.querySelector('#aaSnakeAuto'),flappy=panel.querySelector('#aaFlappyAuto'),breakout=panel.querySelector('#aaBreakoutAuto');
    if(snake)snake.onchange=()=>save({...settings(),snakeAuto:snake.checked});
    if(flappy)flappy.onchange=()=>save({...settings(),flappyAuto:flappy.checked});
    if(breakout)breakout.onchange=()=>save({...settings(),breakoutAuto:breakout.checked});
    panel.querySelector('#aaBoost').onclick=()=>command('boost');
    panel.querySelector('#aaReset').onclick=()=>command('reset');
    panel.querySelector('#aaClose').onclick=()=>{panel.remove();panel=null};
    panel.querySelector('#aaLock').onclick=()=>{localStorage.removeItem(UNLOCK);panel.remove();panel=null;button?.remove();button=null}
  }

  function pin(){
    css();if(document.getElementById('arcadePin'))return;
    const p=document.createElement('div');p.id='arcadePin';p.innerHTML=`<div class="box"><b>Enter admin code</b><input id="arcadePinInput" inputmode="numeric" maxlength="4" autocomplete="off"><div class="buttons"><button id="arcadePinCancel">Cancel</button><button id="arcadePinGo">Unlock</button></div></div>`;document.body.appendChild(p);
    const input=p.querySelector('#arcadePinInput');setTimeout(()=>input.focus(),20);
    const go=()=>{if(input.value===CODE){localStorage.setItem(UNLOCK,'1');p.remove();mountButton();openPanel()}else{input.value='';input.placeholder='Wrong code'}};
    input.onkeydown=e=>{if(e.key==='Enter')go()};p.querySelector('#arcadePinGo').onclick=go;p.querySelector('#arcadePinCancel').onclick=()=>p.remove()
  }

  function hubSecret(){const title=document.querySelector('h1');if(!title)return;title.addEventListener('click',()=>{const n=Date.now();tries=tries.filter(t=>n-t<2600);tries.push(n);if(tries.length>=5){tries=[];pin()}});let digits='';addEventListener('keydown',e=>{if(/^\d$/.test(e.key)){digits=(digits+e.key).slice(-4);if(digits===CODE){localStorage.setItem(UNLOCK,'1');mountButton();openPanel();digits=''}}})}

  function aiHistory(){try{const h=JSON.parse(localStorage.getItem(AI_HISTORY)||'[]');return Array.isArray(h)?h.slice(-12):[]}catch{return[]}}
  function saveAIHistory(h){try{localStorage.setItem(AI_HISTORY,JSON.stringify(h.slice(-12)))}catch{}}
  function renderAI(){if(!aiPanel)return;const box=aiPanel.querySelector('#arcadeAIMessages'),h=aiHistory();box.innerHTML='';if(!h.length){const d=document.createElement('div');d.className='msg bot';d.textContent='Hey — I’m Arcade AI. Ask me about a game, controls, strategies, bugs, or ideas.';box.appendChild(d)}else for(const m of h){const d=document.createElement('div');d.className='msg '+(m.role==='user'?'user':'bot');d.textContent=m.content;box.appendChild(d)}box.scrollTop=box.scrollHeight}
  async function sendAI(){
    if(aiBusy||!aiPanel)return;const input=aiPanel.querySelector('#arcadeAIInput'),send=aiPanel.querySelector('#arcadeAISend'),text=input.value.trim();if(!text)return;
    let h=aiHistory();h.push({role:'user',content:text});saveAIHistory(h);input.value='';renderAI();aiBusy=true;send.disabled=true;send.textContent='...';
    try{const r=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:h,page:document.title+' • '+location.pathname})});const data=await r.json().catch(()=>({}));const reply=r.ok?data.reply:(data.error||'Arcade AI is not connected yet.');h=aiHistory();h.push({role:'assistant',content:String(reply)});saveAIHistory(h)}catch{h=aiHistory();h.push({role:'assistant',content:'I could not reach Arcade AI. Make sure GROQ_API_KEY is set in Vercel.'});saveAIHistory(h)}finally{aiBusy=false;send.disabled=false;send.textContent='Send';renderAI();input.focus()}
  }
  function openAI(){css();if(aiPanel){aiPanel.remove();aiPanel=null;return}aiPanel=document.createElement('div');aiPanel.id='arcadeAIPanel';aiPanel.innerHTML=`<div class="aiHead"><b>Arcade AI</b><button id="arcadeAIClose">Close</button></div><div id="arcadeAIMessages"></div><div class="aiComposer"><textarea id="arcadeAIInput" rows="1" placeholder="Ask Arcade AI..."></textarea><button class="send" id="arcadeAISend">Send</button></div>`;document.body.appendChild(aiPanel);renderAI();aiPanel.querySelector('#arcadeAIClose').onclick=()=>{aiPanel.remove();aiPanel=null};aiPanel.querySelector('#arcadeAISend').onclick=sendAI;aiPanel.querySelector('#arcadeAIInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI()}});setTimeout(()=>aiPanel?.querySelector('#arcadeAIInput')?.focus(),40)}
  function mountAI(){if(aiButton)return;css();aiButton=document.createElement('button');aiButton.id='arcadeAIButton';aiButton.textContent='AI';aiButton.setAttribute('aria-label','Open Arcade AI');aiButton.onclick=openAI;document.body.appendChild(aiButton)}
  function loadVibes(){if(document.querySelector('script[data-arcade-vibes]'))return;const s=document.createElement('script');s.dataset.arcadeVibes='1';s.src=new URL('arcade-vibes.js',ADMIN_SRC).href;document.head.appendChild(s)}
  function init(){mountButton();mountAI();loadVibes();if(pageType()==='hub')hubSecret()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();