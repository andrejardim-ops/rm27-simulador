(function(){
'use strict';
var LIN=[34,35,36,37], RED=[920,930,940,960], SHORT=[37,38,39,40];
var SC={c:'Conservador',m:'Central',o:'Otimista'}, SCK=['c','m','o'];
var AREAS=[['ch','Humanas'],['lc','Linguagens'],['cn','Natureza'],['mt','Matemática'],['red','Redação']];
var VIEWS=[['visao','1 Visão geral'],['tri','2 Simulador TRI'],['univ','3 Universidades'],['vest','4 Vestibulares'],['metas','5 Metas de acertos'],['comparador','6 Comparador'],['estrategia','7 Estratégia de prova'],['relatorio','8 Relatório']];
var NEAR=15;
var DEF={lin:35,red:940,nat:38,mat:38,cen:'m',uni:'ufmg',mod:'ampla',v:'visao'};
var S=copy(DEF), TRI=null, UNI=null, VEST=null, META=null, LEGADO={};
var F={lin:'',red:'',nat:'',mat:'',st:'',only:false,sort:'avg',dir:-1,nmin:37,nmax:40,mmin:37,mmax:40,limit:600};
var B={ua:'ufmg',ub:'ufmg',ma:'ampla',mb:'ampla',a:{lin:35,red:940,nat:37,mat:37},b:{lin:35,red:940,nat:40,mat:40}};
var Q={q:'',uf:'',reg:'',proc:'',cat:'',ver:'',corte:'',limit:24};
var Qv={q:'',st:''};
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
  t=p.get('uni')||S.uni; t=canonUni(t);
  if(t&&UNI.some(function(u){return u.id===t}))S.uni=t;
  else S.uni=canonUni(DEF.uni);
  if(!UNI.some(function(u){return u.id===S.uni})&&UNI.length)S.uni=UNI[0].id;
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
function canonUni(id){return (LEGADO&&LEGADO[id])||id}
function uniById(id){id=canonUni(id);for(var i=0;i<UNI.length;i++)if(UNI[i].id===id)return UNI[i];return UNI[0]}
function verKind(s){s=s||'';if(/^verificado/i.test(s))return 'verificado';if(/^parcial/i.test(s))return 'parcial';return 'nao'}
function verChip(s){
  var k=verKind(s), cls=k==='verificado'?'acima':k==='parcial'?'prox':'na';
  var label=k==='verificado'?'verificado':k==='parcial'?'parcial':'não verificado';
  return '<span class="st '+cls+'" title="'+esc(s||'não verificado')+'">'+label+'</span>';
}
function distBadge(e){
  if(!e||e.c==null)return '<span class="st na">Sem corte comparável</span>';
  if(e.d==null)return '<span class="st prox">Pesos não verificados</span>';
  return stBadge(e.st);
}
function labelOf(u){
  var n=0,i;for(i=0;i<UNI.length;i++)if(UNI[i].sigla===u.sigla)n++;
  if(n<2)return u.sigla;
  var c=u.cidade;if(c.length>14)c=c.slice(0,13)+'…';
  return u.sigla+' '+c;
}
function cautionMark(u){
  if((u.notas||[]).some(function(n){return /não se aplica/i.test(n)}))return '*';
  if(verKind(u.status_verificacao)==='parcial')return '†';
  return '';
}
function hrefOf(url){return esc(encodeURI(String(url||'')))}
function srcLinks(fontes){return (fontes||[]).map(function(f){return '<a href="'+hrefOf(f.url)+'" target="_blank" rel="noopener">'+esc(f.nome)+'</a>'}).join(' · ')}
function anteriorBlock(u){
  var a=u.anterior;
  if(a&&a.valor!=null){
    var s='Edição anterior ('+esc(a.ano)+'): '+f2(a.valor)+'.';
    if(a.fonte)s+=' Fonte: <a href="'+hrefOf(a.fonte)+'" target="_blank" rel="noopener">relatório MEC '+esc(a.ano)+'</a>.';
    if(a.vagas_ac!=null)s+=' Vagas na ampla em '+esc(a.ano)+': '+f0(a.vagas_ac)+'.';
    return s;
  }
  if(a&&a.obs)return 'Edição anterior ('+esc(a.ano||2025)+'): '+esc(a.obs)+(a.fonte?' Fonte: <a href="'+hrefOf(a.fonte)+'" target="_blank" rel="noopener">relatório MEC</a>.':'');
  if(u.processo&&u.processo.tipo==='Sisu')return 'Edição anterior (2025): <span class="st na">não verificado</span> (não consta neste levantamento).';
  return '';
}
function alertNotas(u){
  var ns=(u.notas||[]).filter(function(n){return /não se aplica|não verificado|cautela|duas vias|cotas exibidas|mensalidade/i.test(n)});
  if(!ns.length)return '';
  return '<div class="note">'+ns.map(function(n){return '<p>'+esc(n)+'</p>'}).join('')+'</div>';
}
function vagasLine(u){
  var c=u.corte||{};
  if(c.vagas_ac==null&&c.inscricoes_ac==null&&c.vagas_total_curso==null)return '';
  var s='<p class="src"><b>Vagas no relatório MEC (Sisu 2026):</b> ';
  var bits=[];
  if(c.vagas_ac!=null)bits.push('ampla '+f0(c.vagas_ac));
  if(c.inscricoes_ac!=null)bits.push('inscrições na ampla '+f0(c.inscricoes_ac));
  if(c.vagas_total_curso!=null)bits.push('vagas do curso '+f0(c.vagas_total_curso));
  s+=bits.join(' · ')+'.</p>';
  if(c.vagas_ac!=null&&c.vagas_ac<=6)s+='<div class="note">Poucas vagas na ampla concorrência ('+c.vagas_ac+'). O número é o do relatório do MEC; compare com cautela. Não é previsão.</div>';
  return s;
}
function f0(n){return n==null?'—':Number(n).toLocaleString('pt-BR')}
function pf(n){if(n==null)return '—';return String(n).replace('.',',')}
function uniOptions(sel){
  var regs=['Norte','Nordeste','Centro-Oeste','Sudeste','Sul'], html='', seen={};
  regs.forEach(function(r){
    var us=UNI.filter(function(u){return u.regiao===r});
    if(!us.length)return;
    us.sort(function(a,b){return a.sigla.localeCompare(b.sigla,'pt')||a.cidade.localeCompare(b.cidade,'pt')});
    html+='<optgroup label="'+esc(r)+'">'+us.map(function(u){seen[u.id]=1;var mark=u.corte.valor==null?' (sem corte comparável)':(verKind(u.status_verificacao)==='parcial'?' (parcial)':'');return '<option value="'+u.id+'"'+(u.id===sel?' selected':'')+'>'+esc(u.sigla+' — '+u.cidade+'/'+u.uf+mark)+'</option>'}).join('')+'</optgroup>';
  });
  var rest=UNI.filter(function(u){return !seen[u.id]});
  if(rest.length)html+='<optgroup label="Outras">'+rest.map(function(u){return '<option value="'+u.id+'"'+(u.id===sel?' selected':'')+'>'+esc(u.sigla+' — '+u.cidade+'/'+u.uf)+'</option>'}).join('')+'</optgroup>';
  return html;
}
function filteredUnis(){
  var q=(Q.q||'').trim().toLowerCase();
  return UNI.filter(function(u){
    if(Q.uf&&u.uf!==Q.uf)return false;
    if(Q.reg&&u.regiao!==Q.reg)return false;
    if(Q.proc&&u.processo.tipo!==Q.proc)return false;
    if(Q.cat&&u.categoria!==Q.cat)return false;
    if(Q.ver&&verKind(u.status_verificacao)!==Q.ver)return false;
    if(Q.corte==='com'&&u.corte.valor==null)return false;
    if(Q.corte==='sem'&&u.corte.valor!=null)return false;
    if(q){
      var blob=(u.sigla+' '+u.nome+' '+u.cidade+' '+u.uf+' '+(u.campus||'')+' '+(u.regiao||'')+' '+(u.processo.tipo||'')+' '+(u.processo.nome||'')+' '+(u.categoria||'')).toLowerCase();
      if(blob.indexOf(q)<0)return false;
    }
    return true;
  });
}
function byCorte(a,b){
  var av=a.corte.valor,bv=b.corte.valor;
  if(av==null&&bv==null)return a.sigla.localeCompare(b.sigla,'pt')||a.cidade.localeCompare(b.cidade,'pt');
  if(av==null)return 1;if(bv==null)return -1;return bv-av;
}
function distinct(key){
  var o=[], seen={};
  UNI.forEach(function(u){var v=key(u);if(v&&!seen[v]){seen[v]=1;o.push(v)}});
  o.sort(function(a,b){return String(a).localeCompare(String(b),'pt')});
  return o;
}
function selFilter(id,label,vals,cur,ph){
  return '<div><label for="'+id+'">'+label+'</label><select id="'+id+'" data-in="'+id+'"><option value="">'+(ph||'Todos')+'</option>'+vals.map(function(v){
    var val,lab; if(Array.isArray(v)){val=v[0];lab=v[1]}else{val=lab=v}
    return '<option value="'+esc(val)+'"'+(String(cur)===String(val)?' selected':'')+'>'+esc(lab)+'</option>';
  }).join('')+'</select></div>';
}
function prepUni(u){
  u.minimos=u.minimos||{};
  u.modalidades=u.modalidades||[];
  u.notas=u.notas||[];
  u.corte=u.corte||{valor:null,fontes:[],verificacao:'não verificado'};
  u.corte.fontes=u.corte.fontes||[];
  u.processo=u.processo||{tipo:'',status2027:''};
  if(!u.status_verificacao)u.status_verificacao='não verificado';
  if(u.media_minima!=null&&u.minimos.media==null)u.minimos.media=u.media_minima;
  return u;
}
function vestsFor(u){if(!VEST)return [];return VEST.processos.filter(function(p){return (p.siglas||[]).indexOf(u.sigla)>=0})}
function fieldNV(label,value){
  var nv=/não verificado/i.test(value||'');
  return '<dt>'+label+'</dt><dd class="'+(nv?'nv':'')+'">'+esc(value||'—')+'</dd>';
}
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
  var u=uniById(S.uni),c=cutoff(u,S.mod),vals=SCK.map(function(k){return avgOf(scoresOf(S,k))}),wv=SCK.map(function(k){return weighted(u,scoresOf(S,k))});
  var groups=[{label:'Média simples',vals:vals}], all=vals.slice(), extra='';
  if(wv[0]!=null){groups.push({label:'Ponderada '+labelOf(u),vals:wv});all=all.concat(wv)}
  else extra='<p class="src">Pesos de '+esc(u.sigla)+': <span class="st na">não verificado</span>. A média ponderada não entra neste gráfico.</p>';
  if(c!=null)all.push(c);
  var mn=Math.floor(Math.min.apply(null,all)/20)*20-20,mx=Math.ceil(Math.max.apply(null,all)/20)*20+10;
  return gbars({title:'Conservador, central e otimista',groups:groups,colors:COL3,min:mn,max:mx,hline:c,hlabel:c?'corte '+labelOf(u)+' '+f2(c):'',h:230,labelIdx:1})+legend([['Conservador',COL3[0]],['Central',COL3[1]],['Otimista',COL3[2]]])+extra;
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
function chartCuts(list){
  var rows=(list||compUnis()).map(function(u){var e=evalU(u,S,S.cen,'ampla'),lo=weighted(u,scoresOf(S,'c')),hi=weighted(u,scoresOf(S,'o'));return {u:u,e:e,lo:lo,hi:hi}}).filter(function(r){return r.e.c!=null&&r.e.w!=null&&r.lo!=null&&r.hi!=null});
  if(!rows.length)return '<p class="src">Nenhum curso com corte e pesos neste recorte. A distância não é calculada sem os dois.</p>';
  var total=rows.length, capped=false;
  if(rows.length>16){capped=true;rows=rows.slice().sort(function(a,b){return Math.abs(a.e.d)-Math.abs(b.e.d)}).slice(0,16)}
  rows.sort(function(a,b){return a.e.c-b.e.c});
  var all=[];rows.forEach(function(r){all.push(r.e.c,r.lo,r.hi,r.e.w)});
  var mn=Math.floor(Math.min.apply(null,all)/20)*20-10,mx=Math.ceil(Math.max.apply(null,all)/20)*20+10,labs=rows.map(function(r){return labelOf(r.u)+cautionMark(r.u)}),pl=Math.min(168,Math.max(72,7*Math.max.apply(null,labs.map(function(s){return s.length})))),pr=14,pt=8,rh=26,W=Math.max(360,pl+230),H=pt+rows.length*rh+30,iw=W-pl-pr;
  var X=function(v){return pl+(v-mn)/(mx-mn)*iw},s='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Nota simulada versus cortes históricos">',i,v;
  for(v=Math.ceil(mn/20)*20;v<=mx;v+=20)s+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+pt+'" y2="'+(H-22)+'" stroke="#e3eaf6"/><text x="'+X(v)+'" y="'+(H-10)+'" font-size="9" text-anchor="middle" fill="#5b6b86">'+v+'</text>';
  var col={acima:'#16a34a',prox:'#d97706',abaixo:'#b42318'};
  rows.forEach(function(r,i){
    var y=pt+i*rh;
    s+='<text x="'+(pl-6)+'" y="'+(y+rh/2+3)+'" font-size="10" text-anchor="end" fill="#0f1b33" font-weight="600">'+esc(labelOf(r.u)+cautionMark(r.u))+'</text>';
    s+='<rect x="'+pl+'" y="'+(y+5)+'" width="'+Math.max(0,X(r.e.w)-pl)+'" height="'+(rh-12)+'" rx="4" fill="'+col[r.e.st]+'" opacity=".85"/>';
    s+='<line x1="'+X(r.lo)+'" x2="'+X(r.hi)+'" y1="'+(y+rh/2)+'" y2="'+(y+rh/2)+'" stroke="#0a2a5e" stroke-width="2"/><line x1="'+X(r.lo)+'" x2="'+X(r.lo)+'" y1="'+(y+rh/2-4)+'" y2="'+(y+rh/2+4)+'" stroke="#0a2a5e" stroke-width="2"/><line x1="'+X(r.hi)+'" x2="'+X(r.hi)+'" y1="'+(y+rh/2-4)+'" y2="'+(y+rh/2+4)+'" stroke="#0a2a5e" stroke-width="2"/>';
    s+='<line x1="'+X(r.e.c)+'" x2="'+X(r.e.c)+'" y1="'+(y+1)+'" y2="'+(y+rh-1)+'" stroke="#0f1b33" stroke-width="3"/>';
  });
  return s+'</svg>'+legend([['Acima do corte','#16a34a'],['Perto (até '+NEAR+' pts)','#d97706'],['Abaixo','#b42318'],['Corte histórico (barra preta)','#0f1b33'],['Faixa conserv.–otimista (linha)','#0a2a5e']])+'<p class="src">Barra = nota ponderada estimada (cenário '+SC[S.cen].toLowerCase()+'), comparada ao corte histórico da ampla concorrência. Não indica aprovação.'+(capped?' Exibindo 16 cursos com corte mais próximo da sua nota, de '+total+' com corte e pesos.':'')+' * = o levantamento diz que esse corte de 2026 não se aplica ao processo de 2027. † = status parcial.</p>';
}
function chartSens(){
  var u=uniById(S.uni),base=scoresOf(S,S.cen),bA=avgOf(base),bW=weighted(u,base);
  function d(k,dn,dm){var s2={lin:S.lin,red:S.red,nat:clamp(S.nat+dn,0,45),mat:clamp(S.mat+dm,0,45)},sc=scoresOf(s2,S.cen);return [avgOf(sc)-bA,bW!=null?weighted(u,sc)-bW:0]}
  var m=d('m',0,1),n=d('n',1,0),mx=Math.max(m[0],n[0],m[1],n[1],1),W=360,H=170,pl=96,iw=W-pl-40;
  var rows=[['+1 em Matemática · média simples',m[0],'#16a34a'],['+1 em Natureza · média simples',n[0],'#0b5ed7']];
  if(bW!=null)rows.push(['+1 em Matemática · pond. '+u.sigla,m[1],'#16a34a'],['+1 em Natureza · pond. '+u.sigla,n[1],'#0b5ed7']);
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
  var u=uniById(S.uni),m='';
  if(u.modalidades.length)m='<div class="ctl"><label>Modalidade</label><select data-in="mod"><option value="ampla">Ampla concorrência</option>'+u.modalidades.map(function(x){return '<option value="'+x.id+'"'+(S.mod===x.id?' selected':'')+'>'+esc(x.nome)+'</option>'}).join('')+'</select><p class="src">Cotas: só entram se estiverem no arquivo de dados. A elegibilidade depende de cada edital.</p></div>';
  return '<div class="ctl"><label>Universidade de referência</label><select data-in="uni">'+uniOptions(S.uni)+'</select></div>'+m;
}
function summaryKpis(){
  var sc={},k;SCK.forEach(function(c){sc[c]=scoresOf(S,c)});
  var u=uniById(S.uni),e=evalU(u,S,S.cen,S.mod),n=0,tot=0;
  var comps=combos(LIN,RED,[37,38,39,40],[37,38,39,40]);
  comps.forEach(function(c){tot++;if(reached(u,c,S.cen,S.mod))n++});
  var best=comps.slice().sort(function(a,b){return avgOf(scoresOf(b,S.cen))-avgOf(scoresOf(a,S.cen))})[0];
  var inRange=compUnis().filter(function(x){return reached(x,S,S.cen,'ampla')});
  var reachTxt=inRange.length?inRange.map(function(x){return '<span class="chip g">'+esc(labelOf(x)+cautionMark(x))+'</span>'}).join(' '):'nenhuma neste cenário';
  var comboTxt=(e.c==null||!u.pesos)?'<p>A conta de combinações que alcançam o corte não entra para '+esc(labelOf(u))+': '+(e.c==null?'sem corte comparável.':'pesos não verificados.')+'</p>':'<p><b>'+n+' de '+tot+'</b> combinações da tabela (Nat./Mat. 37–40) alcançam o corte histórico de '+esc(labelOf(u))+' no cenário '+SC[S.cen].toLowerCase()+'.</p>';
  var unb=UNI.filter(function(x){return x.id==='unb-brasilia'})[0];
  var unbTxt=unb?(esc(unb.sigla)+' ('+f2(unb.corte.valor)+', '+esc(unb.status_verificacao)+')'):'UnB';
  return '<div class="grid2"><div class="kpi g"><b>'+f1(avgOf(sc[S.cen]))+'</b><span>Média simples estimada ('+SC[S.cen].toLowerCase()+')</span></div>'+
  '<div class="kpi"><b>'+f1(avgOf(sc.c))+' – '+f1(avgOf(sc.o))+'</b><span>Faixa conservador–otimista</span></div>'+
  '<div class="kpi"><b>'+(e.w==null?'—':f1(e.w))+'</b><span>Ponderada '+esc(labelOf(u))+' ('+SC[S.cen].toLowerCase()+')</span></div>'+
  '<div class="kpi"><b>'+(e.d==null?'—':sgn(e.d))+'</b><span>Distância ao corte histórico '+(e.c!=null?f2(e.c):'')+'</span></div></div>'+
  '<p style="margin-top:10px">'+distBadge(e)+' '+verChip(u.status_verificacao)+' <small>'+esc(labelOf(u))+' · cenário '+SC[S.cen].toLowerCase()+'</small></p>'+
  '<p class="src">'+(u.corte&&u.corte.edicao?esc(u.corte.edicao)+' · '+esc(u.corte.modalidade||''):'sem corte comparável')+'</p>'+
  '<p class="statusline">'+esc(u.status_verificacao||'não verificado')+'</p>'+
  comboTxt+
  '<p>Com a simulação atual, o corte histórico (ampla) é alcançado em <b>'+inRange.length+'</b> de '+compUnis().length+' cursos com corte e pesos: '+reachTxt+'.</p>'+
  '<p class="src">* no nome = o levantamento diz que o corte de 2026 não se aplica ao processo de 2027. '+unbTxt+' fica de fora desta conta: pesos não verificados. Melhor combinação da tabela (média simples): Ling. '+best.lin+' · Red. '+best.red+' · Nat. '+best.nat+' · Mat. '+best.mat+' → '+f1(avgOf(scoresOf(best,S.cen)))+'. Resultado matemático sobre cortes históricos, não é probabilidade de aprovação.</p>';
}
var MSG='<div class="msg"><p><b>Lorenzo, acertar 43 das 45 questões de Ciências Humanas é uma conquista extraordinária.</b></p><p>Você já demonstrou conhecimento, disciplina e capacidade de alcançar resultados expressivos.</p><p>Agora vem uma etapa fundamental: Matemática e Ciências da Natureza.</p><p>Cada questão resolvida corretamente amplia suas possibilidades.</p><p>Você não precisa acertar tudo. Precisa fazer uma prova inteligente, administrar seu tempo e aproveitar o conhecimento que construiu.</p><p><b>A Medicina é o seu objetivo. Continue trabalhando para conquistá-la.</b></p></div>';
function initViews(){
  $('#view-visao').innerHTML='<div class="card hero"><h1>Rota Medicina 2027</h1><p>Simule o segundo dia do ENEM, veja a nota estimada por área e compare com os cortes históricos de '+UNI.length+' cursos de Medicina em universidades públicas. Mexa nos controles: tudo recalcula na hora. Linguagens continua na faixa de 34 a 37 acertos.</p></div>'+
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
  var withW=UNI.filter(function(u){return u.pesos});
  var wrows=withW.map(function(u){var p=u.pesos;return '<tr><td>'+esc(labelOf(u))+'</td><td>'+[pf(p.cn),pf(p.ch),pf(p.lc),pf(p.mt),pf(p.red)].join('/')+'</td>'+SCK.map(function(c){return '<td>'+f1(weighted(u,sc[c]))+'</td>'}).join('')+'</tr>'}).join('');
  $('#view-tri').innerHTML='<div class="card"><h2>Simulador TRI</h2><div class="note"><b>Estimativa, não é a nota oficial.</b> A TRI não conta apenas acertos: a nota depende dos parâmetros das questões (dificuldade, discriminação e acerto ao acaso) e de <i>quais</i> questões foram acertadas. Aqui usamos a distribuição histórica de notas por número de acertos no ENEM 2023, 2024 e 2025 para dar uma faixa plausível.</div>'+
  '<div class="info"><b>Como lemos os dados:</b> <b>Conservador</b> = menor percentil 10 entre 2023–2025; <b>Central</b> = média das medianas; <b>Otimista</b> = maior percentil 90. Ou seja, o conservador e o otimista cobrem cerca de 80% dos candidatos com aquele número de acertos nas três edições. Redação é a nota simulada, igual nos três cenários.</div>'+
  '<div class="tscroll"><table><thead><tr><th>Área</th><th>Acertos</th><th>Conserv.</th><th>Central</th><th>Otimista</th></tr></thead><tbody>'+rows+'</tbody><tfoot>'+avg+'</tfoot></table></div>'+
  '<p class="src">* extrapolado (sem candidatos observados nesse número de acertos) · † amostra pequena (&lt; 300 candidatos nas três edições).</p>'+
  '<p class="src">Fonte: microdados oficiais do ENEM/INEP (aplicação regular), tabulados por <a href="'+TRI.meta.fonte_url+'" target="_blank" rel="noopener">Prof. Rafael Teixeira</a> (<a href="'+TRI.meta.fonte_csv+'" target="_blank" rel="noopener">planilha</a>); conferido com <a href="'+TRI.meta.fonte_secundaria+'" target="_blank" rel="noopener">EnemCopilot</a>. Microdados originais: <a href="'+TRI.meta.fonte_inep+'" target="_blank" rel="noopener">INEP</a>. Acesso em 09/11/2026. Os dados de 2026 ainda não existem.</p></div>'+
  '<div class="card"><h3>Notas estimadas por área</h3>'+chartAreas()+'</div>'+
  '<div class="card"><h3>Conservador, central e otimista</h3>'+uniSelect()+chartScen()+'</div>'+
  '<div class="card"><h3>Evolução da média conforme os acertos</h3>'+chartEvo()+'</div>'+
  '<div class="card"><h3>E se acertar mais uma?</h3>'+chartSens()+'</div>'+
  '<div class="card"><h3>Média ponderada por universidade</h3><p class="mut">Pesos na ordem Nat/Hum/Ling/Mat/Red, do relatório MEC de vagas do Sisu 2026 (edição única do ano). Nota = soma(peso × nota) ÷ soma dos pesos. '+withW.length+' cursos têm pesos; onde o peso não veio no levantamento, a linha não entra e o card marca <span class="st na">não verificado</span>.</p><div class="tscroll"><table><thead><tr><th>Univ.</th><th>Pesos</th><th>Conserv.</th><th>Central</th><th>Otim.</th></tr></thead><tbody>'+wrows+'</tbody></table></div></div>';
}
function pesosChips(u){if(!u.pesos)return '<p class="src">Pesos: <span class="st na">não verificado</span> neste levantamento. A distância até o corte não é calculada.</p>';var p=u.pesos;return '<div class="pesos"><span>Natureza '+pf(p.cn)+'</span><span>Humanas '+pf(p.ch)+'</span><span>Linguagens '+pf(p.lc)+'</span><span>Matemática '+pf(p.mt)+'</span><span>Redação '+pf(p.red)+'</span></div>'}
function cardTone(e){if(e.c==null)return 'na';if(e.d==null)return 'parcial';return e.st}
function ucard(u){
  var mod=S.uni===u.id?S.mod:'ampla',e=evalU(u,S,S.cen,mod),lo=evalU(u,S,'c',mod),hi=evalU(u,S,'o',mod),c=e.c;
  var mods='';
  if(u.modalidades.length){mods='<label class="src">Modalidade</label><select data-in="umod" data-u="'+u.id+'"><option value="ampla">Ampla concorrência</option>'+u.modalidades.map(function(x){return '<option value="'+x.id+'"'+(mod===x.id?' selected':'')+'>'+esc(x.nome)+'</option>'}).join('')+'</select>'}
  var corteTxt=c==null?'<div class="big" style="color:var(--mut)">sem corte comparável</div><small>'+esc(u.processo.tipo)+'</small>':'<div class="big">'+f2(c)+'</div><small>'+esc(u.corte.edicao)+' · '+esc(u.corte.modalidade)+'</small>';
  var ant=anteriorBlock(u);
  var dif=e.d==null?'':('<dl class="kv"><dt>Sua nota estimada ('+SC[S.cen].toLowerCase()+')</dt><dd>'+f1(e.w)+'</dd><dt>Diferença para o corte</dt><dd>'+sgn(e.d)+'</dd><dt>Faixa conserv.–otimista</dt><dd>'+f1(lo.w)+' – '+f1(hi.w)+'</dd></dl>'+(e.fails.length?'<div class="note">Atenção — abaixo da nota mínima exigida em: '+esc(e.fails.join('; '))+'.</div>':''));
  var cat=u.categoria?'<span class="chip'+( /mensalidade/i.test(u.categoria)?' pay':'')+'">'+esc(u.categoria)+'</span> ':'';
  var vestBtn=vestsFor(u).length?'<p><button type="button" class="btn btn-ghost" data-act="openvest" data-sigla="'+esc(u.sigla)+'">Ver datas do processo</button></p>':'';
  var reg=u.regiao?'<span class="chip">'+esc(u.regiao)+'</span> ':'';
  return '<article class="card ucard '+cardTone(e)+'"><header><div><h3>'+esc(u.sigla)+' <small>· '+esc(u.cidade)+'/'+esc(u.uf)+'</small></h3><small>'+esc(u.nome)+' — '+esc(u.campus)+'</small></div><div>'+distBadge(e)+'</div></header>'+
  '<p>'+reg+'<span class="chip">'+esc(u.processo.tipo)+'</span> '+cat+verChip(u.status_verificacao)+'</p>'+
  '<p class="statusline">'+esc(u.status_verificacao||'não verificado')+'</p>'+
  corteTxt+(ant?'<p class="src">'+ant+'</p>':'')+dif+alertNotas(u)+vagasLine(u)+mods+pesosChips(u)+vestBtn+
  '<details><summary>Fonte, processo e observações</summary><p class="src"><b>Processo 2027:</b> '+esc(u.processo.status2027||'')+'</p>'+
  (u.processo.status_verificacao_datas?'<p class="src"><b>Datas:</b> '+esc(u.processo.status_verificacao_datas)+(u.processo.consultado_em?' · acesso '+esc(u.processo.consultado_em):'')+'</p>':'')+
  (u.corte.valor!=null?'<p class="src"><b>Corte:</b> '+esc(u.corte.tipo)+'. Base: '+esc(u.corte.base_enem)+'.<br><b>Verificação do corte:</b> '+esc(u.corte.verificacao||u.status_verificacao)+'.</p>':'<p class="src"><b>Corte:</b> sem corte comparável. '+esc(u.corte.tipo||'')+' <span class="st na">não verificado</span>.</p>')+
  (u.co_ies_curso?'<p class="src"><b>CO_IES_CURSO (MEC):</b> '+esc(u.co_ies_curso)+'</p>':'<p class="src"><b>CO_IES_CURSO:</b> não se aplica a este processo (fora do relatório Sisu usado aqui).</p>')+
  (u.pesos_fonte?'<p class="src"><b>Pesos:</b> '+esc(u.pesos_fonte)+' ('+u.pesos_ano+').</p>':'<p class="src"><b>Pesos:</b> <span class="st na">não verificado</span>.</p>')+
  (u.media_minima!=null?'<p class="src"><b>Média mínima:</b> '+f2(u.media_minima)+' (relatório MEC de vagas, Sisu 2026).</p>':'')+
  (u.notas||[]).map(function(n){return '<p class="src">• '+esc(n)+'</p>'}).join('')+
  '<p class="src"><b>Fontes:</b> '+srcLinks(u.corte.fontes)+'</p></details></article>';
}
function renderUniv(){
  var sisuN=UNI.filter(function(u){return u.processo.tipo==='Sisu'&&u.corte.valor!=null}).length;
  var semN=UNI.filter(function(u){return u.corte.valor==null}).length;
  var ed=META&&META.sisu2027;
  var info=ed?'<div class="info"><b>Sisu 2026 (edição única do ano)</b> — chamada regular, ampla concorrência, relatório oficial do MEC. '+sisuN+' campi com corte de 2026. '+semN+' processos próprios <b>sem corte comparável</b>. Sisu 2027: '+esc(ed.edital)+'. Datas de inscrição do candidato: <span class="st na">não verificado</span> ('+esc(ed.datas_candidato)+'). <a href="'+hrefOf(ed.fonte)+'" target="_blank" rel="noopener">Edital nº 86 no DOU</a>.</div>':'';
  var h='<div class="card"><h2>Universidades públicas de Medicina</h2><p>'+UNI.length+' cursos. A faixa é de <b>corte histórico</b> (nível de disputa), <b>não de qualidade</b>. Ampla concorrência. Cortes passados <b>não</b> preveem 2027 e <b>não</b> são chance de aprovação.</p>'+info+
  '<div class="filters"><div class="span2"><label for="q_q">Buscar</label><input id="q_q" type="search" data-in="q_q" value="'+esc(Q.q)+'" placeholder="Sigla, cidade, campus ou nome" autocomplete="off"></div>'+
  selFilter('q_uf','UF',distinct(function(u){return u.uf}),Q.uf,'Todas')+
  selFilter('q_reg','Região',distinct(function(u){return u.regiao}),Q.reg,'Todas')+
  selFilter('q_proc','Processo',distinct(function(u){return u.processo.tipo}),Q.proc,'Todos')+
  selFilter('q_cat','Categoria',distinct(function(u){return u.categoria}),Q.cat,'Todas')+
  selFilter('q_ver','Verificação',[['verificado','verificado'],['parcial','parcial'],['nao','não verificado']],Q.ver,'Todas')+
  selFilter('q_corte','Corte',[['com','com corte'],['sem','sem corte comparável']],Q.corte,'Todos')+
  '</div><div class="btn-row"><button type="button" class="btn btn-ghost" data-act="uclear">Limpar filtros</button></div>';
  var list=filteredUnis().slice().sort(byCorte);
  var shown=list.slice(0,Q.limit);
  h+='<p id="rowcount"><b>'+shown.length+'</b> de '+list.length+' no filtro · '+UNI.length+' no levantamento. Ordem: maior corte de 2026 primeiro; sem corte comparável no fim.</p></div>';
  if(!shown.length)h+='<div class="card"><p>Nenhum curso com esses filtros.</p></div>';
  else h+='<div class="ucards">'+shown.map(ucard).join('')+'</div>';
  if(shown.length<list.length)h+='<div class="btn-row"><button type="button" class="btn" data-act="umore">Mostrar mais</button><button type="button" class="btn btn-ghost" data-act="uall">Mostrar todos os '+list.length+'</button></div>';
  h+='<div class="card"><h3>Nota simulada versus cortes</h3>'+chartCuts(list.filter(function(u){return u.corte.valor!=null&&u.pesos}))+'</div>';
  h+='<div class="card"><h3>Comparar duas universidades lado a lado</h3>'+sideBySide()+'</div>';
  $('#view-univ').innerHTML=h;
}
function renderVest(){
  var procs=VEST?VEST.processos:[];
  var q=(Qv.q||'').trim().toLowerCase();
  var list=procs.filter(function(p){
    if(Qv.st==='nao'&&verKind(p.status)!=='nao'&&!/não verificado/i.test(p.status+' '+p.inscricao+' '+p.provas+' '+p.resultado))return false;
    if(Qv.st==='parcial'&&verKind(p.status)!=='parcial'&&!/^parcial/i.test(p.status||''))return false;
    if(Qv.st==='verificado'&&verKind(p.status)!=='verificado')return false;
    if(q){
      var blob=(p.instituicao+' '+p.processo+' '+(p.siglas||[]).join(' ')+' '+p.status).toLowerCase();
      if(blob.indexOf(q)<0)return false;
    }
    return true;
  });
  var ed=META&&META.sisu2027;
  var h='<div class="card"><h2>Vestibulares próprios e Sisu 2027</h2><p>Calendário lido em 13/11/2026 (horário de Brasília). Cada data fica ao lado da fonte e da data de acesso. O que não foi confirmado continua escrito como <span class="st na">não verificado</span> ou parcial. Isto não é nota de corte nem chance de aprovação.</p>'+
  (ed?'<div class="info"><b>Adesão das instituições ao Sisu 2027:</b> '+esc(ed.edital)+'. <a href="'+hrefOf(ed.fonte)+'" target="_blank" rel="noopener">DOU</a>. Datas do candidato: <span class="st na">não verificado</span>.</div>':'')+
  '<div class="filters"><div class="span2"><label for="v_q">Buscar</label><input id="v_q" type="search" data-in="v_q" value="'+esc(Qv.q)+'" placeholder="Instituição ou sigla" autocomplete="off"></div>'+
  selFilter('v_st','Status',[['verificado','começa com verificado'],['parcial','parcial'],['nao','contém não verificado']],Qv.st,'Todos')+
  '</div><div class="btn-row"><button type="button" class="btn btn-ghost" data-act="vclear">Limpar filtros</button></div>'+
  '<p><b>'+list.length+'</b> de '+procs.length+' linhas.</p></div>';
  list.forEach(function(p){
    var tone=verKind(p.status)==='verificado'&&!/não verificado/i.test(p.status+' '+p.inscricao+' '+p.provas+' '+p.resultado)?'ok':(verKind(p.status)==='nao'?'na':'parcial');
    h+='<article class="card vcard '+tone+'"><header><div><h3>'+esc(p.instituicao)+'</h3><small>'+esc(p.processo)+'</small></div><div>'+verChip(p.status)+'</div></header>'+
    '<p class="statusline">'+esc(p.status||'não verificado')+'</p>'+
    '<dl class="dates">'+fieldNV('Inscrição',p.inscricao)+fieldNV('Provas',p.provas)+fieldNV('Resultado',p.resultado)+'</dl>'+
    '<p class="src"><b>Data de acesso à fonte:</b> '+esc(p.acesso||'não verificado')+'</p>'+
    '<p class="src"><b>Fontes:</b> '+srcLinks(p.fontes)+'</p></article>';
  });
  if(!list.length)h+='<div class="card"><p>Nenhuma linha com esses filtros.</p></div>';
  $('#view-vest').innerHTML=h;
}
function uopts(sel){sel=canonUni(sel);return UNI.map(function(u){return '<option value="'+u.id+'"'+(u.id===sel?' selected':'')+'>'+esc(u.sigla+' — '+u.cidade+'/'+u.uf)+'</option>'}).join('')}
function pesoTxt(u){return u.pesos?[pf(u.pesos.cn),pf(u.pesos.ch),pf(u.pesos.lc),pf(u.pesos.mt),pf(u.pesos.red)].join('/'):'não verificado'}
function sideBySide(){
  B.ua=canonUni(B.ua);B.ub=canonUni(B.ub);
  var a=uniById(B.ua),b=uniById(B.ub),ea=evalU(a,S,S.cen,'ampla'),eb=evalU(b,S,S.cen,'ampla');
  function row(l,x,y){return '<tr><td>'+l+'</td><td>'+x+'</td><td>'+y+'</td></tr>'}
  return '<div class="grid2"><select data-in="ua">'+uopts(B.ua)+'</select><select data-in="ub">'+uopts(B.ub)+'</select></div><div class="tscroll" style="margin-top:8px"><table><thead><tr><th></th><th>'+esc(labelOf(a))+'</th><th>'+esc(labelOf(b))+'</th></tr></thead><tbody>'+
  row('Processo',esc(a.processo.tipo),esc(b.processo.tipo))+row('Corte',e2(ea.c),e2(eb.c))+row('Verificação',verChip(a.status_verificacao),verChip(b.status_verificacao))+row('Sua nota ('+SC[S.cen].toLowerCase()+')',f1(ea.w),f1(eb.w))+row('Diferença',ea.d==null?'—':sgn(ea.d),eb.d==null?'—':sgn(eb.d))+row('Situação',distBadge(ea),distBadge(eb))+
  row('Pesos N/H/L/M/R',pesoTxt(a),pesoTxt(b))+'</tbody></table></div><p class="src">Cortes de universidades com pesos diferentes estão em escalas diferentes; compare a <b>diferença</b>, não só o corte. Sem corte comparável não entra na conta de distância.</p>';
}
function e2(v){return v==null?'sem corte comparável':f2(v)}
function renderMetas(){
  var u=uniById(S.uni),c=cutoff(u,S.mod),h='<div class="card"><h2>Quantos acertos faltam para a Medicina?</h2><p>Escolha a universidade e veja quantos acertos em Matemática (ou Natureza) igualam o <b>corte histórico</b>, mantendo Humanas 43, Linguagens '+S.lin+' e Redação '+S.red+'.</p>'+uniSelect()+
  '<div class="note"><b>Leitura correta:</b> isto é uma conta matemática sobre um corte de edição passada. <b>Não é probabilidade</b> de aprovação: o corte de 2027 pode ser maior ou menor, e a nota oficial pode diferir da estimada.</div></div>';
  if(c==null){h+='<div class="card"><p><b>'+esc(labelOf(u))+'</b> está <b>sem corte comparável</b> ('+esc(u.processo.tipo)+'). '+verChip(u.status_verificacao)+'</p><p class="statusline">'+esc(u.status_verificacao||'não verificado')+'</p><p class="src">'+esc(u.processo.status2027||'')+'</p></div>';$('#view-metas').innerHTML=h;return}
  if(!u.pesos){h+='<div class="card"><p><b>'+esc(labelOf(u))+'</b> tem corte histórico <b>'+f2(c)+'</b> ('+esc(u.corte.edicao||'')+'). '+verChip(u.status_verificacao)+' '+esc(u.status_verificacao||'')+'</p><p>Os pesos estão <span class="st na">não verificado</span>. Esta conta de acertos não é feita, para não inventar uma distância.</p></div>';$('#view-metas').innerHTML=h;return}
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
  reach.map(function(r){return '<p><b>'+SC[r[0]]+':</b> '+(r[1].length?r[1].map(function(x){return '<span class="chip g">'+esc(labelOf(x)+cautionMark(x))+'</span>'}).join(' '):'nenhuma')+'</p>'}).join('')+
  '<p class="src">Para testar “redação 940, Natureza 39 e Matemática 40”, use “Ajustar cenário”. Cursos sem corte comparável não entram nessa conta. * = o corte de 2026 não se aplica ao processo de 2027 (caso da UNEMAT). UnB não entra: pesos não verificados.</p></div>';
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
  var gap=cutoff(u,S.mod)==null?'<div class="note">'+esc(labelOf(u))+' está sem corte comparável. A tabela mostra as médias; a situação do corte fica em branco.</div>':(!u.pesos?'<div class="note">Pesos de '+esc(labelOf(u))+': <span class="st na">não verificado</span>. A distância até o corte não é calculada.</div>':'');
  var h='<div class="card"><h2>Comparador de cenários</h2><p>Todas as combinações de Linguagens (34–37) × Redação (920/930/940/960) × Natureza × Matemática (padrão 37–40) = <b>256 combinações</b>, com Humanas fixo em 43. Cenário TRI: <b>'+SC[S.cen]+'</b>. Toque numa linha para usar a combinação.</p>'+uniSelect()+gap+
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
  rows+=compUnis().map(function(u){var ea=evalU(u,A,S.cen,'ampla'),eb=evalU(u,Bb,S.cen,'ampla');return '<tr><td>'+esc(labelOf(u)+cautionMark(u))+' <small>('+f2(ea.c)+')</small></td><td>'+sgn(ea.d)+'</td><td>'+sgn(eb.d)+'</td><td>'+(ea.d>=0&&eb.d>=0?'ambos acima':ea.d<0&&eb.d>=0?'B alcança':ea.d>=0&&eb.d<0?'A alcança':'nenhum')+'</td></tr>'}).join('');
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
  var urows=UNI.slice().sort(byCorte).map(function(u){var e=evalU(u,S,S.cen,'ampla'),name=esc(labelOf(u))+' <small>'+esc(u.uf)+'</small>';
    if(e.c==null)return '<tr><td>'+name+'</td><td>sem corte comparável</td><td colspan="2" class="mut" style="text-align:left;white-space:normal">'+esc(u.processo.tipo)+'</td><td>'+verChip(u.status_verificacao)+'</td></tr>';
    if(e.w==null)return '<tr><td>'+name+'</td><td>'+f2(e.c)+' <small>('+u.corte.ano+')</small></td><td colspan="2" class="mut" style="text-align:left;white-space:normal">distância não calculada — pesos não verificados</td><td>'+verChip(u.status_verificacao)+'</td></tr>';
    var lo=evalU(u,S,'c','ampla'),hi=evalU(u,S,'o','ampla');return '<tr><td>'+name+'</td><td>'+f2(e.c)+' <small>('+u.corte.ano+')</small></td><td>'+f1(e.w)+'</td><td>'+sgn(e.d)+'</td><td>'+distBadge(e)+'<br><small>'+sgn(lo.d)+' a '+sgn(hi.d)+'</small><br>'+verChip(u.status_verificacao)+'</td></tr>'}).join('');
  var txt=resumo();
  $('#view-relatorio').innerHTML='<div class="card hero"><h1>Rota Medicina 2027 — Relatório</h1><p>Simulação do Lorenzo · gerado em '+new Date().toLocaleDateString('pt-BR')+'</p></div>'+
  '<div class="card no-print"><h2>Compartilhar</h2><p>O link guarda esta simulação (Linguagens '+S.lin+', Redação '+S.red+', Natureza '+S.nat+', Matemática '+S.mat+', cenário '+SC[S.cen].toLowerCase()+').</p><div class="btn-row"><button class="btn" data-act="copylink" type="button">Copiar link do cenário</button><button class="btn btn-green" data-act="share" type="button">Compartilhar</button><button class="btn btn-ghost" data-act="pdf" type="button">Exportar PDF</button><button class="btn btn-ghost" data-act="copytxt" type="button">Copiar resumo</button></div><p class="src">PDF: na janela de impressão, escolha “Salvar como PDF” (no iPhone: compartilhar → Salvar em Arquivos).</p><textarea readonly id="share-url" style="width:100%;min-height:70px;border:1.5px solid var(--line);border-radius:12px;padding:8px;font:12px monospace">'+esc(shareURL())+'</textarea></div>'+
  '<div class="card"><h3>Cenário simulado</h3><p>Humanas 43/45 (fixo) · Linguagens '+S.lin+' · Redação '+S.red+' · Natureza '+S.nat+'/45 · Matemática '+S.mat+'/45</p><div class="tscroll"><table><thead><tr><th>Área</th><th>Conserv.</th><th>Central</th><th>Otimista</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>'+
  '<div class="card"><h3>Comparação com cortes históricos (ampla, cenário '+SC[S.cen].toLowerCase()+')</h3><div class="tscroll"><table><thead><tr><th>Univ.</th><th>Corte</th><th>Sua nota</th><th>Dif.</th><th>Situação</th></tr></thead><tbody>'+urows+'</tbody></table></div><p class="src">Diferença abaixo da situação: faixa conservador a otimista.</p></div>'+
  '<div class="card"><h3>Notas por área</h3>'+chartAreas()+'</div><div class="card"><h3>Nota simulada versus cortes</h3>'+chartCuts()+'</div>'+
  '<div class="card"><h3>Mensagem</h3>'+MSG+'</div>'+
  '<div class="note"><b>Avisos:</b> (1) notas por área são <b>estimativas</b> pelo histórico do ENEM 2023–2025; a nota oficial depende da TRI e das questões acertadas. (2) Cortes são da edição única do Sisu 2026 (chamada regular, ampla) ou, no caso da UnB, do Acesso Enem 2026 com status parcial. <b>Não</b> preveem 2027. (3) Nenhuma probabilidade de aprovação é calculada. (4) Onde o status não é verificado, o texto permanece <b>não verificado</b>. (5) UNEMAT: o corte 786,79 é do Sisu 2026 e não se aplica ao processo próprio de 2027.</div>'+
  '<div class="card"><h3>Fontes</h3><ul class="tight src"><li>TRI: microdados ENEM/INEP via <a href="'+TRI.meta.fonte_url+'">Prof. Rafael Teixeira</a> e <a href="'+TRI.meta.fonte_secundaria+'">EnemCopilot</a>; <a href="'+TRI.meta.fonte_inep+'">INEP</a>.</li><li>Cortes e pesos do Sisu 2026: relatórios oficiais do MEC (inscrições e notas de corte; vagas ofertadas), citados em cada curso. Conferidos também em agregadores que republicam o MEC.</li><li>Sisu 2027: '+(META&&META.sisu2027?'<a href="'+hrefOf(META.sisu2027.fonte)+'">'+esc(META.sisu2027.edital)+'</a>. Datas do candidato: não verificado.':'edital de adesão.')+'</li><li>Processos próprios: <code>data/vestibulares.json</code>, com fonte e data de acesso em cada linha.</li><li>Dados editáveis em <code>data/universidades.json</code>, <code>data/vestibulares.json</code> e <code>data/tri.json</code>.</li></ul></div>';
  $('#view-relatorio').setAttribute('data-txt',txt);
}
function resumo(){
  var sc=scoresOf(S,S.cen), hit=compUnis().filter(function(x){return reached(x,S,S.cen,'ampla')});
  var u=uniById(S.uni), e=evalU(u,S,S.cen,S.mod);
  var ref=e.c==null?'sem corte comparável':(e.d==null?'corte '+f2(e.c)+', pesos não verificados':'diferença '+sgn(e.d));
  return 'Rota Medicina 2027 — simulação do Lorenzo\nHumanas 43 · Ling. '+S.lin+' · Red. '+S.red+' · Nat. '+S.nat+' · Mat. '+S.mat+'\nMédia simples estimada ('+SC[S.cen].toLowerCase()+'): '+f1(avgOf(sc))+'\nReferência '+labelOf(u)+': '+ref+' ('+(u.status_verificacao||'não verificado')+')\nCorte histórico alcançado em '+hit.length+' de '+compUnis().length+' cursos com corte e pesos.\nEstimativas, não é nota oficial nem previsão de aprovação.\n'+shareURL();
}

/* ---------- navegação / render ---------- */
var RENDER={visao:renderVisao,tri:renderTRI,univ:renderUniv,vest:renderVest,metas:renderMetas,comparador:renderComparador,estrategia:renderEstrategia,relatorio:renderRelatorio};
function rerenderKeep(){var y=window.scrollY;renderCurrent();window.scrollTo(0,y)}
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
    case 'more':F.limit+=600;rerenderKeep();break;
    case 'fclear':F.lin=F.red=F.nat=F.mat=F.st='';F.only=false;F.nmin=37;F.nmax=40;F.mmin=37;F.mmax=40;F.limit=600;renderCurrent();break;
    case 'uclear':Q.q='';Q.uf='';Q.reg='';Q.proc='';Q.cat='';Q.ver='';Q.corte='';Q.limit=24;renderCurrent();break;
    case 'umore':Q.limit+=24;rerenderKeep();break;
    case 'uall':Q.limit=UNI.length;rerenderKeep();break;
    case 'vclear':Qv.q='';Qv.st='';renderCurrent();break;
    case 'openvest':Qv.q=el.getAttribute('data-sigla')||'';Qv.st='';showView('vest',true);break;
    case 'copylink':copyText(shareURL(),'Link copiado!');break;
    case 'copytxt':copyText($('#view-relatorio').getAttribute('data-txt'),'Resumo copiado!');break;
    case 'share':var d={title:'Rota Medicina 2027',text:'Simulação do Lorenzo',url:shareURL()};if(navigator.share)navigator.share(d).catch(function(){});else copyText(shareURL(),'Link copiado!');break;
    case 'pdf':if(S.v!=='relatorio')showView('relatorio');setTimeout(function(){window.print()},250);break;
  }
});
document.addEventListener('input',function(ev){
  var el=ev.target,k=el.getAttribute&&el.getAttribute('data-in');if(!k)return;
  if(k==='nat'||k==='mat'){if(el.value==='')return;S[k]=clamp(el.value,0,45);$$('[data-in="'+k+'"]').forEach(function(i){if(i!==el&&i!==document.activeElement)i.value=S[k]});update();return}
  if(k==='q_q'||k==='v_q'){var pos=el.selectionStart,val=el.value;if(k==='q_q'){Q.q=val;Q.limit=24}else Qv.q=val;rerenderKeep();var n=document.getElementById(k);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(err){}}}
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
  if(k==='q_uf'||k==='q_reg'||k==='q_proc'||k==='q_cat'||k==='q_ver'||k==='q_corte'){Q[k.slice(2)]=el.value;Q.limit=24;renderCurrent();return}
  if(k==='v_st'){Qv.st=el.value;renderCurrent();return}
  if(k==='chk'){try{localStorage.setItem('rm_'+el.getAttribute('data-id'),el.checked?'1':'0')}catch(e){}}
});
function boot(){
  var nav=$('#nav');nav.innerHTML=VIEWS.map(function(v){return '<button type="button" data-v="'+v[0]+'" aria-current="false">'+v[1]+'</button>'}).join('');
  nav.addEventListener('click',function(ev){var b=ev.target.closest('button[data-v]');if(b)showView(b.getAttribute('data-v'),true)});
  ['#btn-ajustar','#fab'].forEach(function(s){$(s).addEventListener('click',function(){$('#sheet').hidden=false})});
  initViews();showView(S.v,false);
}
function fail(e){$('#app').innerHTML='<div class="err">Não foi possível carregar os dados ('+esc(e&&e.message||e)+'). Abra este link pela internet (não como arquivo local).</div>'}
Promise.all([fetch('data/tri.json').then(function(r){if(!r.ok)throw new Error('tri.json '+r.status);return r.json()}),fetch('data/universidades.json').then(function(r){if(!r.ok)throw new Error('universidades.json '+r.status);return r.json()}),fetch('data/vestibulares.json').then(function(r){if(!r.ok)throw new Error('vestibulares.json '+r.status);return r.json()})]).then(function(r){TRI=r[0];META=r[1].meta||{};LEGADO=META.ids_legado||{};UNI=(r[1].universidades||[]).map(prepUni);VEST=r[2];window.__RM_DATA={meta:META};B.ua=canonUni(B.ua);B.ub=canonUni(B.ub);readURL();boot()}).catch(fail);
})();
