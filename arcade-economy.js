(()=>{
  const KEY='arcadeEconomyV1',THEME_KEY='arcadeHubTheme';
  const CATALOG=[
    {id:'theme-cyber',name:'Cyber Purple',game:'Arcade Hub',type:'theme',price:150,desc:'Purple and electric-blue hub theme.',preview:['#8d7cff','#4bd9ff']},
    {id:'theme-sunset',name:'Sunset Rush',game:'Arcade Hub',type:'theme',price:200,desc:'Warm orange, pink, and deep-purple hub theme.',preview:['#ffb45f','#ff5d8f']},
    {id:'theme-toxic',name:'Toxic Night',game:'Arcade Hub',type:'theme',price:250,desc:'Green neon hub theme with a darker arcade look.',preview:['#b6ff67','#36db83']},
    {id:'pong-crimson',name:'Crimson Paddle',game:'Pong',type:'pongSkin',skin:'crimson',price:180,desc:'Unlock the Crimson paddle skin in Pong.',preview:['#ffb0ba','#ed4164']},
    {id:'pong-galaxy',name:'Galaxy Paddle',game:'Pong',type:'pongSkin',skin:'galaxy',price:450,desc:'Unlock the Galaxy paddle skin in Pong.',preview:['#d7a6ff','#5cc9ff']},
    {id:'dash-sunset',name:'Sunset Cube',game:'Block Dash',type:'dashSkin',skin:'sunset',price:160,desc:'Unlock the Sunset cube and course vibe.',preview:['#ffd07b','#ff547c']},
    {id:'dash-toxic',name:'Toxic Cube',game:'Block Dash',type:'dashSkin',skin:'toxic',price:250,desc:'Unlock the Toxic cube and course vibe.',preview:['#d9ff72','#35d979']},
    {id:'dash-void',name:'Void Cube',game:'Block Dash',type:'dashSkin',skin:'void',price:400,desc:'Unlock the Void cube and course vibe.',preview:['#d89cff','#694cff']},
    {id:'dash-gold',name:'Gold Cube',game:'Block Dash',type:'dashSkin',skin:'gold',price:600,desc:'Unlock the Gold cube and course vibe.',preview:['#fff0a0','#d79725']}
  ];
  const defaults={coins:150,owned:['theme-midnight'],equipped:{theme:'theme-midnight'},lastDaily:'',earned:0,spent:0};
  function fresh(){return JSON.parse(JSON.stringify(defaults))}
  function state(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return{...fresh(),...v,owned:Array.isArray(v.owned)?v.owned:['theme-midnight'],equipped:{theme:'theme-midnight',...(v.equipped||{})}}}catch{return fresh()}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent('arcade-economy-change',{detail:{state:s}}));return s}
  function add(amount,reason='Reward'){amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return state().coins;const s=state();s.coins+=amount;s.earned=(s.earned||0)+amount;save(s);window.dispatchEvent(new CustomEvent('arcade-coins-earned',{detail:{amount,reason,balance:s.coins}}));return s.coins}
  function spend(amount){amount=Math.max(0,Math.floor(Number(amount)||0));const s=state();if(amount>s.coins)return false;s.coins-=amount;s.spent=(s.spent||0)+amount;save(s);return true}
  function item(id){return CATALOG.find(x=>x.id===id)||null}
  function owns(id){return state().owned.includes(id)}
  function syncGameUnlock(it,equip=false){
    if(it.type==='pongSkin'){
      const key='pongProfileV2';let p={};try{p=JSON.parse(localStorage.getItem(key)||'{}')}catch{};const u=new Set(Array.isArray(p.unlocked)?p.unlocked:['neon']);u.add('neon');u.add(it.skin);p.unlocked=[...u];if(equip)p.skin=it.skin;localStorage.setItem(key,JSON.stringify(p));
    }
    if(it.type==='dashSkin'){
      const key='blockDashProfileV2';let p={};try{p=JSON.parse(localStorage.getItem(key)||'{}')}catch{};const u=new Set(Array.isArray(p.unlocked)?p.unlocked:['neon']);u.add('neon');u.add(it.skin);p.unlocked=[...u];if(equip)p.skin=it.skin;localStorage.setItem(key,JSON.stringify(p));
    }
  }
  function purchase(id){const it=item(id);if(!it)return{ok:false,error:'Item not found'};const s=state();if(s.owned.includes(id))return{ok:true,owned:true,balance:s.coins};if(s.coins<it.price)return{ok:false,error:'Not enough Arcade Coins',balance:s.coins};s.coins-=it.price;s.spent=(s.spent||0)+it.price;s.owned.push(id);save(s);syncGameUnlock(it,false);return{ok:true,balance:s.coins,item:it}}
  function equip(id){const it=item(id);if(!it||!owns(id))return false;const s=state();if(it.type==='theme'){s.equipped.theme=id;localStorage.setItem(THEME_KEY,id)}else if(it.type==='pongSkin'||it.type==='dashSkin')syncGameUnlock(it,true);save(s);return true}
  function currentTheme(){return state().equipped.theme||localStorage.getItem(THEME_KEY)||'theme-midnight'}
  function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function dailyAvailable(){return state().lastDaily!==today()}
  function claimDaily(){const s=state(),t=today();if(s.lastDaily===t)return{ok:false,balance:s.coins};s.lastDaily=t;s.coins+=30;s.earned=(s.earned||0)+30;save(s);return{ok:true,amount:30,balance:s.coins}}
  window.ArcadeEconomy={state,save,balance:()=>state().coins,add,spend,catalog:()=>CATALOG.map(x=>({...x})),item,owns,purchase,equip,currentTheme,dailyAvailable,claimDaily};

  if(location.pathname.toLowerCase().includes('/games/')){
    let activeSeconds=0,awarded=0;
    setInterval(()=>{
      if(document.hidden)return;
      activeSeconds+=10;
      if(activeSeconds>=60&&awarded<20){activeSeconds=0;awarded+=3;add(3,'Playtime reward')}
    },10000);
  }
})();