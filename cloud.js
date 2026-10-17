// Firebase: Google login, progress saved in the cloud (so a student can go on from another device)
// and the list of pages the teacher has made visible.
// Talks to script.js through window.book (see "access" in script.js).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCbpLwgIBNQhDj6EZRiNJy-n0rp3kPnVdY',
  authDomain: 'textbook-9601c.firebaseapp.com',
  projectId: 'textbook-9601c',
  storageBucket: 'textbook-9601c.firebasestorage.app',
  messagingSenderId: '354398633560',
  appId: '1:354398633560:web:7446ea659454cfa868942d',
};

// Only these Google accounts get the teacher panel (the same list is in firestore.rules)
const TEACHER_EMAILS = ['paola.fatigato@gmail.com'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const book = window.book;
const OWNER_KEY = book.storageKey + ':owner';
const isDrawing = v => typeof v === 'string' && v.startsWith('data:');

/* ---------- which pages students can see ---------- */

// A saved list is a list of spreads. Up to version 5 a spread was written with its pages, like "142-143",
// and the numbers changed a few times:
//  - version 2: pp. 142–169 moved forward by 2 when "Who am I?" (pp. 142–143) was added
//  - version 3: all the pages were renumbered 2, 3, 4… without gaps (the spreads below, in order, are now 2-3, 4-5, 6-7…)
//  - version 4: pp. 34–39 are the new section "Animals & have" at the end of Owners, so every spread from 34-35 on moved forward by 6
//  - version 5: pp. 56–61 are the new "Daily routine" pages at the end of Present Simple, so every spread from 56-57 on moved forward by 6
//  - version 6: a spread is written with its name (data-id in index.html), so the list no longer changes when pages
//    are added or moved: this is the last conversion. (The chapters were also put in the order of the three school years.)
// A list saved before a change still uses the old numbers: convert it, and drop the spreads that no longer exist.
const PAGES_VERSION = 6;
const V2_SPREADS = [
  '2-3', '4-5', '6-7', '8-9', '10-11', '12-13', '14-15', '16-17', '18-19', '20-21', '22-23', '24-25',
  '26-27', '28-29', '29.1-29.2', '30-31', '32-33', '34-35', '36-37', '38-39', '40-41', '42-43', '44-45',
  '46-47', '48-49', '50-51', '52-53', '54-55', '56-57', '58-59', '60-61', '62-63', '64-65', '66-67', '68-69',
  '70-71', '72-73', '74-75', '76-77', '78-79', '80-81', '82-83', '84-85', '86-87', '88-89', '90-91', '92-93',
  '94-95', '96-97', '98-99', '100-101', '102-103', '104-105', '106-107', '108-109', '110-111', '112-113',
  '114-115', '116-117', '118-119', '120-121', '122-123', '124-125', '126-127', '128-129', '130-131',
  '132-133', '134-135', '136-137', '137.1-137.2', '137.3-137.4', '138-139', '140-141', '142-143', '144-145',
  '146-147', '148-149', '150-151', '152-153', '154-155', '156-157', '158-159', '160-161', '162-163',
  '164-165', '166-167', '168-169', '170-171', '202-203', '204-205', '206-207', '222-223', '224-225',
  '226-227', '228-229', '230-231', '232-233', '242-243', '244-245', '246-247', '248-249', '250-251',
  '252-253', '254-255',
];
const toV2 = k => { const [a, b] = k.split('-').map(Number); return a >= 142 && b <= 169 ? `${a + 2}-${b + 2}` : k; };
const toV3 = k => { const i = V2_SPREADS.indexOf(k); return i < 0 ? null : `${2 + 2 * i}-${3 + 2 * i}`; };
const toV4 = k => { const [a, b] = k.split('-').map(Number); return a >= 34 ? `${a + 6}-${b + 6}` : k; };
const toV5 = k => { const [a, b] = k.split('-').map(Number); return a >= 56 ? `${a + 6}-${b + 6}` : k; };
// the spreads of version 5 in order (2-3, 4-5, 6-7…) → their names
const V5_IDS = [
  'gk-guess', 'gk-star', 'bank-intro', 'bank-catalogue', 'bank-problems', 'bank-email', 'bank-notebook',
  'bank-review', 'tobe-intro', 'tobe-pronouns', 'tobe-rules', 'tobe-test', 'own-adjectives', 'own-saxon',
  'own-mistakes', 'own-circe', 'own-animals-have', 'own-animals-guess', 'own-three-s', 'greek-gods',
  'greek-persephone', 'greek-play', 'greek-acting', 'ps-affirmative', 'ps-negative', 'ps-conversation-game',
  'ps-practice', 'ps-routine-pictures', 'ps-routine-clock', 'ps-routine-linking', 'home-coraline',
  'home-vocab', 'home-prepositions', 'home-missions', 'people-body', 'people-slash-draw', 'people-identikit',
  'people-ladder', 'people-characters', 'meta-intro', 'meta-rule2', 'meta-stroop', 'meta-simile',
  'meta-workshop', 'pers-big5', 'pers-conscientiousness', 'pers-agreeableness', 'pers-test', 'pers-adjectives',
  'pers-villain-words', 'pers-villain-reading', 'pers-villain-mine', 'clothes-vocab', 'clothes-accessories',
  'clothes-wearing', 'clothes-roles', 'clothes-auction', 'clothes-practice1', 'clothes-practice2',
  'alice-reading', 'alice-there-is', 'alice-comparisons', 'alice-yoga', 'alice-society', 'shk-meet',
  'shk-id-card', 'shk-sonnet', 'shk-rhyme-machine', 'shk-rhyme-gym', 'rj-verona', 'rj-fight', 'rj-party',
  'rj-kiss', 'rj-balcony', 'rj-rehearsal', 'jobs-reading', 'jobs-story', 'jobs-vocab', 'jobs-stereotypes',
  'jobs-forehead', 'jobs-career', 'jobs-cv-model', 'jobs-my-cv', 'fut-intro', 'fut-will-teller',
  'fut-will-analysis', 'fut-will-sentences', 'fut-will-dice', 'fut-going-to', 'fut-going-to-questions',
  'fut-present-cont', 'fut-which-rules', 'fut-which-practice', 'fut-which-sort', 'test-pron-a', 'test-pron-b',
  'test-pron-c', 'test-clothes-a1', 'test-clothes-a2', 'test-clothes-b1', 'test-clothes-b2', 'test-clothes-c1',
  'test-clothes-c2', 'exit-persephone1', 'exit-persephone2', 'exit-sonnet1', 'exit-sonnet2', 'jobcards-1',
  'jobcards-2', 'jobcards-3', 'author-meet', 'author-clues', 'author-case', 'af-quiz', 'af-symbolism',
  'af-rules', 'n1984',
];
const toV6 = k => V5_IDS[(Number(k.split('-')[0]) - 2) / 2] || null;

onSnapshot(doc(db, 'config', 'visibility'), snap => {
  const data = snap.exists() ? snap.data() : {};
  const spreads = data.spreads || [];
  const v = data.pagesVersion || 1;
  const v3 = v >= 3 ? spreads : (v >= 2 ? spreads : spreads.map(toV2)).map(toV3).filter(Boolean);
  const v4 = v >= 4 ? v3 : v3.map(toV4);
  const v5 = v >= 5 ? v4 : v4.map(toV5);
  book.setVisible(v >= 6 ? v5 : v5.map(toV6).filter(Boolean));
}, err => console.error('Cannot read the visible pages:', err.code, err.message));

book.onSaveVisible = async spreads => {
  try {
    await setDoc(doc(db, 'config', 'visibility'), { spreads, updated: Date.now(), pagesVersion: PAGES_VERSION });
  } catch (err) {
    console.error('Cannot save the visible pages:', err.code, err.message);
    throw new Error(`${err.code} — check the Firestore rules and that the database exists`);
  }
};

/* ---------- login ---------- */

book.signIn = () => signInWithPopup(auth, new GoogleAuthProvider()).catch(err => {
  if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
    alert('Could not sign in: ' + err.message);
  }
});

book.signOut = async () => {
  await signOut(auth);
  book.forgetLocal(); // the next student on this device starts from a clean book
  localStorage.removeItem(OWNER_KEY);
  location.reload();
};

/* ---------- progress ---------- */

let user = null;
let ready = false;       // the first merge with the cloud is done
let synced = {};         // what the cloud has, to send only what changed
let timer = null;

const progressRef = uid => doc(db, 'progress', uid);
const drawingRef = (uid, key) => doc(db, 'progress', uid, 'drawings', key);

async function pull(uid) {
  const [main, drawings] = await Promise.all([
    getDoc(progressRef(uid)),
    getDocs(collection(db, 'progress', uid, 'drawings')),
  ]);
  const cloud = { ...(main.exists() ? main.data().answers : {}) };
  drawings.forEach(d => { cloud[d.id] = d.data().data; });
  return cloud;
}

async function push() {
  timer = null;
  if (!user || !ready) return;
  const now = book.getSaved();
  const text = {};
  const jobs = [];
  for (const [k, v] of Object.entries(now)) {
    if (isDrawing(v)) {
      if (synced[k] !== v) jobs.push(setDoc(drawingRef(user.uid, k), { data: v }));
    } else if (v !== '' && v != null) text[k] = v;
  }
  // a drawing that was cleared
  for (const k of Object.keys(synced)) {
    if (isDrawing(synced[k]) && !isDrawing(now[k])) jobs.push(deleteDoc(drawingRef(user.uid, k)));
  }
  const canon = o => JSON.stringify(Object.entries(o).filter(([, v]) => !isDrawing(v) && v !== '').sort(([a], [b]) => (a < b ? -1 : 1)));
  const textChanged = canon(text) !== canon(synced);
  if (textChanged) jobs.push(setDoc(progressRef(user.uid), { answers: text, updated: Date.now() }));
  if (!jobs.length) return;
  try {
    await Promise.all(jobs);
    synced = { ...text, ...Object.fromEntries(Object.entries(now).filter(([, v]) => isDrawing(v))) };
    book.setSyncState('ok');
  } catch {
    book.setSyncState('error');
    timer = setTimeout(push, 15000); // try again later (offline, for example)
  }
}

// script.js calls this every time something is saved
book.onSaved = () => {
  if (!user || !ready) return;
  book.setSyncState('saving');
  clearTimeout(timer);
  timer = setTimeout(push, 1000);
};

// "Clear answers" on these pages: send it now, the page reloads right after
book.flush = async () => { if (timer) { clearTimeout(timer); await push(); } };

// leaving the page: send what is left
window.addEventListener('pagehide', () => { if (timer) push(); });

onAuthStateChanged(auth, async u => {
  user = u;
  ready = false;
  book.setUser(u && {
    name: u.displayName || u.email,
    email: u.email,
    teacher: TEACHER_EMAILS.includes(u.email) && u.emailVerified,
  });
  // a print copy only needs to know who is signed in: it never pulls or sends answers
  if (!u || book.printCopy) return;

  book.setSyncState('saving');
  let cloud;
  try { cloud = await pull(u.uid); } catch { book.setSyncState('error'); return; }

  const local = book.getSaved();
  const owner = localStorage.getItem(OWNER_KEY);
  // what is on this device belongs to this student only if nobody else signed in here before
  const mine = !owner || owner === u.uid ? local : {};
  const merged = { ...mine, ...cloud }; // the cloud is newer: it wins
  localStorage.setItem(OWNER_KEY, u.uid);

  const same = Object.keys(merged).length === Object.keys(local).length
    && Object.entries(merged).every(([k, v]) => local[k] === v);
  if (!same) {
    // let the book start again with the merged answers
    book.replaceSaved(merged);
    location.reload();
    return;
  }
  synced = cloud;
  ready = true;
  push(); // answers written before signing in
  book.setSyncState('ok');
});
