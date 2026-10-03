/* VfL Osnabrück Dashboard
   DATA-FIRST ARCHITECTURE:
   Laufende Save-Änderungen gehören in data.json.
   Dieses File enthält nur Darstellung, Navigation und Angebots-Workflow.
*/
const CONFIG = {
  dataUrl: 'data.json',
  offerStateKey: 'toni-kroos-manager-offer-status',
  currency: 'EUR',
  positionGroups: [
    {label:'Torwart', positions:['GK']},
    {label:'Rechtsverteidigung', positions:['RB','RWB']},
    {label:'Innenverteidigung', positions:['CB','IV']},
    {label:'Linksverteidigung', positions:['LB','LWB']},
    {label:'Zentrales Mittelfeld', positions:['CM','CDM','CAM','ZDM','ZM','ZOM']},
    {label:'Außenbahn', positions:['RW','LW','RM','LM']},
    {label:'Sturm', positions:['ST']}
  ]
};

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const eur = value => new Intl.NumberFormat('de-DE',{style:'currency',currency:CONFIG.currency,maximumFractionDigits:0}).format(Number(value||0));
const board = d => d.boardSatisfaction || d.boardSat || {};
const manager = d => d.managerContract || d.manager || {};
const goals = d => d.seasonGoals || {};
const latest = (d,name) => (d.players||[]).find(p => p.name === name);

function htmlList(items, render, empty='Keine Daten hinterlegt.') {
  return items?.length ? items.map(render).join('') : '<div class="empty">'+empty+'</div>';
}
function offerStates(){try{return JSON.parse(localStorage.getItem(CONFIG.offerStateKey)||'{}')}catch{return {}}}
function setOfferState(id,state){const s=offerStates();s[id]=state;localStorage.setItem(CONFIG.offerStateKey,JSON.stringify(s))}
function offerId(o){return (o.club||'')+'|'+(o.contract||'')}

function issueUrl(o,decision){
  const p=new URLSearchParams();
  p.set('title','[TRAINER-ANGEBOT] '+(o.club||'Verein')+' – '+decision);
  p.set('body',
    'Trainer: Toni Kroos\nVerein: '+(o.club||'')+'\nLiga: '+(o.league||'')+
    '\nVertrag: '+(o.contract||'')+'\nJahresgehalt: '+(o.annualSalary||0)+
    ' €\nHandgeld: '+(o.signOnBonus||0)+' €\nTransferbudget: '+(o.transferBudgetPromise||0)+
    ' €\n\nEntscheidung: '+decision
  );
  return 'https://github.com/Dragon-dev-alt/toni-krooskariere/issues/new?'+p.toString();
}
window.offerAction = (index, decision) => {
  const o = window.dashboardOffers[index];
  if(!o) return;
  setOfferState(offerId(o),decision);
  window.open(issueUrl(o,decision==='accepted'?'ANGENOMMEN':decision==='rejected'?'ABGELEHNT':'INTERESSE – noch keine Entscheidung'),'_blank','noopener');
  render(window.dashboardData);
};

function renderSquad(players){
  let out='';
  CONFIG.positionGroups.forEach(group=>{
    const rows=players.filter(p=>group.positions.includes(p.position));
    if(!rows.length)return;
    out += '<div class="groupTitle">'+esc(group.label)+'</div>';
    out += '<table><thead><tr><th>Spieler</th><th>Pos.</th><th>OVR/POT</th><th>Rolle</th><th>Status</th></tr></thead><tbody>';
    out += rows.map(p=>'<tr><td><b>'+esc(p.name)+'</b></td><td>'+esc(p.position||'–')+'</td><td>'+esc((p.ovr??'–')+'/'+(p.potential??'–'))+'</td><td>'+esc(p.role||'–')+'</td><td><span class="badge">'+esc(p.status||'–')+'</span></td></tr>').join('');
    out += '</tbody></table>';
  });
  return out || '<div class="empty">Kein aktiver Profikader hinterlegt.</div>';
}

function render(d){
  window.dashboardData=d;
  const bs=board(d), mc=manager(d), sg=goals(d), players=d.players||[], priorities=d.priorities||[];
  $('season').textContent='Saison '+(d.currentSeason||'2027/28');
  $('date').textContent=d.currentDate||'–';

  $('ovBudget').textContent=eur(d.budget); $('fiBudget').textContent=eur(d.budget);
  $('ovSat').textContent=(bs.score??'–')+'/10'; $('ovSatText').textContent=esc(bs.status||'');
  $('ovGoal').textContent=esc(sg.currentOfficialGoal||sg.primary||'–'); $('ovGoalSub').textContent=esc(sg.internalOutlook||'');
  $('ovContract').textContent=esc(mc.contractEnds||'–'); $('ovContractSub').textContent=esc(mc.status||'laufend');

  $('ovPriorities').innerHTML=htmlList(priorities,x=>'<div class="rule"><b>'+esc(x.position)+' <span class="badge '+(x.priority==='Sehr hoch'?'bad':x.priority==='Hoch'?'warn':'')+'">'+esc(x.priority)+'</span></b>'+esc(x.status)+'</div>');
  $('priorityCount').textContent=priorities.length+' Themen';

  const active=d.activeOffers||[];
  $('ovActive').innerHTML=htmlList(active,x=>'<div class="rule"><b>'+esc(x.player)+'</b><br>'+esc(x.status)+'</div>','Keine offenen Kaderfälle.');

  $('ovTalents').innerHTML=htmlList((d.talents||[]).slice(0,7),x=>'<div class="rule"><b>'+esc(x.name)+'</b> · '+esc(x.age)+' Jahre · '+esc((x.ovr??'–')+'/'+(x.pot??x.potential??'–'))+' · '+esc(x.role||'–')+'</div>');
  const cp=mc.currentClubPerspective||{};
  $('ovClubCourse').innerHTML=
    '<div class="rule"><b>Spielidee</b>'+esc(d.formation||'4-3-3 Flach')+' · Linienhöhe '+esc(d.lineHeight??65)+' · Ballbesitz, Kurzpass, kontrollierte Vertikalität, Gegenpressing.</div>'+
    '<div class="rule"><b>Sommer</b>Aktuelle Prioritäten und Transferstatus werden direkt aus data.json geladen.</div>'+
    '<div class="callout"><strong>VfL-Perspektive</strong>'+esc(cp.sportingPerspective||'Bundesliga etablieren und den Kader langfristig stabilisieren.')+'</div>';

  $('sqPlayers').innerHTML=renderSquad(players);
  $('sqCount').textContent=players.length+' aktive Spieler';

  const talents=d.talents||[];
  $('sqTalents').innerHTML=talents.length
    ? '<table><thead><tr><th>Spieler</th><th>Alter</th><th>OVR/POT</th><th>Rolle</th></tr></thead><tbody>'+
      talents.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.age)+'</td><td>'+esc((x.ovr??'–')+'/'+(x.pot??x.potential??'–'))+'</td><td>'+esc(x.role||'–')+'</td></tr>').join('')+
      '</tbody></table>'
    : '<div class="empty">Keine aktiven Talente.</div>';

  $('sqLoans').innerHTML=htmlList(d.loanList||[],x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.ovr)+'/'+esc(x.potential)+'</td><td>'+esc(x.position)+'</td><td>'+esc(x.status)+'</td></tr>');
  if(d.loanList?.length){
    $('sqLoans').innerHTML='<table><thead><tr><th>Spieler</th><th>OVR/POT</th><th>Pos.</th><th>Status</th></tr></thead><tbody>'+
      d.loanList.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.ovr)+'/'+esc(x.potential)+'</td><td>'+esc(x.position)+'</td><td>'+esc(x.status)+'</td></tr>').join('')+
      '</tbody></table>';
  }
  $('sqLoanDone').innerHTML='<strong>Bereits verliehen</strong> '+(d.loanList||[]).map(x=>esc(x.name)+' · '+esc(x.status.replace(/^Verliehen · /,'')||'')).join(' · ');
  $('sqAcademy').innerHTML=d.academy?.length
    ? '<table><thead><tr><th>Spieler</th><th>Alter</th><th>OVR/POT</th><th>Pos.</th></tr></thead><tbody>'+
      d.academy.map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.age)+'</td><td>'+esc((x.ovr??'–')+'/'+(x.potential??x.pot??'–'))+'</td><td>'+esc(x.position||'–')+'</td></tr>').join('')+
      '</tbody></table>'
    : '<div class="empty">Keine Akademiespieler.</div>';

  $('trPriorities').innerHTML=htmlList(priorities,x=>'<div class="rule"><b>'+esc(x.position)+' <span class="badge '+(x.priority==='Sehr hoch'?'bad':x.priority==='Hoch'?'warn':'')+'">'+esc(x.priority)+'</span></b>'+esc(x.status)+'</div>');
  const mission=d.youthScoutingNext?.recommendedMission;
  $('trScouting').innerHTML=mission
    ? '<div class="rule"><b>Land</b>'+esc(mission.country)+'</div><div class="rule"><b>Dauer</b>'+esc(mission.duration)+'</div><div class="rule"><b>Fokus</b>'+esc((mission.focus||[]).join(' · '))+'</div><div class="rule"><b>Priorität</b>'+esc(mission.priority||'–')+'</div>'
    : '<div class="empty">Keine Mission hinterlegt.</div>';
  $('trActive').innerHTML=htmlList(active,x=>'<div class="rule"><b>'+esc(x.player)+'</b><br>'+esc(x.status)+'</div>','Keine offenen Transfers.');

  const far=d.transferPlan?.summer2027?.strikerPlan;
  $('trSummer').innerHTML=
    (far
      ? '<div class="rule"><b>Ben Farhat</b>'+esc(far.status)+' · ca. '+eur(far.estimatedFee)+' Ablöse · Ziel '+eur(far.boardTargetFee)+' · max. '+eur(far.boardMaxFee)+'<br>Vertragsvorschlag: '+esc(far.proposedContract?.role||'Rotation')+' · '+esc(far.proposedContract?.years||4)+' Jahre · '+eur(far.proposedContract?.weeklyWage||0)+'/Woche · '+eur(far.proposedContract?.entryBonus||0)+' Handgeld</div>'
      : '')+
    '<div class="rule"><b>Mittelfeld</b>Fukui, Wätjen und Hirsch bilden die ZM-Dreierreihe mit individuell angepassten Rollen.</div>'+
    '<div class="rule"><b>IV</b>Karademir und Schöller als geplante Stamm-Innenverteidiger.</div>'+
    '<div class="rule"><b>Danach</b>Keine weiteren proaktiven Einkäufe; nur noch auf Abgänge reagieren.</div>';

  $('trSales').innerHTML=(d.sales||[]).map(x=>'<tr><td><b>'+esc(x.name)+'</b></td><td>'+esc(x.status)+(x.destination?' · '+esc(x.destination):'')+'</td><td>'+eur(x.fee)+'</td><td>'+eur(x.reinvestable||0)+'</td></tr>').join('')||'<tr><td colspan="4" class="empty">Keine abgeschlossenen Verkäufe.</td></tr>';
  $('trSaleCandidates').innerHTML=htmlList(d.saleCandidates||[],x=>'<div class="rule"><b>Markt: '+esc(x.name)+'</b><br>'+esc(x.status)+' · Marktwert '+eur(x.marketValue||0)+'<br><span class="muted">'+esc(x.note||'')+'</span></div>');
  $('trLoanList').innerHTML=htmlList(d.loanList||[],x=>'<div class="rule"><b>'+esc(x.name)+'</b><br>'+esc(x.position)+' · '+esc(x.ovr)+' OVR / '+esc(x.potential)+' POT<br>'+esc(x.status)+'</div>');

  const z=d.zmTransferBudgetGuidance||{};
  $('trZMTargets').innerHTML=htmlList(d.zmTargets||[],x=>{
    const cls=(x.status||'').includes('Nicht')?'bad':(x.status||'').includes('Beobachtung')?'warn':'';
    return '<div class="rule"><b>'+esc(x.name)+' · '+esc(x.ovr)+' OVR / '+esc(x.potential)+' POT <span class="badge '+cls+'">'+esc(x.status)+'</span></b><br>'+esc((x.positions||[]).join(' / '))+' · '+esc(x.age)+' Jahre<br>Marktwert '+eur(x.marketValue)+' · Gehalt '+eur(x.weeklyWage)+'/Woche<br><b>Preis:</b> min. '+eur(x.minimumPrice)+' · Wunsch '+eur(x.askingPrice)+' · Vorstand max. '+(x.boardMaxFee?eur(x.boardMaxFee):'keine Freigabe')+'</div>';
  });
  $('trZMBudget').innerHTML=z.planningReferenceBudget
    ? '<div class="callout"><strong>ZM-Ausgabenrahmen</strong>Planungsbasis '+eur(z.planningReferenceBudget)+'. 1 ZM: '+eur(z.oneZm?.targetRange?.[0])+'–'+eur(z.oneZm?.targetRange?.[1])+'. 2 ZM: '+eur(z.twoZm?.targetRangeTotal?.[0])+'–'+eur(z.twoZm?.targetRangeTotal?.[1])+' zusammen.</div>'
    : '';

  const sil=(d.sales||[]).find(x=>x.name==='Mario Silva');
  $('fiJannotta').textContent=eur((d.sales||[]).find(x=>x.name==='Theo Jannotta')?.fee||0);
  $('fiRemberg').textContent=eur((d.sales||[]).find(x=>x.name==='Mats Remberg')?.fee||0);
  $('fiMikel').textContent=eur(d.transferPlan?.summer2027?.rvTarget?.negotiatedFee||0);
  $('fiRules').innerHTML='<div class="rule"><b>Reinvestition</b>70 % der Netto-Transfererlöse dürfen reinvestiert werden.</div><div class="rule"><b>Reserve</b>'+esc(d.transferPlan?.summer2027?.postFarhatPolicy||'Nach dem letzten Neuzugang Reserve bilden.')+'</div><div class="rule"><b>Aktueller Stand</b>'+esc(d.budgetNote||'')+'</div>';

  $('boSat').textContent=(bs.score??'–')+'/10'; $('boSatText').textContent=esc(bs.status||'');
  $('boGoal').textContent=esc(sg.currentOfficialGoal||sg.primary||'–'); $('boGoalSub').textContent=esc(sg.internalOutlook||'');
  $('boContract').textContent=esc(mc.contractEnds||'–'); $('boContractSub').textContent=esc(mc.currentStatus||mc.status||'laufend');
  $('boClause').textContent=mc.specialExitClause?.active?'Ja':'Nein';
  $('boRules').innerHTML=(d.rules||[]).map((x,i)=>'<div class="rule"><b>'+(i+1)+'. Regel</b>'+esc(x)+'</div>').join('');
  $('boAssessment').innerHTML='<div class="callout"><strong>'+esc(bs.status||'')+'</strong>'+esc(bs.currentAssessment||'')+'</div><div class="rule"><b>Offizielles Ziel</b>'+esc(sg.currentOfficialGoal||sg.primary||'–')+'</div>';
  const meeting=d.lastMeeting || d.boardMeetingHistory?.slice(-1)[0];
  $('boMeeting').innerHTML=meeting
    ? '<div class="callout"><strong>Bewertung</strong>'+esc(meeting.assessment||'')+'</div>'+
      (meeting.questions||[]).map((q,i)=>'<div class="rule"><b>'+(i+1)+'. Frage</b>'+esc(q)+(meeting.answers?.[i]?'<br><span class="muted"><b>Antwort Trainer:</b> '+esc(meeting.answers[i])+'</span>':'')+'</div>').join('')
    : '<div class="empty">Keine Sitzung hinterlegt.</div>';

  $('caCurrent').innerHTML='<div class="rule"><b>Aktueller Verein</b>'+esc(mc.club||'VfL Osnabrück')+' · '+esc(mc.currentLeague||'Bundesliga')+'</div><div class="rule"><b>Vertrag</b>bis '+esc(mc.contractEnds||'Sommer 2029')+'</div><div class="rule"><b>Status</b>'+esc(mc.currentStatus||mc.status||'laufend')+'</div>';
  const states=offerStates();
  window.dashboardOffers=getOffers(d).filter(o=>!['accepted','rejected'].includes(states[offerId(o)]));
  $('caOffers').innerHTML=window.dashboardOffers.length
    ? window.dashboardOffers.map((o,i)=>{
        const interest=states[offerId(o)]==='interest';
        return '<div class="rule"><b>'+esc(o.club)+' <span class="badge">'+esc(o.league)+'</span>'+(interest?' <span class="badge warn">Interesse</span>':'')+'</b><br>'+esc(o.contract)+' · '+eur(o.annualSalary)+'/Jahr · '+eur(o.signOnBonus)+' Handgeld<br><b>Transferbudget:</b> '+eur(o.transferBudgetPromise)+'<br><span class="muted">'+esc(o.perspective?.sportingPerspective||o.note||'')+'</span><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button class="btn" onclick="offerAction('+i+',\'accepted\')">✅ Annehmen</button><button class="btn" style="background:#8f2d2d" onclick="offerAction('+i+',\'rejected\')">❌ Ablehnen</button><button class="btn" style="background:#6b7280" onclick="offerAction('+i+',\'interest\')">🔎 Interesse</button></div></div>';
      }).join('')
    : '<div class="empty">Aktuell keine neuen Trainerangebote. Historische Angebote bleiben gespeichert.</div>';
  $('caClubPerspective').innerHTML='<div class="rule"><b>Sportlich</b>'+esc(cp.sportingPerspective||'Bundesliga etablieren.')+'</div><div class="rule"><b>Trainer</b>'+esc(cp.managerPerspective||'Die erste Bundesliga-Saison gemeinsam bestreiten.')+'</div><div class="rule"><b>Entwicklung</b>'+esc(cp.developmentPerspective||'Junge Spieler gezielt entwickeln.')+'</div>';
  $('caClause').innerHTML=mc.specialExitClause?.active
    ? '<div class="callout"><strong>Optionaler Wechsel ab Ende 2027/28</strong>Ohne Entschädigungszahlung zu einem Klub aus Bundesliga, Premier League oder LaLiga. Kein Wechselzwang.</div>'
    : '<div class="empty">Keine Sonderklausel.</div>';
}
async function load(){
  try{
    const res=await fetch(CONFIG.dataUrl+'?'+Date.now());
    if(!res.ok)throw new Error('HTTP '+res.status);
    const d=await res.json();
    render(d);
    $('updated').textContent='Stand '+(d.currentDate||'')+' · geladen '+new Date().toLocaleString('de-DE');
  }catch(err){$('updated').textContent='Fehler beim Laden: '+err.message}
}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  btn.classList.add('active'); $(btn.dataset.view).classList.add('active');
}));
window.loadDashboard=load;
$('refresh').addEventListener('click',load);
load();
