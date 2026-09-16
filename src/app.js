(function(){
"use strict";

/* ======================================================================
   CONTENT DATA — injected by build/build.js from content/topics/*.json
   and content/skills/*.json. Do not hand-edit TOPICS/SKILLS here; edit
   the content files instead and re-run the build.
   ====================================================================== */
/* __CONTENT_INJECTION_POINT__ */

const SECTIONS = [
  { key:"vocab",   label_en:"Vocabulary", label_ur:"الفاظ" },
  { key:"reading", label_en:"Reading",    label_ur:"مطالعہ" },
  { key:"writing", label_en:"Writing",    label_ur:"تحریر" },
  { key:"grammar", label_en:"Grammar",    label_ur:"قواعد" }
];

/* ======================================================================
   DIFFICULTY
   Easy = fewer options + a hint, so a struggling learner still gets a win.
   Medium = the original v1 experience.
   Hard = more options, no hints, plus one open-ended "Creative Corner" or
   reflective task at the end (self-checked, not auto-graded — free Urdu
   writing can't be marked reliably by this app).
   ====================================================================== */
const LEVELS = [
  { key:"easy",   en:"Easy",   ur:"آسان" },
  { key:"medium", en:"Medium", ur:"درمیانہ" },
  { key:"hard",   en:"Hard",   ur:"مشکل" }
];
function levelCfg(level){
  if(level==="easy")   return { quizCount:4, optCount:2, hint:true,  creative:false };
  if(level==="hard")   return { quizCount:8, optCount:4, hint:false, creative:true  };
  return                      { quizCount:6, optCount:4, hint:false, creative:false }; // medium
}
// Trims an options array down to `count` choices while keeping the correct
// one in the set, and returns the correct answer's new index.
function sliceOptions(opts, correctIdx, count){
  if(count>=opts.length) return { opts:opts.slice(), a:correctIdx };
  const correctVal = opts[correctIdx];
  const others = opts.filter((_,i)=>i!==correctIdx).sort(()=>Math.random()-0.5).slice(0, Math.max(0,count-1));
  const finalOpts = others.concat([correctVal]).sort(()=>Math.random()-0.5);
  return { opts:finalOpts, a: finalOpts.indexOf(correctVal) };
}

/* ======================================================================
   PROGRESS  (localStorage — per-device, no login)
   ====================================================================== */
const STORE_KEY = "urdu-safar-progress-v1";
function loadProgress(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {};
}
function saveProgress(p){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }catch(e){}
}
let progress = loadProgress();
function sectionStars(topicId, sectionKey){
  const p = progress[topicId] && progress[topicId][sectionKey];
  return p ? p.stars : 0;
}
function setSectionResult(topicId, sectionKey, correct, total){
  if(!progress[topicId]) progress[topicId] = {};
  const pct = total ? correct/total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  progress[topicId][sectionKey] = { correct, total, stars, done:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}
function topicTotalStars(topicId){
  return SECTIONS.reduce((s,sec)=> s + sectionStars(topicId, sec.key), 0);
}
function isTopicMastered(topicId){
  return SECTIONS.every(sec => sectionStars(topicId, sec.key) >= 2);
}
function overallStars(){
  return TOPICS.reduce((s,t)=> s + topicTotalStars(t.id), 0);
}
function masteredCount(){
  return TOPICS.filter(t=>isTopicMastered(t.id)).length;
}
// Writing-prompt completion, used only by the Skills feature (free-write
// prompts aren't auto-graded, so they're tracked as done/not-done, not stars).
function markPromptDone(skillId, idx){
  if(!progress[skillId]) progress[skillId] = {};
  if(!progress[skillId].prompts) progress[skillId].prompts = {};
  progress[skillId].prompts[idx] = true;
  saveProgress(progress);
}
function isPromptDone(skillId, idx){
  return !!(progress[skillId] && progress[skillId].prompts && progress[skillId].prompts[idx]);
}
function promptsDoneCount(skillId){
  const skill = SKILLS.find(s=>s.id===skillId);
  const n = skill ? skill.prompts.length : 0;
  let done = 0;
  for(let i=0;i<n;i++) if(isPromptDone(skillId,i)) done++;
  return done;
}

/* ======================================================================
   PLAYER + LEADERBOARD
   No real accounts (no backend to hold Google/Instagram sign-in secrets
   safely, and Instagram has no general sign-in API for small apps like
   this) — "sign up" is a nickname, stored on this device. Every finished
   section earns a medal (gold=3 stars, silver=2, bronze=1). A local
   leaderboard on this device always works, so more than one learner
   sharing the same computer can compare medals. If this page is opened
   by someone signed into the same Claude account/organization as the
   person who published it, medals also sync to a small shared
   leaderboard (the `db` capability) so those viewers see each other too
   — that reach depends on the account, not on this code, so the app
   quietly falls back to the local-only leaderboard when sharing isn't
   available.
   ====================================================================== */
const PLAYER_KEY = "urdu-safar-player-v1";
function loadPlayer(){
  try{
    const raw = localStorage.getItem(PLAYER_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return null;
}
function savePlayer(p){
  try{ localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); }catch(e){}
}
function newPlayerId(){
  try{ if(window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID(); }catch(e){}
  return "p" + Date.now() + "-" + Math.random().toString(36).slice(2);
}
let player = loadPlayer();

function medalForStars(stars){
  return stars===3 ? "gold" : stars===2 ? "silver" : stars===1 ? "bronze" : null;
}
function computeMedalTotals(){
  let gold=0, silver=0, bronze=0;
  TOPICS.forEach(t=> SECTIONS.forEach(sec=>{
    const m = medalForStars(sectionStars(t.id, sec.key));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  }));
  SKILLS.forEach(s=>{
    const m = medalForStars(sectionStars(s.id, "practice"));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  });
  ["wordquiz","idioms"].forEach(kind=>{
    const m = medalForStars(vpStars(kind));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  });
  READING_SKILLS.forEach(t=> ["short","matching","notes"].forEach(key=>{
    const m = medalForStars(rsStars(t.id, key));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  }));
  GRAMMAR_LAB.forEach(t=> ["cloze","transform"].forEach(key=>{
    const m = medalForStars(glStars(t.id, key));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  }));
  return { gold, silver, bronze, score: gold*3 + silver*2 + bronze*1 };
}

/* ======================================================================
   GRAMMAR LAB — progress data layer
   Matches 3248 Paper 2, Ex.1-2 (sentence transformation + multiple-choice
   cloze). Unlike Reading Skills, this DOES get difficulty levels — it's
   supporting skill-building rather than a fixed exam simulation, per
   docs/new-categories-design-3248.md. Both exercise types auto-score.
   ====================================================================== */
function glStars(topicId, key){
  const p = progress[topicId] && progress[topicId]["gl_"+key];
  return p ? p.stars : 0;
}
function setGlResult(topicId, key, correct, total){
  if(!progress[topicId]) progress[topicId] = {};
  const pct = total ? correct/total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  progress[topicId]["gl_"+key] = { correct, total, stars, done:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}

/* ======================================================================
   READING SKILLS — progress data layer
   Matches 3248 Paper 1, Ex.1-3 (short-answer, multiple matching,
   note-making). Short-answer and matching auto-score like the rest of
   the app; note-making is self-assessed (model notes + checklist, the
   student rates their own attempt) since there's no single correct set
   of notes. See docs/new-categories-design-3248.md.
   ====================================================================== */
function rsStars(topicId, key){
  const p = progress[topicId] && progress[topicId]["rs_"+key];
  return p ? p.stars : 0;
}
function setRsResult(topicId, key, correct, total){
  if(!progress[topicId]) progress[topicId] = {};
  const pct = total ? correct/total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  progress[topicId]["rs_"+key] = { correct, total, stars, done:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}
function setRsSelfRating(topicId, key, stars){
  if(!progress[topicId]) progress[topicId] = {};
  progress[topicId]["rs_"+key] = { stars, done:true, selfAssessed:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}
// Lenient short-answer check: Urdu spelling varies, so accept an exact
// match after trimming punctuation/whitespace, or either string containing
// the other (handles "10 بجے" vs "صبح 10 بجے"-style acceptable variants).
function normalizeAnswer(s){
  return (s||"").trim().replace(/[۔،؟!.,?]/g,"").replace(/\s+/g," ").toLowerCase();
}
function isShortAnswerCorrect(given, acceptable){
  const g = normalizeAnswer(given);
  if(!g) return false;
  return acceptable.some(a=>{
    const na = normalizeAnswer(a);
    return g===na || g.includes(na) || na.includes(g);
  });
}

/* ======================================================================
   VOCABULARY PRACTICE — data layer
   A dedicated, cross-topic practice mode (not tied to any one Essay
   topic): spaced-repetition flashcards over every topic's vocab (170
   words, not scored — repetition is the point), a mixed word-match quiz
   drawn from all topics, and an idiom drill from a new idiom bank. Built
   first because "concentrate on vocabulary and skills practice" was the
   top-level ask — see docs/new-categories-design-3248.md. Reuses vocab
   already authored per topic; only the idiom bank is new content.
   ====================================================================== */
function allVocabWords(){
  const out = [];
  TOPICS.forEach(t=> t.vocab.forEach(w=> out.push(Object.assign({ topicId:t.id }, w))));
  return out;
}

// Leitner-style spaced repetition: box 0-3, each box a longer review gap.
// "Still learning" resets to box 0 (due immediately); "Got it" advances a
// box and pushes the next review further out.
const SRS_KEY = "urdu-safar-vocab-srs-v1";
const SRS_GAPS_MS = [0, 24*3600e3, 3*24*3600e3, 7*24*3600e3];
function loadSrs(){
  try{ const raw = localStorage.getItem(SRS_KEY); if(raw) return JSON.parse(raw); }catch(e){}
  return {};
}
function saveSrs(s){ try{ localStorage.setItem(SRS_KEY, JSON.stringify(s)); }catch(e){} }
let srs = loadSrs();
function srsKeyFor(w){ return w.topicId + "|" + w.ur; }
function srsBox(w){ const e = srs[srsKeyFor(w)]; return e ? e.box : 0; }
function srsIsDue(w){
  const e = srs[srsKeyFor(w)];
  return !e || Date.now() >= e.dueAt;
}
function srsMark(w, knewIt){
  const key = srsKeyFor(w);
  const prevBox = srs[key] ? srs[key].box : 0;
  const box = knewIt ? Math.min(prevBox+1, SRS_GAPS_MS.length-1) : 0;
  srs[key] = { box, dueAt: Date.now() + SRS_GAPS_MS[box] };
  saveSrs(srs);
}
function srsMasteredCount(){
  return allVocabWords().filter(w=> srsBox(w) >= SRS_GAPS_MS.length-1).length;
}

// Vocabulary Practice's own progress bucket, separate from the per-topic
// TOPICS/SECTIONS bookkeeping above since it isn't tied to one topic.
function vpStars(kind){
  const p = progress["_vocabpractice"] && progress["_vocabpractice"][kind];
  return p ? p.stars : 0;
}
function setVpResult(kind, correct, total){
  if(!progress["_vocabpractice"]) progress["_vocabpractice"] = {};
  const pct = total ? correct/total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  progress["_vocabpractice"][kind] = { correct, total, stars, done:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}

const LB_KEY = "urdu-safar-leaderboard-v1";
function loadLocalLeaderboard(){
  try{
    const raw = localStorage.getItem(LB_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return [];
}
function saveLocalLeaderboard(list){
  try{ localStorage.setItem(LB_KEY, JSON.stringify(list)); }catch(e){}
}
function upsertLocalLeaderboard(entry){
  const list = loadLocalLeaderboard();
  const i = list.findIndex(x=>x.id===entry.id);
  if(i>=0) list[i] = entry; else list.push(entry);
  saveLocalLeaderboard(list);
}

// Lazily resolves the shared-database capability. Stays null (silently)
// when this page isn't running with db access — the app never depends
// on it being there.
let db = null;
async function getDb(){
  if(db) return db;
  try{
    if(typeof window !== "undefined" && window.claude && window.claude.use){
      db = await window.claude.use("db");
    }
  }catch(e){ db = null; }
  return db;
}

function medalHtml(stars){
  const m = medalForStars(stars);
  if(!m) return '';
  const emoji = m==="gold" ? "🥇" : m==="silver" ? "🥈" : "🥉";
  const label = m==="gold" ? "Gold medal" : m==="silver" ? "Silver medal" : "Bronze medal";
  return `<div class="medal-badge">${emoji} ${label}</div>`;
}
function refreshPlayerLeaderboardEntry(){
  if(!player) return;
  const totals = computeMedalTotals();
  const entry = {
    id: player.id, nickname: player.nickname, group: player.group || null,
    gold: totals.gold, silver: totals.silver, bronze: totals.bronze, score: totals.score,
    updatedAt: Date.now()
  };
  upsertLocalLeaderboard(entry);
  (async ()=>{
    try{
      const d = await getDb();
      if(!d) return;
      await d.doc("leaderboard/" + entry.id).set(entry);
    }catch(e){ /* shared leaderboard unavailable — local copy already saved */ }
  })();
}

async function fetchSharedLeaderboard(){
  try{
    const d = await getDb();
    if(!d) return null;
    const snap = await d.collection("leaderboard").orderBy("score", "desc").limit(30).get();
    return snap.docs.map(doc=>doc.data());
  }catch(e){ return null; }
}

// A "group" is just a shared code typed into two devices — not an account
// system. Its members only actually see each other on the leaderboard when
// they're both viewing this page inside the same Claude account/org (the
// same reach limit as the leaderboard's shared mode); on this device alone
// it still narrows the local board to the code, which is at least honest.
function normalizeGroupCode(raw){
  return (raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
function setPlayerGroup(code){
  if(!player) return;
  player.group = code || null;
  savePlayer(player);
  refreshPlayerLeaderboardEntry();
}

/* ======================================================================
   STATE + ROUTER
   ====================================================================== */
let route = { view:"home" };
const app = document.getElementById("app");

function go(next){ route = next; render(); window.scrollTo({top:0}); }

function starsHtml(n, max){
  max = max || 3;
  let out = "";
  for(let i=0;i<max;i++) out += `<span class="star ${i<n?'on':''}">★</span>`;
  return `<span class="topic-stars">${out}</span>`;
}

/* ======================================================================
   HOME VIEW
   ====================================================================== */
function skillsOverallStats(){
  const maxStars = SKILLS.length * 3;
  const stars = SKILLS.reduce((s,k)=> s + sectionStars(k.id, "practice"), 0);
  const promptsTotal = SKILLS.reduce((s,k)=> s + k.prompts.length, 0);
  const promptsDone = SKILLS.reduce((s,k)=> s + promptsDoneCount(k.id), 0);
  return { stars, maxStars, promptsDone, promptsTotal };
}

/* ======================================================================
   SIGN UP  (nickname only — see the note above PLAYER + LEADERBOARD)
   ====================================================================== */
function renderSignup(){
  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="en display">Urdu Safar</span><span class="ur-mark ur">سفر</span></div>
      <div class="tagline">O&nbsp;Level&nbsp;Urdu&nbsp;3248&nbsp;Practice</div>
    </div>
    <div class="card signup-card">
      <div class="rule-title">Welcome! What should we call you?</div>
      <p class="rule-explain">Pick a nickname to track your progress and appear on the leaderboard. No email or password needed — this stays on your device.</p>
      <input type="text" id="nickInput" class="nick-input" placeholder="Your nickname" maxlength="20" autocomplete="off" />
      <div class="btn-row"><button class="btn primary" id="startBtn" disabled>Start learning</button></div>
    </div>
  `;
  const input = document.getElementById("nickInput");
  const btn = document.getElementById("startBtn");
  input.addEventListener("input", ()=>{ btn.disabled = input.value.trim().length < 2; });
  input.addEventListener("keydown", e=>{ if(e.key === "Enter" && !btn.disabled) btn.click(); });
  btn.addEventListener("click", ()=>{
    const nickname = input.value.trim().slice(0,20);
    if(nickname.length < 2) return;
    player = { id: newPlayerId(), nickname };
    savePlayer(player);
    refreshPlayerLeaderboardEntry();
    route = { view:"home" };
    render();
  });
  input.focus();
}

/* ======================================================================
   LEADERBOARD
   ====================================================================== */
function renderLeaderboard(){
  const backTab = route.homeTab === "skills" ? "skills" : "essays";
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Home</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">اسکور بورڈ</span>
      <span class="en-title">Leaderboard</span>
    </div>
    <div class="card group-card">
      <div class="rule-title" style="font-size:15px;margin-bottom:6px;">Group</div>
      ${player.group ? `
        <p class="rule-explain" style="margin-bottom:10px;">You're in group <strong>${player.group}</strong>. Share this code with a friend so they can join it too.</p>
        <div class="btn-row"><button class="btn" id="leaveGroupBtn">Leave group</button></div>
      ` : `
        <p class="rule-explain" style="margin-bottom:10px;">Not in a group yet. Create a short code and share it with a friend, or type theirs to join.</p>
        <div class="btn-row"><button class="btn primary" id="joinGroupBtn">Join or create a group</button></div>
      `}
      <p class="rule-explain group-caveat">Heads up: a group code only connects people who open Urdu Safar signed into the same Claude account as whoever published it — it won't reach a friend on their own separate account.</p>
    </div>
    <div id="lbHost"><div class="card"><p class="rule-explain">Loading…</p></div></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({view:"home", homeTab:backTab}));
  const joinBtn = document.getElementById("joinGroupBtn");
  if(joinBtn) joinBtn.addEventListener("click", ()=>{
    const raw = window.prompt("Enter a group code to join — or make one up to start a new group (letters/numbers, up to 8 characters):", "");
    const code = normalizeGroupCode(raw);
    if(code){ setPlayerGroup(code); renderLeaderboard(); }
  });
  const leaveBtn = document.getElementById("leaveGroupBtn");
  if(leaveBtn) leaveBtn.addEventListener("click", ()=>{
    setPlayerGroup(null);
    renderLeaderboard();
  });
  drawLeaderboard();
}

async function drawLeaderboard(){
  const host = document.getElementById("lbHost");
  const local = loadLocalLeaderboard();
  const remote = await fetchSharedLeaderboard();
  let rows, scopeNote, shared;
  if(remote && remote.length){
    const map = new Map();
    remote.forEach(r=> map.set(r.id, r));
    local.forEach(l=> { if(!map.has(l.id)) map.set(l.id, l); });
    rows = Array.from(map.values());
    shared = true;
  } else {
    rows = local;
    shared = false;
  }
  if(player.group){
    rows = rows.filter(r => r.group === player.group);
    scopeNote = shared
      ? `Showing group ${player.group} — everyone in it who can open this with the right account.`
      : `Showing group ${player.group} on this device only.`;
  } else {
    scopeNote = shared
      ? "Shared leaderboard — everyone who can open this with the right account sees this list."
      : "This leaderboard is saved on this device — it shows everyone who has used Urdu Safar here.";
  }
  rows.sort((a,b)=> (b.score||0) - (a.score||0));
  host.innerHTML = `
    <div class="card">
      <p class="rule-explain">${scopeNote}</p>
      ${rows.length ? rows.map((r,i)=>`
        <div class="lb-row ${player && r.id===player.id ? 'me':''}">
          <span class="lb-rank">${i+1}</span>
          <span class="lb-name">${r.nickname}${player && r.id===player.id ? ' (you)' : ''}</span>
          <span class="lb-medals">🥇${r.gold||0}&nbsp;🥈${r.silver||0}&nbsp;🥉${r.bronze||0}</span>
        </div>
      `).join("") : `<p class="rule-explain">No medals earned yet — finish a quiz to appear here.</p>`}
    </div>
  `;
}

function renderHome(){
  const tab = route.homeTab === "skills" ? "skills"
    : route.homeTab === "vocab" ? "vocab"
    : route.homeTab === "reading-skills" ? "reading-skills"
    : route.homeTab === "grammar-lab" ? "grammar-lab"
    : "essays";

  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="en display">Urdu Safar</span><span class="ur-mark ur">سفر</span></div>
      <div class="tagline">O&nbsp;Level&nbsp;Urdu&nbsp;3248&nbsp;Practice</div>
    </div>

    <div class="player-row">
      <span class="player-name">👤 ${player.nickname} <button class="link-btn" id="editNameBtn">edit</button>${player.group ? ` · 👥 ${player.group}` : ''}</span>
      <button class="btn lb-btn" id="lbBtn">🏆 Leaderboard</button>
    </div>

    <div class="tabbar home-tabbar">
      <button class="tab ${tab==='essays'?'active':''}" data-hometab="essays">
        <span>Essays <span class="ur">مضامین</span></span>
      </button>
      <button class="tab ${tab==='skills'?'active':''}" data-hometab="skills">
        <span>Skills <span class="ur">صلاحیت</span></span>
      </button>
      <button class="tab ${tab==='vocab'?'active':''}" data-hometab="vocab">
        <span>Vocabulary <span class="ur">لفظی مشق</span></span>
      </button>
      <button class="tab ${tab==='reading-skills'?'active':''}" data-hometab="reading-skills">
        <span>Reading Skills <span class="ur">مطالعہ کی مہارت</span></span>
      </button>
      <button class="tab ${tab==='grammar-lab'?'active':''}" data-hometab="grammar-lab">
        <span>Grammar Lab <span class="ur">قواعد کی مشق</span></span>
      </button>
    </div>

    <div id="homeTabHost"></div>

    <footer class="note">More content from the Kawish course books will be added here over time — this is version 1.</footer>
  `;

  app.querySelectorAll("[data-hometab]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"home", homeTab: el.dataset.hometab }));
  });
  document.getElementById("lbBtn").addEventListener("click", ()=> go({ view:"leaderboard", homeTab: tab }));
  document.getElementById("editNameBtn").addEventListener("click", ()=>{
    const nn = window.prompt("Update your nickname:", player.nickname);
    if(nn && nn.trim()){
      player.nickname = nn.trim().slice(0,20);
      savePlayer(player);
      refreshPlayerLeaderboardEntry();
      render();
    }
  });

  const host = document.getElementById("homeTabHost");
  if(tab === "essays") drawEssaysGrid(host);
  else if(tab === "vocab") drawVocabPracticeGrid(host);
  else if(tab === "reading-skills") drawReadingSkillsGrid(host);
  else if(tab === "grammar-lab") drawGrammarLabGrid(host);
  else drawSkillsGrid(host);
}

function drawGrammarLabGrid(host){
  const maxStars = GRAMMAR_LAB.length * 6;
  const stars = GRAMMAR_LAB.reduce((s,t)=> s + ["cloze","transform"].reduce((s2,k)=> s2 + glStars(t.id,k), 0), 0);
  const msg = GRAMMAR_LAB.length
    ? "Sentence transformation and cloze passages from Paper 2 — pick a difficulty and practise."
    : "More topics are added here over time — this category is still growing.";
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>
    <div class="topic-grid">
      ${GRAMMAR_LAB.map(t=>{
        const total = ["cloze","transform"].reduce((s,k)=> s + glStars(t.id,k), 0);
        return `
        <div class="topic-card" data-gltopic="${t.id}">
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(total, 6)}
        </div>`;
      }).join("")}
    </div>
  `;
  host.querySelectorAll("[data-gltopic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"grammarlab", topicId: el.dataset.gltopic, mode:"hub", level:"medium" }));
  });
}

function drawReadingSkillsGrid(host){
  const maxStars = READING_SKILLS.length * 9;
  const stars = READING_SKILLS.reduce((s,t)=> s + ["short","matching","notes"].reduce((s2,k)=> s2 + rsStars(t.id,k), 0), 0);
  const msg = READING_SKILLS.length
    ? "Practice the exact exercise formats from Paper 1: short-answer, multiple matching, and note-making."
    : "More topics are added here over time — this category is still growing.";
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>
    <div class="topic-grid">
      ${READING_SKILLS.map(t=>{
        const total = ["short","matching","notes"].reduce((s,k)=> s + rsStars(t.id,k), 0);
        return `
        <div class="topic-card" data-rstopic="${t.id}">
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(total, 9)}
        </div>`;
      }).join("")}
    </div>
  `;
  host.querySelectorAll("[data-rstopic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"readingskills", topicId: el.dataset.rstopic, mode:"hub" }));
  });
}

function drawVocabPracticeGrid(host){
  const totalWords = allVocabWords().length;
  const mastered = srsMasteredCount();
  const dueCount = allVocabWords().filter(srsIsDue).length;
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${mastered}/${totalWords}</span><span class="lab">Words mastered</span></div>
      <div class="overall-div"></div>
      <div class="overall-stat"><span class="num">${IDIOMS.length}</span><span class="lab">Idioms</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">Practice vocabulary from every topic in one place — flashcards, a mixed quiz, and idiom drills for Paper 2.</div>
    </div>
    <div class="topic-grid">
      <div class="topic-card" data-vp="flash">
        <div class="vp-card-title">Flashcard Review</div>
        <div class="vp-card-desc">${dueCount} word${dueCount===1?'':'s'} due for review right now</div>
      </div>
      <div class="topic-card" data-vp="quiz">
        <div class="vp-card-title">Word Match Quiz</div>
        <div class="vp-card-desc">Meanings &amp; synonyms mixed from all topics</div>
        ${starsHtml(vpStars("wordquiz"), 3)}
      </div>
      <div class="topic-card" data-vp="idioms">
        <div class="vp-card-title">Idioms Drill <span class="ur">محاورے</span></div>
        <div class="vp-card-desc">${IDIOMS.length} common idioms tested in Paper 2</div>
        ${starsHtml(vpStars("idioms"), 3)}
      </div>
    </div>
  `;
  host.querySelectorAll("[data-vp]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"vocabpractice", mode: el.dataset.vp }));
  });
}

function drawEssaysGrid(host){
  const mastered = masteredCount();
  const stars = overallStars();
  const maxStars = TOPICS.length * SECTIONS.length * 3;
  let msg;
  if(mastered === 0 && stars === 0){
    msg = "Pick an essay topic below to begin. Each one covers vocabulary, reading, writing and a grammar point from your course.";
  } else if(mastered === TOPICS.length){
    msg = "All current topics mastered — more will be added here as you work through the course books.";
  } else {
    msg = "Keep going — a topic is mastered once every section reaches at least two stars.";
  }

  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${mastered}/${TOPICS.length}</span><span class="lab">Mastered</span></div>
      <div class="overall-div"></div>
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>

    <div class="topic-grid">
      ${TOPICS.map(t => {
        const mastered = isTopicMastered(t.id);
        return `
        <div class="topic-card" data-topic="${t.id}">
          ${mastered ? '<div class="mastered-seal">Mastered</div>' : ''}
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(topicTotalStars(t.id), SECTIONS.length*3)}
        </div>`;
      }).join("")}
    </div>
  `;

  host.querySelectorAll("[data-topic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"topic", topicId: el.dataset.topic, section:"vocab" }));
  });
}

function drawSkillsGrid(host){
  const { stars, maxStars, promptsDone, promptsTotal } = skillsOverallStats();
  let msg;
  if(stars === 0 && promptsDone === 0){
    msg = "Pick a writing skill below. Each one shows samples, then a practice quiz and writing prompts.";
  } else if(stars === maxStars && promptsDone === promptsTotal){
    msg = "All skills' quizzes and prompts completed — well done.";
  } else {
    msg = "Keep going — quiz stars and prompts written both count as progress.";
  }

  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Quiz Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-stat"><span class="num">${promptsDone}/${promptsTotal}</span><span class="lab">Prompts</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>

    <div class="topic-grid">
      ${SKILLS.map(s => {
        const st = sectionStars(s.id, "practice");
        const pdone = promptsDoneCount(s.id);
        return `
        <div class="topic-card" data-skill="${s.id}">
          <div class="ur-title ur">${s.ur}</div>
          <div class="en-title">${s.en}</div>
          ${starsHtml(st, 3)}
          <div class="skill-meta">${pdone}/${s.prompts.length} prompts written</div>
        </div>`;
      }).join("")}
    </div>
  `;

  host.querySelectorAll("[data-skill]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"skill", skillId: el.dataset.skill }));
  });
}

/* ======================================================================
   TOPIC VIEW (tab shell)
   ====================================================================== */
function renderTopic(){
  const topic = TOPICS.find(t=>t.id===route.topicId);
  const sectionKey = route.section || "vocab";
  const level = route.level || "medium";

  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Essays</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    ${topic.factoid ? `
      <div class="factoid"><span class="mark">؟</span><span><span class="ur">${topic.factoid.ur}</span><br>${topic.factoid.en}</span></div>
    ` : ''}
    <div class="tabbar">
      ${SECTIONS.map(sec => `
        <button class="tab ${sec.key===sectionKey?'active':''}" data-sec="${sec.key}">
          <span>${sec.label_en}</span>
          <span class="tab-stars">${'★'.repeat(sectionStars(topic.id, sec.key))}${'☆'.repeat(3-sectionStars(topic.id, sec.key))}</span>
        </button>
      `).join("")}
    </div>
    <div class="level-row">
      <span class="level-label">Difficulty</span>
      <div class="level-bar">
        ${LEVELS.map(l => `<button class="level-btn ${l.key===level?'active':''}" data-level="${l.key}">${l.en}</button>`).join("")}
      </div>
    </div>
    <div id="sectionHost"></div>
  `;

  document.getElementById("backHome").addEventListener("click", ()=> go({view:"home"}));
  app.querySelectorAll(".tab").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"topic", topicId: topic.id, section: el.dataset.sec, level }));
  });
  app.querySelectorAll(".level-btn").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"topic", topicId: topic.id, section: sectionKey, level: el.dataset.level }));
  });

  const host = document.getElementById("sectionHost");
  if(sectionKey === "vocab") renderVocab(host, topic, level);
  else if(sectionKey === "reading") renderReading(host, topic, level);
  else if(sectionKey === "writing") renderWriting(host, topic, level);
  else renderGrammar(host, topic, level);
}

/* ======================================================================
   SKILL VIEW (Writing Skills — a second content type, no difficulty
   levels: overview + samples -> practice quiz -> free-write prompts)
   ====================================================================== */
function renderSkill(){
  const skill = SKILLS.find(s=>s.id===route.skillId);
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Skills</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${skill.ur}</span>
      <span class="en-title">${skill.en}</span>
    </div>
    <div id="skillHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({view:"home", homeTab:"skills"}));
  const host = document.getElementById("skillHost");
  drawSkillOverview(host, skill);
}

function drawSkillOverview(host, skill){
  const stars = sectionStars(skill.id, "practice");
  const pdone = promptsDoneCount(skill.id);
  host.innerHTML = `
    <div class="card">
      <div class="rule-title">How to write it</div>
      <ul class="checklist">${skill.points.map(p=>`<li>${p}</li>`).join("")}</ul>
    </div>
    <div class="card">
      <div class="rule-title">Worked samples</div>
      ${skill.samples.map((sm,i)=>`
        <div class="sample-block">
          <div class="sample-cap">${i+1}. ${sm.caption}</div>
          <div class="ur sample-text">${sm.ur}</div>
        </div>
      `).join("")}
    </div>
    <div class="card">
      <div class="rule-title">Practice quiz</div>
      <div class="qmeta"><span>3 questions</span><span>${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span></div>
      <div class="btn-row"><button class="btn primary" id="startQuiz">Start practice quiz</button></div>
    </div>
    <div class="card">
      <div class="rule-title">Writing prompts</div>
      <div class="qmeta"><span>Free write — self-checked</span><span>${pdone}/${skill.prompts.length} done</span></div>
      <div class="btn-row" style="flex-wrap:wrap;">
        ${skill.prompts.map((pr,i)=>`
          <button class="btn ${isPromptDone(skill.id,i)?'primary':''}" data-pidx="${i}">${isPromptDone(skill.id,i)?'✓ ':''}Prompt ${i+1}</button>
        `).join("")}
      </div>
    </div>
  `;
  document.getElementById("startQuiz").addEventListener("click", ()=> runSkillQuiz(host, skill));
  host.querySelectorAll("[data-pidx]").forEach(btn=>{
    btn.addEventListener("click", ()=> runSkillPrompt(host, skill, Number(btn.dataset.pidx)));
  });
}

function runSkillQuiz(host, skill){
  const qs = skill.practice;
  let qi = 0, correct = 0;
  function drawQ(){
    if(qi >= qs.length){
      renderSkillSummary(host, skill, correct, qs.length, ()=>runSkillQuiz(host, skill));
      return;
    }
    const q = qs[qi];
    host.innerHTML = `
      ${dotsHtml(qs.length, qi)}
      <div class="card">
        <div class="qmeta"><span>Question ${qi+1} of ${qs.length}</span><span>Practice</span></div>
        <div class="prompt-ur ur">${q.q}</div>
        <div class="options">
          ${q.opts.map((o,idx)=>`<button class="opt ur" data-idx="${idx}">${o}</button>`).join("")}
        </div>
        <div id="fb"></div>
      </div>
    `;
    host.querySelectorAll(".opt").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.dataset.idx);
        const ok = idx === q.a;
        if(ok) correct++;
        host.querySelectorAll(".opt").forEach((b,bi)=>{
          b.disabled = true;
          if(bi===q.a) b.classList.add("correct");
          else if(bi===idx) b.classList.add("wrong");
        });
        document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct answer: '+q.opts[q.a]}</div>`;
        setTimeout(()=>{ qi++; drawQ(); }, 900);
      });
    });
  }
  drawQ();
}

function renderSkillSummary(host, skill, correct, total, onRetry){
  setSectionResult(skill.id, "practice", correct, total);
  const stars = sectionStars(skill.id, "practice");
  const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising this one." : "Try again — it will get easier.";
  host.innerHTML = `
    <div class="card summary">
      <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <h2>${correct} / ${total} correct</h2>
      ${medalHtml(stars)}
      <p>${line}</p>
      <div class="btn-row">
        <button class="btn" id="retryBtn">Try again</button>
        <button class="btn primary" id="backBtn">Back</button>
      </div>
    </div>
  `;
  document.getElementById("retryBtn").addEventListener("click", onRetry);
  document.getElementById("backBtn").addEventListener("click", ()=> go({view:"skill", skillId:skill.id}));
}

function runSkillPrompt(host, skill, idx){
  const pr = skill.prompts[idx];
  renderCreativeStep(host, pr.ur, pr.en, ()=>{
    markPromptDone(skill.id, idx);
    renderSkill();
  });
}

/* ======================================================================
   VOCABULARY PRACTICE VIEW
   ====================================================================== */
function renderVocabPractice(){
  const mode = route.mode || "quiz";
  const title = mode === "flash" ? "Flashcard Review" : mode === "idioms" ? "Idioms Drill" : "Word Match Quiz";
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Vocabulary</button>
    </div>
    <div class="topic-head">
      <span class="en-title vp-view-title">${title}</span>
    </div>
    <div id="vpHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"vocab" }));
  const host = document.getElementById("vpHost");
  if(mode === "flash") runVocabFlashcards(host);
  else if(mode === "idioms") runIdiomsQuiz(host);
  else runVocabWordQuiz(host);
}

function runVocabFlashcards(host){
  const all = allVocabWords();
  let due = all.filter(srsIsDue).sort((a,b)=> srsBox(a)-srsBox(b));
  if(due.length === 0) due = all.slice().sort(()=>Math.random()-0.5);
  const batch = due.slice(0, Math.min(15, due.length));
  let i = 0, flipped = false;

  function draw(){
    if(i >= batch.length){
      host.innerHTML = `
        <div class="card summary">
          <h2>Session complete</h2>
          <p>Reviewed ${batch.length} word${batch.length===1?'':'s'}. ${srsMasteredCount()}/${all.length} words fully mastered so far.</p>
          <div class="btn-row"><button class="btn primary" id="doneBtn">Back to Vocabulary</button></div>
        </div>
      `;
      document.getElementById("doneBtn").addEventListener("click", ()=> go({ view:"home", homeTab:"vocab" }));
      return;
    }
    const w = batch[i];
    const topicTitle = (TOPICS.find(t=>t.id===w.topicId) || {}).en || "";
    host.innerHTML = `
      ${dotsHtml(batch.length, i)}
      <div class="flash-wrap">
        <div class="flashcard" id="card">
          ${flipped ? `
            <div class="back-en">${w.en}</div>
            <div class="example ur">${w.ex_ur}</div>
            <div class="example-en">${w.ex_en}</div>
            ${w.syn ? `<div class="syn-line ur"><span class="lab" style="direction:ltr;">Synonym (مترادف)</span>${w.syn}</div>` : ''}
          ` : `
            <div class="front-ur ur">${w.ur}</div>
            <div class="hint">From "${topicTitle}" — tap to reveal</div>
          `}
        </div>
        ${flipped ? `
          <div class="btn-row">
            <button class="btn" id="stillLearning">Still learning</button>
            <button class="btn primary" id="gotIt">Got it &#10003;</button>
          </div>
        ` : `<div class="btn-row"><button class="btn primary" id="flip">Flip card</button></div>`}
      </div>
    `;
    document.getElementById("card").addEventListener("click", ()=>{ flipped=!flipped; draw(); });
    const flipBtn = document.getElementById("flip");
    if(flipBtn) flipBtn.addEventListener("click", ()=>{ flipped=true; draw(); });
    const stillBtn = document.getElementById("stillLearning");
    if(stillBtn) stillBtn.addEventListener("click", ()=>{ srsMark(w,false); i++; flipped=false; draw(); });
    const gotBtn = document.getElementById("gotIt");
    if(gotBtn) gotBtn.addEventListener("click", ()=>{ srsMark(w,true); i++; flipped=false; draw(); });
  }
  draw();
}

function drawVpQuizResult(host, kind, correct, total, onRetry){
  setVpResult(kind, correct, total);
  const stars = vpStars(kind);
  const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
  host.innerHTML = `
    <div class="card summary">
      <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <h2>${correct} / ${total} correct</h2>
      ${medalHtml(stars)}
      <p>${line}</p>
      <div class="btn-row">
        <button class="btn" id="retryBtn">Try again</button>
        <button class="btn primary" id="backBtn">Back</button>
      </div>
    </div>
  `;
  document.getElementById("retryBtn").addEventListener("click", onRetry);
  document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"home", homeTab:"vocab" }));
}

function runVocabWordQuiz(host){
  const pool = allVocabWords();
  const QUIZ_COUNT = Math.min(12, pool.length);
  const shuffled = pool.slice().sort(()=>Math.random()-0.5).slice(0, QUIZ_COUNT);
  const meaningItems = shuffled.map((w,n)=>{
    const urToEn = n % 2 === 0;
    const distractors = pool.filter(x=>x.ur!==w.ur).sort(()=>Math.random()-0.5).slice(0,3);
    const opts = distractors.concat([w]).sort(()=>Math.random()-0.5);
    return {
      kind:"meaning", urToEn,
      prompt: urToEn ? w.ur : w.en,
      opts: opts.map(o => urToEn ? o.en : o.ur),
      answer: urToEn ? w.en : w.ur,
      label: urToEn ? "What does this mean?" : "Which word means this?"
    };
  });
  const synPool = pool.filter(w=>w.syn);
  const synItems = [];
  if(synPool.length >= 2){
    synPool.slice().sort(()=>Math.random()-0.5).slice(0, Math.min(6, synPool.length)).forEach((w,n)=>{
      const wordToSyn = n % 2 === 0;
      const distractors = synPool.filter(x=>x.ur!==w.ur).sort(()=>Math.random()-0.5).slice(0,3);
      const opts = distractors.concat([w]).sort(()=>Math.random()-0.5);
      synItems.push({
        kind:"syn", wordToSyn,
        prompt: wordToSyn ? w.ur : w.syn,
        opts: opts.map(o => wordToSyn ? o.syn : o.ur),
        answer: wordToSyn ? w.syn : w.ur,
        label: wordToSyn ? "Which word is a synonym (مترادف) of this?" : "This is a synonym — which word does it belong to?"
      });
    });
  }
  const items = meaningItems.concat(synItems);
  let qi=0, correct=0;
  function drawQ(){
    if(qi>=items.length){ drawVpQuizResult(host, "wordquiz", correct, items.length, ()=>runVocabWordQuiz(host)); return; }
    const it = items[qi];
    const promptCls = it.kind==="meaning" ? (it.urToEn ? "ur" : "") : "ur";
    const optCls = it.kind==="meaning" ? (it.urToEn ? "en" : "ur") : "ur";
    host.innerHTML = `
      ${dotsHtml(items.length, qi)}
      <div class="card">
        <div class="qmeta"><span>Question ${qi+1} of ${items.length}</span><span>${it.kind==='syn' ? 'Synonyms' : 'Meaning'}</span></div>
        <div class="prompt-ur ${promptCls}">${it.prompt}</div>
        <div class="translation-hint" style="direction:ltr;">${it.label}</div>
        <div class="options" id="opts">
          ${it.opts.map((o,idx)=>`<button class="opt ${optCls}" data-idx="${idx}">${o}</button>`).join("")}
        </div>
        <div id="fb"></div>
      </div>
    `;
    host.querySelectorAll("#opts .opt").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const chosen = it.opts[btn.dataset.idx];
        const ok = chosen === it.answer;
        if(ok) correct++;
        host.querySelectorAll("#opts .opt").forEach(b=>{
          b.disabled = true;
          if(b.textContent===it.answer) b.classList.add("correct");
          else if(b===btn) b.classList.add("wrong");
        });
        document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok? 'Correct!' : 'Correct answer: '+it.answer}</div>`;
        setTimeout(()=>{ qi++; drawQ(); }, 900);
      });
    });
  }
  drawQ();
}

function runIdiomsQuiz(host){
  const pool = IDIOMS;
  const QUIZ_COUNT = Math.min(10, pool.length);
  const items = pool.slice().sort(()=>Math.random()-0.5).slice(0, QUIZ_COUNT).map((idm,n)=>{
    const idiomToMeaning = n % 2 === 0;
    const distractors = pool.filter(x=>x.id!==idm.id).sort(()=>Math.random()-0.5).slice(0,3);
    const opts = distractors.concat([idm]).sort(()=>Math.random()-0.5);
    return {
      idiomToMeaning,
      prompt: idiomToMeaning ? idm.ur : idm.meaning_en,
      opts: opts.map(o => idiomToMeaning ? o.meaning_en : o.ur),
      answer: idiomToMeaning ? idm.meaning_en : idm.ur,
      label: idiomToMeaning ? "What does this idiom mean?" : "Which idiom means this?"
    };
  });
  let qi=0, correct=0;
  function drawQ(){
    if(qi>=items.length){ drawVpQuizResult(host, "idioms", correct, items.length, ()=>runIdiomsQuiz(host)); return; }
    const it = items[qi];
    const promptCls = it.idiomToMeaning ? "ur" : "";
    const optCls = it.idiomToMeaning ? "" : "ur";
    host.innerHTML = `
      ${dotsHtml(items.length, qi)}
      <div class="card">
        <div class="qmeta"><span>Question ${qi+1} of ${items.length}</span><span>Idioms</span></div>
        <div class="prompt-ur ${promptCls}">${it.prompt}</div>
        <div class="translation-hint" style="direction:ltr;">${it.label}</div>
        <div class="options" id="opts">
          ${it.opts.map((o,idx)=>`<button class="opt ${optCls}" data-idx="${idx}">${o}</button>`).join("")}
        </div>
        <div id="fb"></div>
      </div>
    `;
    host.querySelectorAll("#opts .opt").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const chosen = it.opts[btn.dataset.idx];
        const ok = chosen === it.answer;
        if(ok) correct++;
        host.querySelectorAll("#opts .opt").forEach(b=>{
          b.disabled = true;
          if(b.textContent===it.answer) b.classList.add("correct");
          else if(b===btn) b.classList.add("wrong");
        });
        document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok? 'Correct!' : 'Correct answer: '+it.answer}</div>`;
        setTimeout(()=>{ qi++; drawQ(); }, 900);
      });
    });
  }
  drawQ();
}

/* ======================================================================
   READING SKILLS VIEW
   Matches 3248 Paper 1, Ex.1-3. Piloted on one topic first, per the
   locked build order — see docs/new-categories-design-3248.md.
   ====================================================================== */
function renderReadingSkills(){
  const topic = READING_SKILLS.find(t=>t.id===route.topicId);
  const mode = route.mode || "hub";
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Reading Skills</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    <div id="rsHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"reading-skills" }));
  const host = document.getElementById("rsHost");
  if(mode === "short") runShortAnswer(host, topic);
  else if(mode === "matching") runMultipleMatching(host, topic);
  else if(mode === "notes") runNoteMaking(host, topic);
  else drawReadingSkillsHub(host, topic);
}

function drawReadingSkillsHub(host, topic){
  host.innerHTML = `
    <div class="topic-grid">
      <div class="topic-card" data-rsmode="short">
        <div class="vp-card-title">Short Answer</div>
        <div class="vp-card-desc">${topic.shortAnswer.questions.length} questions — read a notice, answer briefly</div>
        ${starsHtml(rsStars(topic.id,"short"), 3)}
      </div>
      <div class="topic-card" data-rsmode="matching">
        <div class="vp-card-title">Multiple Matching</div>
        <div class="vp-card-desc">Match each statement to the right paragraph</div>
        ${starsHtml(rsStars(topic.id,"matching"), 3)}
      </div>
      <div class="topic-card" data-rsmode="notes">
        <div class="vp-card-title">Note-Making</div>
        <div class="vp-card-desc">Self-assessed — compare your notes to a model answer</div>
        ${starsHtml(rsStars(topic.id,"notes"), 3)}
      </div>
    </div>
  `;
  host.querySelectorAll("[data-rsmode]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"readingskills", topicId: topic.id, mode: el.dataset.rsmode }));
  });
}

function runShortAnswer(host, topic){
  const qs = topic.shortAnswer.questions;
  let qi = 0, correct = 0, showingPassage = true;

  function drawPassage(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Read the notice</div>
        <div class="passage ur">${topic.shortAnswer.passage.replace(/\n/g,"<br>")}</div>
        <div class="btn-row"><button class="btn primary" id="toQ">Answer questions</button></div>
      </div>
    `;
    document.getElementById("toQ").addEventListener("click", ()=>{ showingPassage=false; drawQ(); });
  }

  function drawQ(){
    if(qi >= qs.length){
      setRsResult(topic.id, "short", correct, qs.length);
      const stars = rsStars(topic.id, "short");
      const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
      host.innerHTML = `
        <div class="card summary">
          <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
          <h2>${correct} / ${qs.length} correct</h2>
          ${medalHtml(stars)}
          <p>${line}</p>
          <div class="btn-row">
            <button class="btn" id="retryBtn">Try again</button>
            <button class="btn primary" id="backBtn">Back</button>
          </div>
        </div>
      `;
      document.getElementById("retryBtn").addEventListener("click", ()=>{ qi=0; correct=0; drawPassage(); });
      document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"readingskills", topicId:topic.id, mode:"hub" }));
      return;
    }
    const q = qs[qi];
    host.innerHTML = `
      ${dotsHtml(qs.length, qi)}
      <div class="card">
        <div class="qmeta"><span>Question ${qi+1} of ${qs.length}</span><span>Short Answer</span></div>
        <div class="passage ur" style="font-size:16px;margin-bottom:14px;opacity:.85;">${topic.shortAnswer.passage.replace(/\n/g,"<br>")}</div>
        <div class="prompt-ur ur">${q.q}</div>
        <input type="text" id="saInput" class="nick-input ur" dir="rtl" placeholder="اپنا جواب یہاں لکھیں..." autocomplete="off" />
        <div class="btn-row"><button class="btn primary" id="checkBtn">Check</button></div>
        <div id="fb"></div>
      </div>
    `;
    const input = document.getElementById("saInput");
    input.focus();
    const check = ()=>{
      const ok = isShortAnswerCorrect(input.value, q.answers);
      if(ok) correct++;
      input.disabled = true;
      document.getElementById("checkBtn").disabled = true;
      document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Accepted answer: '+q.answers[0]}</div>`;
      setTimeout(()=>{ qi++; drawQ(); }, 1100);
    };
    document.getElementById("checkBtn").addEventListener("click", check);
    input.addEventListener("keydown", e=>{ if(e.key==="Enter") check(); });
  }

  drawPassage();
}

function runMultipleMatching(host, topic){
  const { paragraphs, statements } = topic.multipleMatching;
  const picks = new Array(statements.length).fill(null);

  function draw(){
    const allPicked = picks.every(p=>p!==null);
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Paragraphs</div>
        ${paragraphs.map(p=>`<div class="sample-block"><span class="sample-cap" style="direction:rtl;text-align:right;">${p.label}</span><div class="ur sample-text">${p.ur}</div></div>`).join("")}
      </div>
      <div class="card">
        <div class="rule-title">Match each statement to a paragraph</div>
        ${statements.map((s,i)=>`
          <div class="sample-block">
            <div class="ur" style="font-size:18px;margin-bottom:10px;">${s.ur}</div>
            <div class="bank" style="direction:ltr;justify-content:flex-start;">
              ${paragraphs.map(p=>`<span class="tile ${picks[i]===p.label?'placed':''}" data-si="${i}" data-label="${p.label}">${p.label}</span>`).join("")}
            </div>
          </div>
        `).join("")}
        <div class="btn-row"><button class="btn primary" id="checkBtn" ${allPicked?'':'disabled'}>Check</button></div>
        <div id="fb"></div>
      </div>
    `;
    host.querySelectorAll(".tile[data-si]").forEach(el=>{
      el.addEventListener("click", ()=>{
        picks[Number(el.dataset.si)] = el.dataset.label;
        draw();
      });
    });
    const checkBtn = document.getElementById("checkBtn");
    if(checkBtn) checkBtn.addEventListener("click", ()=>{
      const correct = statements.filter((s,i)=> picks[i]===s.match).length;
      setRsResult(topic.id, "matching", correct, statements.length);
      const stars = rsStars(topic.id, "matching");
      const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
      host.innerHTML = `
        <div class="card summary">
          <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
          <h2>${correct} / ${statements.length} correct</h2>
          ${medalHtml(stars)}
          <p>${line}</p>
          <div class="btn-row">
            <button class="btn" id="retryBtn">Try again</button>
            <button class="btn primary" id="backBtn">Back</button>
          </div>
        </div>
      `;
      document.getElementById("retryBtn").addEventListener("click", ()=> runMultipleMatching(host, topic));
      document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"readingskills", topicId:topic.id, mode:"hub" }));
    });
  }
  draw();
}

function runNoteMaking(host, topic){
  const { passage, headings, modelNotes, checklist } = topic.noteMaking;
  let showingModel = false;

  function drawWriting(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Read the passage</div>
        <div class="passage ur">${passage}</div>
      </div>
      <div class="card">
        <div class="rule-title">Make notes under each heading</div>
        <p class="rule-explain">Jot down key points — short phrases, not full sentences.</p>
        ${headings.map(h=>`
          <div style="margin-bottom:14px;">
            <div class="ur" style="font-weight:700;font-size:17px;margin-bottom:6px;">${h.ur}</div>
            <textarea class="creative-ta" dir="rtl" data-headingkey="${h.key}" placeholder="نکات یہاں لکھیں..." style="min-height:70px;font-size:16px;"></textarea>
          </div>
        `).join("")}
        <div class="btn-row"><button class="btn primary" id="compareBtn">Compare with model notes</button></div>
      </div>
    `;
    document.getElementById("compareBtn").addEventListener("click", ()=>{ showingModel=true; drawCompare(); });
  }

  function drawCompare(){
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Model notes</div>
        ${headings.map(h=>`
          <div class="sample-block">
            <div class="sample-cap" style="direction:rtl;text-align:right;font-size:15px;">${h.ur}</div>
            <ul class="checklist" style="direction:rtl;text-align:right;padding-inline-start:0;padding-inline-end:20px;">
              ${(modelNotes[h.key]||[]).map(pt=>`<li class="ur">${pt}</li>`).join("")}
            </ul>
          </div>
        `).join("")}
      </div>
      <div class="card">
        <div class="rule-title">Self-check</div>
        <ul class="checklist">${checklist.map(c=>`<li class="ur" style="direction:rtl;text-align:right;">${c}</li>`).join("")}</ul>
        <p class="rule-explain">Rate your own attempt honestly — this isn't auto-scored, since note-making has no single correct answer.</p>
        <div class="btn-row">
          <button class="btn" data-rate="1">Needs work</button>
          <button class="btn" data-rate="2">Good</button>
          <button class="btn primary" data-rate="3">Excellent</button>
        </div>
      </div>
    `;
    host.querySelectorAll("[data-rate]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setRsSelfRating(topic.id, "notes", Number(btn.dataset.rate));
        go({ view:"readingskills", topicId:topic.id, mode:"hub" });
      });
    });
  }

  drawWriting();
}

/* ======================================================================
   GRAMMAR LAB VIEW
   Matches 3248 Paper 2, Ex.1-2. Piloted on one topic, per the locked
   build order — see docs/new-categories-design-3248.md. Unlike Reading
   Skills, this keeps difficulty levels (Easy/Medium/Hard), same as
   Essay topics, since it's supporting skill-building rather than a
   fixed exam simulation.
   ====================================================================== */
function renderGrammarLab(){
  const topic = GRAMMAR_LAB.find(t=>t.id===route.topicId);
  const mode = route.mode || "hub";
  const level = route.level || "medium";
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Grammar Lab</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    <div class="level-row">
      <span class="level-label">Difficulty</span>
      <div class="level-bar">
        ${LEVELS.map(l => `<button class="level-btn ${l.key===level?'active':''}" data-level="${l.key}">${l.en}</button>`).join("")}
      </div>
    </div>
    <div id="glHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"grammar-lab" }));
  app.querySelectorAll(".level-btn").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"grammarlab", topicId:topic.id, mode, level: el.dataset.level }));
  });
  const host = document.getElementById("glHost");
  if(mode === "cloze") runCloze(host, topic, level);
  else if(mode === "transform") runTransformation(host, topic, level);
  else drawGrammarLabHub(host, topic, level);
}

function drawGrammarLabHub(host, topic, level){
  host.innerHTML = `
    <div class="topic-grid">
      <div class="topic-card" data-glmode="cloze">
        <div class="vp-card-title">Cloze Passage</div>
        <div class="vp-card-desc">${topic.cloze.gaps.length} gaps — choose the correct word in context</div>
        ${starsHtml(glStars(topic.id,"cloze"), 3)}
      </div>
      <div class="topic-card" data-glmode="transform">
        <div class="vp-card-title">Sentence Transformation</div>
        <div class="vp-card-desc">${topic.transformation.length} sentences — rewrite as instructed</div>
        ${starsHtml(glStars(topic.id,"transform"), 3)}
      </div>
    </div>
  `;
  host.querySelectorAll("[data-glmode]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"grammarlab", topicId: topic.id, mode: el.dataset.glmode, level }));
  });
}

function runCloze(host, topic, level){
  const cfg = levelCfg(level);
  function showPassage(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Read the passage</div>
        <div class="passage ur">${topic.cloze.passage}</div>
        ${cfg.hint ? `<div class="translation-hint" style="direction:rtl;">Hint: ${topic.grammarPoint.ur} — ${topic.grammarPoint.en}</div>` : ''}
        <div class="btn-row"><button class="btn primary" id="toGaps">Fill in the gaps</button></div>
      </div>
    `;
    document.getElementById("toGaps").addEventListener("click", runGaps);
  }

  function runGaps(){
    const gaps = topic.cloze.gaps;
    let gi = 0, correct = 0, extraDone = false;
    const total = gaps.length + (cfg.creative ? 1 : 0);
    function drawQ(){
      if(gi >= gaps.length){
        if(cfg.creative && !extraDone){
          renderCreativeStep(
            host,
            "اس قواعد کے اصول کو استعمال کرتے ہوئے اپنا ایک نیا جملہ لکھیں۔",
            "Using one of this passage's grammar rules, write one new sentence of your own.",
            ()=>{ extraDone=true; correct++; finish(); }
          );
          return;
        }
        finish();
        return;
      }
      const g = gaps[gi];
      const sliced = sliceOptions(g.opts, g.a, cfg.optCount);
      host.innerHTML = `
        ${dotsHtml(total, gi)}
        <div class="card">
          <div class="qmeta"><span>Gap (${gi+1}) of ${gaps.length}</span><span>Cloze</span></div>
          <div class="passage ur" style="font-size:16px;margin-bottom:14px;opacity:.85;">${topic.cloze.passage}</div>
          <div class="translation-hint" style="direction:ltr;">Choose the correct word for gap (${gi+1})</div>
          <div class="options">
            ${sliced.opts.map((o,idx)=>`<button class="opt ur" data-idx="${idx}">${o}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>
      `;
      host.querySelectorAll(".opt").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const idx = Number(btn.dataset.idx);
          const ok = idx === sliced.a;
          if(ok) correct++;
          host.querySelectorAll(".opt").forEach((b,bi)=>{
            b.disabled = true;
            if(bi===sliced.a) b.classList.add("correct");
            else if(bi===idx) b.classList.add("wrong");
          });
          document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct answer: '+sliced.opts[sliced.a]+' — '+g.en}</div>`;
          setTimeout(()=>{ gi++; drawQ(); }, 1100);
        });
      });
    }
    function finish(){
      setGlResult(topic.id, "cloze", correct, total);
      const stars = glStars(topic.id, "cloze");
      const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
      host.innerHTML = `
        <div class="card summary">
          <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
          <h2>${correct} / ${total} correct</h2>
          ${medalHtml(stars)}
          <p>${line}</p>
          <div class="btn-row">
            <button class="btn" id="retryBtn">Try again</button>
            <button class="btn primary" id="backBtn">Back</button>
          </div>
        </div>
      `;
      document.getElementById("retryBtn").addEventListener("click", ()=> runCloze(host, topic, level));
      document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"grammarlab", topicId:topic.id, mode:"hub", level }));
    }
    drawQ();
  }

  showPassage();
}

function runTransformation(host, topic, level){
  const cfg = levelCfg(level);
  const items = topic.transformation;
  let ti = 0, correct = 0, extraDone = false;
  const total = items.length + (cfg.creative ? 1 : 0);

  function drawQ(){
    if(ti >= items.length){
      if(cfg.creative && !extraDone){
        renderCreativeStep(
          host,
          `${topic.grammarPoint.ur} کے اصول پر مبنی اپنا ایک نیا جملہ لکھیں۔`,
          `Write one new sentence of your own applying one of this topic's grammar rules (${topic.grammarPoint.en}).`,
          ()=>{ extraDone=true; correct++; finish(); }
        );
        return;
      }
      finish();
      return;
    }
    const item = items[ti];
    host.innerHTML = `
      ${dotsHtml(total, ti)}
      <div class="card">
        <div class="qmeta"><span>Sentence ${ti+1} of ${items.length}</span><span>Transformation</span></div>
        ${cfg.hint ? `<div class="translation-hint" style="direction:ltr;">Hint: ${topic.grammarPoint.en}</div>` : ''}
        <div class="translation-hint">"${item.en}"</div>
        <div class="prompt-ur ur">${item.original}</div>
        <div class="translation-hint ur" style="font-size:15px;font-weight:600;color:var(--ink);direction:rtl;">${item.instruction_ur} <span style="color:var(--ink-soft);font-weight:400;">(${item.instruction_en})</span></div>
        <input type="text" id="tInput" class="nick-input ur" dir="rtl" placeholder="اپنا جواب یہاں لکھیں..." autocomplete="off" />
        <div class="btn-row"><button class="btn primary" id="checkBtn">Check</button></div>
        <div id="fb"></div>
      </div>
    `;
    const input = document.getElementById("tInput");
    input.focus();
    const check = ()=>{
      const ok = isShortAnswerCorrect(input.value, item.answers);
      if(ok) correct++;
      input.disabled = true;
      document.getElementById("checkBtn").disabled = true;
      document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Accepted answer: '+item.answers[0]}</div>`;
      setTimeout(()=>{ ti++; drawQ(); }, 1200);
    };
    document.getElementById("checkBtn").addEventListener("click", check);
    input.addEventListener("keydown", e=>{ if(e.key==="Enter") check(); });
  }

  function finish(){
    setGlResult(topic.id, "transform", correct, total);
    const stars = glStars(topic.id, "transform");
    const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
    host.innerHTML = `
      <div class="card summary">
        <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
        <h2>${correct} / ${total} correct</h2>
        ${medalHtml(stars)}
        <p>${line}</p>
        <div class="btn-row">
          <button class="btn" id="retryBtn">Try again</button>
          <button class="btn primary" id="backBtn">Back</button>
        </div>
      </div>
    `;
    document.getElementById("retryBtn").addEventListener("click", ()=> runTransformation(host, topic, level));
    document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"grammarlab", topicId:topic.id, mode:"hub", level }));
  }

  drawQ();
}

/* ======================================================================
   SUMMARY (shared)
   ====================================================================== */
function renderSummary(host, topic, sectionKey, correct, total, onRetry){
  setSectionResult(topic.id, sectionKey, correct, total);
  const stars = sectionStars(topic.id, sectionKey);
  const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising this section." : "Try again — it will get easier.";
  host.innerHTML = `
    <div class="card summary">
      <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <h2>${correct} / ${total} correct</h2>
      ${medalHtml(stars)}
      <p>${line}</p>
      <div class="btn-row">
        <button class="btn" id="retryBtn">Try again</button>
        <button class="btn primary" id="tabsBtn">Back to topic</button>
      </div>
    </div>
  `;
  document.getElementById("retryBtn").addEventListener("click", onRetry);
  document.getElementById("tabsBtn").addEventListener("click", ()=> go({view:"topic", topicId:topic.id, section:sectionKey}));
}

function dotsHtml(total, current){
  let out = "";
  for(let i=0;i<total;i++) out += `<div class="dot ${i<current?'done':i===current?'now':''}"></div>`;
  return `<div class="progress-dots">${out}</div>`;
}

/* ======================================================================
   CREATIVE CORNER (shared) — an open-ended free-write step used at Hard
   difficulty. Not auto-graded (free Urdu text can't be marked reliably);
   crediting one point simply for a genuine attempt, so the app rewards
   creative production instead of only recognition.
   ====================================================================== */
const CREATIVE_CHECKLIST = [
  "Used at least two words from this topic",
  "Wrote at least two or three full sentences",
  "Checked that verb endings match the subject's gender"
];
function renderCreativeStep(host, promptUr, promptEn, onDone){
  host.innerHTML = `
    <div class="card">
      <span class="creative-badge">Creative Corner</span>
      <div class="prompt-ur ur">${promptUr}</div>
      <div class="prompt-en">${promptEn}</div>
      <textarea class="creative-ta" dir="rtl" id="creativeInput" placeholder="اپنا جواب یہاں لکھیں..."></textarea>
      <ul class="checklist">${CREATIVE_CHECKLIST.map(c=>`<li>${c}</li>`).join("")}</ul>
      <div class="btn-row"><button class="btn primary" id="doneCreative" disabled>Mark as complete</button></div>
    </div>
  `;
  const ta = document.getElementById("creativeInput");
  const btn = document.getElementById("doneCreative");
  ta.addEventListener("input", ()=>{ btn.disabled = ta.value.trim().length < 3; });
  btn.addEventListener("click", onDone);
}

/* ======================================================================
   VOCABULARY: flashcards then MCQ quiz
   ====================================================================== */
function renderVocab(host, topic, level){
  const cfg = levelCfg(level);
  let i = 0;
  let flipped = false;

  function draw(){
    const w = topic.vocab[i];
    host.innerHTML = `
      ${dotsHtml(topic.vocab.length, i)}
      <div class="flash-wrap">
        <div class="flashcard" id="card">
          ${flipped ? `
            <div class="back-en">${w.en}</div>
            <div class="example ur">${w.ex_ur}</div>
            <div class="example-en">${w.ex_en}</div>
            ${w.syn ? `<div class="syn-line ur"><span class="lab" style="direction:ltr;">Synonym (مترادف)</span>${w.syn}</div>` : ''}
          ` : `
            <div class="front-ur ur">${w.ur}</div>
            <div class="hint">Tap card to reveal meaning</div>
          `}
        </div>
        <div class="btn-row">
          <button class="btn" id="prev" ${i===0?'disabled':''}>Previous</button>
          <button class="btn primary" id="next">${i===topic.vocab.length-1 ? 'Start quiz' : 'Next word'}</button>
        </div>
      </div>
    `;
    document.getElementById("card").addEventListener("click", ()=>{ flipped=!flipped; draw(); });
    document.getElementById("prev").addEventListener("click", ()=>{ i=Math.max(0,i-1); flipped=false; draw(); });
    document.getElementById("next").addEventListener("click", ()=>{
      if(i===topic.vocab.length-1) runQuiz();
      else { i++; flipped=false; draw(); }
    });
  }

  function runQuiz(){
    // Phase 1: word <-> meaning (as before).
    const meaningItems = [];
    const pool = topic.vocab.slice();
    for(let n=0; n<cfg.quizCount; n++){
      const w = pool[n % pool.length];
      const urToEn = n % 2 === 0;
      const distractors = topic.vocab.filter(x=>x.ur!==w.ur).sort(()=>Math.random()-0.5).slice(0, Math.max(0,cfg.optCount-1));
      const opts = distractors.concat([w]).sort(()=>Math.random()-0.5);
      meaningItems.push({
        kind:"meaning", urToEn,
        prompt: urToEn ? w.ur : w.en,
        opts: opts.map(o => urToEn ? o.en : o.ur),
        answer: urToEn ? w.en : w.ur,
        hint: urToEn ? w.ex_en : w.ex_ur,
        label: urToEn ? "What does this mean?" : "Which word means this?"
      });
    }

    // Phase 2: synonyms (مترادفات) — only for words that have one tagged.
    // This mirrors the real "synonyms" section of O Level Urdu papers.
    const synPool = topic.vocab.filter(w=>w.syn);
    const synItems = [];
    if(synPool.length >= 2){
      const synCount = Math.min(cfg.quizCount, synPool.length*2);
      for(let n=0; n<synCount; n++){
        const w = synPool[n % synPool.length];
        const wordToSyn = n % 2 === 0;
        const distractors = synPool.filter(x=>x.ur!==w.ur).sort(()=>Math.random()-0.5).slice(0, Math.max(0,cfg.optCount-1));
        const opts = distractors.concat([w]).sort(()=>Math.random()-0.5);
        synItems.push({
          kind:"syn", wordToSyn,
          prompt: wordToSyn ? w.ur : w.syn,
          opts: opts.map(o => wordToSyn ? o.syn : o.ur),
          answer: wordToSyn ? w.syn : w.ur,
          label: wordToSyn ? "Which word is a synonym (مترادف) of this?" : "This is a synonym — which word does it belong to?"
        });
      }
    }

    const items = meaningItems.concat(synItems);
    let qi=0, correct=0;
    function drawQ(){
      if(qi>=items.length){ renderSummary(host, topic, "vocab", correct, items.length, ()=>renderVocab(host, topic, level)); return; }
      const it = items[qi];
      const promptCls = it.kind==="meaning" ? (it.urToEn ? "ur" : "") : "ur";
      const optCls = it.kind==="meaning" ? (it.urToEn ? "en" : "ur") : "ur";
      host.innerHTML = `
        ${dotsHtml(items.length, qi)}
        <div class="card">
          <div class="qmeta"><span>Question ${qi+1} of ${items.length}</span><span>${it.kind==='syn' ? 'Synonyms' : 'Meaning'}</span></div>
          <div class="prompt-ur ${promptCls}">${it.prompt}</div>
          <div class="translation-hint" style="direction:ltr;">${it.label}</div>
          ${(cfg.hint && it.kind==='meaning') ? `<div class="translation-hint ${it.urToEn?'':'ur'}">Hint: ${it.hint}</div>` : ''}
          <div class="options" id="opts">
            ${it.opts.map((o,idx)=>`<button class="opt ${optCls}" data-idx="${idx}">${o}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>
      `;
      document.querySelectorAll("#opts .opt").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const chosen = it.opts[btn.dataset.idx];
          const ok = chosen === it.answer;
          if(ok) correct++;
          document.querySelectorAll("#opts .opt").forEach(b=>{
            b.disabled = true;
            if(b.textContent===it.answer) b.classList.add("correct");
            else if(b===btn) b.classList.add("wrong");
          });
          document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok? 'Correct!' : 'Correct answer: '+it.answer}</div>`;
          setTimeout(()=>{ qi++; drawQ(); }, 900);
        });
      });
    }
    drawQ();
  }

  draw();
}

/* ======================================================================
   READING: passage then comprehension MCQs
   ====================================================================== */
function renderReading(host, topic, level){
  const cfg = levelCfg(level);
  function showPassage(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Read the passage</div>
        <div class="passage ur">${topic.reading.passage}</div>
        <div class="btn-row"><button class="btn primary" id="toQ">Answer questions</button></div>
      </div>
    `;
    document.getElementById("toQ").addEventListener("click", runQuestions);
  }

  function runQuestions(){
    const qs = topic.reading.questions;
    let qi=0, correct=0, extraDone=false;
    const total = qs.length + (cfg.creative ? 1 : 0);
    function drawQ(){
      if(qi>=qs.length){
        if(cfg.creative && !extraDone){
          renderCreativeStep(
            host,
            "آپ کے خیال میں اس کہانی میں آگے کیا ہو سکتا ہے؟ اپنے الفاظ میں لکھیں۔",
            "In your own words, what do you think might happen next in this story?",
            ()=>{ extraDone=true; correct++; renderSummary(host, topic, "reading", correct, total, ()=>renderReading(host, topic, level)); }
          );
          return;
        }
        renderSummary(host, topic, "reading", correct, total, ()=>renderReading(host, topic, level));
        return;
      }
      const q = qs[qi];
      const sliced = sliceOptions(q.opts, q.a, cfg.optCount);
      host.innerHTML = `
        ${dotsHtml(total, qi)}
        <div class="card">
          <div class="qmeta"><span>Question ${qi+1} of ${qs.length}</span><span>Comprehension</span></div>
          ${cfg.hint ? `<div class="passage ur" style="font-size:16px;margin-bottom:14px;opacity:.85;">${topic.reading.passage}</div>` : ''}
          <div class="prompt-ur ur">${q.q}</div>
          <div class="options">
            ${sliced.opts.map((o,idx)=>`<button class="opt ur" data-idx="${idx}">${o}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>
      `;
      host.querySelectorAll(".opt").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const idx = Number(btn.dataset.idx);
          const ok = idx === sliced.a;
          if(ok) correct++;
          host.querySelectorAll(".opt").forEach((b,bi)=>{
            b.disabled=true;
            if(bi===sliced.a) b.classList.add("correct");
            else if(bi===idx) b.classList.add("wrong");
          });
          document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct answer: '+sliced.opts[sliced.a]}</div>`;
          setTimeout(()=>{ qi++; drawQ(); }, 900);
        });
      });
    }
    drawQ();
  }

  showPassage();
}

/* ======================================================================
   WRITING: sentence building (word bank) + fill-in-the-blank
   ====================================================================== */
function renderWriting(host, topic, level){
  const cfg = levelCfg(level);
  const buildItems = cfg.optCount <= 2 ? [] : topic.writing.build; // Easy skips sentence-building, starts with blanks
  const blankItems = topic.writing.blanks;
  let bi = 0, correct = 0, extraDone = false;
  const totalItems = buildItems.length + blankItems.length + (cfg.creative ? 1 : 0);

  function drawBuild(){
    if(bi >= buildItems.length){ bi=0; drawBlank(); return; }
    const item = buildItems[bi];
    const bank = item.bank.map((w,idx)=>({word:w, idx, used:false}));
    let placed = [];

    function draw(){
      host.innerHTML = `
        ${dotsHtml(totalItems, bi)}
        <div class="card">
          <div class="qmeta"><span>Build the sentence</span><span>${bi+1} / ${buildItems.length}</span></div>
          <div class="translation-hint">"${item.en}"</div>
          <div class="answer-strip" id="strip">
            ${placed.length ? placed.map(p=>`<span class="tile placed" data-pos="${p.idx}">${p.word}</span>`).join("") : '<span class="placeholder">Tap the words below in order &rarr;</span>'}
          </div>
          <div class="bank" id="bank">
            ${bank.map(b=>`<span class="tile ${b.used?'used':''}" data-idx="${b.idx}">${b.word}</span>`).join("")}
          </div>
          <div class="btn-row">
            <button class="btn" id="undo" ${placed.length? '' : 'disabled'}>Undo</button>
            <button class="btn primary" id="check" ${placed.length===item.answer.length?'':'disabled'}>Check</button>
          </div>
          <div id="fb"></div>
        </div>
      `;
      host.querySelectorAll("#bank .tile:not(.used)").forEach(el=>{
        el.addEventListener("click", ()=>{
          const idx = Number(el.dataset.idx);
          bank[idx].used = true;
          placed.push({word:bank[idx].word, idx});
          draw();
        });
      });
      const undoBtn = document.getElementById("undo");
      if(undoBtn) undoBtn.addEventListener("click", ()=>{
        const last = placed.pop();
        if(last) bank[last.idx].used = false;
        draw();
      });
      const checkBtn = document.getElementById("check");
      if(checkBtn) checkBtn.addEventListener("click", ()=>{
        const built = placed.map(p=>p.word);
        const ok = JSON.stringify(built) === JSON.stringify(item.answer);
        if(ok) correct++;
        document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct order: '+item.answer.join(' ')}</div>`;
        host.querySelectorAll("#bank .tile, #undo, #check").forEach(el=> el.style.pointerEvents='none');
        setTimeout(()=>{ bi++; drawBuild(); }, 1100);
      });
    }
    draw();
  }

  function drawBlank(){
    if(bi >= blankItems.length){
      if(cfg.creative && !extraDone && topic.writing.creative){
        renderCreativeStep(
          host, topic.writing.creative.ur, topic.writing.creative.en,
          ()=>{ extraDone=true; correct++; renderSummary(host, topic, "writing", correct, totalItems, ()=>renderWriting(host, topic, level)); }
        );
        return;
      }
      renderSummary(host, topic, "writing", correct, totalItems, ()=>renderWriting(host, topic, level));
      return;
    }
    const item = blankItems[bi];
    const sliced = sliceOptions(item.opts, item.a, cfg.optCount);
    host.innerHTML = `
      ${dotsHtml(totalItems, buildItems.length + bi)}
      <div class="card">
        <div class="qmeta"><span>Fill in the blank</span><span>${bi+1} / ${blankItems.length}</span></div>
        <div class="translation-hint">"${item.en}"</div>
        <div class="prompt-ur ur">${item.text}</div>
        <div class="options">
          ${sliced.opts.map((o,idx)=>`<button class="opt ur" data-idx="${idx}">${o}</button>`).join("")}
        </div>
        <div id="fb"></div>
      </div>
    `;
    host.querySelectorAll(".opt").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.dataset.idx);
        const ok = idx === sliced.a;
        if(ok) correct++;
        host.querySelectorAll(".opt").forEach((b,bidx)=>{
          b.disabled=true;
          if(bidx===sliced.a) b.classList.add("correct");
          else if(bidx===idx) b.classList.add("wrong");
        });
        document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct answer: '+sliced.opts[sliced.a]}</div>`;
        setTimeout(()=>{ bi++; drawBlank(); }, 900);
      });
    });
  }

  drawBuild();
}

/* ======================================================================
   GRAMMAR: short rule card then practice MCQs
   ====================================================================== */
function renderGrammar(host, topic, level){
  const cfg = levelCfg(level);
  function showRule(){
    const g = topic.grammar;
    host.innerHTML = `
      <div class="card">
        <div class="rule-title ur">${g.title}</div>
        <div class="rule-explain">${g.explain}</div>
        <table class="ex">
          <tr><th>Example</th><th></th></tr>
          ${g.rows.map(r=>`<tr><td class="ur">${r[0]}</td><td class="gloss">${r[1]}</td></tr>`).join("")}
        </table>
        <div class="btn-row" style="margin-top:14px;"><button class="btn primary" id="toPractice">Practise</button></div>
      </div>
    `;
    document.getElementById("toPractice").addEventListener("click", runPractice);
  }

  function runPractice(){
    const items = topic.grammar.practice;
    let qi=0, correct=0, extraDone=false;
    const total = items.length + (cfg.creative ? 1 : 0);
    function drawQ(){
      if(qi>=items.length){
        if(cfg.creative && !extraDone){
          renderCreativeStep(
            host,
            "اس اصول کو استعمال کرتے ہوئے اپنی ایک نئی مثال لکھیں۔",
            "Using this grammar rule, write one new example sentence of your own.",
            ()=>{ extraDone=true; correct++; renderSummary(host, topic, "grammar", correct, total, ()=>renderGrammar(host, topic, level)); }
          );
          return;
        }
        renderSummary(host, topic, "grammar", correct, total, ()=>renderGrammar(host, topic, level));
        return;
      }
      const q = items[qi];
      const sliced = sliceOptions(q.opts, q.a, cfg.optCount);
      host.innerHTML = `
        ${dotsHtml(total, qi)}
        <div class="card">
          <div class="qmeta"><span>Question ${qi+1} of ${items.length}</span><span>Grammar</span></div>
          <div class="translation-hint">"${q.en}"</div>
          <div class="prompt-ur ur">${q.q}</div>
          <div class="options">
            ${sliced.opts.map((o,idx)=>`<button class="opt ur" data-idx="${idx}">${o}</button>`).join("")}
          </div>
          <div id="fb"></div>
        </div>
      `;
      host.querySelectorAll(".opt").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const idx = Number(btn.dataset.idx);
          const ok = idx === sliced.a;
          if(ok) correct++;
          host.querySelectorAll(".opt").forEach((b,bidx)=>{
            b.disabled=true;
            if(bidx===sliced.a) b.classList.add("correct");
            else if(bidx===idx) b.classList.add("wrong");
          });
          document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Correct answer: '+sliced.opts[sliced.a]}</div>`;
          setTimeout(()=>{ qi++; drawQ(); }, 900);
        });
      });
    }
    drawQ();
  }

  showRule();
}

/* ======================================================================
   MAIN RENDER
   ====================================================================== */
function render(){
  if(!player){ renderSignup(); return; }
  if(route.view === "home") renderHome();
  else if(route.view === "skill") renderSkill();
  else if(route.view === "leaderboard") renderLeaderboard();
  else if(route.view === "vocabpractice") renderVocabPractice();
  else if(route.view === "readingskills") renderReadingSkills();
  else if(route.view === "grammarlab") renderGrammarLab();
  else renderTopic();
}

render();
})();
