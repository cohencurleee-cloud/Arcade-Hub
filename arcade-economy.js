(()=>{
  const KEY='arcadeEconomyV1',THEME_KEY='arcadeHubTheme',GAME_COSMETICS_KEY='arcadeGameCosmeticsV1';
  const CATALOG=[
    {id:'theme-cyber',name:'Cyber Purple',game:'Arcade Hub',type:'theme',price:150,desc:'Purple and electric-blue hub theme.',preview:['#8d7cff','#4bd9ff']},
    {id:'theme-sunset',name:'Sunset Rush',game:'Arcade Hub',type:'theme',price:200,desc:'Warm orange, pink, and deep-purple hub theme.',preview:['#ffb45f','#ff5d8f']},
    {id:'theme-toxic',name:'Toxic Night',game:'Arcade Hub',type:'theme',price:250,desc:'Green neon hub theme with a darker arcade look.',preview:['#b6ff67','#36db83']},

    {id:'dash-sunset',name:'Sunset Cube',game:'Block Dash',type:'dashSkin',skin:'sunset',price:160,desc:'Unlock the Sunset cube and course vibe.',preview:['#ffd07b','#ff547c']},
    {id:'dash-toxic',name:'Toxic Cube',game:'Block Dash',type:'dashSkin',skin:'toxic',price:250,desc:'Unlock the Toxic cube and course vibe.',preview:['#d9ff72','#35d979']},
    {id:'dash-void',name:'Void Cube',game:'Block Dash',type:'dashSkin',skin:'void',price:400,desc:'Unlock the Void cube and course vibe.',preview:['#d89cff','#694cff']},
    {id:'dash-gold',name:'Gold Cube',game:'Block Dash',type:'dashSkin',skin:'gold',price:600,desc:'Unlock the Gold cube and course vibe.',preview:['#fff0a0','#d79725']},

    {id:'flappy-night',name:'Night Flight',game:'Flappy Bird',type:'gameSkin',gameKey:'flappy',skin:'night',price:180,desc:'Turn Flappy Bird into a darker neon night flight.',preview:['#1d315f','#6de8ff']},
    {id:'flappy-candy',name:'Candy Sky',game:'Flappy Bird',type:'gameSkin',gameKey:'flappy',skin:'candy',price:300,desc:'A brighter pink-and-blue candy color remix.',preview:['#ff94cf','#77dcff']},

    {id:'snake-venom',name:'Neon Venom',game:'Snake',type:'gameSkin',gameKey:'snake',skin:'venom',price:200,desc:'Punchier neon colors for the whole Snake board.',preview:['#7dff72','#2fffd3']},
    {id:'snake-ice',name:'Ice Serpent',game:'Snake',type:'gameSkin',gameKey:'snake',skin:'ice',price:320,desc:'Cool blue and icy tones across Snake.',preview:['#d8f4ff','#5faaff']},

    {id:'pong-crimson',name:'Crimson Paddle',game:'Pong',type:'pongSkin',skin:'crimson',price:180,desc:'Unlock the Crimson paddle skin in Pong.',preview:['#ffb0ba','#ed4164']},
    {id:'pong-galaxy',name:'Galaxy Paddle',game:'Pong',type:'pongSkin',skin:'galaxy',price:450,desc:'Unlock the Galaxy paddle skin in Pong.',preview:['#d7a6ff','#5cc9ff']},

    {id:'breakout-plasma',name:'Plasma Breaker',game:'Breakout',type:'gameSkin',gameKey:'breakout',skin:'plasma',price:220,desc:'A hotter neon-plasma look for bricks, balls, and arena.',preview:['#ff70e8','#7b6dff']},
    {id:'breakout-ice',name:'Ice Breaker',game:'Breakout',type:'gameSkin',gameKey:'breakout',skin:'ice',price:340,desc:'Cool the whole Breakout arena into icy blue tones.',preview:['#d9f6ff','#60b8ff']},

    {id:'memory-holo',name:'Hologram Cards',game:'Memory Match',type:'gameSkin',gameKey:'memory',skin:'holo',price:180,desc:'Holographic cyan and violet memory cards.',preview:['#69e6ff','#a57cff']},
    {id:'memory-galaxy',name:'Galaxy Deck',game:'Memory Match',type:'gameSkin',gameKey:'memory',skin:'galaxy',price:350,desc:'A deep-space purple deck with glowing cards.',preview:['#754fff','#df88ff']}
  ];
  const defaults={coins:150,owned:['theme-midnight'],equipped:{theme:'theme-midnight'},lastDaily:'',earned:0,spent:0};
  function fresh(){return JSON.parse(JSON.stringify(defaults))}
  function state(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return{...fresh(),...v,owned:Array.isArray(v.owned)?v.owned:['theme-midnight'],equipped:{theme:'theme-midnight',...(v.equipped||{})}}}catch{return fresh()}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('arcade-economy-change',{detail:{state:s}}));return s}
  function add(amount,reason='Reward'){amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return state().coins;const s=state();s.coins+=amount;s.earned=(s.earned||0)+amount;save(s);window.dispatchEvent(new CustomEvent('arcade-coins-earned',{detail:{amount,reason,balance:s.coins}}));return s.coins}
  function spend(amount){amount=Math.max(0,Math.floor(Number(amount)||0));const s=state();if(amount>s.coins)return false;s.coins-=amount;s.spent=(s.spent||0)+amount;save(s);return true}
  function item(id){return CATALOG.find(x=>x.id===id)||null}
  function owns(id){return state().owned.includes(id)}
  function gameCosmetics(){try{const v=JSON.parse(localStorage.getItem(GAME_COSMETICS_KEY)||'{}');return v&&typeof v==='object'?v:{}}catch{return{}}}
  function setGameCosmetic(gameKey,skin){const v=gameCosmetics();v[gameKey]=skin;localStorage.setItem(GAME_COSMETICS_KEY,JSON.stringify(v));window.dispatchEvent(new CustomEvent('arcade-cosmetic-change',{detail:{gameKey,skin}}))}
  function gameCosmetic(gameKey){return gameCosmetics()[gameKey]||'default'}
  function syncGameUnlock(it,equip=false){
    if(it.type==='pongSkin'){
      const key='pongProfileV2';let p={};try{p=JSON.parse(localStorage.getItem(key)||'{}')}catch{};const u=new Set(Array.isArray(p.unlocked)?p.unlocked:['neon']);u.add('neon');u.add(it.skin);p.unlocked=[...u];if(equip)p.skin=it.skin;localStorage.setItem(key,JSON.stringify(p));
    }
    if(it.type==='dashSkin'){
      const key='blockDashProfileV2';let p={};try{p=JSON.parse(localStorage.getItem(key)||'{}')}catch{};const u=new Set(Array.isArray(p.unlocked)?p.unlocked:['neon']);u.add('neon');u.add(it.skin);p.unlocked=[...u];if(equip)p.skin=it.skin;localStorage.setItem(key,JSON.stringify(p));
    }
    if(it.type==='gameSkin'&&equip)setGameCosmetic(it.gameKey,it.skin);
  }
  function purchase(id){const it=item(id);if(!it)return{ok:false,error:'Item not found'};const s=state();if(s.owned.includes(id))return{ok:true,owned:true,balance:s.coins};if(s.coins<it.price)return{ok:false,error:'Not enough Arcade Coins',balance:s.coins};s.coins-=it.price;s.spent=(s.spent||0)+it.price;s.owned.push(id);save(s);syncGameUnlock(it,false);return{ok:true,balance:s.coins,item:it}}
  function equip(id){const it=item(id);if(!it||!owns(id))return false;const s=state();if(it.type==='theme'){s.equipped.theme=id;localStorage.setItem(THEME_KEY,id)}else syncGameUnlock(it,true);save(s);return true}
  function currentTheme(){return state().equipped.theme||localStorage.getItem(THEME_KEY)||'theme-midnight'}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dailyAvailable(){return state().lastDaily!==today()}
  function claimDaily(){const s=state(),t=today();if(s.lastDaily===t)return{ok:false,balance:s.coins};s.lastDaily=t;s.coins+=30;s.earned=(s.earned||0)+30;save(s);return{ok:true,amount:30,balance:s.coins}}
  window.ArcadeEconomy={state,save,balance:()=>state().coins,add,spend,catalog:()=>CATALOG.map(x=>({...x})),item,owns,purchase,equip,currentTheme,dailyAvailable,claimDaily,gameCosmetics,gameCosmetic,setGameCosmetic};

  if(location.pathname.toLowerCase().includes('/games/')){
    let activeSeconds=0,awarded=0;
    setInterval(()=>{
      if(document.hidden)return;
      activeSeconds+=10;
      if(activeSeconds>=60&&awarded<20){activeSeconds=0;awarded+=3;add(3,'Playtime reward')}
    },10000);
  }
})();