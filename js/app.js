(function(){
'use strict';
var LIN=[34,35,36,37], RED=[920,930,940,960], SHORT=[37,38,39,40];
var SC={c:'Conservador',m:'Central',o:'Otimista'}, SCK=['c','m','o'];
var AREAS=[['ch','Humanas'],['lc','Linguagens'],['cn','Natureza'],['mt','Matemática'],['red','Redação']];
var VIEWS=[['visao','1 Visão geral'],['tri','2 Simulador TRI'],['univ','3 Universidades'],['metas','4 Metas de acertos'],['comparador','5 Comparador'],['estrategia','6 Estratégia de prova'],['relatorio','7 Relatório']];
var NEAR=15;
var DEF={lin:35,red:940,nat:38,mat:38,cen:'m',uni:'ufmg',mod:'ampla',v:'visao'};
var S=copy(DEF), TRI=null, UNI=null;
var F={lin:'',red:'',nat:'',mat:'',st:'',only:false,sort:'avg',dir:-1,nmin:37,nmax:40,mmin:37,mmax:40,limit:600};
var B={ua:'ufmg',ub:'ufmg',ma:'ampla',mb:'ampla',a:{lin:35,red:940,nat:37,mat:37},b:{lin:35,red:940,nat:40,mat:40}};
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function copy(o){return JSON.parse(JSON.stringify(o))}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function clamp(n,a,b){n=Math.round(Number(n));if(isNaN(n))return a;return Math.max(a,Math.min(b,n))}
function f1(n){return n==null?'—':n.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}
function f2(n){return n==null?'—':n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function sgn(n){return (n>0?'+':n<0?'−':'')+f1(Math.abs(n))}

/* ---------- estado / URL ---------- */
function readURL(){
  var p=new URLSearchParams(location.search), t;
  t=parseInt(p.get('lin'),10); S.lin=LIN.indexOf(t)>=0?t:DEF.lin;
  t=parseInt(p.get('red'),10); S.red=RED.indexOf(t)>=0?t:DEF.red;
  if(p.has('nat'))S.nat=clamp(p.get('nat'),0,45);
  if(p.has('mat'))S.mat=clamp(p.get('mat'),0,45);
  t=p.get('cen'); S.cen=SCK.indexOf(t)>=0?t:DEF.cen;
  t=p.get('uni'); if(t&&UNI.some(function(u){return u.id===t}))S.uni=t;
  t=p.get('mod'); if(t)S.mod=t;
  t=p.get('v'); if(VIEWS.some(function(v){return v[0]===t}))S.v=t;
  fixMod();
}
function qs(extra){
  var p=new URLSearchParams();
  p.set('lin',S.lin);p.set('red',S.red);p.set('nat',S.nat);p.set('mat',S.mat);p.set('cen',S.cen);p.set('uni',S.uni);
  if(S.mod!=='ampla')p.set('mod',S.mod);
  if(extra)p.set('v',extra);
  return p.toString();
}
function shareURL(){return location.origin+location.pathname+'?'+qs('relatorio')}
function syncURL(){try{history.replaceState(null,'','?'+qs(S.v==='visao'?'':S.v))}catch(e){}}

/* ---------- cálculo ---------- */
function tri(a,k,sc){return TRI.areas[a].tabela[clamp(k,0,45)][sc]}
function scoresOf(s,sc){return {ch:tri('ch',43,sc),lc:tri('lc',s.lin,sc),cn:tri('cn',s.nat,sc),mt:tri('mt',s.mat,sc),red:s.red}}
function avgOf(sc){return (sc.ch+sc.lc+sc.cn+sc.mt+sc.red)/5}
function uniById(id){for(var i=0;i<UNI.length;i++)if(UNI[i].id===id)return UNI[i];return UNI[0]}
function cutoff(u,mod){
  if(!u||!u.corte||u.corte.valor==null)return null;
  if(!mod||mod==='ampla')return u.corte.valor;
  for(var i=0;i<u.modalidades.length;i++)if(u.modalidades[i].id===mod)return u.modalidades[i].valor;
  return u.corte.valor;
}
function fixMod(){var u=uniById(S.uni);if(S.mod!=='ampla'&&!u.modalidades.some(function(m){return m.id===S.mod}))S.mod='ampla'}
function weighted(u,sc){
  if(!u.pesos)return null;var p=u.pesos,t=0,w=0,k;
  for(k in p){t+=p[k]*sc[k];w+=p[k]}
  return t/w;
}
function minFails(u,sc){
  var f=[],m=u.minimos||{},n={cn:'Natureza',ch:'Humanas',lc:'Linguagens',mt:'Matemática',red:'Redação'},k;
  for(k in m){if(k==='media'){if(avgOf(sc)<m[k])f.push('média simples < '+m[k])}else if(sc[k]<m[k])f.push(n[k]+' < '+m[k])}
  return f;
}
function evalU(u,s,scn,mod){
  var sc=scoresOf(s,scn),c=cutoff(u,mod),w=weighted(u,sc);
  if(c==null||w==null)return {w:w,c:c,d:null,st:'na',fails:[]};
  var d=w-c,fails=minFails(u,sc),st=d>=0?'acima':d>=-NEAR?'prox':'abaixo';
  if(fails.length&&st==='acima')st='prox';
  return {w:w,c:c,d:d,st:st,fails:fails};
}
var STL={acima:'Acima do corte',prox:'Perto do corte',abaixo:'Abaixo do corte',na:'Sem corte comparável'};
function stBadge(st){return '<span class="st '+st+'">'+STL[st]+'</span>'}
function reached(u,s,scn,mod){var e=evalU(u,s,scn,mod);return e.d!=null&&e.d>=0&&!e.fails.length}
function needMat(u,mod,nat,scn){
  for(var m=0;m<=45;m++){if(reached(u,{lin:S.lin,red:S.red,nat:nat,mat:m},scn,mod))return m}
  return null;
}
function compUnis(){return UNI.filter(function(u){return u.corte.valor!=null&&u.pesos})}
function faixaOf(c){return c>=825?0:c>=810?1:c>=795?2:3}
var FAIXAS=['Cortes mais altos (≥ 825)','Cortes altos (810 a 824,99)','Cortes intermediários (795 a 809,99)','Cortes mais baixos (< 795)'];

/* ---------- SVG ---------- */
function gbars(o){
  var W=360,H=o.h||220,pl=34,pr=8,pt=14,pb=34,iw=W-pl-pr,ih=H-pt-pb,g=o.groups,n=g.length,gw=iw/n,bw=Math.min(18,(gw-8)/o.colors.length);
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.title)+'">',i,j,v,y,x;
  for(i=0;i<=4;i++){v=o.min+(o.max-o.min)*i/4;y=pt+ih-(v-o.min)/(o.max-o.min)*ih;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="#e3eaf6"/><text x="'+(pl-4)+'" y="'+(y+3)+'" font-size="9" fill="#5b6b86" text-anchor="end">'+Math.round(v)+'</text>'}
  g.forEach(function(gr,gi){
    var x0=pl+gi*gw+(gw-bw*gr.vals.length)/2;
    gr.vals.forEach(function(v,j){
      var hh=Math.max(0,(v-o.min)/(o.max-o.min)*ih);x=x0+j*bw;y=pt+ih-hh;
      s+='<rect x="'+x+'" y="'+y+'" width="'+(bw-2)+'" height="'+hh+'" rx="3" fill="'+o.colors[j]+'"/>';
      if(j===(o.labelIdx==null?1:o.labelIdx))s+='<text x="'+(x+(bw-2)/2)+'" y="'+(y-3)+'" font-size="8.5" text-anchor="middle" fill="#0a2a5e" font-weight="700">'+Math.round(v)+'</text>';
    });
    s+='<text x="'+(pl+gi*gw+gw/2)+'" y="'+(H-pb+14)+'" font-size="9.5" text-anchor="middle" fill="#0f1b33">'+esc(gr.label)+'</text>';
    if(gr.sub)s+='<text x="'+(pl+gi*gw+gw/2)+'" y="'+(H-pb+25)+'" font-size="8" text-anchor="middle" fill="#5b6b86">'+esc(gr.sub)+'</text>';
  });
  if(o.hline!=null&&o.hline>=o.min&&o.hline<=o.max){y=pt+ih-(o.hline-o.min)/(o.max-o.min)*ih;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y+'" y2="'+y+'" stroke="#b42318" stroke-width="1.5" stroke-dasharray="5 3"/><text x="'+(W-pr)+'" y="'+(y-3)+'" font-size="8.5" fill="#b42318" text-anchor="end">'+esc(o.hlabel||'')+'</text>'}
  return s+'</svg>';
}
function legend(items){return '<div class="legend">'+items.map(function(i){return '<span><i style="background:'+i[1]+'"></i>'+esc(i[0])+'</span>'}).join('')+'</div>'}
var COL3=['#9cc3ff','#0b5ed7','#16a34a'];
function chartAreas(){
  var gr=AREAS.map(function(a){var k=a[0];return {label:a[1],sub:k==='red'?String(S.red):k==='ch'?'43':String(k==='lc'?S.lin:k==='cn'?S.nat:S.mat),vals:SCK.map(function(c){return scoresOf(S,c)[k]})}});
  return gbars({title:'Notas estimadas por área',groups:gr,colors:COL3,min:300,max:1000})+legend([['Conservador',COL3[0]],['Central',COL3[1]],['Otimista',COL3[2]]]);
}
function chartScen(){
  var u=uniById(S.uni),c=cutoff(u,S.mod),vals=SCK.map(function(k){return avgOf(scoresOf(S,k))}),wv=SCK.map(function(k){var w=weighted(u,scoresOf(S,k));return w==null?0:w});
  var all=vals.concat(wv).concat(c?[c]:[]),mn=Math.floor(Math.min.apply(null,all.filter(Boolean))/20)*20-20,mx=Math.ceil(Math.max.apply(null,all)/20)*20+10;
  return gbars({title:'Conservador, central e otimista',groups:[{label:'Média simples',vals:vals},{label:'Ponderada '+u.sigla,vals:wv}],colors:COL3,min:mn,max:mx,hline:c,hlabel:c?'corte '+u.sigla+' '+f2(c):'',h:230,labelIdx:1})+legend([['Conservador',COL3[0]],['Central',COL3[1]],['Otimista',COL3[2]]]);
}
function chartEvo(){
  var W=360,H=210,pl=36,pr=10,pt=12,pb=30,iw=W-pl-pr,ih=H-pt-pb,x0=25,x1=45,A=[],B2=[],k,mn=9999,mx=0;
  for(k=x0;k<=x1;k++){var a=avgOf(scoresOf({lin:S.lin,red:S.red,nat:k,mat:S.mat},S.cen)),b=avgOf(scoresOf({lin:S.lin,red:S.red,nat:S.nat,mat:k},S.cen));A.push(a);B2.push(b);mn=Math.min(mn,a,b);mx=Math.max(mx,a,b)}
  mn=Math.floor(mn/10)*10-5;mx=Math.ceil(mx/10)*10+5;
  var X=function(k){return pl+(k-x0)/(x1-x0)*iw},Y=function(v){return pt+ih-(v-mn)/(mx-mn)*ih};
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolução da média conforme acertos">',i,v;
  for(i=0;i<=4;i++){v=mn+(mx-mn)*i/4;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#e3eaf6"/><text x="'+(pl-4)+'" y="'+(Y(v)+3)+'" font-size="9" fill="#5b6b86" text-anchor="end">'+Math.round(v)+'</text>'}
  for(k=x0;k<=x1;k+=5)s+='<text x="'+X(k)+'" y="'+(H-pb+14)+'" font-size="9.5" text-anchor="middle" fill="#0f1b33">'+k+'</text>';
  s+='<text x="'+(pl+iw/2)+'" y="'+(H-4)+'" font-size="9" text-anchor="middle" fill="#5b6b86">acertos na área que varia</text>';
  var pa=A.map(function(v,i){return X(x0+i)+','+Y(v)}).join(' '),pb2=B2.map(function(v,i){return X(x0+i)+','+Y(v)}).join(' ');
  s+='<polyline points="'+pa+'" fill="none" stroke="#0b5ed7" stroke-width="2.5"/><polyline points="'+pb2+'" fill="none" stroke="#16a34a" stroke-width="2.5"/>';
  if(S.nat>=x0)s+='<circle cx="'+X(S.nat)+'" cy="'+Y(A[S.nat-x0])+'" r="5" fill="#fff" stroke="#0b5ed7" stroke-width="3"/>';
  if(S.mat>=x0)s+='<circle cx="'+X(S.mat)+'" cy="'+Y(B2[S.mat-x0])+'" r="5" fill="#fff" stroke="#16a34a" stroke-width="3"/>';
  return s+'</svg>'+legend([['Varia só Natureza (Mat. = '+S.mat+')','#0b5ed7'],['Varia só Matemática (Nat. = '+S.nat+')','#16a34a']])+'<p class="src">Média simples das cinco áreas, cenário '+SC[S.cen].toLowerCase()+'. Círculos = sua simulação atual.</p>';
}
function chartCuts(){
  var rows=compUnis().map(function(u){var e=evalU(u,S,S.cen,'ampla'),lo=weighted(u,scoresOf(S,'c')),hi=weighted(u,scoresOf(S,'o'));return {u:u,e:e,lo:lo,hi:hi}}).sort(function(a,b){return a.e.c-b.e.c});
  var all=[];rows.forEach(function(r){all.push(r.e.c,r.lo,r.hi,r.e.w)});
  var mn=Math.floor(Math.min.apply(null,all)/20)*20-10,mx=Math.ceil(Math.max.apply(null,all)/20)*20+10,W=360,rh=26,pl=62,pr=14,pt=8,H=pt+rows.length*rh+30,iw=W-pl-pr;
  var X=function(v){return pl+(v-mn)/(mx-mn)*iw},s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Nota simulada versus cortes históricos">',i,v;
  for(v=Math.ceil(mn/20)*20;v<=mx;v+=20)s+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+pt+'" y2="'+(H-22)+'" stroke="#e3eaf6"/><text x="'+X(v)+'" y="'+(H-10)+'" font-size="9" text-anchor="middle" fill="#5b6b86">'+v+'</text>';
  var col={acima:'#16a34a',prox:'#d97706',abaixo:'#b42318'};
  rows.forEach(function(r,i){
    var y=pt+i*rh;
    s+='<text x="'+(pl-6)+'" y="'+(y+rh/2+3)+'" font-size="10" text-anchor="end" fill="#0f1b33" font-weight="600">'+esc(r.u.sigla)+'</text>';
    s+='<rect x="'+pl+'" y="'+(y+5)+'" width="'+Math.max(0,X(r.e.w)-pl)+'" height="'+(rh-12)+'" rx="4" fill="'+col[r.e.st]+'" opacity=".85"/>';
    s+='<line x1="'+X(r.lo)+'" x2="'+X(r.hi)+'" y1="'+(y+rh/2)+'" y2="'+(y+rh/2)+'" stroke="#0a2a5e" stroke-width="2"/><line x1="'+X(r.lo)+'" x2="'+X(r.lo)+'" y1="'+(y+rh/2-4)+'" y2="'+(y+rh/2+4)+'" stroke="#0a2a5e" stroke-width="2"/><line x1="'+X(r.hi)+'" x2="'+X(r.hi)+'" y1="'+(y+rh/2-4)+'" y2="'+(y+rh/2+4)+'" stroke="#0a2a5e" stroke-width="2"/>';
    s+='<line x1="'+X(r.e.c)+'" x2="'+X(r.e.c)+'" y1="'+(y+1)+'" y2="'+(y+rh-1)+'" stroke="#0f1b33" stroke-width="3"/>';
  });
  return s+'</svg>'+legend([['Acima do corte','#16a34a'],['Perto (até '+NEAR+' pts)','#d97706'],['Abaixo','#b42318'],['Corte histórico (barra preta)','#0f1b33'],['Faixa conserv.–otimista (linha)','#0a2a5e']])+'<p class="src">Barra = nota ponderada estimada (cenário '+SC[S.cen].toLowerCase()+'), comparada ao corte da ampla concorrência mais recente de cada universidade. Não indica aprovação.</p>';
}
function chartSens(){
  var u=uniById(S.uni),base=scoresOf(S,S.cen),bA=avgOf(base),bW=weighted(u,base);
  function d(k,dn,dm){var s2={lin:S.lin,red:S.red,nat:clamp(S.nat+dn,0,45),mat:clamp(S.mat+dm,0,45)},sc=scoresOf(s2,S.cen);return [avgOf(sc)-bA,bW!=null?weighted(u,sc)-bW:0]}
  var m=d('m',0,1),n=d('n',1,0),mx=Math.max(m[0],n[0],m[1],n[1],1),W=360,H=170,pl=96,iw=W-pl-40;
  var rows=[['+1 em Matemática · média simples',m[0],'#16a34a'],['+1 em Natureza · média simples',n[0],'#0b5ed7'],['+1 em Matemática · pond. '+u.sigla,m[1],'#16a34a'],['+1 em Natureza · pond. '+u.sigla,n[1],'#0b5ed7']];
  var s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Sensibilidade a mais um acerto">';
  rows.forEach(function(r,i){var y=10+i*38,w=Math.max(2,r[1]/mx*iw);s+='<text x="0" y="'+(y+8)+'" font-size="9.5" fill="#0f1b33">'+esc(r[0].split(' · ')[0])+'</text><text x="0" y="'+(y+20)+'" font-size="8.5" fill="#5b6b86">'+esc(r[0].split(' · ')[1])+'</text><rect x="'+pl+'" y="'+(y)+'" width="'+w+'" height="22" rx="5" fill="'+r[2]+'"/><text x="'+(pl+w+5)+'" y="'+(y+15)+'" font-size="10.5" font-weight="700" fill="#0a2a5e">'+sgn(r[1])+'</text>'});
  return s+'</svg><p class="src">Ganho em pontos ao acertar uma questão a mais, a partir da simulação atual (cenário '+SC[S.cen].toLowerCase()+'). O efeito real depende de quais questões são acertadas.</p>';
}

/* ---------- controles ---------- */
function seg(act,opts,cur,cls){return '<div class="seg '+(cls||'')+'" role="group">'+opts.map(function(o){var v=o[0];return '<button type="button" data-act="'+act+'" data-v="'+v+'" aria-pressed="'+(String(cur)===String(v))+'">'+esc(o[1])+'</button>'}).join('')+'</div>'}
function areaCtl(key,label,cur){
  return '<div class="ctl"><label>'+label+' <span class="sub">(0–45 acertos)</span></label>'+seg(key,SHORT.map(function(v){return [v,v]}),cur,'green')+
  '<div class="stepper"><button type="button" data-act="'+key+'d" data-d="-1" aria-label="Menos um acerto">−</button><input type="number" inputmode="numeric" min="0" max="45" data-in="'+key+'" value="'+cur+'" aria-label="'+label+' acertos"><button type="button" data-act="'+key+'d" data-d="1" aria-label="Mais um acerto">+</button><span class="mut" data-lbl="'+key+'"></span></div>'+
  '<input type="range" min="0" max="45" step="1" data-in="'+key+'" value="'+cur+'" aria-label="'+label+' controle deslizante"></div>';
}
function controlsHTML(){
  return '<div class="ctl"><label>Humanas</label><div class="fixed"><span>43 de 45 acertos</span><span>fixo</span></div></div>'+
  '<div class="ctl"><label>Linguagens <span class="sub">(simulação de acertos)</span></label>'+seg('lin',LIN.map(function(v){return [v,v]}),S.lin)+'</div>'+
  '<div class="ctl"><label>Redação <span class="sub">(simulação)</span></label>'+seg('red',RED.map(function(v){return [v,v]}),S.red)+'</div>'+
  areaCtl('nat','Ciências da Natureza',S.nat)+areaCtl('mat','Matemática',S.mat)+
  '<div class="ctl"><label>Cenário da TRI exibido</label>'+seg('cen',SCK.map(function(k){return [k,SC[k]]}),S.cen)+'</div>'+
  '<div class="btn-row"><button type="button" class="btn btn-ghost" data-act="reset">Voltar ao cenário inicial</button></div>';
}
function syncControls(){
  $$('[data-act]').forEach(function(b){
    var a=b.getAttribute('data-act'),v=b.getAttribute('data-v');
    if(v!=null&&(a==='lin'||a==='red'||a==='nat'||a==='mat'||a==='cen'))b.setAttribute('aria-pressed',String(S[a])===v);
  });
  $$('[data-in="nat"],[data-in="mat"]').forEach(function(i){if(document.activeElement!==i)i.value=S[i.getAttribute('data-in')]});
  var sc=scoresOf(S,S.cen);
  $$('[data-lbl]').forEach(function(l){var k=l.getAttribute('data-lbl');l.textContent='≈ '+Math.round(sc[k==='nat'?'cn':'mt'])+' pts'});
  var bar=$('#scenario-bar');
  bar.innerHTML='<span class="chip g">Humanas 43</span><span class="chip">Ling. '+S.lin+'</span><span class="chip">Red. '+S.red+'</span><span class="chip">Nat. '+S.nat+'</span><span class="chip">Mat. '+S.mat+'</span><span class="chip g">Média '+f1(avgOf(sc))+' ('+SC[S.cen].toLowerCase()+')</span>';
}

/* ---------- views ---------- */
function uniSelect(id){
  var o=UNI.map(function(u){return '<option value="'+u.id+'"'+(u.id===S.uni?' selected':'')+'>'+esc(u.sigla+' — '+u.cidade+'/'+u.uf+(u.corte.valor==null?' (sem corte comparável)':''))+'</option>'}).join('');
  var u=uniById(S.uni),m='';
  if(u.modalidades.length)m='<div class="ctl"><label>Modalidade</label><select data-in="mod"><option value="ampla">Ampla concorrência</option>'+u.modalidades.map(function(x){return '<option value="'+x.id+'"'+(S.mod===x.id?' selected':'')+'>'+esc(x.nome)+'</option>'}).join('')+'</select><p class="src">Cotas: dados do Sisu 2026 de fonte secundária; a elegibilidade depende de cada edital.</p></div>';
  return '<div class="ctl"><label>Universidade de referência</label><select data-in="uni">'+o+'</select></div>'+m;
}
function summaryKpis(){
  var sc={},k;SCK.forEach(function(c){sc[c]=scoresOf(S,c)});
  var u=uniById(S.uni),e=evalU(u,S,S.cen,S.mod),n=0,tot=0;
  var comps=combos(LIN,RED,[37,38,39,40],[37,38,39,40]);
  comps.forEach(function(c){tot++;if(reached(u,c,S.cen,S.mod))n++});
  var best=comps.slice().sort(function(a,b){return avgOf(scoresOf(b,S.cen))-avgOf(scoresOf(a,S.cen))})[0];
  var inRange=compUnis().filter(function(x){return reached(x,S,S.cen,'ampla')});
  return '<div class="grid2"><div class="kpi g"><b>'+f1(avgOf(sc[S.cen]))+'</b><span>Média simples estimada ('+SC[S.cen].toLowerCase()+')</span></div>'+
  '<div class="kpi"><b>'+f1(avgOf(sc.c))+' – '+f1(avgOf(sc.o))+'</b><span>Faixa conservador–otimista</span></div>'+
  '<div class="kpi"><b>'+(e.w==null?'—':f1(e.w))+'</b><span>Ponderada '+esc(u.sigla)+' ('+SC[S.cen].toLowerCase()+')</span></div>'+
  '<div class="kpi"><b>'+(e.d==null?'—':sgn(e.d))+'</b><span>Distância ao corte histórico '+(e.c!=null?f2(e.c):'')+'</span></div></div>'+
  '<p style="margin-top:10px">'+(e.d==null?'<span class="st na">Sem corte comparável</span>':stBadge(e.st))+' <small>'+esc(u.sigla)+' · cenário '+SC[S.cen].toLowerCase()+'</small></p>'+
  '<p><b>'+n+' de '+tot+'</b> combinações da tabela (Nat./Mat. 37–40) alcançam o corte histórico de '+esc(u.sigla)+' no cenário '+SC[S.cen].toLowerCase()+'.</p>'+
  '<p>Com a simulação atual, o corte histórico (ampla) é alcançado em <b>'+inRange.length+'</b> de '+compUnis().length+' universidades com corte comparável: '+(inRange.length?inRange.map(function(x){return esc(x.sigla)}).join(', '):'nenhuma neste cenário')+'.</p>'+
  '<p class="src">Melhor combinação da tabela (média simples): Ling. '+best.lin+' · Red. '+best.red+' · Nat. '+best.nat+' · Mat. '+best.mat+' → '+f1(avgOf(scoresOf(best,S.cen)))+'. Resultado matemático sobre cortes históricos, não é probabilidade de aprovação.</p>';
}
var MSG='<div class="msg"><p><b>Lorenzo, acertar 43 das 45 questões de Ciências Humanas é uma conquista extraordinária.</b></p><p>Você já demonstrou conhecimento, disciplina e capacidade de alcançar resultados expressivos.</p><p>Agora vem uma etapa fundamental: Matemática e Ciências da Natureza.</p><p>Cada questão resolvida corretamente amplia suas possibilidades.</p><p>Você não precisa acertar tudo. Precisa fazer uma prova inteligente, administrar seu tempo e aproveitar o conhecimento que construiu.</p><p><b>A Medicina é o seu objetivo. Continue trabalhando para conquistá-la.</b></p></div>';
function initViews(){
  $('#view-visao').innerHTML='<div class="card hero"><h1>Rota Medicina 2027</h1><p>Simule o segundo dia do ENEM, veja a nota estimada por área e compare com os cortes históricos das universidades públicas. Mexa nos controles: tudo recalcula na hora.</p></div>'+
   '<div class="card"><h2>Painel principal</h2><p class="mut">Humanas está fixo em 43/45. Linguagens e Redação são simulações. Natureza e Matemática aceitam de 0 a 45.</p><div id="ctl-inline">'+controlsHTML()+'</div></div><div id="dyn-visao"></div><div class="card"><h2>Mensagem para você</h2>'+MSG+'</div>';
  $('#sheet-controls').innerHTML=controlsHTML();
}
function renderVisao(){
  $('#dyn-visao').innerHTML='<div class="card"><h2>Resultado da simulação</h2>'+uniSelect()+summaryKpis()+'</div>'+
  '<div class="card"><h3>Sua nota estimada versus cortes históricos</h3>'+chartCuts()+'</div>'+
  '<div class="note"><b>Importante:</b> todos os números de nota são <b>estimativas</b> baseadas em dados históricos do ENEM (2023–2025). A nota oficial depende da dificuldade e dos parâmetros das questões e de quais itens você acerta. Cortes são de edições passadas, <b>não</b> são previsão para 2027 e <b>não</b> indicam chance de aprovação.</div>';
}
function renderTRI(){
  var sc={};SCK.forEach(function(c){sc[c]=scoresOf(S,c)});
  var rows=AREAS.map(function(a){var k=a[0],ac=k==='ch'?'43':k==='lc'?S.lin:k==='cn'?S.nat:k==='mt'?S.mat:'—',t=k!=='red'?TRI.areas[k].tabela[clamp(k==='ch'?43:k==='lc'?S.lin:k==='cn'?S.nat:S.mat,0,45)]:null,flag=t&&t.est?' <small title="extrapolado">*</small>':t&&t.pequena?' <small title="amostra pequena">†</small>':'';
    return '<tr><td>'+a[1]+'</td><td>'+ac+(k==='red'?'':'/45')+flag+'</td>'+SCK.map(function(c){return '<td>'+f1(sc[c][k])+'</td>'}).join('')+'</tr>'}).join('');
  var avg='<tr><th>Média simples</th><th></th>'+SCK.map(function(c){return '<th>'+f1(avgOf(sc[c]))+'</th>'}).join('')+'</tr>';
  var wrows=UNI.filter(function(u){return u.pesos}).map(function(u){return '<tr><td>'+esc(u.sigla)+'</td><td>'+u.pesos.cn+'/'+u.pesos.ch+'/'+u.pesos.lc+'/'+u.pesos.mt+'/'+u.pesos.red+'</td>'+SCK.map(function(c){return '<td>'+f1(weighted(u,sc[c]))+'</td>'}).join('')+'</tr>'}).join('');
  $('#view-tri').innerHTML='<div class="card"><h2>Simulador TRI</h2><div class="note"><b>Estimativa, não é a nota oficial.</b> A TRI não conta apenas acertos: a nota depende dos parâmetros das questões (dificuldade, discriminação e acerto ao acaso) e de <i>quais</i> questões foram acertadas. Aqui usamos a distribuição histórica de notas por número de acertos no ENEM 2023, 2024 e 2025 para dar uma faixa plausível.</div>'+
  '<div class="info"><b>Como lemos os dados:</b> <b>Conservador</b> = menor percentil 10 entre 2023–2025; <b>Central</b> = média das medianas; <b>Otimista</b> = maior percentil 90. Ou seja, o conservador e o otimista cobrem cerca de 80% dos candidatos com aquele número de acertos nas três edições. Redação é a nota simulada, igual nos três cenários.</div>'+
  '<div class="tscroll"><table><thead><tr><th>Área</th><th>Acertos</th><th>Conserv.</th><th>Central</th><th>Otimista</th></tr></thead><tbody>'+rows+'</tbody><tfoot>'+avg+'</tfoot></table></div>'+
  '<p class="src">* extrapolado (sem candidatos observados nesse número de acertos) · † amostra pequena (&lt; 300 candidatos nas três edições).</p>'+
  '<p class="src">Fonte: microdados oficiais do ENEM/INEP (aplicação regular), tabulados por <a href="'+TRI.meta.fonte_url+'" target="_blank" rel="noopener">Prof. Rafael Teixeira</a> (<a href="'+TRI.meta.fonte_csv+'" target="_blank" rel="noopener">planilha</a>); conferido com <a href="'+TRI.meta.fonte_secundaria+'" target="_blank" rel="noopener">EnemCopilot</a>. Microdados originais: <a href="'+TRI.meta.fonte_inep+'" target="_blank" rel="noopener">INEP</a>. Acesso em 09/11/2026. Os dados de 2026 ainda não existem.</p></div>'+
  '<div class="card"><h3>Notas estimadas por área</h3>'+chartAreas()+'</div>'+
  '<div class="card"><h3>Conservador, central e otimista</h3>'+uniSelect()+chartScen()+'</div>'+
  '<div class="card"><h3>Evolução da média conforme os acertos</h3>'+chartEvo()+'</div>'+
  '<div class="card"><h3>E se acertar mais uma?</h3>'+chartSens()+'</div>'+
  '<div class="card"><h3>Média ponderada por universidade</h3><p class="mut">Pesos na ordem Nat/Hum/Ling/Mat/Red (Sisu 2026). Nota = soma(peso × nota) ÷ soma dos pesos.</p><div class="tscroll"><table><thead><tr><th>Univ.</th><th>Pesos</th><th>Conserv.</th><th>Central</th><th>Otim.</th></tr></thead><tbody>'+wrows+'</tbody></table></div></div>';
}
function srcLinks(u){return u.corte.fontes.map(function(f){return '<a href="'+esc(f.url)+'" target="_blank" rel="noopener">'+esc(f.nome)+'</a>'}).join(' · ')}
function pesosChips(u){if(!u.pesos)return '<p class="src">Pesos: não verificado / não se aplica a este processo.</p>';var p=u.pesos;return '<div class="pesos"><span>Natureza '+p.cn+'</span><span>Humanas '+p.ch+'</span><span>Linguagens '+p.lc+'</span><span>Matemática '+p.mt+'</span><span>Redação '+p.red+'</span></div>'}
function ucard(u){
  var mod=S.uni===u.id?S.mod:'ampla',e=evalU(u,S,S.cen,mod),lo=evalU(u,S,'c',mod),hi=evalU(u,S,'o',mod),c=e.c;
  var cm='ampla',mods='';
  if(u.modalidades.length){mods='<label class="src">Modalidade</label><select data-in="umod" data-u="'+u.id+'"><option value="ampla">Ampla concorrência</option>'+u.modalidades.map(function(x){return '<option value="'+x.id+'"'+(mod===x.id?' selected':'')+'>'+esc(x.nome)+'</option>'}).join('')+'</select>'}
  var corteTxt=c==null?'<div class="big" style="color:var(--mut)">não verificado</div><small>sem corte comparável (processo próprio)</small>':'<div class="big">'+f2(c)+'</div><small>'+esc(u.corte.edicao)+' · '+esc(u.corte.modalidade)+'</small>';
  var dif=e.d==null?'':'<dl class="kv"><dt>Sua nota estimada ('+SC[S.cen].toLowerCase()+')</dt><dd>'+f1(e.w)+'</dd><dt>Diferença para o corte</dt><dd>'+sgn(e.d)+'</dd><dt>Faixa conserv.–otimista</dt><dd>'+f1(lo.w)+' – '+f1(hi.w)+'</dd></dl>'+(e.fails.length?'<div class="note">Atenção — abaixo da nota mínima exigida em: '+esc(e.fails.join('; '))+'.</div>':'');
  return '<article class="card ucard '+e.st+'"><header><div><h3>'+esc(u.sigla)+' <small>· '+esc(u.cidade)+'/'+esc(u.uf)+'</small></h3><small>'+esc(u.nome)+' — '+esc(u.campus)+'</small></div><div>'+stBadge(e.st)+'</div></header>'+
  '<p><span class="chip">'+esc(u.processo.tipo)+'</span></p>'+corteTxt+dif+mods+pesosChips(u)+
  '<details><summary>Fonte, processo e observações</summary><p class="src"><b>Processo 2027:</b> '+esc(u.processo.status2027)+'</p>'+
  (u.corte.valor!=null?'<p class="src"><b>Corte:</b> '+esc(u.corte.tipo)+'. Base: '+esc(u.corte.base_enem)+'. '+(u.anterior?'Edição anterior ('+u.anterior.ano+'): '+f2(u.anterior.valor)+'. ':'')+'<br><b>Verificação:</b> '+esc(u.corte.verificacao)+'.</p>':'<p class="src"><b>Corte:</b> não verificado — '+esc(u.corte.tipo)+'.</p>')+
  (u.pesos_fonte?'<p class="src"><b>Pesos:</b> '+esc(u.pesos_fonte)+' ('+u.pesos_ano+').</p>':'')+
  u.notas.map(function(n){return '<p class="src">• '+esc(n)+'</p>'}).join('')+
  '<p class="src"><b>Fontes:</b> '+srcLinks(u)+'</p></details></article>';
}
function renderUniv(){
  var h='<div class="card"><h2>Universidades públicas de Medicina</h2><p>Organizadas por <b>faixa de corte histórico</b> (nível de disputa), <b>não por qualidade</b>. Ampla concorrência como padrão. Cortes são de edições passadas e <b>não</b> valem como previsão de 2027. Cada card mostra o processo de ingresso: universidades com processo próprio não usam números do Sisu.</p>'+
  '<div class="info">Dados: Sisu 2026 (ENEM 2023–2025), fonte secundária que republica números do MEC e das universidades. Edital do Sisu 2027 ainda não foi publicado — confirme pesos, vagas e mínimas quando sair.</div></div>';
  FAIXAS.forEach(function(t,i){
    var us=UNI.filter(function(u){return u.corte.valor!=null&&faixaOf(u.corte.valor)===i}).sort(function(a,b){return b.corte.valor-a.corte.valor});
    if(us.length)h+='<h3 style="margin:16px 4px 6px">'+t+'</h3><div class="ucards">'+us.map(ucard).join('')+'</div>';
  });
  var na=UNI.filter(function(u){return u.corte.valor==null});
  if(na.length)h+='<h3 style="margin:16px 4px 6px">Processo próprio / sem corte verificado</h3><div class="ucards">'+na.map(ucard).join('')+'</div>';
  h+='<div class="card"><h3>Nota simulada versus cortes</h3>'+chartCuts()+'</div>';
  h+='<div class="card"><h3>Comparar duas universidades lado a lado</h3>'+sideBySide()+'</div>';
  $('#view-univ').innerHTML=h;
}
function uopts(sel){return UNI.map(function(u){return '<option value="'+u.id+'"'+(u.id===sel?' selected':'')+'>'+esc(u.sigla+' — '+u.cidade)+'</option>'}).join('')}
function sideBySide(){
  var a=uniById(B.ua),b=uniById(B.ub),ea=evalU(a,S,S.cen,'ampla'),eb=evalU(b,S,S.cen,'ampla');
  function col(u,e){return '<td><b>'+esc(u.sigla)+'</b></td>'}
  function row(l,x,y){return '<tr><td>'+l+'</td><td>'+x+'</td><td>'+y+'</td></tr>'}
  return '<div class="grid2"><select data-in="ua">'+uopts(B.ua)+'</select><select data-in="ub">'+uopts(B.ub)+'</select></div><div class="tscroll" style="margin-top:8px"><table><thead><tr><th></th><th>'+esc(a.sigla)+'</th><th>'+esc(b.sigla)+'</th></tr></thead><tbody>'+
  row('Processo',esc(a.processo.tipo.split(' ')[0]),esc(b.processo.tipo.split(' ')[0]))+row('Corte (ampla)',e2(ea.c),e2(eb.c))+row('Sua nota ('+SC[S.cen].toLowerCase()+')',f1(ea.w),f1(eb.w))+row('Diferença',ea.d==null?'—':sgn(ea.d),eb.d==null?'—':sgn(eb.d))+row('Situação',stBadge(ea.st),stBadge(eb.st))+
  row('Pesos N/H/L/M/R',a.pesos?[a.pesos.cn,a.pesos.ch,a.pesos.lc,a.pesos.mt,a.pesos.red].join('/'):'—',b.pesos?[b.pesos.cn,b.pesos.ch,b.pesos.lc,b.pesos.mt,b.pesos.red].join('/'):'—')+'</tbody></table></div><p class="src">Cortes de universidades com pesos diferentes estão em escalas diferentes; compare a <b>diferença</b>, não só o corte.</p>';
}
function e2(v){return v==null?'não verificado':f2(v)}
function renderMetas(){
  var u=uniById(S.uni),c=cutoff(u,S.mod),h='<div class="card"><h2>Quantos acertos faltam para a Medicina?</h2><p>Escolha a universidade e veja quantos acertos em Matemática (ou Natureza) igualam o <b>corte histórico</b>, mantendo Humanas 43, Linguagens '+S.lin+' e Redação '+S.red+'.</p>'+uniSelect()+
  '<div class="note"><b>Leitura correta:</b> isto é uma conta matemática sobre um corte de edição passada. <b>Não é probabilidade</b> de aprovação: o corte de 2027 pode ser maior ou menor, e a nota oficial pode diferir da estimada.</div></div>';
  if(c==null||!u.pesos){h+='<div class="card"><p><b>'+esc(u.sigla)+'</b> tem processo próprio ('+esc(u.processo.tipo)+') e não há corte comparável verificado. Escolha outra universidade para a análise.</p><p class="src">'+esc(u.processo.status2027)+'</p></div>';$('#view-metas').innerHTML=h;return}
  h+='<div class="card"><h3>'+esc(u.sigla)+': corte histórico '+f2(c)+' ('+u.corte.ano+')</h3><p>Com <b>Natureza = '+S.nat+'</b>, quantos acertos em Matemática igualam o corte?</p><div class="tscroll"><table><thead><tr><th>Cenário TRI</th><th>Mat. necessária</th></tr></thead><tbody>'+
  SCK.map(function(k){var n=needMat(u,S.mod,S.nat,k);return '<tr><td>'+SC[k]+'</td><td><b>'+(n==null?'nem com 45':n)+'</b>'+(n==null?'':' acertos')+'</td></tr>'}).join('')+'</tbody></table></div>'+
  '<h3 style="margin-top:14px">Tabela rápida: Matemática necessária por Natureza</h3><div class="tscroll"><table><thead><tr><th>Natureza</th><th>Conserv.</th><th>Central</th><th>Otimista</th></tr></thead><tbody>'+
  [35,36,37,38,39,40,41,42].map(function(nn){return '<tr class="'+(nn===S.nat?'sel':'')+'"><td>'+nn+'</td>'+SCK.map(function(k){var n=needMat(u,S.mod,nn,k);return '<td>'+(n==null?'—':n)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div><p class="src">“—” = nem com 45 acertos em Matemática. Linguagens '+S.lin+', Redação '+S.red+'.</p></div>';
  var N0=30,cells='<div class="hd"></div>',x,y;
  for(x=N0;x<=45;x++)cells+='<div class="hd">'+(x%5===0?x:'')+'</div>';
  for(y=45;y>=N0;y--){cells+='<div class="hd">'+(y%5===0?y:'')+'</div>';for(x=N0;x<=45;x++){var ok=reached(u,{lin:S.lin,red:S.red,nat:y,mat:x},S.cen,S.mod);cells+='<button type="button" class="'+(ok?'ok':'no')+(y===S.nat&&x===S.mat?' cur':'')+'" data-act="cell" data-n="'+y+'" data-m="'+x+'" aria-label="Natureza '+y+', Matemática '+x+': '+(ok?'alcança':'não alcança')+' o corte histórico"></button>'}}
  h+='<div class="card"><h3>Mapa Natureza × Matemática ('+SC[S.cen].toLowerCase()+')</h3><p class="mut">Verde = alcança o corte histórico de '+esc(u.sigla)+'. Toque numa célula para usar essa combinação. Eixo vertical: Natureza (30–45); horizontal: Matemática (30–45).</p><div class="heat" style="grid-template-columns:repeat('+(47-N0)+',1fr)" role="group" aria-label="Mapa de combinações">'+cells+'</div><div class="legend"><span><i style="background:#16a34a"></i>alcança</span><span><i style="background:#e4e9f2"></i>não alcança</span></div></div>';
  var reach=SCK.map(function(k){return [k,compUnis().filter(function(x){return reached(x,S,k,'ampla')})]});
  h+='<div class="card"><h3>Com a simulação atual, quais universidades entram na faixa?</h3><p>Redação '+S.red+' · Natureza '+S.nat+' · Matemática '+S.mat+' · Linguagens '+S.lin+' · Humanas 43. Universidades cujo corte histórico (ampla) é alcançado:</p>'+
  reach.map(function(r){return '<p><b>'+SC[r[0]]+':</b> '+(r[1].length?r[1].map(function(x){return '<span class="chip g">'+esc(x.sigla)+'</span>'}).join(' '):'nenhuma')+'</p>'}).join('')+
  '<p class="src">Exemplo do enunciado: para testar “redação 940, Natureza 39 e Matemática 40”, ajuste os controles em “Ajustar cenário”. Universidades com processo próprio sem corte comparável (ex.: UNEMAT) não entram nessa conta.</p></div>';
  $('#view-metas').innerHTML=h;
}
function combos(L,R,N,M){var o=[];L.forEach(function(l){R.forEach(function(r){N.forEach(function(n){M.forEach(function(m){o.push({lin:l,red:r,nat:n,mat:m})})})})});return o}
function range(a,b){var o=[],i;a=clamp(a,0,45);b=clamp(b,0,45);if(b<a){var t=a;a=b;b=t}if(b-a>15)b=a+15;for(i=a;i<=b;i++)o.push(i);return o}
function renderComparador(){
  var u=uniById(S.uni),N=range(F.nmin,F.nmax),M=range(F.mmin,F.mmax),rows=combos(LIN,RED,N,M).map(function(c){var e=evalU(u,c,S.cen,S.mod);c.avg=avgOf(scoresOf(c,S.cen));c.w=e.w;c.d=e.d;c.st=e.st;c.ok=e.d!=null&&e.d>=0&&!e.fails.length;return c});
  var total=rows.length;
  rows=rows.filter(function(r){return (F.lin===''||r.lin==+F.lin)&&(F.red===''||r.red==+F.red)&&(F.nat===''||r.nat==+F.nat)&&(F.mat===''||r.mat==+F.mat)&&(F.st===''||r.st===F.st)&&(!F.only||r.ok)});
  rows.sort(function(a,b){var k=F.sort,va=a[k],vb=b[k];if(va==null)va=-1e9;if(vb==null)vb=-1e9;return (va-vb)*F.dir||(a.lin-b.lin)||(a.red-b.red)||(a.nat-b.nat)||(a.mat-b.mat)});
  function sel(id,vals,cur){return '<select data-in="f_'+id+'"><option value="">Todos</option>'+vals.map(function(v){return '<option value="'+v+'"'+(String(cur)===String(v)?' selected':'')+'>'+v+'</option>'}).join('')+'</select>'}
  var shown=rows.slice(0,F.limit);
  function th(k,l){return '<th class="sortable" data-act="sort" data-k="'+k+'">'+l+(F.sort===k?(F.dir<0?' ▼':' ▲'):'')+'</th>'}
  var h='<div class="card"><h2>Comparador de cenários</h2><p>Todas as combinações de Linguagens (34–37) × Redação (920/930/940/960) × Natureza × Matemática (padrão 37–40) = <b>256 combinações</b>, com Humanas fixo em 43. Cenário TRI: <b>'+SC[S.cen]+'</b>. Toque numa linha para usar a combinação.</p>'+uniSelect()+
  '<div class="filters"><div><label>Linguagens</label>'+sel('lin',LIN,F.lin)+'</div><div><label>Redação</label>'+sel('red',RED,F.red)+'</div><div><label>Natureza</label>'+sel('nat',N,F.nat)+'</div><div><label>Matemática</label>'+sel('mat',M,F.mat)+'</div>'+
  '<div><label>Situação</label><select data-in="f_st"><option value="">Todas</option><option value="acima"'+(F.st==='acima'?' selected':'')+'>Acima do corte</option><option value="prox"'+(F.st==='prox'?' selected':'')+'>Perto do corte</option><option value="abaixo"'+(F.st==='abaixo'?' selected':'')+'>Abaixo do corte</option></select></div>'+
  '<div class="check" style="align-self:end"><input type="checkbox" id="f_only" data-in="f_only"'+(F.only?' checked':'')+'><label for="f_only">Só as que alcançam o corte</label></div></div>'+
  '<details><summary>Modo personalizado (qualquer valor de 0 a 45)</summary><p class="src">Defina a faixa de acertos de Natureza e Matemática para montar a tabela (até 16 valores por área).</p><div class="filters"><div><label>Natureza de</label><input type="number" inputmode="numeric" min="0" max="45" data-in="f_nmin" value="'+F.nmin+'"></div><div><label>até</label><input type="number" inputmode="numeric" min="0" max="45" data-in="f_nmax" value="'+F.nmax+'"></div><div><label>Matemática de</label><input type="number" inputmode="numeric" min="0" max="45" data-in="f_mmin" value="'+F.mmin+'"></div><div><label>até</label><input type="number" inputmode="numeric" min="0" max="45" data-in="f_mmax" value="'+F.mmax+'"></div></div><div class="btn-row"><button class="btn btn-ghost" type="button" data-act="fclear">Limpar filtros e voltar a 37–40</button></div></details>'+
  '<p id="rowcount"><b>'+rows.length+'</b> de '+total+' combinações'+(shown.length<rows.length?' (exibindo '+shown.length+')':'')+'.</p>'+
  '<div class="tscroll"><table id="combo-table"><thead><tr>'+th('lin','Ling.')+th('red','Red.')+th('nat','Nat.')+th('mat','Mat.')+th('avg','Média')+th('w','Pond. '+esc(u.sigla))+th('d','Dif.')+'<th>Situação</th></tr></thead><tbody>'+
  shown.map(function(r){var cur=r.lin===S.lin&&r.red===S.red&&r.nat===S.nat&&r.mat===S.mat;return '<tr class="pick'+(cur?' sel':'')+'" data-act="pickrow" data-l="'+r.lin+'" data-r="'+r.red+'" data-n="'+r.nat+'" data-m="'+r.mat+'"><td>'+r.lin+'</td><td>'+r.red+'</td><td>'+r.nat+'</td><td>'+r.mat+'</td><td>'+f1(r.avg)+'</td><td>'+f1(r.w)+'</td><td>'+(r.d==null?'—':sgn(r.d))+'</td><td>'+(r.st==='na'?'—':'<span class="st '+r.st+'">'+(r.st==='acima'?'acima':r.st==='prox'?'perto':'abaixo')+'</span>')+'</td></tr>'}).join('')+'</tbody></table></div>'+
  (shown.length<rows.length?'<div class="btn-row"><button class="btn btn-ghost" type="button" data-act="more">Mostrar mais</button></div>':'')+
  '<p class="src">“Acima/perto/abaixo” compara a nota ponderada estimada com o corte histórico (perto = até '+NEAR+' pontos abaixo). É uma regra deste app, não do MEC.</p></div>';
  h+='<div class="card"><h3>Comparador lado a lado: dois cenários</h3>'+sideScen()+'</div>';
  $('#view-comparador').innerHTML=h;
}
function scenSel(w,k,vals){return '<select data-in="b_'+w+'_'+k+'">'+vals.map(function(v){return '<option value="'+v+'"'+(B[w][k]===v?' selected':'')+'>'+v+'</option>'}).join('')+'</select>'}
function sideScen(){
  var A=B.a,Bb=B.b,N=[];for(var i=0;i<=45;i++)N.push(i);
  var sa=scoresOf(A,S.cen),sb=scoresOf(Bb,S.cen),rows='';
  rows+=[['Humanas',sa.ch,sb.ch],['Linguagens',sa.lc,sb.lc],['Natureza',sa.cn,sb.cn],['Matemática',sa.mt,sb.mt],['Redação',sa.red,sb.red],['Média simples',avgOf(sa),avgOf(sb)]].map(function(r){return '<tr><td>'+r[0]+'</td><td>'+f1(r[1])+'</td><td>'+f1(r[2])+'</td><td>'+sgn(r[2]-r[1])+'</td></tr>'}).join('');
  rows+=compUnis().map(function(u){var ea=evalU(u,A,S.cen,'ampla'),eb=evalU(u,Bb,S.cen,'ampla');return '<tr><td>'+esc(u.sigla)+' <small>('+f2(ea.c)+')</small></td><td>'+sgn(ea.d)+'</td><td>'+sgn(eb.d)+'</td><td>'+(ea.d>=0&&eb.d>=0?'ambos acima':ea.d<0&&eb.d>=0?'B alcança':ea.d>=0&&eb.d<0?'A alcança':'nenhum')+'</td></tr>'}).join('');
  return '<div class="grid2"><div><b>Cenário A</b><label class="src">Linguagens</label>'+scenSel('a','lin',LIN)+'<label class="src">Redação</label>'+scenSel('a','red',RED)+'<label class="src">Natureza</label>'+scenSel('a','nat',N)+'<label class="src">Matemática</label>'+scenSel('a','mat',N)+'</div><div><b>Cenário B</b><label class="src">Linguagens</label>'+scenSel('b','lin',LIN)+'<label class="src">Redação</label>'+scenSel('b','red',RED)+'<label class="src">Natureza</label>'+scenSel('b','nat',N)+'<label class="src">Matemática</label>'+scenSel('b','mat',N)+'</div></div>'+
  '<div class="tscroll" style="margin-top:10px"><table><thead><tr><th></th><th>A</th><th>B</th><th>B − A</th></tr></thead><tbody>'+rows+'</tbody></table></div><p class="src">Cenário TRI: '+SC[S.cen]+'. Para universidades: diferença para o corte histórico (pontos); positivo = alcança o corte (cálculo matemático, não probabilidade).</p>';
}
function renderEstrategia(){
  var chk=function(id,t){var on=false;try{on=localStorage.getItem('rm_'+id)==='1'}catch(e){}return '<label class="check"><input type="checkbox" data-in="chk" data-id="'+id+'"'+(on?' checked':'')+'><span>'+t+'</span></label>'};
  $('#view-estrategia').innerHTML='<div class="card hero"><h2 style="color:#fff">Missão 15 de novembro — reta final</h2><p>Domingo, 15/11/2026: Ciências da Natureza + Matemática, 90 questões em cinco horas. Esta semana é de revisão inteligente, não de maratona.</p></div>'+
  '<div class="card"><h3>Plano da semana (9 a 15/11)</h3><div class="days">'+
  [['Seg 9/11 · Diagnóstico','Liste seus 5 temas de maior ganho em Matemática e Natureza. Revise <b>porcentagem e razão</b> e <b>proporcionalidade</b> (Matemática) e <b>ecologia</b> (Natureza). 20 questões cronometradas.'],
   ['Ter 10/11 · Matemática','<b>Estatística</b> (média, mediana, moda, desvio) e <b>probabilidade</b>. Treine leitura de <b>gráficos e tabelas</b>. Natureza: <b>genética</b> e <b>fisiologia humana</b>.'],
   ['Qua 11/11 · Funções e geometria','<b>Funções</b> (1º e 2º grau, exponencial) e <b>geometria</b> (áreas, volumes, semelhança). Natureza: <b>química orgânica</b> (funções e reações básicas) e <b>estequiometria</b>.'],
   ['Qui 12/11 · Natureza','<b>Soluções</b> (concentração, diluição), <b>eletricidade</b>, <b>energia</b>, <b>termologia</b> e <b>interpretação de experimentos</b>. À tarde: bloco de 45 questões com cronômetro.'],
   ['Sex 13/11 · Revisão leve','Só caderno de erros, fórmulas e 2 blocos curtos de 15–20 questões. Nada de assunto novo. Separe o material e confira o local e o trajeto da prova.'],
   ['Sáb 14/11 · Descanso ativo','30 minutos de leitura do caderno de erros. Separe documento original com foto, caneta preta de corpo transparente, lanche e água. Jantar leve e cama cedo.'],
   ['Dom 15/11 · Dia da prova','Acorde com folga, tome café da manhã, chegue cedo. Confira no cartão de confirmação e no edital o horário dos portões e as regras do dia.']].map(function(d){return '<div class="day"><b>'+d[0]+'</b><p>'+d[1]+'</p></div>'}).join('')+'</div></div>'+
  '<div class="card"><h3>Matemática: prioridades</h3><ul class="tight"><li>Porcentagem e razão · proporcionalidade (regra de três, escalas)</li><li>Estatística · probabilidade</li><li>Geometria (plana e espacial) · funções</li><li>Gráficos e tabelas: leia título, eixos e unidades antes de calcular</li></ul>'+
  '<h3>Natureza: prioridades</h3><ul class="tight"><li>Ecologia · fisiologia humana · genética</li><li>Química orgânica · estequiometria · soluções</li><li>Eletricidade · energia · termologia</li><li>Interpretação de experimentos: identifique variável, controle e conclusão</li></ul></div>'+
  '<div class="card"><h3>As cinco horas de prova</h3><ul class="tight"><li><b>Primeira passada rápida:</b> resolva o que você reconhece de imediato. Marque no caderno as que exigem mais tempo e volte depois. Acertar as fáceis com segurança vale muito.</li>'+
  '<li><b>Tempo médio:</b> são 90 questões em 300 minutos, ou cerca de 3 min 20 s por questão. Use isso como régua, não como regra: as rápidas pagam o tempo das longas.</li>'+
  '<li><b>Questões rápidas primeiro:</b> conta direta, leitura de gráfico, conceito conhecido. Comece pelo bloco em que você se sente mais firme.</li>'+
  '<li><b>Evitando bloqueios:</b> travou por mais de 2–3 minutos? Marque, respire fundo e passe para a próxima. Volte com a cabeça fria.</li>'+
  '<li><b>Cartão-resposta:</b> reserve ao menos 30 minutos no final para passar tudo ao cartão com atenção (ou transfira em blocos durante a prova). Confira o número da questão e do campo.</li>'+
  '<li><b>Caderno:</b> no seu caderno, Natureza costuma ser a parte inicial e Matemática a final (confira a numeração do seu caderno).</li>'+
  '<li><b>Ritmo e corpo:</b> água, um lanche leve, respiração. Se bater cansaço, 30 segundos de pausa com os olhos fechados.</li></ul></div>'+
  '<div class="card"><h3>Checklist (toque para marcar)</h3>'+chk('doc','Documento original com foto')+chk('caneta','Caneta preta de corpo transparente (mais uma reserva)')+chk('local','Local da prova e trajeto conferidos')+chk('sono','Sono em dia na noite de sábado')+chk('lanche','Lanche e água na mochila')+chk('erros','Caderno de erros revisado')+chk('edital','Cartão de confirmação e horário dos portões conferidos')+'</div>'+
  '<div class="card"><h3>Confiança</h3>'+MSG+'</div>';
}
function renderRelatorio(){
  var sc={};SCK.forEach(function(c){sc[c]=scoresOf(S,c)});
  var rows=AREAS.map(function(a){return '<tr><td>'+a[1]+'</td>'+SCK.map(function(c){return '<td>'+f1(sc[c][a[0]])+'</td>'}).join('')+'</tr>'}).join('')+'<tr><th>Média simples</th>'+SCK.map(function(c){return '<th>'+f1(avgOf(sc[c]))+'</th>'}).join('')+'</tr>';
  var urows=UNI.map(function(u){var e=evalU(u,S,S.cen,'ampla');if(e.c==null)return '<tr><td>'+esc(u.sigla)+'</td><td colspan="4" class="mut" style="text-align:left;white-space:normal">'+esc(u.processo.tipo)+' — corte não verificado</td></tr>';
    var lo=evalU(u,S,'c','ampla'),hi=evalU(u,S,'o','ampla');return '<tr><td>'+esc(u.sigla)+'</td><td>'+f2(e.c)+' <small>('+u.corte.ano+')</small></td><td>'+f1(e.w)+'</td><td>'+sgn(e.d)+'</td><td>'+stBadge(e.st)+'<br><small>'+sgn(lo.d)+' a '+sgn(hi.d)+'</small></td></tr>'}).join('');
  var txt=resumo();
  $('#view-relatorio').innerHTML='<div class="card hero"><h1>Rota Medicina 2027 — Relatório</h1><p>Simulação do Lorenzo · gerado em '+new Date().toLocaleDateString('pt-BR')+'</p></div>'+
  '<div class="card no-print"><h2>Compartilhar</h2><p>O link guarda esta simulação (Linguagens '+S.lin+', Redação '+S.red+', Natureza '+S.nat+', Matemática '+S.mat+', cenário '+SC[S.cen].toLowerCase()+').</p><div class="btn-row"><button class="btn" data-act="copylink" type="button">Copiar link do cenário</button><button class="btn btn-green" data-act="share" type="button">Compartilhar</button><button class="btn btn-ghost" data-act="pdf" type="button">Exportar PDF</button><button class="btn btn-ghost" data-act="copytxt" type="button">Copiar resumo</button></div><p class="src">PDF: na janela de impressão, escolha “Salvar como PDF” (no iPhone: compartilhar → Salvar em Arquivos).</p><textarea readonly id="share-url" style="width:100%;min-height:70px;border:1.5px solid var(--line);border-radius:12px;padding:8px;font:12px monospace">'+esc(shareURL())+'</textarea></div>'+
  '<div class="card"><h3>Cenário simulado</h3><p>Humanas 43/45 (fixo) · Linguagens '+S.lin+' · Redação '+S.red+' · Natureza '+S.nat+'/45 · Matemática '+S.mat+'/45</p><div class="tscroll"><table><thead><tr><th>Área</th><th>Conserv.</th><th>Central</th><th>Otimista</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
  '<div class="card"><h3>Comparação com cortes históricos (ampla, cenário '+SC[S.cen].toLowerCase()+')</h3><div class="tscroll"><table><thead><tr><th>Univ.</th><th>Corte</th><th>Sua nota</th><th>Dif.</th><th>Situação</th></tr></thead><tbody>'+urows+'</tbody></table></div><p class="src">Diferença abaixo da situação: faixa conservador a otimista.</p></div>'+
  '<div class="card"><h3>Notas por área</h3>'+chartAreas()+'</div><div class="card"><h3>Nota simulada versus cortes</h3>'+chartCuts()+'</div>'+
  '<div class="card"><h3>Mensagem</h3>'+MSG+'</div>'+
  '<div class="note"><b>Avisos:</b> (1) notas por área são <b>estimativas</b> pelo histórico do ENEM 2023–2025; a nota oficial depende da TRI e das questões acertadas. (2) Cortes são de edições passadas (Sisu 2026 e Acesso Enem UnB 2026) e <b>não</b> preveem 2027. (3) Nenhuma probabilidade de aprovação é calculada. (4) UNEMAT tem vestibular próprio; UnB e UFSC têm processos próprios além do Sisu.</p></div>'+
  '<div class="card"><h3>Fontes</h3><ul class="tight src"><li>TRI: microdados ENEM/INEP via <a href="'+TRI.meta.fonte_url+'">Prof. Rafael Teixeira</a> e <a href="'+TRI.meta.fonte_secundaria+'">EnemCopilot</a>; <a href="'+TRI.meta.fonte_inep+'">INEP</a>.</li><li>Cortes e pesos: <a href="https://dequestoes.com.br/sisu/curso/medicina/">De Questões — Sisu 2026</a>, <a href="https://vemmed.com.br/sisu/nota-de-corte/quanto-precisa-tirar-no-enem">VemMED</a>, <a href="https://www.cebraspe.org.br/vestibulares/unb_26_acessoenem">Cebraspe (UnB)</a>, <a href="https://unemat.br/site/vestibular">UNEMAT</a>, <a href="https://vestibularunificado2027.ufsc.br/inscricao/">UFSC</a>. Detalhes por universidade na seção 3.</li><li>Dados editáveis em <code>data/universidades.json</code> e <code>data/tri.json</code>.</li></ul></div>';
  $('#view-relatorio').setAttribute('data-txt',txt);
}
function resumo(){
  var sc=scoresOf(S,S.cen),u=compUnis().map(function(x){var e=evalU(x,S,S.cen,'ampla');return x.sigla+' '+sgn(e.d)}).join(', ');
  return 'Rota Medicina 2027 — simulação do Lorenzo\nHumanas 43 · Ling. '+S.lin+' · Red. '+S.red+' · Nat. '+S.nat+' · Mat. '+S.mat+'\nMédia simples estimada ('+SC[S.cen].toLowerCase()+'): '+f1(avgOf(sc))+'\nDiferença para o corte histórico (ampla): '+u+'\nEstimativas, não é nota oficial nem previsão de aprovação.\n'+shareURL();
}

/* ---------- navegação / render ---------- */
var RENDER={visao:renderVisao,tri:renderTRI,univ:renderUniv,metas:renderMetas,comparador:renderComparador,estrategia:renderEstrategia,relatorio:renderRelatorio};
function renderCurrent(){RENDER[S.v]();}
function showView(v,push){
  S.v=v;
  $$('.view').forEach(function(s){s.classList.toggle('active',s.id==='view-'+v)});
  $$('#nav button').forEach(function(b){b.setAttribute('aria-current',String(b.getAttribute('data-v')===v))});
  renderCurrent();syncControls();syncURL();
  if(push)window.scrollTo({top:0,behavior:'auto'});
  var cur=$('#nav button[aria-current="true"]');if(cur&&cur.scrollIntoView)try{cur.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}
}
function update(){
  fixMod();syncControls();syncURL();
  var keepScroll=window.scrollY;renderCurrent();
  window.scrollTo(0,keepScroll);
}
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(function(){t.hidden=true},2200)}
function copyText(txt,msg){
  function ok(){toast(msg||'Copiado!')}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(ok,function(){fallback()})}else fallback();
  function fallback(){var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){toast('Não foi possível copiar')}document.body.removeChild(ta)}
}
function setStep(k,d){S[k]=clamp(S[k]+d,0,45);update()}
document.addEventListener('click',function(ev){
  var el=ev.target.closest('[data-act],[data-close]');if(!el)return;
  if(el.hasAttribute('data-close')){$('#sheet').hidden=true;return}
  var a=el.getAttribute('data-act'),v=el.getAttribute('data-v');
  switch(a){
    case 'lin':S.lin=+v;update();break;
    case 'red':S.red=+v;update();break;
    case 'nat':S.nat=+v;update();break;
    case 'mat':S.mat=+v;update();break;
    case 'cen':S.cen=v;update();break;
    case 'natd':setStep('nat',+el.getAttribute('data-d'));break;
    case 'matd':setStep('mat',+el.getAttribute('data-d'));break;
    case 'reset':S.lin=DEF.lin;S.red=DEF.red;S.nat=DEF.nat;S.mat=DEF.mat;S.cen=DEF.cen;update();break;
    case 'cell':S.nat=+el.getAttribute('data-n');S.mat=+el.getAttribute('data-m');update();break;
    case 'pickrow':S.lin=+el.getAttribute('data-l');S.red=+el.getAttribute('data-r');S.nat=+el.getAttribute('data-n');S.mat=+el.getAttribute('data-m');update();toast('Combinação aplicada ao painel');break;
    case 'sort':var k=el.getAttribute('data-k');if(F.sort===k)F.dir=-F.dir;else{F.sort=k;F.dir=(k==='avg'||k==='w'||k==='d')?-1:1}renderCurrent();break;
    case 'more':F.limit+=600;renderCurrent();break;
    case 'fclear':F.lin=F.red=F.nat=F.mat=F.st='';F.only=false;F.nmin=37;F.nmax=40;F.mmin=37;F.mmax=40;F.limit=600;renderCurrent();break;
    case 'copylink':copyText(shareURL(),'Link copiado!');break;
    case 'copytxt':copyText($('#view-relatorio').getAttribute('data-txt'),'Resumo copiado!');break;
    case 'share':var d={title:'Rota Medicina 2027',text:'Simulação do Lorenzo',url:shareURL()};if(navigator.share)navigator.share(d).catch(function(){});else copyText(shareURL(),'Link copiado!');break;
    case 'pdf':if(S.v!=='relatorio')showView('relatorio');setTimeout(function(){window.print()},250);break;
  }
});
document.addEventListener('input',function(ev){
  var el=ev.target,k=el.getAttribute&&el.getAttribute('data-in');if(!k)return;
  if(k==='nat'||k==='mat'){if(el.value==='')return;S[k]=clamp(el.value,0,45);$$('[data-in="'+k+'"]').forEach(function(i){if(i!==el&&i!==document.activeElement)i.value=S[k]});update();}
});
document.addEventListener('change',function(ev){
  var el=ev.target,k=el.getAttribute&&el.getAttribute('data-in');if(!k)return;
  if(k==='nat'||k==='mat'){S[k]=clamp(el.value,0,45);el.value=S[k];update();return}
  if(k==='uni'){S.uni=el.value;S.mod='ampla';update();return}
  if(k==='mod'){S.mod=el.value;update();return}
  if(k==='umod'){S.uni=el.getAttribute('data-u');S.mod=el.value;update();return}
  if(k==='ua'||k==='ub'){B[k]=el.value;renderCurrent();return}
  if(k.indexOf('b_')===0){var p=k.split('_');B[p[1]][p[2]]=+el.value;renderCurrent();return}
  if(k.indexOf('f_')===0){var f=k.slice(2);if(f==='only')F.only=el.checked;else if(/^[nm](min|max)$/.test(f))F[f]=clamp(el.value,0,45);else F[f]=el.value;F.limit=600;renderCurrent();return}
  if(k==='chk'){try{localStorage.setItem('rm_'+el.getAttribute('data-id'),el.checked?'1':'0')}catch(e){}}
});
function boot(){
  var nav=$('#nav');nav.innerHTML=VIEWS.map(function(v){return '<button type="button" data-v="'+v[0]+'" aria-current="false">'+v[1]+'</button>'}).join('');
  nav.addEventListener('click',function(ev){var b=ev.target.closest('button[data-v]');if(b)showView(b.getAttribute('data-v'),true)});
  ['#btn-ajustar','#fab'].forEach(function(s){$(s).addEventListener('click',function(){$('#sheet').hidden=false})});
  initViews();showView(S.v,false);
}
function fail(e){$('#app').innerHTML='<div class="err">Não foi possível carregar os dados ('+esc(e&&e.message||e)+'). Abra este link pela internet (não como arquivo local).</div>'}
Promise.all([fetch('data/tri.json').then(function(r){if(!r.ok)throw new Error('tri.json '+r.status);return r.json()}),fetch('data/universidades.json').then(function(r){if(!r.ok)throw new Error('universidades.json '+r.status);return r.json()})]).then(function(r){TRI=r[0];UNI=r[1].universidades;window.__RM_DATA={meta:r[1].meta};readURL();boot()}).catch(fail);
})();
