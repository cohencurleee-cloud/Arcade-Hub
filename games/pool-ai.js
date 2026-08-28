function plans(player){
  const cb=cue(),out=[];if(!cb)return out;
  for(const t of live().filter(b=>legal(b,player)))for(const pocket of PO){
    const vx=pocket.x-t.x,vy=pocket.y-t.y,L=Math.hypot(vx,vy);if(L<48)continue;
    const ux=vx/L,uy=vy/L,ghost={x:t.x-ux*R*2.018,y:t.y-uy*R*2.018};
    if(ghost.x<T.l+R||ghost.x>T.r-R||ghost.y<T.t+R||ghost.y>T.b-R)continue;
    if(!clearLine(t,pocket,[t.n,0])||!clearLine(cb,ghost,[0,t.n]))continue;
    const cd=Math.hypot(ghost.x-cb.x,ghost.y-cb.y),sx=(ghost.x-cb.x)/Math.max(1,cd),sy=(ghost.y-cb.y)/Math.max(1,cd),align=sx*ux+sy*uy;
    if(align<.12)continue;
    const basePower=clamp(30+cd*.028+L*.021+(1-align)*22,25,88);
    out.push({a:Math.atan2(ghost.y-cb.y,ghost.x-cb.x),p:basePower,t:t.n,pocket,ghost,score:L*.18+cd*.055+(1-align)*175})
  }
  return out.sort((a,b)=>a.score-b.score)
}
function simulate(a,p,sp=0,seconds=7,cueMult=currentCue().power){
  const w=clone(),cb=cue(w);if(!cb)return null;const v=shotSpeed(p,cueMult),dx=Math.cos(a),dy=Math.sin(a),s={first:null,pots:[],spin:sp,spinDone:false,dx,dy,v0:v};
  cb.vx=dx*v;cb.vy=dy*v;const cuePath=[{x:cb.x,y:cb.y}],obj=new Map(),dt=1/240;let time=0,lastC={x:cb.x,y:cb.y},tracked=null;
  while(time<seconds&&moving(w)){
    physics(w,dt,s);time+=dt;const q=cue(w);
    if(q&&!q.p&&Math.hypot(q.x-lastC.x,q.y-lastC.y)>5){cuePath.push({x:q.x,y:q.y});lastC={x:q.x,y:q.y}}
    if(s.first!=null&&!tracked)tracked=w.find(b=>b.n===s.first);
    if(tracked&&!tracked.p){let arr=obj.get(tracked.n);if(!arr){arr=[{x:tracked.x,y:tracked.y}];obj.set(tracked.n,arr)}const z=arr[arr.length-1];if(Math.hypot(tracked.x-z.x,tracked.y-z.y)>5)arr.push({x:tracked.x,y:tracked.y})}
  }
  return{w,s,cuePath,obj}
}
function scoreSimulation(sim,plan,player){
  if(!sim)return 1e9;const cueBall=sim.w.find(b=>b.n===0),targetBall=sim.w.find(b=>b.n===plan.t),scratch=!!cueBall?.p,targetPotted=!!targetBall?.p;
  const legalPots=sim.s.pots.filter(n=>n!==0&&n!==8&&(!groups[player]||grp(n)===groups[player])).length;
  const badPots=sim.s.pots.filter(n=>n!==0&&n!==8&&groups[player]&&grp(n)!==groups[player]).length;
  const eight=sim.s.pots.includes(8),canEight=target(player)==='eight';
  let score=plan.score-(targetPotted?1600:0)-legalPots*260+badPots*380+(scratch?1500:0)+(eight&&!canEight?3000:0);
  if(canEight&&eight&&!scratch)score-=4200;
  if(sim.s.first!==plan.t)score+=1200;
  return score
}
function choose(player){
  if(live().filter(b=>b.n).length===15&&!groups[0]){const cb=cue(),apex=balls.find(b=>b.n);return{a:Math.atan2(apex.y-cb.y,apex.x-cb.x),p:100,t:apex.n,verified:false,spin:0,ghost:{x:apex.x-R*2.02,y:apex.y},pocket:null}}
  const base=plans(player).slice(0,7);let best=null;
  for(const q of base){
    const powers=[clamp(q.p-7,22,100),q.p,clamp(q.p+9,22,100),100];
    const offsets=[-.0045,0,.0045];
    for(const pp of powers)for(const off of offsets){
      const sim=simulate(q.a+off,pp,0,6.5),sc=scoreSimulation(sim,q,player);
      if(!best||sc<best.score)best={...q,a:q.a+off,p:pp,spin:0,score:sc,verified:!!sim?.w.find(b=>b.n===q.t)?.p,sim}
      if(sc<-1200)break
    }
  }
  if(best&&best.verified&&!best.sim?.w.find(b=>b.n===0)?.p)return best;
  if(best)return best;
  const cb=cue();let fallback=null;
  for(const t of live().filter(b=>legal(b,player))){if(!clearLine(cb,t,[0,t.n]))continue;const d=Math.hypot(t.x-cb.x,t.y-cb.y),q={a:Math.atan2(t.y-cb.y,t.x-cb.x),p:clamp(52+d*.028,48,100),t:t.n,score:d,spin:0,ghost:{x:t.x,y:t.y},pocket:null};if(!fallback||q.score<fallback.score)fallback=q}
  return fallback
}
let cheatCache=null,cheatState='';
function cheatPlan(){
  if(!admin().poolPrediction||phase!=='play'||moving()||winner)return null;
  const k=[turn,groups[0],groups[1],selectedCueKey(),...live().map(b=>`${b.n}:${b.x.toFixed(1)}:${b.y.toFixed(1)}`)].join('|');
  if(k===cheatState&&cheatCache)return cheatCache;cheatState=k;cheatCache=choose(turn);return cheatCache
}
function auto(){
  if(phase!=='play'||winner||moving()||performance.now()<autoAt)return;
  const cpu=mode==='cpu'&&turn===1,adm=admin().poolAuto&&(mode!=='2p'||turn===0);if(!cpu&&!adm)return;
  const q=choose(turn);if(!q){turn=opp(turn);notice='No legal shot found.';autoAt=performance.now()+450;return}
  const who=turn;aim=q.a;power=Math.round(q.p);range.value=power;syncPower();spin=q.spin||0;
  notice=(cpu?'CPU':'CHEAT AUTO')+(q.verified?' • guaranteed line':' • best available line');autoAt=performance.now()+360;
  setTimeout(()=>{if(phase==='play'&&!moving()&&!winner&&turn===who)shoot(q.a,q.p,who,q.spin||0)},280)
}
function prediction(){
  if(!admin().poolPrediction||phase!=='play'||moving()||winner)return null;
  const k=[aim,power,spin,selectedCueKey(),turn,...live().map(b=>`${b.n}:${b.x.toFixed(1)}:${b.y.toFixed(1)}`)].join('|');
  if(k===cacheKey&&cache)return cache;cacheKey=k;return cache=simulate(aim,power,spin,7)
}
