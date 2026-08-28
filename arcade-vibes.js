(()=>{
  const KEY='arcadeAudioEnabled';
  const path=location.pathname.toLowerCase();
  const game=path.includes('flappy-square')?'flappy':path.includes('snake')?'snake':path.includes('breakout')?'breakout':path.includes('pong')?'pong':path.includes('memory')?'memory':path.includes('block-dash')?'dash':'hub';
  const meta={
    hub:{name:'Arcade Hub',icon:'✦',accent:'#8c8cff',accent2:'#59d0ff',notes:[220,277,330,440],shape:'dot'},
    flappy:{name:'Flappy Bird',icon:'🐤',accent:'#9cf05a',accent2:'#70c5ce',notes:[523,659,784,659],shape:'cloud'},
    snake:{name:'Snake',icon:'🐍',accent:'#70e28d',accent2:'#b8ff77',notes:[196,247,294,247],shape:'cell'},
    breakout:{name:'Breakout',icon:'🧱',accent:'#8c8cff',accent2:'#ff7d91',notes:[262,330,392,523],shape:'spark'},
    pong:{name:'Pong',icon:'🏓',accent:'#f5f7ff',accent2:'#63d4ff',notes:[196,294,196,392],shape:'streak'},
    memory:{name:'Memory Match',icon:'🧠',accent:'#d884ff',accent2:'#66d9ff',notes:[392,494,587,494],shape:'star'},
    dash:{name:'Block Dash',icon:'⚡',accent:'#ffbe55',accent2:'#ff6e7f',notes:[165,220,247,330],shape:'streak'}
  }[game];

  let enabled=localStorage.getItem(KEY)!=='0',ctx=null,master=null,timer=null,noteIndex=0,started=false;
  const audioButton=document.createElement('button'),nowPlaying=document.createElement('div'),fx=document.createElement('div');
  const wavCache=new Map();

  function css(){
    const s=document.createElement('style');s.id='arcade-vibes-style';
    s.textContent=`#arcadeAudioButton{position:fixed;z-index:99989;left:12px;bottom:max(12px,env(safe-area-inset-bottom));min-width:52px;height:52px;padding:0 14px;border-radius:17px;border:1px solid rgba(255,255,255,.18);background:rgba(14,18,27,.94);color:#fff;font:900 18px system-ui;box-shadow:0 12px 30px rgba(0,0,0,.35);backdrop-filter:blur(12px)}#arcadeNowPlaying{position:fixed;z-index:18;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);padding:7px 11px;border-radius:999px;background:rgba(10,14,20,.58);border:1px solid rgba(255,255,255,.12);color:#fff;font:800 11px system-ui;letter-spacing:.02em;backdrop-filter:blur(10px);pointer-events:none;opacity:.82}#arcadeSoundToast{position:fixed;z-index:100002;left:50%;top:74px;transform:translateX(-50%);padding:9px 13px;border-radius:999px;background:rgba(10,14,20,.92);border:1px solid rgba(255,255,255,.18);color:#fff;font:800 12px system-ui;pointer-events:none;opacity:0;transition:opacity .18s ease}#arcadeFx{position:fixed;z-index:8;inset:0;overflow:hidden;pointer-events:none;mix-blend-mode:screen;opacity:.30}#arcadeFx i{position:absolute;display:block;will-change:transform,opacity;animation:arcadeFloat linear infinite}@keyframes arcadeFloat{0%{transform:translate3d(0,105vh,0) rotate(0deg);opacity:0}12%{opacity:.75}88%{opacity:.45}100%{transform:translate3d(var(--drift),-14vh,0) rotate(280deg);opacity:0}}@media(max-width:520px){#arcadeNowPlaying{top:auto;bottom:max(18px,calc(env(safe-area-inset-bottom) + 18px));left:74px;right:74px;transform:none;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#arcadeAudioButton{height:50px;min-width:50px;padding:0 12px}#arcadeSoundToast{top:max(84px,calc(env(safe-area-inset-top) + 56px))}}`;
    document.head.appendChild(s)
  }

  function mountEffects(){
    fx.id='arcadeFx';document.body.appendChild(fx);const count=game==='hub'?20:14;
    for(let i=0;i<count;i++){
      const e=document.createElement('i'),size=3+Math.random()*8;e.style.left=(Math.random()*100)+'vw';e.style.width=size+'px';e.style.height=size+'px';e.style.animationDuration=(5+Math.random()*8)+'s';e.style.animationDelay=(-Math.random()*10)+'s';e.style.setProperty('--drift',(-45+Math.random()*90)+'px');e.style.background=i%2?meta.accent:meta.accent2;
      if(meta.shape==='cloud'){e.style.width=(18+Math.random()*28)+'px';e.style.height=(5+Math.random()*7)+'px';e.style.borderRadius='999px';e.style.filter='blur(1px)'}else if(meta.shape==='cell'){e.style.borderRadius='4px';e.style.boxShadow=`0 0 10px ${meta.accent}`}else if(meta.shape==='spark'){e.style.width='2px';e.style.height=(8+Math.random()*18)+'px';e.style.borderRadius='999px';e.style.boxShadow=`0 0 10px ${meta.accent2}`}else if(meta.shape==='streak'){e.style.width=(18+Math.random()*38)+'px';e.style.height='2px';e.style.borderRadius='999px';e.style.boxShadow=`0 0 8px ${meta.accent2}`}else if(meta.shape==='star'){e.style.clipPath='polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%)'}else e.style.borderRadius='50%';fx.appendChild(e)
    }
  }

  function toast(text){let t=document.getElementById('arcadeSoundToast');if(!t){t=document.createElement('div');t.id='arcadeSoundToast';document.body.appendChild(t)}t.textContent=text;t.style.opacity='1';clearTimeout(t._hide);t._hide=setTimeout(()=>t.style.opacity='0',1300)}

  function configureIOSAudio(){
    try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch{}
  }

  function ensureAudio(){
    configureIOSAudio();
    if(ctx)return true;
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;ctx=new AC();master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);return true}catch{return false}
  }
  async function resumeAudio(){if(!ensureAudio())return false;try{if(ctx.state!=='running')await ctx.resume();return ctx.state==='running'}catch{return false}}

  function writeString(view,offset,str){for(let i=0;i<str.length;i++)view.setUint8(offset+i,str.charCodeAt(i))}
  function wavSrc(freq,dur,type='sine'){
    const key=`${Math.round(freq)}-${dur.toFixed(3)}-${type}`;if(wavCache.has(key))return wavCache.get(key);
    const rate=22050,samples=Math.max(1,Math.floor(rate*dur)),buffer=new ArrayBuffer(44+samples*2),view=new DataView(buffer);
    writeString(view,0,'RIFF');view.setUint32(4,36+samples*2,true);writeString(view,8,'WAVE');writeString(view,12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);writeString(view,36,'data');view.setUint32(40,samples*2,true);
    for(let i=0;i<samples;i++){
      const phase=2*Math.PI*freq*i/rate;let wave=Math.sin(phase);
      if(type==='square')wave=Math.sin(phase)>=0?1:-1;else if(type==='triangle')wave=2/Math.PI*Math.asin(Math.sin(phase));
      const fadeIn=Math.min(1,i/(rate*.008)),fadeOut=Math.min(1,(samples-i)/(rate*.025)),amp=.72*fadeIn*fadeOut;
      view.setInt16(44+i*2,Math.max(-1,Math.min(1,wave*amp))*32767,true)
    }
    const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    const src='data:audio/wav;base64,'+btoa(binary);wavCache.set(key,src);return src
  }

  function webTone(freq,dur=.10,vol=.35,type='sine',delay=0){
    if(!enabled||!ensureAudio())return;const play=()=>{if(ctx.state!=='running')return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,vol),t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.025)};if(delay>0)setTimeout(play,delay*1000);else play()
  }

  function tone(freq,dur=.10,vol=.45,type='sine',delay=0){
    if(!enabled)return;
    configureIOSAudio();
    const play=()=>{
      try{
        const a=new Audio(wavSrc(freq,dur,type));a.preload='auto';a.volume=Math.max(.08,Math.min(1,vol*1.65));a.playsInline=true;
        const p=a.play();if(p&&p.catch)p.catch(async()=>{await resumeAudio();webTone(freq,dur,vol,type)})
      }catch{resumeAudio().then(()=>webTone(freq,dur,vol,type))}
    };
    if(delay>0)setTimeout(play,delay*1000);else play()
  }

  function confirmation(){tone(660,.13,.62,'sine');tone(990,.17,.58,'sine',.11)}
  function pulse(){if(!enabled||document.hidden)return;const n=meta.notes[noteIndex++%meta.notes.length],type=(game==='breakout'||game==='dash')?'triangle':game==='pong'?'square':'sine';tone(n,.17,.34,type);if(game==='flappy'&&noteIndex%4===0)tone(n*1.5,.11,.24,'sine',.09);if(game==='memory')tone(n*2,.10,.19,'sine',.12)}
  async function startAudio(showToast=false){
    if(!enabled)return false;configureIOSAudio();await resumeAudio();if(!started){started=true;pulse();timer=setInterval(pulse,game==='dash'?780:game==='breakout'?900:game==='pong'?1100:1450)}if(showToast){confirmation();toast('Sound on')}return true
  }
  function stopAudio(){started=false;if(timer){clearInterval(timer);timer=null}if(ctx&&ctx.state==='running')ctx.suspend().catch(()=>{})}
  function uiClick(){if(enabled){tone(game==='flappy'?660:420,.075,.44,'sine');tone(game==='flappy'?880:560,.055,.30,'sine',.05)}}

  function mountUI(){
    audioButton.id='arcadeAudioButton';audioButton.setAttribute('aria-label','Toggle arcade audio');audioButton.textContent=enabled?'🔊':'🔇';audioButton.onclick=async e=>{e.stopPropagation();configureIOSAudio();if(!enabled){enabled=true;localStorage.setItem(KEY,'1');audioButton.textContent='🔊';await startAudio(true)}else if(started){enabled=false;localStorage.setItem(KEY,'0');audioButton.textContent='🔇';stopAudio();toast('Sound off')}else{await startAudio(true)}};document.body.appendChild(audioButton);
    nowPlaying.id='arcadeNowPlaying';nowPlaying.textContent=`${meta.icon} ${game==='hub'?'Arcade Hub':`Now Playing • ${meta.name}`}`;document.body.appendChild(nowPlaying)
  }

  function init(){
    if(document.getElementById('arcade-vibes-style'))return;configureIOSAudio();css();mountEffects();mountUI();
    const unlock=async()=>{configureIOSAudio();if(enabled)await startAudio(false)};
    addEventListener('pointerdown',unlock,{once:true,passive:true});addEventListener('touchstart',unlock,{once:true,passive:true});addEventListener('keydown',unlock,{once:true});
    document.addEventListener('click',e=>{if(e.target.closest('button,a,.card')&&e.target!==audioButton)uiClick()});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio()});
    window.ArcadeVibes={tone,play:async name=>{if(!enabled)return;configureIOSAudio();const map={score:[980,.10,.50],flap:[700,.07,.44],hit:[150,.14,.64],win:[1180,.22,.58],level:[900,.15,.52]};const v=map[name]||[520,.09,.44];tone(v[0],v[1],v[2],'sine')}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();