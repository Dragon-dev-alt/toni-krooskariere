/* VfL Osnabrück Dashboard v3
   Data-first: Save-Zustand in data.json, UI-Logik hier.
   Alle DOM-Zugriffe sind defensiv; ein fehlendes Feld darf das Dashboard nicht stoppen.
*/
const CONFIG={"dataUrl":"data.json","offerStateKey":"toni-kroos-manager-offer-status","currency":"EUR","groups":[{"label":"Torwart","positions":["GK"]},{"label":"Rechtsverteidigung","positions":["RB","RWB"]},{"label":"Innenverteidigung","positions":["CB","IV"]},{"label":"Linksverteidigung","positions":["LB","LWB"]},{"label":"Zentrales Mittelfeld","positions":["CM","CDM","CAM","ZDM","ZM","ZOM"]},{"label":"Außenbahn","positions":["RW","LW","RM","LM"]},{"label":"Sturm","positions":["ST"]}]};

const $=id=>document.getElementById(id);
const setText=(id,value)=>{const el=$(id);if(el)el.textContent=String(value??"");};
const setHTML=(id,value)=>{const el=$(id);if(el)el.innerHTML=String(value??"");};
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const eur=v=>new Intl.NumberFormat("de-DE",{style:"currency",currency:CONFIG.currency,maximumFractionDigits:0}).format(Number(v||0));
const board=d=>d?.boardSatisfaction||d?.boardSat||{};
const manager=d=>d?.managerContract||d?.manager||{};
const goals=d=>d?.seasonGoals||{};
const list=(arr,render,empty="Keine Daten hinterlegt.")=>Array.isArray(arr)&&arr.length?arr.map(render).join(""):'<div class="empty">'+empty+"</div>";

function offerStates(){try{return JSON.parse(localStorage.getItem(CONFIG.offerStateKey)||"{}")}catch{return {}}}
function saveOfferState(id,state){const s=offerStates();s[id]=state;localStorage.setItem(CONFIG.offerStateKey,JSON.stringify(s))}
function offerId(o){return (o?.club||"")+"|"+(o?.contract||"")}
function issueUrl(o,decision){
  const q=new URLSearchParams({
    title:"[TRAINER-ANGEBOT] "+(o?.club||"Verein")+" – "+decision,
    body:[
      "Trainer: Toni Kroos","Verein: "+(o?.club||""),"Liga: "+(o?.league||""),
      "Vertrag: "+(o?.contract||""),"Jahresgehalt: "+(o?.annualSalary||0)+" €",
      "Handgeld: "+(o?.signOnBonus||0)+" €","Transferbudget: "+(o?.transferBudgetPromise||0)+" €",
      "Entscheidung: "+decision
    ].join("\n")
  });
  return "https://github.com/Dragon-dev-alt/toni-krooskariere/issues/new?"+q.toString();
}
window.offerAction=(index,decision)=>{
  const o=(window.dashboardOffers||[])[index]; if(!o)return;
  saveOfferState(offerId(o),decision);
  window.open(issueUrl(o,decision==="accepted"?"ANGENOMMEN":decision==="rejected"?"ABGELEHNT":"INTERESSE – noch keine Entscheidung"),"_blank","noopener");
  render(window.dashboardData);
};

function renderSquad(players){
  let out="";
  for(const g of CONFIG.groups){
    const rows=players.filter(p=>g.positions.includes(p?.position));
    if(!rows.length)continue;
    out+='<div class="groupTitle">'+esc(g.label)+'</div>';
    out+='<table><thead><tr><th>Spieler</th><th>Pos.</th><th>OVR/POT</th><th>Rolle</th><th>Status</th></tr></thead><tbody>';
    out+=rows.map(p=>'<tr><td><b>'+esc(p?.name)+'</b></td><td>'+esc(p?.position||"–")+'</td><td>'+esc((p?.ovr??"–")+"/"+(p?.potential??"–"))+'</td><td>'+esc(p?.role||"–")+'</td><td><span class="badge">'+esc(p?.status||"–")+'</span></td></tr>').join("");
    out+="</tbody></table>";
  }
  return out||'<div class="empty">Kein aktiver Profikader hinterlegt.</div>';
}

function render(d){
  window.dashboardData=d;
  const bs=board(d),mc=manager(d),sg=goals(d);
  const players=Array.isArray(d?.players)?d.players:[], priorities=Array.isArray(d?.priorities)?d.priorities:[], active=Array.isArray(d?.activeOffers)?d.activeOffers:[];

  setText("season","Saison "+(d?.currentSeason||"2027/28")); setText("date",d?.currentDate||"–");
  setText("ovBudget",eur(d?.budget)); setText("fiBudget",eur(d?.budget));
  setText("ovSat",(bs?.score??"–")+"/10"); setText("ovSatText",bs?.status||"");
  setText("ovGoal",sg?.currentOfficialGoal||sg?.primary||"–"); setText("ovGoalSub",sg?.internalOutlook||sg?.secondary||"");
  setText("ovContract",mc?.contractEnds||"–"); setText("ovContractSub",mc?.status||mc?.currentStatus||"laufend");

  setHTML("ovPriorities",list(priorities,x=>'<div class="rule"><b>'+esc(x?.position)+' <span class="badge '+(x?.priority==="Sehr hoch"?"bad":x?.priority==="Hoch"?"warn":"")+'">'+esc(x?.priority)+'</span></b>'+esc(x?.status)+'</div>'));
  setHTML("ovActive",list(active,x=>'<div class="rule"><b>'+esc(x?.player)+'</b><br>'+esc(x?.status)+'</div>',"Keine offenen Kaderfälle."));
  setHTML("ovTalents",list((d?.talents||[]).slice(0,8),x=>'<div class="rule"><b>'+esc(x?.name)+'</b> · '+esc(x?.age)+' Jahre · '+esc((x?.ovr??"–")+"/"+(x?.pot??x?.potential??"–"))+' · '+esc(x?.role||"–")+'</div>'));
  const cp=mc?.currentClubPerspective||{};
  setHTML("ovClubCourse",
    '<div class="rule"><b>Spielidee</b>'+esc(d?.formation||"4-3-3 Flach")+' · Linienhöhe '+esc(d?.lineHeight??65)+' · Ballbesitz, Kurzpass, kontrollierte Vertikalität, Gegenpressing.</div>'+
    '<div class="rule"><b>VfL-Perspektive</b>'+esc(cp?.sportingPerspective||"Bundesliga etablieren und den Kader langfristig stabilisieren.")+'</div>'+
    '<div class="callout"><strong>Talentstrategie</strong>Schubert, Hirsch, Wolf und Richter stehen für den internen Entwicklungskern. Nach Ben Farhat soll der Etat als Reserve für Jugend und Abgänge geschützt werden.</div>'
  );

  setText("sqCount",players.length+" aktive Spieler");
  setHTML("sqPlayers",renderSquad(players));

  const talents=Array.isArray(d?.talents)?d.talents:[];
  setHTML("sqTalents",talents.length?
    '<table><thead><tr><th>Spieler</th><th>Alter</th><th>OVR/POT</th><th>Rolle</th></tr></thead><tbody>'+
    talents.map(x=>'<tr><td><b>'+esc(x?.name)+'</b></td><td>'+esc(x?.age)+'</td><td>'+esc((x?.ovr??"–")+"/"+(x?.pot??x?.potential??"–"))+'</td><td>'+esc(x?.role||"–")+'</td></tr>').join("")+
    '</tbody></table>':'<div class="empty">Keine aktiven Talente.</div>');
  const loans=Array.isArray(d?.loanList)?d.loanList:[];
  setHTML("sqLoans",loans.length?
    '<table><thead><tr><th>Spieler</th><th>OVR/POT</th><th>Pos.</th><th>Status</th></tr></thead><tbody>'+
    loans.map(x=>'<tr><td><b>'+esc(x?.name)+'</b></td><td>'+esc(x?.ovr)+" / "+esc(x?.potential)+'</td><td>'+esc(x?.position)+'</td><td>'+esc(x?.status)+'</td></tr>').join("")+
    '</tbody></table>':'<div class="empty">Keine verliehenen Spieler.</div>');
  setHTML("sqLoanDone",'<strong>Aktuelle Leihen</strong> '+(loans.length?loans.map(x=>esc(x?.name)+" · "+esc((x?.status||"").replace(/^Verliehen · /,""))).join(" · "):"keine"));
  const academy=Array.isArray(d?.academy)?d.academy:[];
  setHTML("sqAcademy",academy.length?
    '<table><thead><tr><th>Spieler</th><th>Alter</th><th>OVR/POT</th><th>Pos.</th></tr></thead><tbody>'+
    academy.map(x=>'<tr><td><b>'+esc(x?.name)+'</b></td><td>'+esc(x?.age)+'</td><td>'+esc((x?.ovr??"–")+"/"+(x?.potential??x?.pot??"–"))+'</td><td>'+esc(x?.position||"–")+'</td></tr>').join("")+
    '</tbody></table>':'<div class="empty">Keine Akademiespieler.</div>');

  setHTML("trPriorities",list(priorities,x=>'<div class="rule"><b>'+esc(x?.position)+' <span class="badge '+(x?.priority==="Sehr hoch"?"bad":x?.priority==="Hoch"?"warn":"")+'">'+esc(x?.priority)+'</span></b>'+esc(x?.status)+'</div>'));
  const mission=d?.youthScoutingNext?.recommendedMission;
  setHTML("trScouting",mission?
    '<div class="rule"><b>Land</b>'+esc(mission?.country)+'</div><div class="rule"><b>Dauer</b>'+esc(mission?.duration)+'</div><div class="rule"><b>Fokus</b>'+esc((mission?.focus||[]).join(" · "))+'</div><div class="rule"><b>Priorität</b>'+esc(mission?.priority||"–")+'</div>':'<div class="empty">Keine Mission hinterlegt.</div>');
  setHTML("trActive",list(active,x=>'<div class="rule"><b>'+esc(x?.player)+'</b><br>'+esc(x?.status)+'</div>',"Keine offenen Transfers."));

  const far=d?.transferPlan?.summer2027?.strikerPlan;
  setHTML("trSummer",
    (far?'<div class="rule"><b>Ben Farhat</b> · '+esc(far?.status)+'<br>Ablöse ca. '+eur(far?.estimatedFee)+' · Ziel '+eur(far?.boardTargetFee)+' · max. '+eur(far?.boardMaxFee)+'<br>Vertrag: '+esc(far?.proposedContract?.role||"Rotation")+' · '+esc(far?.proposedContract?.years||4)+' Jahre · '+eur(far?.proposedContract?.weeklyWage||0)+'/Woche · '+eur(far?.proposedContract?.entryBonus||0)+' Handgeld</div>':'')+
    '<div class="rule"><b>ZM</b>Fukui, Wätjen und Hirsch bilden die ZM-Dreierreihe mit angepassten Aufgaben.</div>'+
    '<div class="rule"><b>IV</b>Karademir und Schöller als geplante Stamm-IV.</div>'+
    '<div class="rule"><b>Danach</b>'+esc(d?.transferPlan?.summer2027?.postFarhatPolicy||"Keine weiteren proaktiven Einkäufe; auf Abgänge reagieren.")+'</div>'
  );

  const z=d?.zmTransferBudgetGuidance||{};
  setHTML("trZMTargets",list(d?.zmTargets||[],x=>'<div class="rule"><b>'+esc(x?.name)+' · '+esc(x?.ovr)+' OVR / '+esc(x?.potential)+' POT</b> · '+esc(x?.status||"")+'<br>'+esc((x?.positions||[]).join(" / "))+' · '+esc(x?.age)+' Jahre<br>Marktwert '+eur(x?.marketValue)+' · '+eur(x?.weeklyWage)+'/Woche<br><b>Preis:</b> min. '+eur(x?.minimumPrice)+' · Wunsch '+eur(x?.askingPrice)+' · max. '+(x?.boardMaxFee?eur(x.boardMaxFee):"keine Freigabe")+'</div>'));
  setHTML("trZMBudget",z?.planningReferenceBudget?'<div class="callout"><strong>ZM-Ausgabenrahmen</strong>Planungsbasis '+eur(z.planningReferenceBudget)+'. 1 ZM: '+eur(z?.oneZm?.targetRange?.[0])+'–'+eur(z?.oneZm?.targetRange?.[1])+'. 2 ZM: '+eur(z?.twoZm?.targetRangeTotal?.[0])+'–'+eur(z?.twoZm?.targetRangeTotal?.[1])+' zusammen.</div>':"");

  const sales=Array.isArray(d?.sales)?d.sales:[];
  setHTML("trSales",sales.length?sales.map(x=>'<tr><td><b>'+esc(x?.name)+'</b></td><td>'+esc(x?.status)+(x?.destination?' · '+esc(x.destination):"")+'</td><td>'+eur(x?.fee)+'</td><td>'+eur(x?.reinvestable||0)+'</td></tr>').join(""):'<tr><td colspan="4" class="empty">Keine abgeschlossenen Verkäufe.</td></tr>');
  setHTML("trSaleCandidates",list(d?.saleCandidates||[],x=>'<div class="rule"><b>Markt: '+esc(x?.name)+'</b><br>'+esc(x?.status)+' · Marktwert '+eur(x?.marketValue||0)+'<br><span class="muted">'+esc(x?.note||"")+'</span></div>'));
  setHTML("trLoanList",list(loans,x=>'<div class="rule"><b>'+esc(x?.name)+'</b><br>'+esc(x?.position)+' · '+esc(x?.ovr)+' OVR / '+esc(x?.potential)+' POT<br>'+esc(x?.status)+'</div>'));

  const jan=sales.find(x=>x?.name==="Theo Jannotta"),rem=sales.find(x=>x?.name==="Mats Remberg"),sil=sales.find(x=>x?.name==="Mario Silva");
  setText("fiJannotta",eur(jan?.fee||0)); setText("fiRemberg",eur(rem?.fee||0)); setText("fiMikel",eur(d?.transferPlan?.summer2027?.rvTarget?.negotiatedFee||0));
  setHTML("fiRules",
    '<div class="rule"><b>Reinvestition</b>70 % der Netto-Transfererlöse dürfen reinvestiert werden.</div>'+
    '<div class="rule"><b>Silva</b>'+eur(sil?.fee||0)+' verkauft, davon '+eur(sil?.reinvestable||0)+' reinvestierbar.</div>'+
    '<div class="rule"><b>Reserve</b>'+esc(d?.transferPlan?.summer2027?.postFarhatPolicy||"Reserve nach der Kaderplanung schützen.")+'</div>'+
    '<div class="rule"><b>Budget</b>'+esc(d?.budgetNote||"")+'</div>'
  );

  setText("boSat",(bs?.score??"–")+"/10"); setText("boSatText",bs?.status||""); setText("boGoal",sg?.currentOfficialGoal||sg?.primary||"–"); setText("boGoalSub",sg?.internalOutlook||sg?.secondary||"");
  setText("boContract",mc?.contractEnds||"–"); setText("boContractSub",mc?.currentStatus||mc?.status||"laufend"); setText("boClause",mc?.specialExitClause?.active?"Ja":"Nein");
  setHTML("boRules",(d?.rules||[]).map((x,i)=>'<div class="rule"><b>'+(i+1)+'. Regel</b>'+esc(x)+'</div>').join(""));
  setHTML("boAssessment",'<div class="callout"><strong>'+esc(bs?.status||"")+'</strong>'+esc(bs?.currentAssessment||"")+'</div><div class="rule"><b>Offizielles Ziel</b>'+esc(sg?.currentOfficialGoal||sg?.primary||"–")+'</div><div class="rule"><b>Zusatzfokus</b>Klassenerhalt und Konstanz.</div>');
  const meeting=d?.lastMeeting||(d?.boardMeetingHistory||[]).slice(-1)[0];
  setHTML("boMeeting",meeting?
    '<div class="callout"><strong>Vorstandsbewertung</strong>'+esc(meeting?.assessment||"")+'</div>'+
    (meeting?.questions||[]).map((q,i)=>'<div class="rule"><b>'+(i+1)+'. Frage</b>'+esc(q)+(meeting?.answers?.[i]?'<br><span class="muted"><b>Antwort Trainer:</b> '+esc(meeting.answers[i])+'</span>':"")+'</div>').join("")
    :'<div class="empty">Keine Sitzung hinterlegt.</div>');

  setHTML("caCurrent",'<div class="rule"><b>Aktueller Verein</b>'+esc(mc?.club||"VfL Osnabrück")+' · '+esc(mc?.currentLeague||"Bundesliga")+'</div><div class="rule"><b>Vertrag</b>bis '+esc(mc?.contractEnds||"Sommer 2029")+'</div><div class="rule"><b>Status</b>'+esc(mc?.currentStatus||mc?.status||"laufend")+'</div>');
  const states=offerStates();
  window.dashboardOffers=(mc?.incomingOffers||[]).filter(o=>!["accepted","rejected"].includes(states[offerId(o)]));
  setHTML("caOffers",window.dashboardOffers.length?window.dashboardOffers.map((o,i)=>{
    const interest=states[offerId(o)]==="interest";
    return '<div class="rule"><b>'+esc(o?.club)+' <span class="badge">'+esc(o?.league)+'</span>'+(interest?' <span class="badge warn">Interesse</span>':"")+'</b><br>'+esc(o?.contract)+' · '+eur(o?.annualSalary)+'/Jahr · '+eur(o?.signOnBonus)+' Handgeld<br><b>Transferbudget:</b> '+eur(o?.transferBudgetPromise)+'<br><span class="muted">'+esc(o?.perspective?.sportingPerspective||o?.note||"")+'</span><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px"><button class="btn" onclick="offerAction('+i+',\'accepted\')">✅ Annehmen</button><button class="btn" style="background:#8f2d2d" onclick="offerAction('+i+',\'rejected\')">❌ Ablehnen</button><button class="btn" style="background:#6b7280" onclick="offerAction('+i+',\'interest\')">🔎 Interesse</button></div></div>';
  }).join(""):'<div class="empty">Aktuell keine neuen Trainerangebote. Historische Angebote bleiben gespeichert.</div>');
  setHTML("caClubPerspective",'<div class="rule"><b>Sportlich</b>'+esc(cp?.sportingPerspective||"Bundesliga etablieren.")+'</div><div class="rule"><b>Trainer</b>'+esc(cp?.managerPerspective||"Die erste Bundesliga-Saison gemeinsam bestreiten.")+'</div><div class="rule"><b>Entwicklung</b>'+esc(cp?.developmentPerspective||"Talente gezielt integrieren.")+'</div>');
  setHTML("caClause",mc?.specialExitClause?.active?
    '<div class="callout"><strong>Optionaler Wechsel ab Ende 2027/28</strong>Ohne Entschädigungszahlung zu einem Klub aus Bundesliga, Premier League oder LaLiga. Kein Wechselzwang.</div>':'<div class="empty">Keine Sonderklausel.</div>');
}

async function load(){
  try{
    const response=await fetch(CONFIG.dataUrl+"?v="+Date.now(),{cache:"no-store"});
    if(!response.ok)throw new Error("Datenfehler HTTP "+response.status);
    const d=await response.json();
    render(d);
    setText("updated","Stand "+(d?.currentDate||"–")+" · geladen "+new Date().toLocaleString("de-DE"));
  }catch(error){
    console.error(error);
    setText("updated","Fehler beim Laden: "+error.message);
    setHTML("ovActive",'<div class="rule"><b>Dashboard-Fehler</b>'+esc(error.message)+'</div>');
  }
}
function init(){
  document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    btn.classList.add("active"); const view=$(btn.dataset.view); if(view)view.classList.add("active");
  }));
  const refresh=$("refresh"); if(refresh)refresh.addEventListener("click",load);
  load();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
