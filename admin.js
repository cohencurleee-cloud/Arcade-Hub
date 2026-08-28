(()=>{
  const ADMIN_SRC=document.currentScript?.src||location.href;
  const UNLOCK='arcadeAdminUnlocked',SETTINGS='arcadeAdminSettings',CODE='1299',AI_HISTORY='arcadeAIHistory';
  const path=location.pathname.toLowerCase(),isGame=path.includes('/games/');
  let panel=null,button=null,toolsBtn=null,toolsMenu=null,tries=[],aiPanel=null,aiButton=null,aiBusy=false;

  const defaults={
    god:false,speed:1,
    snakeAuto:false,flappyAuto:false,breakoutAuto:false,
    pongAuto:false,pongPrediction:false,
    memoryAuto:false,memoryXray:false,
    poolAuto:false,poolPrediction:false
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function settings(){try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return {...defaults}}}
  function save(s){localStorage.setItem(SETTINGS,JSON.stringify(s));window.dispatchEvent(new CustomEvent('arcade-admin-change',{detail:{settings:s}}))}
  function command(name){window.dispatchEvent(new CustomEvent('arcade-admin-command',{detail:{command:name,settings:settings()}}))}
  function unlocked(){return localStorage.getItem(UNLOCK)==='1'}
  function pageType(){
    if(path.includes('/games/snake.html'))return'snake';
    if(path.includes('/games/flappy-square.html'))return'flappy';
    if(path.includes('/games/breakout.html'))return'breakout';
    if(path.includes('/games/pong.html'))return'pong';
    if(path.includes('/games/memory.html'))return'memory';
    if(path.includes('/games/pool.html'))return'pool';
    if(path.includes('/games/block-dash.html'))return'dash';
    if(path.includes('/games/'))return'game';
    return'hub'
  }
  function speedValue(v){v=Number(v);return Number.isFinite(v)&&v>0?v:1}
  function speedText(v){v=speedValue(v);return(v>=1000000||v<.001)?v.toExponential(2)+'x':String(v)+'x'}
  window.ArcadeAdmin={getSettings:settings,isUnlocked:unlocked,command};

  function css(){
    if(document.getElementById('arcade-admin-style'))return;
    const s=document.createElement('style');s.id='arcade-admin-style';s.textContent=`
html[data-arcade-is-game="1"] .top{right:10px!important}
html[data-arcade-page="pong"] #status{top:max(58px,calc(env(safe-area-inset-top) + 48px))!important;max-width:88vw!important}
#arcadeAdminBtn{position:fixed;z-index:99998;right:12px;top:max(12px,env(safe-area-inset-top));border:1px solid #3a4154;background:rgba(10,12,18,.9);color:#fff;border-radius:12px;padding:9px 12px;font:800 12px system-ui;backdrop-filter:blur(12px)}
#arcadeToolsBtn{position:fixed;z-index:99992;right:max(7px,env(safe-area-inset-right));bottom:max(7px,env(safe-area-inset-bottom));width:38px;height:38px;padding:0;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(10,14,21,.72);color:#fff;font:900 20px/1 system-ui;letter-spacing:1px;opacity:.68;box-shadow:0 6px 18px #0006;backdrop-filter:blur(10px)}
#arcadeToolsBtn:active{opacity:1;transform:scale(.96)}
#arcadeToolsMenu{position:fixed;z-index:100000;right:max(7px,env(safe-area-inset-right));bottom:max(52px,calc(env(safe-area-inset-bottom) + 52px));width:182px;padding:8px;background:rgba(11,15,23,.97);border:1px solid #30384b;border-radius:16px;box-shadow:0 20px 60px #000a;display:grid;gap:6px;backdrop-filter:blur(14px)}
#arcadeToolsMenu button{width:100%;text-align:left;border:1px solid #2f384b;background:#171e2b;color:#fff;border-radius:11px;padding:10px 11px;font:800 13px system-ui}
#arcadeToolsMenu .muted{padding:3px 5px 2px;color:#8993aa;font:700 10px system-ui;text-transform:uppercase;letter-spacing:.06em}
#arcadeAdminPanel{position:fixed;z-index:100003;inset:0;background:rgba(0,0,0,.68);display:grid;place-items:center;padding:18px}
#arcadeAdminPanel .box{width:min(92vw,410px);max-height:86dvh;overflow:auto;background:#11151f;border:1px solid #30384b;border-radius:22px;padding:18px;color:#fff;font:14px system-ui;box-shadow:0 24px 70px #0008}
#arcadeAdminPanel h2{margin:0 0 4px;font-size:22px}#arcadeAdminPanel .muted{color:#9da6ba;margin-bottom:16px}
#arcadeAdminPanel .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #242b3a}#arcadeAdminPanel .row small{display:block;color:#8993aa;font-weight:500;margin-top:3px;max-width:235px}
#arcadeAdminPanel input[type=checkbox]{width:22px;height:22px;accent-color:#6de68b;flex:0 0 auto}#arcadeAdminPanel input[type=range]{width:145px}#arcadeAdminPanel input[type=text]{width:112px;border:1px solid #343d52;background:#090c12;color:#fff;border-radius:10px;padding:9px 8px;font:800 16px system-ui;text-align:center}
#arcadeAdminPanel button{border:1px solid #343d52;background:#1b2230;color:#fff;border-radius:12px;padding:10px 12px;font-weight:800}#arcadeAdminPanel .speedCustom{display:flex;gap:7px;align-items:center}#arcadeAdminPanel .speedCustom button{padding:9px 10px}#arcadeAdminPanel .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}
#arcadePin{position:fixed;z-index:100004;inset:0;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px}#arcadePin .box{width:min(90vw,330px);background:#11151f;border:1px solid #30384b;border-radius:20px;padding:18px;color:#fff;font:14px system-ui}#arcadePin input{width:100%;font-size:28px;letter-spacing:10px;text-align:center;padding:12px;border-radius:12px;border:1px solid #343d52;background:#090c12;color:#fff;margin:12px 0}#arcadePin .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px}#arcadePin button{padding:11px;border-radius:12px;border:1px solid #343d52;background:#1b2230;color:#fff;font-weight:800}
#arcadeAIButton{position:fixed;z-index:99990;right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:48px;height:48px;border-radius:15px;border:1px solid #3b4660;background:rgba(17,22,32,.9);color:#fff;font:900 14px system-ui;box-shadow:0 10px 26px #0007;backdrop-filter:blur(12px)}
#arcadeAIPanel{position:fixed;z-index:100005;right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:min(92vw,390px);height:min(68dvh,520px);background:#0f141e;border:1px solid #30394d;border-radius:22px;box-shadow:0 26px 80px #0009;display:flex;flex-direction:column;overflow:hidden;color:#fff;font:14px system-ui}
#arcadeAIPanel .aiHead{padding:14px 14px 12px;border-bottom:1px solid #242c3b;display:flex;justify-content:space-between;align-items:center}#arcadeAIPanel .aiHead b{font-size:17px}#arcadeAIPanel .aiHead button{border:0;background:#1a2230;color:#fff;border-radius:10px;padding:7px 10px;font-weight:800}
#arcadeAIMessages{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px}#arcadeAIMessages .msg{max-width:86%;padding:10px 12px;border-radius:15px;line-height:1.38;white-space:pre-wrap;word-wrap:break-word}#arcadeAIMessages .user{align-self:flex-end;background:#eef3ff;color:#111827}#arcadeAIMessages .bot{align-self:flex-start;background:#1a2230;border:1px solid #2d374a}
#arcadeAIPanel .aiComposer{display:flex;gap:8px;padding:10px;border-top:1px solid #242c3b;background:#0c1119}#arcadeAIPanel textarea{flex:1;resize:none;min-height:44px;max-height:110px;border:1px solid #30394d;border-radius:13px;background:#151b27;color:#fff;padding:11px;font:16px system-ui;outline:none}#arcadeAIPanel .send{border:1px solid #4a5873;background:#e9efff;color:#101522;border-radius:13px;padding:0 15px;font-weight:900}#arcadeAIPanel .send:disabled{opacity:.5}
@media(max-width:520px){#arcadeAdminPanel{padding:10px}#arcadeAdminPanel .box{max-height:88dvh}#arcadeAIPanel{left:8px;right:8px;width:auto;height:min(72dvh,560px);bottom:max(8px,env(safe-area-inset-bottom))}#arcadeToolsBtn{width:36px;height:36px;border-radius:11px;font-size:18px}#arcadeToolsMenu{bottom:max(49px,calc(env(safe-area-inset-bottom) + 49px))}}
`;document.head.appendChild(s)
  }

  function mountButton(){if(isGame||!unlocked()||button)return;css();button=document.createElement('button');button.id='arcadeAdminBtn';button.textContent='ADMIN';button.onclick=openPanel;document.body.appendChild(button)}
  function autoRow(id,title,desc,checked){return`<div class="row"><span><b>${title}</b><small>${desc}</small></span><input id="${id}" type="checkbox" ${checked?'checked':''}></div>`}
  function openPanel(){
    css();closeTools();if(panel)panel.remove();const s=settings(),type=pageType();let rows='';
    if(type==='snake'||type==='hub')rows+=autoRow('aaSnakeAuto','Snake autopilot','Automatically hunts apples and avoids traps.',s.snakeAuto);
    if(type==='flappy'||type==='hub')rows+=autoRow('aaFlappyAuto','Flappy autopilot','Automatically times jumps through pipe openings.',s.flappyAuto);
    if(type==='breakout'||type==='hub')rows+=autoRow('aaBreakoutAuto','Breakout autopilot','Tracks the ball and catches power-ups.',s.breakoutAuto);
    if(type==='pong'||type==='hub'){rows+=autoRow('aaPongAuto','Pong autopilot','AI controls your paddle and plays for you.',s.pongAuto);rows+=autoRow('aaPongPrediction','Pong prediction','Shows the predicted ball path and landing point.',s.pongPrediction)}
    if(type==='memory'||type==='hub'){rows+=autoRow('aaMemoryAuto','Memory autopilot','Automatically finds and matches every pair.',s.memoryAuto);rows+=autoRow('aaMemoryXray','Memory XRAY','Shows every hidden card while you can still play.',s.memoryXray)}
    if(type==='pool'||type==='hub'){rows+=autoRow('aaPoolAuto','Pool autopilot','Plans legal shots, pockets balls, and plays your turns.',s.poolAuto);rows+=autoRow('aaPoolPrediction','Pool predictor','Shows the cue path, first contact, and planned object-ball line.',s.poolPrediction)}
    const current=speedValue(s.speed),sliderCurrent=clamp(current,.5,20);
    panel=document.createElement('div');panel.id='arcadeAdminPanel';panel.innerHTML=`<div class="box"><h2>Admin Panel</h2><div class="muted">Game controls and testing tools.</div><div class="row"><b>God mode</b><input id="aaGod" type="checkbox" ${s.god?'checked':''}></div><div class="row"><span><b>Game speed</b><small>Quick 0.5x–20x slider.</small></span><span><input id="aaSpeed" type="range" min="0.5" max="20" step="0.5" value="${sliderCurrent}"> <b id="aaSpeedText">${speedText(current)}</b></span></div><div class="row"><span><b>Custom speed</b><small>Any positive finite number.</small></span><span class="speedCustom"><input id="aaCustomSpeed" type="text" inputmode="decimal" value="${current}"><button id="aaSetSpeed">Set</button></span></div>${rows}<div class="buttons"><button id="aaBoost">Boost</button><button id="aaReset">Reset game</button><button id="aaClose">Close</button><button id="aaLock">Lock admin</button></div></div>`;document.body.appendChild(panel);
    const god=panel.querySelector('#aaGod'),speed=panel.querySelector('#aaSpeed'),label=panel.querySelector('#aaSpeedText'),custom=panel.querySelector('#aaCustomSpeed');
    const applySpeed=value=>{const v=Number(String(value).trim());if(!Number.isFinite(v)||v<=0){custom.value=String(speedValue(settings().speed));return}save({...settings(),speed:v});label.textContent=speedText(v);custom.value=String(v);speed.value=String(clamp(v,.5,20))};
    god.onchange=()=>save({...settings(),god:god.checked});speed.oninput=()=>applySpeed(speed.value);panel.querySelector('#aaSetSpeed').onclick=()=>applySpeed(custom.value);custom.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();applySpeed(custom.value);custom.blur()}};
    const binds=[
      ['#aaSnakeAuto','snakeAuto'],['#aaFlappyAuto','flappyAuto'],['#aaBreakoutAuto','breakoutAuto'],
      ['#aaPongAuto','pongAuto'],['#aaPongPrediction','pongPrediction'],
      ['#aaMemoryAuto','memoryAuto'],['#aaMemoryXray','memoryXray'],
      ['#aaPoolAuto','poolAuto'],['#aaPoolPrediction','poolPrediction']
    ];
    for(const[q,k]of binds){const el=panel.querySelector(q);if(el)el.onchange=()=>save({...settings(),[k]:el.checked})}
    panel.querySelector('#aaBoost').onclick=()=>command('boost');panel.querySelector('#aaReset').onclick=()=>command('reset');panel.querySelector('#aaClose').onclick=()=>{panel.remove();panel=null};panel.querySelector('#aaLock').onclick=()=>{localStorage.removeItem(UNLOCK);panel.remove();panel=null;button?.remove();button=null}
  }

  function pin(){css();if(document.getElementById('arcadePin'))return;const p=document.createElement('div');p.id='arcadePin';p.innerHTML=`<div class="box"><b>Enter admin code</b><input id="arcadePinInput" inputmode="numeric" maxlength="4" autocomplete="off"><div class="buttons"><button id="arcadePinCancel">Cancel</button><button id="arcadePinGo">Unlock</button></div></div>`;document.body.appendChild(p);const input=p.querySelector('#arcadePinInput');setTimeout(()=>input.focus(),20);const go=()=>{if(input.value===CODE){localStorage.setItem(UNLOCK,'1');p.remove();mountButton();openPanel()}else{input.value='';input.placeholder='Wrong code'}};input.onkeydown=e=>{if(e.key==='Enter')go()};p.querySelector('#arcadePinGo').onclick=go;p.querySelector('#arcadePinCancel').onclick=()=>p.remove()}
  function hubSecret(){const title=document.querySelector('h1');if(!title)return;title.addEventListener('click',()=>{const n=Date.now();tries=tries.filter(t=>n-t<2600);tries.push(n);if(tries.length>=5){tries=[];pin()}});let digits='';addEventListener('keydown',e=>{if(/^\d$/.test(e.key)){digits=(digits+e.key).slice(-4);if(digits===CODE){localStorage.setItem(UNLOCK,'1');mountButton();openPanel();digits=''}}})}

  function aiHistory(){try{const h=JSON.parse(localStorage.getItem(AI_HISTORY)||'[]');return Array.isArray(h)?h.slice(-16):[]}catch{return[]}}
  function saveAIHistory(h){try{localStorage.setItem(AI_HISTORY,JSON.stringify(h.slice(-16)))}catch{}}
  function renderAI(){if(!aiPanel)return;const box=aiPanel.querySelector('#arcadeAIMessages'),h=aiHistory();box.innerHTML='';if(!h.length){const d=document.createElement('div');d.className='msg bot';d.textContent='Hey — I’m Arcade AI. Ask me about a game, controls, strategies, bugs, or ideas.';box.appendChild(d)}else for(const m of h){const d=document.createElement('div');d.className='msg '+(m.role==='user'?'user':'bot');d.textContent=m.content;box.appendChild(d)}box.scrollTop=box.scrollHeight}
  async function sendAI(){if(aiBusy||!aiPanel)return;const input=aiPanel.querySelector('#arcadeAIInput'),send=aiPanel.querySelector('#arcadeAISend'),text=input.value.trim();if(!text)return;let h=aiHistory();h.push({role:'user',content:text});saveAIHistory(h);input.value='';renderAI();aiBusy=true;send.disabled=true;send.textContent='...';try{const r=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:h,page:document.title+' • '+location.pathname})});const data=await r.json().catch(()=>({}));const reply=r.ok?data.reply:(data.error||'Arcade AI is not connected yet.');h=aiHistory();h.push({role:'assistant',content:String(reply)});saveAIHistory(h)}catch{h=aiHistory();h.push({role:'assistant',content:'I could not reach Arcade AI. Make sure GROQ_API_KEY is set in Vercel.'});saveAIHistory(h)}finally{aiBusy=false;send.disabled=false;send.textContent='Send';renderAI();input.focus()}}
  function openAI(){css();closeTools();if(aiPanel){aiPanel.remove();aiPanel=null;return}aiPanel=document.createElement('div');aiPanel.id='arcadeAIPanel';aiPanel.innerHTML=`<div class="aiHead"><b>Arcade AI</b><button id="arcadeAIClose">Close</button></div><div id="arcadeAIMessages"></div><div class="aiComposer"><textarea id="arcadeAIInput" rows="1" placeholder="Ask Arcade AI..."></textarea><button class="send" id="arcadeAISend">Send</button></div>`;document.body.appendChild(aiPanel);renderAI();aiPanel.querySelector('#arcadeAIClose').onclick=()=>{aiPanel.remove();aiPanel=null};aiPanel.querySelector('#arcadeAISend').onclick=sendAI;aiPanel.querySelector('#arcadeAIInput').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAI()}};setTimeout(()=>aiPanel?.querySelector('#arcadeAIInput')?.focus(),40)}
  function mountAI(){if(isGame||aiButton)return;css();aiButton=document.createElement('button');aiButton.id='arcadeAIButton';aiButton.textContent='AI';aiButton.setAttribute('aria-label','Open Arcade AI');aiButton.onclick=openAI;document.body.appendChild(aiButton)}

  function musicEnabled(){if(window.ArcadeVibes?.isEnabled)return!!window.ArcadeVibes.isEnabled();return localStorage.getItem('arcadeAudioEnabled')!=='0'}
  function closeTools(){if(toolsMenu){toolsMenu.remove();toolsMenu=null}}
  function openTools(){css();if(toolsMenu){closeTools();return}toolsMenu=document.createElement('div');toolsMenu.id='arcadeToolsMenu';const adminItem=unlocked()?'<button id="arcadeToolAdmin">Admin panel</button>':'';toolsMenu.innerHTML=`<div class="muted">Game tools</div>${adminItem}<button id="arcadeToolAI">Arcade AI</button><button id="arcadeToolMusic">Music: ${musicEnabled()?'On':'Off'}</button><button id="arcadeToolClose">Close</button>`;document.body.appendChild(toolsMenu);toolsMenu.querySelector('#arcadeToolAdmin')?.addEventListener('click',openPanel);toolsMenu.querySelector('#arcadeToolAI').onclick=openAI;toolsMenu.querySelector('#arcadeToolMusic').onclick=async()=>{if(window.ArcadeVibes?.toggle)await window.ArcadeVibes.toggle(true);else window.dispatchEvent(new Event('arcade-vibes-toggle'));const el=toolsMenu?.querySelector('#arcadeToolMusic');if(el)el.textContent=`Music: ${musicEnabled()?'On':'Off'}`};toolsMenu.querySelector('#arcadeToolClose').onclick=closeTools}
  function mountTools(){if(!isGame||toolsBtn)return;css();toolsBtn=document.createElement('button');toolsBtn.id='arcadeToolsBtn';toolsBtn.textContent='•••';toolsBtn.setAttribute('aria-label','Open game tools');toolsBtn.onclick=e=>{e.stopPropagation();openTools()};document.body.appendChild(toolsBtn);document.addEventListener('pointerdown',e=>{if(toolsMenu&&!toolsMenu.contains(e.target)&&e.target!==toolsBtn)closeTools()},{passive:true})}

  function loadVibes(){if(document.querySelector('script[data-arcade-vibes]'))return;const s=document.createElement('script');s.dataset.arcadeVibes='1';s.src=new URL('arcade-vibes.js',ADMIN_SRC).href;document.head.appendChild(s)}
  function init(){const type=pageType();document.documentElement.dataset.arcadePage=type;document.documentElement.dataset.arcadeIsGame=isGame?'1':'0';css();if(isGame)mountTools();else{mountButton();mountAI();if(type==='hub')hubSecret()}loadVibes()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();