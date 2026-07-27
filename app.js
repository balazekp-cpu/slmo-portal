const C=window.SLMO_CONFIG;
const state={standings:[],matches:[],tournaments:[],teams:[],season:"2026/27",demo:false};
const val=(o,...keys)=>{for(const k of keys)if(o[k]!==undefined&&o[k]!=="")return o[k];return""};
const num=v=>Number(String(v??0).replace(",","."))||0;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const dateText=v=>{if(!v)return"";const s=String(v),m=s.match(/^Date\((\d+),(\d+),(\d+)\)$/);return m?new Date(+m[1],+m[2],+m[3]).toLocaleDateString("sl-SI"):s};
const medal=p=>p===1?"🥇":p===2?"🥈":p===3?"🥉":String(p);
function parseGviz(text){const a=text.indexOf("{"),b=text.lastIndexOf("}");if(a<0||b<0)throw Error("Neveljaven odgovor.");const j=JSON.parse(text.slice(a,b+1)),cols=j.table.cols.map(c=>c.label||c.id);return j.table.rows.map(r=>{const o={};(r.c||[]).forEach((c,i)=>o[cols[i]||`c${i}`]=c?.f??c?.v??"");return o})}
async function getSheet(name,range=""){if(!C.spreadsheetId||C.spreadsheetId.startsWith("VNESI_"))throw Error("ID ni nastavljen.");const url=`https://docs.google.com/spreadsheets/d/${C.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}${range?`&range=${encodeURIComponent(range)}`:""}`;const r=await fetch(url);if(!r.ok)throw Error(`Napaka ${r.status}`);return parseGviz(await r.text())}
async function loadData(){
 const [s,m,t,e,n]=await Promise.all([getSheet(C.sheets.standings,"A4:K14"),getSheet(C.sheets.matches,"A4:P104"),getSheet(C.sheets.tournaments,"A4:H24"),getSheet(C.sheets.teams,"A4:F14"),getSheet(C.sheets.settings,"A4:B12")]);
 state.standings=s.filter(r=>val(r,"Ekipa")).map(r=>({place:num(val(r,"Mesto")),team:val(r,"Ekipa"),played:num(val(r,"Tekme")),wins:num(val(r,"Zmage")),losses:num(val(r,"Porazi")),points:num(val(r,"Točke")),setsFor:num(val(r,"Nizi +")),setsAgainst:num(val(r,"Nizi -")),scoreFor:num(val(r,"Točke +")),scoreAgainst:num(val(r,"Točke -")),ratio:num(val(r,"Količnik"))}));
 state.matches=m.filter(r=>val(r,"Domači")&&val(r,"Gostje")).map(r=>({tournament:val(r,"Turnir"),date:dateText(val(r,"Datum")),time:val(r,"Čas"),court:val(r,"Igrišče"),home:val(r,"Domači"),away:val(r,"Gostje"),result:val(r,"Rezultat"),sets:[[val(r,"1. niz D"),val(r,"1. niz G")],[val(r,"2. niz D"),val(r,"2. niz G")],[val(r,"3. niz D"),val(r,"3. niz G")]].filter(x=>x[0]!==""&&x[1]!=="" ).map(x=>`${x[0]}:${x[1]}`),status:val(r,"Status")}));
 state.tournaments=t.filter(r=>val(r,"Naziv turnirja")).map(r=>({name:val(r,"Naziv turnirja"),date:dateText(val(r,"Datum")),host:val(r,"Gostitelj"),place:val(r,"Kraj"),hall:val(r,"Dvorana"),status:val(r,"Status"),note:val(r,"Opomba")}));
 state.teams=e.filter(r=>val(r,"Ime ekipe")).map(r=>({name:val(r,"Ime ekipe"),place:val(r,"Kraj"),abbr:val(r,"Kratica"),color:val(r,"Klubska barva","Barva"),logo:val(r,"LOGOTIP / URL","Logotip / URL")}));
 const sr=n.find(r=>val(r,"Nastavitev")==="Sezona");if(sr)state.season=val(sr,"Vrednost")||state.season;
}
const findTeam=name=>state.teams.find(t=>t.name===name)||{name,place:"",abbr:String(name).slice(0,3)};
const standingFor=name=>state.standings.find(s=>s.team===name)||{place:"–",played:0,wins:0,losses:0,points:0,setsFor:0,setsAgainst:0,scoreFor:0,scoreAgainst:0,ratio:0};
const teamMatches=name=>state.matches.filter(m=>m.home===name||m.away===name);
function teamWon(m,name){if(!m.result)return false;const [a,b]=m.result.split(":").map(Number);return m.home===name?a>b:b>a}
function render(){
 document.querySelectorAll("[data-season]").forEach(x=>x.textContent=state.season);
 document.getElementById("teamCount").textContent=state.teams.length;
 const leader=state.standings[0];document.getElementById("leaderButton").textContent=leader?.team||"–";document.getElementById("leaderButton").onclick=()=>leader&&openTeam(leader.team);
 const next=state.tournaments.find(t=>t.status==="Načrtovan"||t.status==="V teku")||state.tournaments.at(-1);const nb=document.getElementById("nextTournamentButton");nb.textContent=next?`${next.name}${next.date?` · ${next.date}`:""}`:"–";nb.onclick=()=>next&&openTournament(next.name);
 const last=state.matches.filter(m=>m.status==="Končana").at(-1);document.getElementById("lastMatch").textContent=last?`${last.home} ${last.result} ${last.away}`:"–";
 renderHome();renderStandings();renderResults();renderTournaments();renderTeams();buildFilter();
 const ds=document.getElementById("dataStatus");ds.textContent="Povezano z Google Preglednicami";ds.className="status-pill live";
}
function renderHome(){
 document.getElementById("homeStandings").innerHTML=state.standings.slice(0,5).map(r=>`<div class="mini-row"><span class="rank-medal">${medal(r.place)}</span><button class="mini-team" data-team="${esc(r.team)}">${esc(r.team)}</button><span class="mini-points">${r.points} toč.</span></div>`).join("")||'<p class="empty">Lestvica še ni na voljo.</p>';
 document.getElementById("homeResults").innerHTML=state.matches.filter(m=>m.status==="Končana").slice(-5).reverse().map(m=>`<div class="home-result"><span>${esc(m.home)}</span><strong>${esc(m.result)}</strong><span>${esc(m.away)}</span></div>`).join("")||'<p class="empty">Tekme še niso odigrane.</p>';
}
function renderStandings(){
 document.getElementById("standingsBody").innerHTML=state.standings.map(r=>`<tr><td>${medal(r.place)}</td><td><button class="standing-team" data-team="${esc(r.team)}">${esc(r.team)}</button></td><td>${r.played}</td><td>${r.wins}</td><td>${r.losses}</td><td><strong>${r.points}</strong></td><td>${r.setsFor}</td><td>${r.setsAgainst}</td><td>${r.scoreFor}</td><td>${r.scoreAgainst}</td><td>${Number(r.ratio).toFixed(3)}</td></tr>`).join("");
}
function renderResults(){
 const f=document.getElementById("tournamentFilter").value,data=state.matches.filter(m=>!f||m.tournament===f).slice().reverse();
 const grid=document.getElementById("resultsGrid");grid.innerHTML="";if(!data.length){grid.innerHTML='<p class="empty">Rezultati še niso objavljeni.</p>';return}
 data.forEach(m=>{const n=document.getElementById("resultTemplate").content.cloneNode(true);const tb=n.querySelector(".match-tournament");tb.textContent=m.tournament;tb.dataset.tournament=m.tournament;n.querySelector("time").textContent=[m.date,m.time].filter(Boolean).join(" · ");const h=n.querySelector(".home-team"),a=n.querySelector(".away-team");h.textContent=m.home;h.dataset.team=m.home;a.textContent=m.away;a.dataset.team=m.away;n.querySelector(".match-score").textContent=m.result||"–";n.querySelector(".set-scores").innerHTML=m.sets.map(s=>`<span>${esc(s)}</span>`).join("");n.querySelector(".match-status").textContent=m.status;grid.appendChild(n)});
}
function renderTournaments(){
 const g=document.getElementById("tournamentsGrid");g.innerHTML=state.tournaments.length?state.tournaments.map(t=>`<button class="tournament-card" data-tournament="${esc(t.name)}"><span class="badge">${esc(t.status||"Načrtovan")}</span><h3>${esc(t.name)}</h3><p><strong>${esc(t.date||"Datum še ni določen")}</strong></p><p>${t.host?`Gostitelj: ${esc(t.host)}`:"Gostitelj še ni določen"}</p><p>${esc([t.hall,t.place].filter(Boolean).join(", "))}</p></button>`).join(""):'<p class="empty">Turnirji še niso vpisani.</p>';
}
function renderTeams(){
 const g=document.getElementById("teamsGrid");g.innerHTML=state.teams.length?state.teams.map(t=>`<button class="team-card" data-team="${esc(t.name)}">${t.logo?`<img class="team-logo" src="${esc(t.logo)}" alt="">`:`<div class="team-initials">${esc((t.abbr||t.name.slice(0,3)).toUpperCase())}</div>`}<div class="team-card-copy"><h3>${esc(t.name)}</h3><p>${esc(t.place||"")}</p></div></button>`).join(""):'<p class="empty">Ekipe še niso vpisane.</p>';
}
function buildFilter(){const s=document.getElementById("tournamentFilter"),old=s.value,n=[...new Set(state.matches.map(m=>m.tournament).filter(Boolean))];s.innerHTML='<option value="">Vsi turnirji</option>'+n.map(x=>`<option>${esc(x)}</option>`).join("");s.value=n.includes(old)?old:""}
function openTeam(name){
 const t=findTeam(name),s=standingFor(name),matches=teamMatches(name),form=matches.filter(m=>m.status==="Končana").slice(-5).map(m=>teamWon(m,name));
 const rows=matches.slice().reverse().slice(0,10).map(m=>{const opp=m.home===name?m.away:m.home;return `<div class="detail-match"><span>${esc(m.date)}</span><span>${esc(opp)}</span><strong>${esc(m.result||"–")}</strong><span class="right">${esc(m.sets.join(" · "))}</span></div>`}).join("")||'<p class="empty">Ni vpisanih tekem.</p>';
 document.getElementById("teamDetail").innerHTML=`<div class="detail-hero"><div class="detail-hero-inner">${t.logo?`<img class="detail-logo" src="${esc(t.logo)}" alt="">`:`<div class="detail-initials">${esc((t.abbr||name.slice(0,3)).toUpperCase())}</div>`}<div><span class="eyebrow">${s.place}. mesto</span><h2>${esc(name)}</h2><p>${esc(t.place||"")}</p></div></div></div><div class="detail-body"><div class="profile-stats"><div class="profile-stat"><span>Tekme</span><strong>${s.played}</strong></div><div class="profile-stat"><span>Zmage</span><strong>${s.wins}</strong></div><div class="profile-stat"><span>Porazi</span><strong>${s.losses}</strong></div><div class="profile-stat"><span>Točke</span><strong>${s.points}</strong></div><div class="profile-stat"><span>Nizi</span><strong>${s.setsFor}:${s.setsAgainst}</strong></div><div class="profile-stat"><span>Točke nizov</span><strong>${s.scoreFor}:${s.scoreAgainst}</strong></div><div class="profile-stat"><span>Količnik</span><strong>${Number(s.ratio).toFixed(3)}</strong></div><div class="profile-stat"><span>Forma</span><div class="form-strip">${form.map(w=>`<span class="form-dot ${w?"form-win":"form-loss"}">${w?"Z":"P"}</span>`).join("")||"–"}</div></div></div><h3>Zadnje tekme</h3>${rows}</div>`;
 document.getElementById("teamDialog").showModal();
}
function openTournament(name){
 const t=state.tournaments.find(x=>x.name===name)||{name},matches=state.matches.filter(m=>m.tournament===name);
 const cards=matches.map(m=>`<div class="compact-match"><div><span>${esc(m.home)}</span><strong>${esc(m.result||"–")}</strong><span>${esc(m.away)}</span></div><small>${esc(m.sets.join(" · "))}${m.time?` · ${esc(m.time)}`:""}</small></div>`).join("")||'<p class="empty">Razpored oziroma rezultati še niso vpisani.</p>';
 document.getElementById("tournamentDetail").innerHTML=`<div class="detail-hero"><span class="eyebrow">${esc(t.status||"Turnir")}</span><h2>${esc(t.name)}</h2><p>${esc([t.date,t.place].filter(Boolean).join(" · "))}</p></div><div class="detail-body"><div class="tournament-summary"><div class="summary-box"><span>Gostitelj</span><strong>${esc(t.host||"–")}</strong></div><div class="summary-box"><span>Dvorana</span><strong>${esc(t.hall||"–")}</strong></div><div class="summary-box"><span>Število tekem</span><strong>${matches.length}</strong></div></div><h3>Razpored in rezultati</h3><div class="tournament-matches">${cards}</div></div>`;
 document.getElementById("tournamentDialog").showModal();
}
document.addEventListener("click",e=>{const team=e.target.closest("[data-team]"),tour=e.target.closest("[data-tournament]");if(team)openTeam(team.dataset.team);if(tour)openTournament(tour.dataset.tournament);if(e.target.matches("[data-close-dialog]"))e.target.closest("dialog").close()});
document.getElementById("tournamentFilter").addEventListener("change",renderResults);
document.getElementById("menuButton").addEventListener("click",()=>{const n=document.getElementById("mainNav");n.classList.toggle("open");document.getElementById("menuButton").setAttribute("aria-expanded",n.classList.contains("open"))});
document.querySelectorAll(".main-nav a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mainNav").classList.remove("open")));
(async()=>{try{await loadData();render()}catch(e){console.error(e);const d=document.getElementById("dataStatus");d.textContent="Povezava s podatki ni uspela";d.className="status-pill demo"}})();
