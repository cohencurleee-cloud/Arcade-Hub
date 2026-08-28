(()=>{
  const UNLOCK='arcadeAdminUnlocked', SETTINGS='arcadeAdminSettings', CODE='1299';
  let panel,button,tries=[];
  const defaults={god:false,speed:1,snakeAuto:false,flappyAuto:false,breakoutAuto:false};
  function settings(){try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS)||'{}')}}catch{return {...defaults}}}
  function save(s){localStorage.setItem(SETTINGS,JSON.stringify(s));window.dispatchEvent(new CustomEvent('arcade-admin-change',{detail:{settings:s}}))}
  function command(name){window.dispatchEvent(new CustomEvent('arcade-admin-command',{detail:{command:name,settings:settings()}}))}
  function unlocked(){return localStorage.getItem(UNLOCK)==='1'}
  function pageType(){
    const p=location.pathname.toLowerCase();
    if(p.includes('/games/snake.html'))return'snake';
    if(p.includes('/games/flappy-square.html'))return'flappy';
    if(p.includes('/games/breakout.html'))return'breakout';
    if(p.includes('/games/'))return'game';
    return'hub'
  }
  window.ArcadeAdmin={getSettings:settings,isUnlocked:unlocked,command};
  function css(){
    if(document.getElementById('arcade-admin-style'))return;
    const s=document.createElement('style');s.id='arcade-admin-style';
    s.textContent=`#arcadeAdminBtn{position:fixed;z-index:99998;right:12px;top:max(12px,env(safe-area-inset-top));border:1px solid #3a4154;background:rgba(10,12,18,.9);color:#fff;border-radius:12px;padding:9px 12px;font:800 12px system-ui;backdrop-filter:blur(12px)}#arcadeAdminPanel{position:fixed;z-index:99999;inset:0;background:rgba(0,0,0,.68);display:grid;place-items:center;padding:18px}#arcadeAdminPanel .box{width:min(92vw,390px);max-height:86vh;overflow:auto;background:#11151f;border:1px solid #30384b;border-radius:22px;padding:18px;color:#fff;font:14px system-ui;box-shadow:0 24px 70px #0008}#arcadeAdminPanel h2{margin:0 0 4px;font-size:22px}#arcadeAdminPanel .muted{color:#9da6ba;margin-bottom:16px}#arcadeAdminPanel .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #242b3a}#arcadeAdminPanel .row small{display:block;color:#8993aa;font-weight:500;margin-top:3px;max-width:220px}#arcadeAdminPanel input[type=checkbox]{width:22px;height:22px;accent-color:#6de68b;flex:0 0 auto}#arcadeAdminPanel input[type=range]{width:145px}#arcadeAdminPanel button{border:1px solid #343d52;background:#1b2230;color:#fff;border-radius:12px;padding:10px 12px;font-weight:800}#arcadeAdminPanel .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}#arcadePin{position:fixed;z-index:100000;inset:0;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px}#arcadePin .box{width:min(90vw,330px);background:#11151f;border:1px solid #30384b;border-radius:20px;padding:18px;color:#fff;font:14px system-ui}#arcadePin input{width:100%;font-size:28px;letter-spacing:10px;text-align:center;padding:12px;border-radius:12px;border:1px solid #343d52;background:#090c12;color:#fff;margin:12px 0}#arcadePin .buttons{display:grid;grid-template-columns:1fr 1fr;gap:9px}#arcadePin button{padding:11px;border-radius:12px;border:1px solid #343d52;background:#1b2230;color:#fff;font-weight:800}`;
    document.head.appendChild(s)
  }
  function mountButton(){if(!unlocked()||button)return;css();button=document.createElement('button');button.id='arcadeAdminBtn';button.textContent='ADMIN';button.onclick=openPanel;document.body.appendChild(button)}
  function autoRow(id,title,desc,checked){return `<div class="row"><span><b>${title}</b><small>${desc}</small></span><input id="${id}" type="checkbox" ${checked?'checked':''}></div>`}
  function openPanel(){
    css();if(panel)panel.remove();
    const s=settings(),type=pageType();let autoRows='';
    if(type==='snake'||type==='hub')autoRows+=autoRow('aaSnakeAuto','Snake autopilot','Automatically hunts apples and tries to avoid trapping itself.',s.snakeAuto);
    if(type==='flappy'||type==='hub')autoRows+=autoRow('aaFlappyAuto','Flappy autopilot','Automatically times flaps and aims for the next pipe gap.',s.flappyAuto);
    if(type==='breakout'||type==='hub')autoRows+=autoRow('aaBreakoutAuto','Breakout autopilot','Automatically tracks the ball and catches falling power-ups.',s.breakoutAuto);
    panel=document.createElement('div');panel.id='arcadeAdminPanel';
    panel.innerHTML=`<div class="box"><h2>Admin Panel</h2><div class="muted">Unlocked for every Arcade Hub game.</div><div class="row"><b>God mode</b><input id="aaGod" type="checkbox" ${s.god?'checked':''}></div><div class="row"><b>Game speed</b><span><input id="aaSpeed" type="range" min="0.5" max="2" step="0.1" value="${s.speed}"> <b id="aaSpeedText">${Number(s.speed).toFixed(1)}x</b></span></div>${autoRows}<div class="buttons"><button id="aaBoost">Boost</button><button id="aaReset">Reset game</button><button id="aaClose">Close</button><button id="aaLock">Lock admin</button></div></div>`;
    document.body.appendChild(panel);
    const god=panel.querySelector('#aaGod'),speed=panel.querySelector('#aaSpeed'),label=panel.querySelector('#aaSpeedText');
    god.onchange=()=>save({...settings(),god:god.checked});
    speed.oninput=()=>{label.textContent=Number(speed.value).toFixed(1)+'x';save({...settings(),speed:+speed.value})};
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
    const p=document.createElement('div');p.id='arcadePin';
    p.innerHTML=`<div class="box"><b>Enter admin code</b><input id="arcadePinInput" inputmode="numeric" maxlength="4" autocomplete="off"><div class="buttons"><button id="arcadePinCancel">Cancel</button><button id="arcadePinGo">Unlock</button></div></div>`;
    document.body.appendChild(p);
    const input=p.querySelector('#arcadePinInput');setTimeout(()=>input.focus(),20);
    const go=()=>{if(input.value===CODE){localStorage.setItem(UNLOCK,'1');p.remove();mountButton();openPanel()}else{input.value='';input.placeholder='Wrong code'}};
    input.onkeydown=e=>{if(e.key==='Enter')go()};p.querySelector('#arcadePinGo').onclick=go;p.querySelector('#arcadePinCancel').onclick=()=>p.remove()
  }
  function hubSecret(){
    const title=document.querySelector('h1');if(!title)return;
    title.addEventListener('click',()=>{const n=Date.now();tries=tries.filter(t=>n-t<2600);tries.push(n);if(tries.length>=5){tries=[];pin()}});
    let digits='';addEventListener('keydown',e=>{if(/^\d$/.test(e.key)){digits=(digits+e.key).slice(-4);if(digits===CODE){localStorage.setItem(UNLOCK,'1');mountButton();openPanel();digits=''}}})
  }
  document.addEventListener('DOMContentLoaded',()=>{mountButton();if(pageType()==='hub')hubSecret()})
})();
