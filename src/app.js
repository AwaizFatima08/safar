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
   "Sign up" is just a nickname, stored on this device — always available,
   works fully offline, no account needed. Every finished section earns a
   medal (gold=3 stars, silver=2, bronze=1); a local leaderboard on this
   device always works, so more than one learner sharing the same device
   can compare medals. Signing into a real account (Firebase Auth, see
   ACCOUNTS + FRIEND GROUPS below) additionally lets someone create or
   join one real friend group whose members' medals sync through Cloud
   Firestore, for a leaderboard that works across separate devices.
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
  TRANSLATION.forEach(t=> ["warmup","passage"].forEach(key=>{
    const m = medalForStars(trStars(t.id, key));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  }));
  SUMMARY_WRITING.forEach(t=>{
    const m = medalForStars(swStars(t.id));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  });
  EXTENDED_WRITING.forEach(t=>{
    const m = medalForStars(ewStars(t.id));
    if(m==="gold") gold++; else if(m==="silver") silver++; else if(m==="bronze") bronze++;
  });
  return { gold, silver, bronze, score: gold*3 + silver*2 + bronze*1 };
}

/* ======================================================================
   EXTENDED WRITING — progress data layer
   Matches 3248 Paper 2, Ex.3 (~200-word composition, 20/50 marks on
   that paper — the single highest-value exercise in the qualification).
   Self-assessed via a checklist mapped to the syllabus's AO2 writing
   objectives (W1-W5) — the design doc's open question (checklist vs.
   staying unscored like Creative Corner) is resolved in favour of the
   checklist, now validated by Summary Writing and Translation.
   ====================================================================== */
function ewStars(topicId){
  const p = progress[topicId] && progress[topicId]["ew"];
  return p ? p.stars : 0;
}
function setEwSelfRating(topicId, stars){
  if(!progress[topicId]) progress[topicId] = {};
  progress[topicId]["ew"] = { stars, done:true, selfAssessed:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}

/* ======================================================================
   SUMMARY WRITING — progress data layer
   Matches 3248 Paper 1, Ex.4 (condense a passage to <=100 words, own
   words). Single self-assessed exercise per entry — no auto-scorable
   variant, since summarizing is inherently open-ended. See
   docs/new-categories-design-3248.md.
   ====================================================================== */
function swStars(topicId){
  const p = progress[topicId] && progress[topicId]["sw"];
  return p ? p.stars : 0;
}
function setSwSelfRating(topicId, stars){
  if(!progress[topicId]) progress[topicId] = {};
  progress[topicId]["sw"] = { stars, done:true, selfAssessed:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}

/* ======================================================================
   TRANSLATION — progress data layer
   Matches 3248 Paper 2, Ex.4 (English->Urdu) — the exercise the old
   0539-based plan mistakenly dropped, since 0539 doesn't test
   translation but 3248 requires it. Warm-up (sentence-builder, auto-
   scored) is the easier entry point; the full passage is self-assessed,
   same rationale as Reading Skills' note-making. See
   docs/new-categories-design-3248.md.
   ====================================================================== */
function trStars(topicId, key){
  const p = progress[topicId] && progress[topicId]["tr_"+key];
  return p ? p.stars : 0;
}
function setTrResult(topicId, key, correct, total){
  if(!progress[topicId]) progress[topicId] = {};
  const pct = total ? correct/total : 0;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  progress[topicId]["tr_"+key] = { correct, total, stars, done:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
}
function setTrSelfRating(topicId, key, stars){
  if(!progress[topicId]) progress[topicId] = {};
  progress[topicId]["tr_"+key] = { stars, done:true, selfAssessed:true };
  saveProgress(progress);
  refreshPlayerLeaderboardEntry();
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
  return (s||"").trim()
    .replace(/[ً-ٰٟ​-‏]/g,"") // diacritics (zer/zabar/pesh…) and zero-width joiners
    .replace(/ي/g,"ی").replace(/ك/g,"ک")              // Arabic-keyboard yeh/kaf → Urdu forms
    .replace(/[۔،؟!.,?]/g,"").replace(/\s+/g," ").toLowerCase();
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

/* ======================================================================
   ACCOUNTS + FRIEND GROUPS (Firebase Auth + Firestore)
   Optional layer on top of the always-available local guest mode above.
   Design: docs/accounts-friends-leaderboard-design.md (v1.0) and
   docs/update-1.1-design.md (multi-group, moderation, reset flow).
   Signing in is never required — every practice feature and the
   on-device leaderboard work offline as a guest. Signing in (email +
   password) lets you create or join up to MAX_GROUPS friend groups whose
   members' medal totals sync through Cloud Firestore.
   ====================================================================== */
const MAX_GROUPS = 5;
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.homilabs.safar";
let fbUser = null;
function fbAuth(){ try{ return (typeof firebase !== "undefined") ? firebase.auth() : null; }catch(e){ return null; } }
function fbFirestore(){ try{ return (typeof firebase !== "undefined") ? firebase.firestore() : null; }catch(e){ return null; } }

// Names typed by other group members end up on this screen, so every piece
// of user-supplied text goes through escapeHtml before touching innerHTML.
function escapeHtml(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function cleanName(s, max){
  return String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max || 30);
}

// v1.0 stored a single `player.group`; v1.1 keeps a list.
function playerGroups(){
  if(!player) return [];
  if(!Array.isArray(player.groups)){
    player.groups = (player.group && player.group.groupId) ? [player.group] : [];
    delete player.group;
    savePlayer(player);
  }
  return player.groups;
}
function setPlayerGroups(list){
  player.groups = list.filter(g => g && g.groupId).slice(0, MAX_GROUPS);
  delete player.group;
  savePlayer(player);
  if(fbUser){
    const fs = fbFirestore();
    if(fs) fs.collection("users").doc(fbUser.uid).set({ groups: player.groups }, { merge:true }).catch(()=>{});
  }
}
function dropPlayerGroup(groupId){
  setPlayerGroups(playerGroups().filter(g => g.groupId !== groupId));
}

const AUTH_VIEWS = ["home", "account", "leaderboard", "group", "groupCreate", "groupJoin"];
function initFirebaseAuthListener(){
  const auth = fbAuth();
  if(!auth) return;
  auth.onAuthStateChanged(async (u)=>{
    fbUser = u;
    if(u) await loadAccountFromFirestore();
    if(player && AUTH_VIEWS.includes(route.view)) render();
  });
}

async function loadAccountFromFirestore(){
  const fs = fbFirestore();
  if(!fs || !fbUser) return;
  try{
    const ref = fs.collection("users").doc(fbUser.uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    if(!player) player = { id: fbUser.uid, nickname: data.displayName || fbUser.displayName || (fbUser.email||"").split("@")[0] };
    player.id = fbUser.uid;
    if(data.displayName) player.nickname = data.displayName;
    const legacy = (data.group && data.group.groupId) ? [data.group] : [];
    player.groups = (Array.isArray(data.groups) ? data.groups : legacy).filter(g => g && g.groupId).slice(0, MAX_GROUPS);
    delete player.group;
    savePlayer(player);
    if(!Array.isArray(data.groups)){
      ref.set({ groups: player.groups, group: firebase.firestore.FieldValue.delete() }, { merge:true }).catch(()=>{});
    }
    refreshPlayerLeaderboardEntry();
  }catch(e){ /* offline — local state stays as-is */ }
}

async function signUp(email, password, displayName){
  const auth = fbAuth();
  if(!auth) throw new Error("offline");
  const name = cleanName(displayName, 20) || email.split("@")[0];
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  try{ await cred.user.updateProfile({ displayName: name }); }catch(e){}
  await fbFirestore().collection("users").doc(cred.user.uid).set({ email, displayName: name, createdAt: Date.now(), groups: [] });
  if(!player) player = { id: cred.user.uid, nickname: name };
  player.id = cred.user.uid;
  player.nickname = name;
  player.groups = [];
  delete player.group;
  savePlayer(player);
  refreshPlayerLeaderboardEntry();
}
async function logIn(email, password){
  const auth = fbAuth();
  if(!auth) throw new Error("offline");
  await auth.signInWithEmailAndPassword(email, password);
  // onAuthStateChanged runs loadAccountFromFirestore, but callers navigate
  // straight away — load here too so the next screen has the groups list.
  fbUser = auth.currentUser;
  await loadAccountFromFirestore();
}
async function sendReset(email){
  const auth = fbAuth();
  if(!auth) throw new Error("offline");
  await auth.sendPasswordResetEmail(email);
}
async function logOut(){
  const auth = fbAuth();
  if(auth) await auth.signOut();
  fbUser = null;
  if(player){ player.groups = []; delete player.group; savePlayer(player); }
}
function updateDisplayName(name){
  const clean = cleanName(name, 20);
  if(clean.length < 2) return false;
  player.nickname = clean;
  savePlayer(player);
  refreshPlayerLeaderboardEntry();
  return true;
}
// Firebase requires a *recent* sign-in for account deletion, so the
// password is always re-checked first.
async function deleteAccountEverywhere(password){
  const auth = fbAuth();
  const fs = fbFirestore();
  if(!auth || !auth.currentUser) throw new Error("not signed in");
  const cred = firebase.auth.EmailAuthProvider.credential(auth.currentUser.email, password);
  await auth.currentUser.reauthenticateWithCredential(cred);
  await Promise.all(playerGroups().slice().map(g => leaveGroup(g.groupId).catch(()=>{})));
  await fs.collection("users").doc(auth.currentUser.uid).delete().catch(()=>{});
  await auth.currentUser.delete();
  fbUser = null;
  if(player){ player.groups = []; savePlayer(player); }
}

const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easy to read aloud
function randomInviteCode(){
  let s = "";
  for(let i=0;i<6;i++) s += INVITE_ALPHABET[Math.floor(Math.random()*INVITE_ALPHABET.length)];
  return s;
}
function memberDoc(){
  const t = computeMedalTotals();
  return { displayName: cleanName(player.nickname, 20) || "Player", gold: t.gold, silver: t.silver, bronze: t.bronze, score: t.score, updatedAt: Date.now() };
}
async function createGroup(name){
  const fs = fbFirestore();
  if(!fs || !fbUser) throw new Error("signin");
  if(playerGroups().length >= MAX_GROUPS) throw new Error("limit");
  const groupName = cleanName(name, 30) || "My Group";
  const groupRef = fs.collection("groups").doc();
  let code = randomInviteCode();
  for(let tries=0; tries<4; tries++){
    const taken = await fs.collection("groupLookup").doc(code).get();
    if(!taken.exists) break;
    code = randomInviteCode();
  }
  await groupRef.set({ name: groupName, ownerUid: fbUser.uid, inviteCode: code, memberUids: [fbUser.uid], createdAt: Date.now() });
  await fs.collection("groupLookup").doc(code).set({ groupId: groupRef.id, ownerUid: fbUser.uid });
  await groupRef.collection("members").doc(fbUser.uid).set(memberDoc());
  const g = { groupId: groupRef.id, name: groupName, inviteCode: code };
  setPlayerGroups(playerGroups().concat([g]));
  return g;
}
async function joinGroupByCode(rawCode){
  const code = normalizeGroupCode(rawCode);
  if(code.length !== 6) throw new Error("format");
  const fs = fbFirestore();
  if(!fs || !fbUser) throw new Error("signin");
  const existing = playerGroups().find(g => g.inviteCode === code);
  if(existing) return existing;
  if(playerGroups().length >= MAX_GROUPS) throw new Error("limit");
  const lookupSnap = await fs.collection("groupLookup").doc(code).get();
  if(!lookupSnap.exists) throw new Error("not-found");
  const { groupId } = lookupSnap.data();
  const groupRef = fs.collection("groups").doc(groupId);
  try{
    await groupRef.update({ memberUids: firebase.firestore.FieldValue.arrayUnion(fbUser.uid) });
  }catch(e){ throw new Error("not-found"); }
  await groupRef.collection("members").doc(fbUser.uid).set(memberDoc());
  let groupName = "Friend Group";
  try{ const gs = await groupRef.get(); if(gs.exists) groupName = gs.data().name || groupName; }catch(e){}
  const g = { groupId, name: groupName, inviteCode: code };
  setPlayerGroups(playerGroups().concat([g]));
  return g;
}
async function leaveGroup(groupId){
  const fs = fbFirestore();
  if(!fs || !fbUser || !groupId) return;
  const groupRef = fs.collection("groups").doc(groupId);
  let data = null;
  try{ const s = await groupRef.get(); if(s.exists) data = s.data(); }catch(e){}
  if(data && data.ownerUid === fbUser.uid && (data.memberUids||[]).length <= 1){
    await deleteGroup(groupId, data).catch(()=>{});
    return;
  }
  await groupRef.collection("members").doc(fbUser.uid).delete().catch(()=>{});
  await groupRef.update({ memberUids: firebase.firestore.FieldValue.arrayRemove(fbUser.uid) }).catch(()=>{});
  dropPlayerGroup(groupId);
}
// Owner only. Member docs go first: the rule that lets the owner delete
// them looks the owner up on the group doc, which must still exist.
async function deleteGroup(groupId, known){
  const fs = fbFirestore();
  if(!fs || !fbUser) return;
  const groupRef = fs.collection("groups").doc(groupId);
  let data = known;
  if(!data){ const s = await groupRef.get(); data = s.exists ? s.data() : null; }
  if(!data || data.ownerUid !== fbUser.uid) throw new Error("not-owner");
  const members = await groupRef.collection("members").get();
  await Promise.all(members.docs.map(d => d.ref.delete().catch(()=>{})));
  if(data.inviteCode) await fs.collection("groupLookup").doc(data.inviteCode).delete().catch(()=>{});
  await groupRef.delete();
  dropPlayerGroup(groupId);
}
async function removeMember(groupId, uid){
  const fs = fbFirestore();
  if(!fs || !fbUser || uid === fbUser.uid) return;
  const groupRef = fs.collection("groups").doc(groupId);
  await groupRef.collection("members").doc(uid).delete();
  await groupRef.update({ memberUids: firebase.firestore.FieldValue.arrayRemove(uid) });
}
// Returns { group, members } or null when the group is gone or this user
// was removed from it (both look like a permission error to the client).
async function fetchGroup(groupId){
  const fs = fbFirestore();
  if(!fs || !groupId) return null;
  try{
    const ref = fs.collection("groups").doc(groupId);
    const gs = await ref.get();
    if(!gs.exists) return null;
    const ms = await ref.collection("members").get();
    const members = ms.docs.map(d => Object.assign({ id:d.id }, d.data()))
      .sort((a,b) => (b.score||0) - (a.score||0) || (b.gold||0) - (a.gold||0));
    return { group: Object.assign({ groupId }, gs.data()), members };
  }catch(e){
    if(e && e.code === "permission-denied") return null;
    throw e;
  }
}

async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
  try{
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }catch(e){ return false; }
}
async function shareInvite(g){
  const text = `Join my Urdu Safar group "${g.name}"!\nOpen Urdu Safar → Leaderboard → Join with a code, and enter: ${g.inviteCode}\n${PLAY_URL}`;
  const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;
  if(plugin){
    try{ await plugin.share({ title: "Urdu Safar group invite", text, dialogTitle: "Share invite code" }); return "shared"; }
    catch(e){ if(/cancel/i.test((e && e.message) || "")) return "cancelled"; }
  }
  if(navigator.share){
    try{ await navigator.share({ title: "Urdu Safar group invite", text }); return "shared"; }catch(e){}
  }
  return (await copyText(text)) ? "copied" : "failed";
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
  upsertLocalLeaderboard({
    id: player.id, nickname: player.nickname,
    gold: totals.gold, silver: totals.silver, bronze: totals.bronze, score: totals.score,
    updatedAt: Date.now()
  });
  if(!fbUser) return;
  const fs = fbFirestore();
  if(!fs) return;
  fs.collection("users").doc(fbUser.uid).set({ displayName: player.nickname }, { merge:true }).catch(()=>{});
  const doc = memberDoc();
  playerGroups().forEach(g=>{
    fs.collection("groups").doc(g.groupId).collection("members").doc(fbUser.uid).set(doc).catch(()=>{});
  });
}

// Invite codes are typed by hand, so be forgiving about case/punctuation.
function normalizeGroupCode(raw){
  return (raw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

/* ======================================================================
   STATE + ROUTER
   ====================================================================== */
let route = { view:"home" };
const app = document.getElementById("app");

/* Android back button: each screen gets a browser-history entry, and the
   backButton listener below walks that history (closing the app from home).
   Tab/level switches on the same screen replace the entry, and forms you
   leave on success (sign-in, create/join group) are replaced too, so Back
   never lands on a stale form. Navigating to a screen that is already further
   down the history (Home, the in-app back links, Leaderboard after deleting a
   group) rewinds to it instead of stacking a duplicate. If the History API is
   unavailable (some sandboxed web frames), navigation just renders in place. */
const NAV_REPLACE_FROM = ["signin", "signup", "forgot", "groupCreate", "groupJoin"];
let navStack = [route], pendingNav = null, historyOk = true;
function hist(fn){
  if(!historyOk) return false;
  try { fn(); return true; } catch(e){ historyOk = false; return false; }
}
function sameScreen(a, b){
  return a.view === b.view && ["topicId","skillId","groupId","mode"].every(k => (a[k]||"") === (b[k]||""));
}
function showRoute(next){ route = next; render(); window.scrollTo({top:0}); }
function go(next){
  const cur = navStack.length - 1;
  for(let i = cur - 1; i >= 0; i--){
    if(sameScreen(navStack[i], next)){
      pendingNav = { next, idx: i };
      if(hist(() => history.go(i - cur))) return;
      pendingNav = null;
      break;
    }
  }
  if(sameScreen(route, next) || NAV_REPLACE_FROM.includes(route.view)){
    navStack[cur] = next;
    hist(() => history.replaceState({ r: next, d: cur }, ""));
  } else {
    navStack.push(next);
    hist(() => history.pushState({ r: next, d: cur + 1 }, ""));
  }
  showRoute(next);
}
window.addEventListener("popstate", e => {
  if(pendingNav){
    const { next, idx } = pendingNav; pendingNav = null;
    navStack.length = idx + 1; navStack[idx] = next;
    hist(() => history.replaceState({ r: next, d: idx }, ""));
    showRoute(next);
    return;
  }
  const s = e.state || { r: { view:"home" }, d: 0 };
  navStack.length = Math.min(navStack.length, s.d + 1);
  navStack[s.d] = s.r;
  showRoute(s.r);
});
// The plugin's built-in handler does nothing once history runs out, so take
// over: step back while there is history, close the app from home.
(function(){
  const AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if(!AppPlugin || !AppPlugin.addListener) return;
  AppPlugin.addListener("backButton", ({ canGoBack }) => {
    if(canGoBack) history.back(); else AppPlugin.exitApp();
  });
})();

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
   WELCOME — start as a guest (nickname only) or use an account
   ====================================================================== */
function brandHtml(){
  return `
    <div class="topbar">
      <div class="brand"><span class="en display">Urdu Safar</span><span class="ur-mark ur">سفر</span></div>
      <div class="tagline">O&nbsp;Level&nbsp;&amp;&nbsp;IGCSE&nbsp;Urdu&nbsp;Practice</div>
    </div>`;
}
function renderSignup(){
  app.innerHTML = `
    ${brandHtml()}
    <div class="card signup-card">
      <div class="rule-title">Welcome! What should we call you?</div>
      <p class="rule-explain">Pick a nickname and start practising straight away. No email or password needed — your progress stays on this device.</p>
      <input type="text" id="nickInput" class="nick-input" placeholder="Your nickname" maxlength="20" autocomplete="off" />
      <div class="btn-row"><button class="btn primary" id="startBtn" disabled>Start as guest</button></div>
    </div>
    <div class="card signup-card">
      <div class="rule-title" style="font-size:15px;">Want to compete with friends?</div>
      <p class="rule-explain">An account lets you create or join friend groups and compare medals across devices. You can also add one later from the Leaderboard.</p>
      <div class="btn-row">
        <button class="btn" id="welcomeSignIn">Sign in</button>
        <button class="btn" id="welcomeSignUp">Create account</button>
      </div>
    </div>
  `;
  const input = document.getElementById("nickInput");
  const btn = document.getElementById("startBtn");
  input.addEventListener("input", ()=>{ btn.disabled = cleanName(input.value, 20).length < 2; });
  input.addEventListener("keydown", e=>{ if(e.key === "Enter" && !btn.disabled) btn.click(); });
  btn.addEventListener("click", ()=>{
    const nickname = cleanName(input.value, 20);
    if(nickname.length < 2) return;
    player = { id: newPlayerId(), nickname, groups: [] };
    savePlayer(player);
    refreshPlayerLeaderboardEntry();
    go({ view:"home" });
  });
  document.getElementById("welcomeSignIn").addEventListener("click", ()=> go({ view:"signin", next:{ view:"home" } }));
  document.getElementById("welcomeSignUp").addEventListener("click", ()=> go({ view:"signup", next:{ view:"home" } }));
}

/* ======================================================================
   SIGN IN / CREATE ACCOUNT / FORGOT PASSWORD
   ====================================================================== */
function authErrorText(e, mode){
  const code = (e && e.code) || "";
  if(e && e.message === "offline") return "Can't reach the sign-in service — check your internet connection.";
  if(code === "auth/email-already-in-use") return "That email already has an account — try signing in instead.";
  if(code === "auth/invalid-email") return "That doesn't look like a valid email address.";
  if(code === "auth/weak-password") return "Choose a stronger password (at least 6 characters).";
  if(code === "auth/too-many-requests") return "Too many attempts — wait a few minutes and try again.";
  if(code === "auth/network-request-failed") return "No internet connection — try again when you're online.";
  if(mode === "signin") return "Couldn't sign in — check your email and password.";
  return "Something went wrong — check your connection and try again.";
}
function renderAuth(mode){
  const next = route.next || { view:"leaderboard" };
  const back = player ? { view:"leaderboard" } : { view:"home" };
  const title = mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in";
  const ur = mode === "signup" ? "نیا اکاؤنٹ" : mode === "forgot" ? "پاس ورڈ ری سیٹ" : "سائن اِن";
  let form = "";
  if(mode === "signup"){
    form = `
      <label class="field-label" for="fName">Display name <span class="hint">(shown to your group)</span></label>
      <input type="text" id="fName" class="nick-input" maxlength="20" autocomplete="nickname" value="${escapeHtml(player ? player.nickname : "")}" />
      <label class="field-label" for="fEmail">Email</label>
      <input type="email" id="fEmail" class="nick-input" autocomplete="email" />
      <label class="field-label" for="fPass">Password <span class="hint">(6+ characters)</span></label>
      <input type="password" id="fPass" class="nick-input" autocomplete="new-password" />
      <label class="field-label" for="fPass2">Confirm password</label>
      <input type="password" id="fPass2" class="nick-input" autocomplete="new-password" />
      <p class="rule-explain small">By creating an account you agree to the <a href="https://safar.homilabs.org/terms-and-conditions.html" target="_blank" rel="noopener">Terms</a> and <a href="https://safar.homilabs.org/privacy-policy.html" target="_blank" rel="noopener">Privacy Policy</a>. Your practice progress on this device is kept.</p>
      <div class="btn-row"><button class="btn primary" id="submitBtn">Create account</button></div>
      <p class="auth-switch">Already have an account? <button class="link-btn" id="toSignIn">Sign in</button></p>`;
  } else if(mode === "forgot"){
    form = `
      <p class="rule-explain">Enter the email you signed up with and we'll send you a link to choose a new password.</p>
      <label class="field-label" for="fEmail">Email</label>
      <input type="email" id="fEmail" class="nick-input" autocomplete="email" />
      <div class="btn-row"><button class="btn primary" id="submitBtn">Send reset link</button></div>
      <p class="auth-switch"><button class="link-btn" id="toSignIn">Back to sign in</button></p>`;
  } else {
    form = `
      <label class="field-label" for="fEmail">Email</label>
      <input type="email" id="fEmail" class="nick-input" autocomplete="email" />
      <label class="field-label" for="fPass">Password</label>
      <input type="password" id="fPass" class="nick-input" autocomplete="current-password" />
      <p class="auth-switch" style="text-align:right;margin-top:6px;"><button class="link-btn" id="toForgot">Forgot password?</button></p>
      <div class="btn-row"><button class="btn primary" id="submitBtn">Sign in</button></div>
      <p class="auth-switch">New here? <button class="link-btn" id="toSignUp">Create an account</button></p>`;
  }
  app.innerHTML = `
    <div class="back-row"><button class="back-btn" id="backBtn">&larr; Back</button></div>
    <div class="topic-head"><span class="ur-title ur">${ur}</span><span class="en-title">${title}</span></div>
    <div class="card auth-card">
      ${form}
      <p class="form-msg" id="formMsg" role="alert"></p>
    </div>
  `;
  const msg = document.getElementById("formMsg");
  const say = (text, good)=>{ msg.textContent = text; msg.className = "form-msg " + (good ? "good" : "bad"); };
  document.getElementById("backBtn").addEventListener("click", ()=> go(back));
  const sw = (id, view)=>{ const el = document.getElementById(id); if(el) el.addEventListener("click", ()=> go({ view, next })); };
  sw("toSignIn", "signin"); sw("toSignUp", "signup"); sw("toForgot", "forgot");
  const submit = document.getElementById("submitBtn");
  const val = id => { const el = document.getElementById(id); return el ? el.value : ""; };
  const run = async ()=>{
    const email = val("fEmail").trim();
    if(!email){ say("Enter your email address."); return; }
    if(mode === "signup"){
      const name = cleanName(val("fName"), 20);
      const p1 = val("fPass"), p2 = val("fPass2");
      if(name.length < 2){ say("Choose a display name of at least 2 characters."); return; }
      if(p1.length < 6){ say("Your password needs at least 6 characters."); return; }
      if(p1 !== p2){ say("The two passwords don't match."); return; }
      submit.disabled = true; say("Creating your account…", true);
      try{ await signUp(email, p1, name); go(next); }
      catch(e){ submit.disabled = false; say(authErrorText(e, mode)); }
    } else if(mode === "forgot"){
      submit.disabled = true;
      try{ await sendReset(email); }catch(e){ if(e && e.code === "auth/invalid-email"){ submit.disabled = false; say(authErrorText(e, mode)); return; } }
      // Same message whether or not the account exists, so the form can't
      // be used to discover which emails are registered.
      say("If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).", true);
    } else {
      const pass = val("fPass");
      if(!pass){ say("Enter your password."); return; }
      submit.disabled = true; say("Signing in…", true);
      try{ await logIn(email, pass); go(next); }
      catch(e){ submit.disabled = false; say(authErrorText(e, mode)); }
    }
  };
  submit.addEventListener("click", run);
  app.querySelectorAll(".auth-card input").forEach(el => el.addEventListener("keydown", e=>{ if(e.key === "Enter") run(); }));
}

/* ======================================================================
   ACCOUNT — display name, log out, delete account
   ====================================================================== */
function renderAccount(){
  if(!fbUser){ go({ view:"signin", next:{ view:"account" } }); return; }
  app.innerHTML = `
    <div class="back-row"><button class="back-btn" id="backBtn">&larr; Leaderboard</button></div>
    <div class="topic-head"><span class="ur-title ur">اکاؤنٹ</span><span class="en-title">Account</span></div>
    <div class="card">
      <p class="rule-explain">Signed in as <strong>${escapeHtml(fbUser.email)}</strong></p>
      <label class="field-label" for="fName">Display name <span class="hint">(shown to your groups)</span></label>
      <input type="text" id="fName" class="nick-input" maxlength="20" value="${escapeHtml(player.nickname)}" />
      <div class="btn-row"><button class="btn" id="saveNameBtn">Save name</button><button class="btn" id="logoutBtn">Log out</button></div>
      <p class="form-msg" id="formMsg" role="alert"></p>
    </div>
    <div class="card">
      <div class="rule-title" style="font-size:15px;margin-bottom:6px;">Delete account</div>
      <p class="rule-explain" style="margin-bottom:10px;">Permanently deletes your account, removes you from every group, and erases the scores synced to it. Practice progress on this device is not affected. This can't be undone.</p>
      <div class="btn-row"><button class="btn danger" id="deleteAcctBtn">Delete my account</button></div>
    </div>
  `;
  const msg = document.getElementById("formMsg");
  document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"leaderboard" }));
  document.getElementById("saveNameBtn").addEventListener("click", ()=>{
    const ok = updateDisplayName(document.getElementById("fName").value);
    msg.textContent = ok ? "Saved — your groups will see the new name." : "Use at least 2 characters.";
    msg.className = "form-msg " + (ok ? "good" : "bad");
  });
  document.getElementById("logoutBtn").addEventListener("click", async ()=>{ await logOut(); go({ view:"leaderboard" }); });
  document.getElementById("deleteAcctBtn").addEventListener("click", async ()=>{
    if(!window.confirm("Delete your account and all its synced data? This can't be undone.")) return;
    const password = window.prompt("Re-enter your password to confirm:");
    if(!password) return;
    const btn = document.getElementById("deleteAcctBtn");
    btn.disabled = true; btn.textContent = "Deleting… please wait";
    try{
      await deleteAccountEverywhere(password);
      window.alert("Your account has been deleted.");
      go({ view:"leaderboard" });
    }catch(e){
      btn.disabled = false; btn.textContent = "Delete my account";
      window.alert("Couldn't delete the account — check the password and your connection, then try again.");
    }
  });
}

/* ======================================================================
   LEADERBOARD — your groups (signed in) + this device's board
   ====================================================================== */
function lbRowHtml(r, i, opts){
  const me = player && r.id === player.id;
  const name = escapeHtml(r.nickname || r.displayName || "Player");
  const tags = (opts && opts.ownerUid === r.id) ? ` <span class="owner-tag">owner</span>` : "";
  const remove = (opts && opts.canRemove && !me) ? `<button class="link-btn danger-link" data-remove="${escapeHtml(r.id)}" data-name="${name}">remove</button>` : "";
  return `
    <div class="lb-row ${me ? 'me' : ''}">
      <span class="lb-rank">${i+1}</span>
      <span class="lb-name">${name}${me ? ' (you)' : ''}${tags}</span>
      <span class="lb-medals">🥇${r.gold||0}&nbsp;🥈${r.silver||0}&nbsp;🥉${r.bronze||0}</span>
      ${remove}
    </div>`;
}
function renderLeaderboard(){
  const signedIn = !!fbUser;
  const groups = signedIn ? playerGroups() : [];
  const full = groups.length >= MAX_GROUPS;
  app.innerHTML = `
    <div class="back-row"><button class="back-btn" id="backHome">&larr; Home</button></div>
    <div class="topic-head">
      <span class="ur-title ur">اسکور بورڈ</span>
      <span class="en-title">Leaderboard</span>
    </div>
    ${signedIn ? `
      <div class="account-chip-row"><button class="btn chip" id="goAccount">👤 ${escapeHtml(player.nickname)} · Account</button></div>
      <div class="card group-card">
        <div class="rule-title" style="font-size:15px;margin-bottom:6px;">My groups <span class="hint">(${groups.length}/${MAX_GROUPS})</span></div>
        ${groups.length ? `<div class="group-list">${groups.map(g=>`
          <button class="group-row" data-group="${escapeHtml(g.groupId)}">
            <span class="group-name">👥 ${escapeHtml(g.name)}</span>
            <span class="group-rank" data-rank="${escapeHtml(g.groupId)}">…</span>
            <span class="chev">›</span>
          </button>`).join("")}</div>`
        : `<p class="rule-explain">No groups yet. Create one for your class or friends and share the invite code, or join with a code someone sent you.</p>`}
        <div class="btn-row">
          <button class="btn primary" id="createGroupBtn" ${full ? "disabled" : ""}>Create a group</button>
          <button class="btn" id="joinGroupBtn" ${full ? "disabled" : ""}>Join with a code</button>
        </div>
        ${full ? `<p class="rule-explain small">You're in the maximum of ${MAX_GROUPS} groups — leave one to join another.</p>` : ""}
      </div>
    ` : `
      <div class="card group-card">
        <div class="rule-title" style="font-size:15px;margin-bottom:6px;">Compete with friends</div>
        <p class="rule-explain" style="margin-bottom:10px;">Sign in to create or join friend groups — group leaderboards sync across everyone's phones. Practice never requires an account.</p>
        <div class="btn-row">
          <button class="btn primary" id="goSignIn">Sign in</button>
          <button class="btn" id="goSignUp">Create account</button>
        </div>
      </div>
    `}
    <div id="lbHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home" }));
  const on = (id, fn)=>{ const el = document.getElementById(id); if(el) el.addEventListener("click", fn); };
  on("goAccount", ()=> go({ view:"account" }));
  on("goSignIn", ()=> go({ view:"signin", next:{ view:"leaderboard" } }));
  on("goSignUp", ()=> go({ view:"signup", next:{ view:"leaderboard" } }));
  on("createGroupBtn", ()=> go({ view:"groupCreate" }));
  on("joinGroupBtn", ()=> go({ view:"groupJoin" }));
  app.querySelectorAll("[data-group]").forEach(el => el.addEventListener("click", ()=> go({ view:"group", groupId: el.dataset.group })));

  const local = loadLocalLeaderboard().slice().sort((a,b)=> (b.score||0) - (a.score||0));
  document.getElementById("lbHost").innerHTML = `
    <div class="card">
      <div class="rule-title" style="font-size:15px;margin-bottom:6px;">On this device</div>
      <p class="rule-explain">Everyone who has practised with Urdu Safar on this phone.</p>
      ${local.length ? local.map((r,i)=> lbRowHtml(r, i)).join("") : `<p class="rule-explain">No medals earned yet — finish a quiz to appear here.</p>`}
    </div>`;

  // Fill in "your rank" for each group in the background.
  groups.forEach(async g=>{
    const el = app.querySelector(`[data-rank="${CSS.escape(g.groupId)}"]`);
    try{
      const res = await fetchGroup(g.groupId);
      if(!el || !el.isConnected) return;
      if(!res){ el.textContent = "no longer available"; return; }
      const members = res.members.filter(m => (res.group.memberUids||[]).includes(m.id));
      const rank = members.findIndex(m => m.id === player.id) + 1;
      el.textContent = rank ? `#${rank} of ${members.length}` : `${members.length} members`;
    }catch(e){ if(el && el.isConnected) el.textContent = "offline"; }
  });
}

/* ======================================================================
   GROUP PAGE — invite code, ranked members, leave / remove / delete
   ====================================================================== */
function renderGroup(){
  const groupId = route.groupId;
  const known = playerGroups().find(g => g.groupId === groupId);
  if(!fbUser || !known){ go({ view:"leaderboard" }); return; }
  app.innerHTML = `
    <div class="back-row"><button class="back-btn" id="backBtn">&larr; Leaderboard</button></div>
    <div class="topic-head"><span class="ur-title ur">گروپ</span><span class="en-title">${escapeHtml(known.name)}</span></div>
    ${route.fresh ? `<div class="card notice good">🎉 Group created! Share the invite code below so friends can join.</div>` : ""}
    <div class="card invite-card">
      <div class="rule-title" style="font-size:15px;">Invite code</div>
      <div class="invite-code" id="inviteCode">${escapeHtml(known.inviteCode)}</div>
      <p class="rule-explain small">Friends open Urdu Safar → Leaderboard → Join with a code.</p>
      <div class="btn-row">
        <button class="btn" id="copyBtn">Copy code</button>
        <button class="btn primary" id="shareBtn">Share invite</button>
      </div>
      <p class="form-msg" id="shareMsg" role="status"></p>
    </div>
    <div id="memberHost"><div class="card"><p class="rule-explain">Loading members…</p></div></div>
  `;
  document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"leaderboard" }));
  const shareMsg = document.getElementById("shareMsg");
  document.getElementById("copyBtn").addEventListener("click", async ()=>{
    const ok = await copyText(known.inviteCode);
    shareMsg.textContent = ok ? "Code copied." : "Couldn't copy — read the code out instead.";
    shareMsg.className = "form-msg " + (ok ? "good" : "bad");
  });
  document.getElementById("shareBtn").addEventListener("click", async ()=>{
    const r = await shareInvite(known);
    if(r === "copied"){ shareMsg.textContent = "Invite message copied — paste it into WhatsApp or SMS."; shareMsg.className = "form-msg good"; }
    else if(r === "failed"){ shareMsg.textContent = "Sharing isn't available — use Copy code instead."; shareMsg.className = "form-msg bad"; }
  });
  drawGroupMembers(groupId, known);
}
async function drawGroupMembers(groupId, known){
  const host = document.getElementById("memberHost");
  let res;
  try{ res = await fetchGroup(groupId); }
  catch(e){
    if(host.isConnected) host.innerHTML = `<div class="card"><p class="rule-explain">Couldn't load the group — check your internet connection.</p><div class="btn-row"><button class="btn" id="retryBtn">Try again</button></div></div>`;
    const rb = document.getElementById("retryBtn");
    if(rb) rb.addEventListener("click", ()=> drawGroupMembers(groupId, known));
    return;
  }
  if(!host.isConnected) return;
  if(!res){
    dropPlayerGroup(groupId);
    host.innerHTML = `<div class="card"><p class="rule-explain">This group is no longer available — it was deleted, or the owner removed you. It's been taken off your list.</p><div class="btn-row"><button class="btn primary" id="okBtn">OK</button></div></div>`;
    document.getElementById("okBtn").addEventListener("click", ()=> go({ view:"leaderboard" }));
    return;
  }
  const { group } = res;
  if(group.name && group.name !== known.name){
    setPlayerGroups(playerGroups().map(g => g.groupId === groupId ? Object.assign({}, g, { name: group.name }) : g));
  }
  const isOwner = group.ownerUid === fbUser.uid;
  const members = res.members.filter(m => (group.memberUids||[]).includes(m.id));
  host.innerHTML = `
    <div class="card">
      <div class="rule-title" style="font-size:15px;margin-bottom:6px;">Members <span class="hint">(${members.length})</span></div>
      ${members.map((m,i)=> lbRowHtml(m, i, { ownerUid: group.ownerUid, canRemove: isOwner })).join("")}
      <div class="btn-row"><button class="btn" id="refreshBtn">Refresh</button></div>
    </div>
    <div class="card">
      <div class="btn-row">
        <button class="btn" id="leaveBtn">Leave group</button>
        ${isOwner ? `<button class="btn danger" id="deleteGroupBtn">Delete group</button>` : ""}
      </div>
      ${isOwner ? `<p class="rule-explain small">You're the owner: you can remove members, or delete the group for everyone.</p>` : ""}
    </div>
  `;
  document.getElementById("refreshBtn").addEventListener("click", ()=> drawGroupMembers(groupId, known));
  document.getElementById("leaveBtn").addEventListener("click", async ()=>{
    const msg = isOwner && members.length > 1
      ? `Leave "${group.name}"? You're the owner — the group will carry on without an owner, so nobody will be able to remove members. To close it instead, use Delete group.`
      : `Leave "${group.name}"?`;
    if(!window.confirm(msg)) return;
    const lb = document.getElementById("leaveBtn"); lb.disabled = true; lb.textContent = "Leaving…";
    await leaveGroup(groupId);
    go({ view:"leaderboard" });
  });
  const del = document.getElementById("deleteGroupBtn");
  if(del) del.addEventListener("click", async ()=>{
    if(!window.confirm(`Delete "${group.name}" for everyone? Members' scores in this group will be removed. This can't be undone.`)) return;
    del.disabled = true; del.textContent = "Deleting…";
    try{ await deleteGroup(groupId); go({ view:"leaderboard" }); }
    catch(e){ del.disabled = false; del.textContent = "Delete group"; window.alert("Couldn't delete the group — check your connection and try again."); }
  });
  host.querySelectorAll("[data-remove]").forEach(btn => btn.addEventListener("click", async ()=>{
    if(!window.confirm(`Remove ${btn.dataset.name} from the group?`)) return;
    btn.disabled = true; btn.textContent = "removing…";
    try{ await removeMember(groupId, btn.dataset.remove); drawGroupMembers(groupId, known); }
    catch(e){ window.alert("Couldn't remove the member — check your connection and try again."); }
  }));
}

function renderGroupForm(mode){
  if(!fbUser){ go({ view:"signin", next:{ view: mode === "create" ? "groupCreate" : "groupJoin" } }); return; }
  const create = mode === "create";
  app.innerHTML = `
    <div class="back-row"><button class="back-btn" id="backBtn">&larr; Leaderboard</button></div>
    <div class="topic-head"><span class="ur-title ur">${create ? "نیا گروپ" : "گروپ میں شامل ہوں"}</span><span class="en-title">${create ? "Create a group" : "Join a group"}</span></div>
    <div class="card auth-card">
      ${create ? `
        <label class="field-label" for="fGroup">Group name <span class="hint">(members will see this)</span></label>
        <input type="text" id="fGroup" class="nick-input" maxlength="30" placeholder="e.g. Class 10-B Urdu" autocomplete="off" />
        <p class="rule-explain small">You'll get a 6-letter invite code to share. Groups are private — only people with the code can join, and there's no chat.</p>
        <div class="btn-row"><button class="btn primary" id="submitBtn">Create group</button></div>
      ` : `
        <label class="field-label" for="fCode">Invite code</label>
        <input type="text" id="fCode" class="nick-input invite-input" maxlength="8" placeholder="ABC123" autocomplete="off" autocapitalize="characters" />
        <p class="rule-explain small">Ask the person who created the group for their 6-character code.</p>
        <div class="btn-row"><button class="btn primary" id="submitBtn">Join group</button></div>
      `}
      <p class="form-msg" id="formMsg" role="alert"></p>
    </div>
  `;
  document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"leaderboard" }));
  const msg = document.getElementById("formMsg");
  const say = (t, good)=>{ msg.textContent = t; msg.className = "form-msg " + (good ? "good" : "bad"); };
  const input = document.getElementById(create ? "fGroup" : "fCode");
  if(!create) input.addEventListener("input", ()=>{ input.value = normalizeGroupCode(input.value); });
  input.focus();
  const submit = document.getElementById("submitBtn");
  const run = async ()=>{
    submit.disabled = true;
    try{
      if(create){
        const name = cleanName(input.value, 30);
        if(name.length < 2){ submit.disabled = false; say("Give the group a name of at least 2 characters."); return; }
        say("Creating…", true);
        const g = await createGroup(name);
        go({ view:"group", groupId: g.groupId, fresh: true });
      } else {
        say("Joining…", true);
        const g = await joinGroupByCode(input.value);
        go({ view:"group", groupId: g.groupId });
      }
    }catch(e){
      submit.disabled = false;
      const m = e && e.message;
      say(m === "limit" ? `You're already in ${MAX_GROUPS} groups — leave one first.`
        : m === "not-found" ? "No group has that code — double-check it with your friend."
        : m === "format" ? "Invite codes are 6 letters/numbers."
        : "Couldn't reach the server — check your internet connection.");
    }
  };
  submit.addEventListener("click", run);
  input.addEventListener("keydown", e=>{ if(e.key === "Enter") run(); });
}

function renderHome(){
  const tab = route.homeTab === "skills" ? "skills"
    : route.homeTab === "vocab" ? "vocab"
    : route.homeTab === "reading-skills" ? "reading-skills"
    : route.homeTab === "grammar-lab" ? "grammar-lab"
    : route.homeTab === "translation" ? "translation"
    : route.homeTab === "summary-writing" ? "summary-writing"
    : route.homeTab === "extended-writing" ? "extended-writing"
    : "essays";

  app.innerHTML = `
    <div class="topbar">
      <div class="brand"><span class="en display">Urdu Safar</span><span class="ur-mark ur">سفر</span></div>
      <div class="tagline">O&nbsp;Level&nbsp;&amp;&nbsp;IGCSE&nbsp;Urdu&nbsp;Practice</div>
    </div>

    <div class="player-row">
      <span class="player-name">👤 ${escapeHtml(player.nickname)} <button class="link-btn" id="editNameBtn">edit</button>${fbUser ? (playerGroups().length ? ` · 👥 ${playerGroups().length} group${playerGroups().length>1?'s':''}` : ` · signed in`) : ` · <button class="link-btn" id="homeSignIn">sign in</button>`}</span>
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
      <button class="tab ${tab==='translation'?'active':''}" data-hometab="translation">
        <span>Translation <span class="ur">ترجمہ</span></span>
      </button>
      <button class="tab ${tab==='summary-writing'?'active':''}" data-hometab="summary-writing">
        <span>Summary Writing <span class="ur">خلاصہ نویسی</span></span>
      </button>
      <button class="tab ${tab==='extended-writing'?'active':''}" data-hometab="extended-writing">
        <span>Extended Writing <span class="ur">توسیعی تحریر</span></span>
      </button>
    </div>

    <div id="homeTabHost"></div>

    <footer class="note">Version 1.1 — 37 topics. More practice will be added over time.</footer>
  `;

  app.querySelectorAll("[data-hometab]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"home", homeTab: el.dataset.hometab }));
  });
  document.getElementById("lbBtn").addEventListener("click", ()=> go({ view:"leaderboard", homeTab: tab }));
  document.getElementById("editNameBtn").addEventListener("click", ()=>{
    const nn = window.prompt("Update your nickname:", player.nickname);
    if(nn && updateDisplayName(nn)) render();
  });
  const homeSignIn = document.getElementById("homeSignIn");
  if(homeSignIn) homeSignIn.addEventListener("click", ()=> go({ view:"signin", next:{ view:"home", homeTab: tab } }));

  const host = document.getElementById("homeTabHost");
  if(tab === "essays") drawEssaysGrid(host);
  else if(tab === "vocab") drawVocabPracticeGrid(host);
  else if(tab === "reading-skills") drawReadingSkillsGrid(host);
  else if(tab === "grammar-lab") drawGrammarLabGrid(host);
  else if(tab === "translation") drawTranslationGrid(host);
  else if(tab === "summary-writing") drawSummaryWritingGrid(host);
  else if(tab === "extended-writing") drawExtendedWritingGrid(host);
  else drawSkillsGrid(host);
}

function drawExtendedWritingGrid(host){
  const maxStars = EXTENDED_WRITING.length * 3;
  const stars = EXTENDED_WRITING.reduce((s,t)=> s + ewStars(t.id), 0);
  const msg = EXTENDED_WRITING.length
    ? "A ~200-word composition to a given prompt — the highest-value exercise in the whole qualification. Self-assessed."
    : "More topics are added here over time — this category is still growing.";
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>
    <div class="topic-grid">
      ${EXTENDED_WRITING.map(t=>`
        <div class="topic-card" data-ewtopic="${t.id}">
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(ewStars(t.id), 3)}
        </div>`).join("")}
    </div>
  `;
  host.querySelectorAll("[data-ewtopic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"extendedwriting", topicId: el.dataset.ewtopic }));
  });
}

function drawSummaryWritingGrid(host){
  const maxStars = SUMMARY_WRITING.length * 3;
  const stars = SUMMARY_WRITING.reduce((s,t)=> s + swStars(t.id), 0);
  const msg = SUMMARY_WRITING.length
    ? "Condense a passage to 100 words or fewer, in your own words — self-assessed against a model summary."
    : "More topics are added here over time — this category is still growing.";
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>
    <div class="topic-grid">
      ${SUMMARY_WRITING.map(t=>`
        <div class="topic-card" data-swtopic="${t.id}">
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(swStars(t.id), 3)}
        </div>`).join("")}
    </div>
  `;
  host.querySelectorAll("[data-swtopic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"summarywriting", topicId: el.dataset.swtopic }));
  });
}

function drawTranslationGrid(host){
  const maxStars = TRANSLATION.length * 6;
  const stars = TRANSLATION.reduce((s,t)=> s + ["warmup","passage"].reduce((s2,k)=> s2 + trStars(t.id,k), 0), 0);
  const msg = TRANSLATION.length
    ? "English to Urdu — sentence warm-ups, then a full passage matching Paper 2's translation exercise."
    : "More topics are added here over time — this category is still growing.";
  host.innerHTML = `
    <div class="overall">
      <div class="overall-stat"><span class="num">${stars}/${maxStars}</span><span class="lab">Stars</span></div>
      <div class="overall-div"></div>
      <div class="overall-msg">${msg}</div>
    </div>
    <div class="topic-grid">
      ${TRANSLATION.map(t=>{
        const total = ["warmup","passage"].reduce((s,k)=> s + trStars(t.id,k), 0);
        return `
        <div class="topic-card" data-trtopic="${t.id}">
          <div class="ur-title ur">${t.ur}</div>
          <div class="en-title">${t.en}</div>
          ${starsHtml(total, 6)}
        </div>`;
      }).join("")}
    </div>
  `;
  host.querySelectorAll("[data-trtopic]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"translation", topicId: el.dataset.trtopic, mode:"hub" }));
  });
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
    // Exam format (3248 Paper 2, Ex.1): a half-written second sentence with
    // a gap — the student supplies only the missing words.
    const stem = item.stem ? item.stem.replace("____", `<span class="stem-gap" id="stemGap">______</span>`) : "";
    host.innerHTML = `
      ${dotsHtml(total, ti)}
      <div class="card">
        <div class="qmeta"><span>Sentence ${ti+1} of ${items.length}</span><span>${item.stem ? "Complete the sentence" : "Transformation"}</span></div>
        ${cfg.hint ? `<div class="translation-hint" style="direction:ltr;">Hint: ${topic.grammarPoint.en}</div>` : ''}
        <div class="translation-hint">"${item.en}"</div>
        <div class="prompt-ur ur">${item.original}</div>
        <div class="translation-hint ur" style="font-size:15px;font-weight:600;color:var(--ink);direction:rtl;">${item.instruction_ur} <bdi dir="ltr" style="color:var(--ink-soft);font-weight:400;font-family:'Karla',sans-serif;font-size:13px;">(${item.instruction_en})</bdi></div>
        ${item.stem ? `<div class="prompt-ur ur stem-line">${stem}</div>` : ''}
        <input type="text" id="tInput" class="nick-input ur" dir="rtl" placeholder="${item.stem ? 'خالی جگہ کے الفاظ لکھیں...' : 'اپنا جواب یہاں لکھیں...'}" autocomplete="off" />
        <div class="btn-row"><button class="btn primary" id="checkBtn">Check</button></div>
        <div id="fb"></div>
      </div>
    `;
    const input = document.getElementById("tInput");
    input.focus();
    const check = ()=>{
      // A gap answer is a word or two, so the lenient substring match used for
      // free rewrites would accept far too much — require an exact match.
      const ok = item.stem
        ? item.answers.some(a => normalizeAnswer(a) === normalizeAnswer(input.value))
        : isShortAnswerCorrect(input.value, item.answers);
      if(ok) correct++;
      input.disabled = true;
      document.getElementById("checkBtn").disabled = true;
      const gap = document.getElementById("stemGap");
      if(gap){ gap.textContent = item.answers[0]; gap.classList.add(ok ? "good" : "bad"); }
      document.getElementById("fb").innerHTML = `<div class="feedback ${ok?'good':'bad'}">${ok?'Correct!':'Accepted answer: '+item.answers[0]}</div>`;
      setTimeout(()=>{ ti++; drawQ(); }, item.stem ? 1800 : 1200);
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
   TRANSLATION VIEW
   Matches 3248 Paper 2, Ex.4. Piloted on one topic, per the locked
   build order — see docs/new-categories-design-3248.md. No difficulty
   levels: the warm-up/full-passage split already provides the easy-to-
   hard progression.
   ====================================================================== */
function renderTranslation(){
  const topic = TRANSLATION.find(t=>t.id===route.topicId);
  const mode = route.mode || "hub";
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Translation</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    <div id="trHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"translation" }));
  const host = document.getElementById("trHost");
  if(mode === "warmup") runTranslationWarmup(host, topic);
  else if(mode === "passage") runTranslationPassage(host, topic);
  else drawTranslationHub(host, topic);
}

function drawTranslationHub(host, topic){
  host.innerHTML = `
    <div class="topic-grid">
      <div class="topic-card" data-trmode="warmup">
        <div class="vp-card-title">Sentence Practice</div>
        <div class="vp-card-desc">${topic.warmup.length} sentences — build the Urdu translation from a word bank</div>
        ${starsHtml(trStars(topic.id,"warmup"), 3)}
      </div>
      <div class="topic-card" data-trmode="passage">
        <div class="vp-card-title">Passage Translation</div>
        <div class="vp-card-desc">Self-assessed — translate a full passage, then compare to a model answer</div>
        ${starsHtml(trStars(topic.id,"passage"), 3)}
      </div>
    </div>
  `;
  host.querySelectorAll("[data-trmode]").forEach(el=>{
    el.addEventListener("click", ()=> go({ view:"translation", topicId: topic.id, mode: el.dataset.trmode }));
  });
}

function runTranslationWarmup(host, topic){
  const items = topic.warmup;
  let ii = 0, correct = 0;

  function drawItem(){
    if(ii >= items.length){
      setTrResult(topic.id, "warmup", correct, items.length);
      const stars = trStars(topic.id, "warmup");
      const line = stars===3 ? "Excellent work!" : stars===2 ? "Good progress." : stars===1 ? "Keep practising." : "Try again — it will get easier.";
      host.innerHTML = `
        <div class="card summary">
          <div class="big-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
          <h2>${correct} / ${items.length} correct</h2>
          ${medalHtml(stars)}
          <p>${line}</p>
          <div class="btn-row">
            <button class="btn" id="retryBtn">Try again</button>
            <button class="btn primary" id="backBtn">Back</button>
          </div>
        </div>
      `;
      document.getElementById("retryBtn").addEventListener("click", ()=> runTranslationWarmup(host, topic));
      document.getElementById("backBtn").addEventListener("click", ()=> go({ view:"translation", topicId:topic.id, mode:"hub" }));
      return;
    }
    const item = items[ii];
    const bank = item.bank.map((w,idx)=>({word:w, idx, used:false}));
    let placed = [];

    function draw(){
      host.innerHTML = `
        ${dotsHtml(items.length, ii)}
        <div class="card">
          <div class="qmeta"><span>Translate into Urdu</span><span>${ii+1} / ${items.length}</span></div>
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
        setTimeout(()=>{ ii++; drawItem(); }, 1200);
      });
    }
    draw();
  }

  drawItem();
}

function runTranslationPassage(host, topic){
  const { en, modelUr, checklist } = topic.passage;
  function drawWriting(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Translate this passage into Urdu</div>
        <div class="passage" style="direction:ltr;text-align:left;font-size:17px;">${en}</div>
      </div>
      <div class="card">
        <div class="rule-title">Your translation</div>
        <textarea class="creative-ta" dir="rtl" id="trInput" placeholder="اپنا ترجمہ یہاں لکھیں..." style="min-height:160px;"></textarea>
        <div class="btn-row"><button class="btn primary" id="compareBtn">Compare with model translation</button></div>
      </div>
    `;
    document.getElementById("compareBtn").addEventListener("click", drawCompare);
  }

  function drawCompare(){
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Model translation</div>
        <div class="ur sample-text">${modelUr}</div>
      </div>
      <div class="card">
        <div class="rule-title">Self-check</div>
        <ul class="checklist">${checklist.map(c=>`<li class="ur" style="direction:rtl;text-align:right;">${c}</li>`).join("")}</ul>
        <p class="rule-explain">Rate your own attempt honestly — translation quality isn't something the app can auto-grade.</p>
        <div class="btn-row">
          <button class="btn" data-rate="1">Needs work</button>
          <button class="btn" data-rate="2">Good</button>
          <button class="btn primary" data-rate="3">Excellent</button>
        </div>
      </div>
    `;
    host.querySelectorAll("[data-rate]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setTrSelfRating(topic.id, "passage", Number(btn.dataset.rate));
        go({ view:"translation", topicId:topic.id, mode:"hub" });
      });
    });
  }

  drawWriting();
}

/* ======================================================================
   SUMMARY WRITING VIEW
   Matches 3248 Paper 1, Ex.4. Piloted on one topic, per the locked
   build order — see docs/new-categories-design-3248.md. Only one
   exercise shape (unlike Reading Skills/Translation), so no hub screen
   — goes straight into the write -> compare -> self-rate flow.
   ====================================================================== */
function renderSummaryWriting(){
  const topic = SUMMARY_WRITING.find(t=>t.id===route.topicId);
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Summary Writing</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    <div id="swHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"summary-writing" }));
  runSummaryWriting(document.getElementById("swHost"), topic);
}

function runSummaryWriting(host, topic){
  function drawWriting(){
    host.innerHTML = `
      <div class="card">
        <div class="passage-cap">Read the passage</div>
        <div class="passage ur">${topic.passage.replace(/\n/g,"<br><br>")}</div>
      </div>
      <div class="card">
        <div class="rule-title">Your summary</div>
        <p class="rule-explain">In your own words, no more than 100 words.</p>
        <textarea class="creative-ta" dir="rtl" id="swInput" placeholder="اپنا خلاصہ یہاں لکھیں..." style="min-height:120px;"></textarea>
        <div class="btn-row"><button class="btn primary" id="compareBtn">Compare with model summary</button></div>
      </div>
    `;
    document.getElementById("compareBtn").addEventListener("click", drawCompare);
  }

  function drawCompare(){
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Model summary</div>
        <div class="ur sample-text">${topic.modelSummary}</div>
      </div>
      <div class="card">
        <div class="rule-title">Self-check</div>
        <ul class="checklist">${topic.checklist.map(c=>`<li class="ur" style="direction:rtl;text-align:right;">${c}</li>`).join("")}</ul>
        <p class="rule-explain">Rate your own attempt honestly — summarizing well isn't something the app can auto-grade.</p>
        <div class="btn-row">
          <button class="btn" data-rate="1">Needs work</button>
          <button class="btn" data-rate="2">Good</button>
          <button class="btn primary" data-rate="3">Excellent</button>
        </div>
      </div>
    `;
    host.querySelectorAll("[data-rate]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setSwSelfRating(topic.id, Number(btn.dataset.rate));
        go({ view:"home", homeTab:"summary-writing" });
      });
    });
  }

  drawWriting();
}

/* ======================================================================
   EXTENDED WRITING VIEW
   Matches 3248 Paper 2, Ex.3 — the highest-value single exercise in the
   qualification. Piloted on one topic, per the locked build order —
   see docs/new-categories-design-3248.md. Same self-assess pattern as
   Summary Writing/Translation, with the checklist mapped to AO2's W1-W5.
   ====================================================================== */
function renderExtendedWriting(){
  const topic = EXTENDED_WRITING.find(t=>t.id===route.topicId);
  app.innerHTML = `
    <div class="back-row">
      <button class="back-btn" id="backHome">&larr; Extended Writing</button>
    </div>
    <div class="topic-head">
      <span class="ur-title ur">${topic.ur}</span>
      <span class="en-title">${topic.en}</span>
    </div>
    <div id="ewHost"></div>
  `;
  document.getElementById("backHome").addEventListener("click", ()=> go({ view:"home", homeTab:"extended-writing" }));
  runExtendedWriting(document.getElementById("ewHost"), topic);
}

function runExtendedWriting(host, topic){
  const { prompt, modelResponse, checklist } = topic;
  function drawWriting(){
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Writing task</div>
        <div class="prompt-ur ur" style="text-align:right;font-size:19px;">${prompt.ur}</div>
        <div class="prompt-en" style="text-align:left;">${prompt.en}</div>
        ${prompt.points ? `<ul class="task-points ur">${prompt.points.map(p=>`<li>${p}</li>`).join("")}</ul>` : ''}
        <table class="ex" style="margin-top:10px;">
          <tr><td class="gloss">Purpose</td><td class="gloss" style="text-align:right;direction:rtl;">${prompt.purpose}</td></tr>
          <tr><td class="gloss">Format</td><td class="gloss" style="text-align:right;direction:rtl;">${prompt.format}</td></tr>
          <tr><td class="gloss">Audience</td><td class="gloss" style="text-align:right;direction:rtl;">${prompt.audience}</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="rule-title">Your composition</div>
        <p class="rule-explain">About ${prompt.words || 200} words${prompt.points ? ", covering every point above" : ", in continuous prose"}. <span id="ewCount" class="word-count">0 words</span></p>
        <textarea class="creative-ta" dir="rtl" id="ewInput" placeholder="اپنی تحریر یہاں لکھیں..." style="min-height:220px;"></textarea>
        <div class="btn-row"><button class="btn primary" id="compareBtn">Compare with model composition</button></div>
      </div>
    `;
    document.getElementById("compareBtn").addEventListener("click", drawCompare);
    const ta = document.getElementById("ewInput");
    const counter = document.getElementById("ewCount");
    ta.addEventListener("input", ()=>{
      const n = (ta.value.trim().match(/\S+/g) || []).length;
      counter.textContent = `${n} word${n===1?'':'s'}`;
    });
  }

  function drawCompare(){
    host.innerHTML = `
      <div class="card">
        <div class="rule-title">Model ${prompt.format && /email|ای میل|letter|خط/i.test(prompt.format) ? "answer" : "composition"}</div>
        <div class="ur sample-text">${modelResponse.split(/\n{2,}/).map(par=>par.replace(/\n/g,"<br>")).join("<br><br>")}</div>
      </div>
      <div class="card">
        <div class="rule-title">Self-check</div>
        <ul class="checklist">${checklist.map(c=>`<li class="ur" style="direction:rtl;text-align:right;">${c}</li>`).join("")}</ul>
        <p class="rule-explain">Rate your own attempt honestly — a composition's quality isn't something the app can auto-grade.</p>
        <div class="btn-row">
          <button class="btn" data-rate="1">Needs work</button>
          <button class="btn" data-rate="2">Good</button>
          <button class="btn primary" data-rate="3">Excellent</button>
        </div>
      </div>
    `;
    host.querySelectorAll("[data-rate]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setEwSelfRating(topic.id, Number(btn.dataset.rate));
        go({ view:"home", homeTab:"extended-writing" });
      });
    });
  }

  drawWriting();
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
const AUTH_FORMS = ["signin", "signup", "forgot"];
function render(){
  if(AUTH_FORMS.includes(route.view)){ renderAuth(route.view); return; }
  if(!player){ renderSignup(); return; }
  if(route.view === "home") renderHome();
  else if(route.view === "skill") renderSkill();
  else if(route.view === "leaderboard") renderLeaderboard();
  else if(route.view === "account") renderAccount();
  else if(route.view === "group") renderGroup();
  else if(route.view === "groupCreate") renderGroupForm("create");
  else if(route.view === "groupJoin") renderGroupForm("join");
  else if(route.view === "vocabpractice") renderVocabPractice();
  else if(route.view === "readingskills") renderReadingSkills();
  else if(route.view === "grammarlab") renderGrammarLab();
  else if(route.view === "translation") renderTranslation();
  else if(route.view === "summarywriting") renderSummaryWriting();
  else if(route.view === "extendedwriting") renderExtendedWriting();
  else renderTopic();
}

initFirebaseAuthListener();
hist(() => history.replaceState({ r: route, d: 0 }, ""));
render();
})();
