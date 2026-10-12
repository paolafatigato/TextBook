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

onSnapshot(doc(db, 'config', 'visibility'), snap => {
  book.setVisible(snap.exists() ? snap.data().spreads || [] : []);
}, () => { /* offline or no permission: keep what we had */ });

book.onSaveVisible = async spreads => {
  await setDoc(doc(db, 'config', 'visibility'), { spreads, updated: Date.now() });
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
  if (!u) return;

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
