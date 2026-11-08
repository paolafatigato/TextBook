// STORY SOLITAIRE - the class game rooms on Firebase (the same project and the same rules as Villain Battle and Grammar Race).
// A room is the document duels/<CODE>, made by the teacher's device (only she changes it); every pupil writes ONLY their own small
// document duels/<CODE>/players/<id>. The rules in firestore.rules already allow all this: nothing to publish.
// class.js talks to this file through window.StoryOnline (it has the same methods as the fake room used for the tests).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCbpLwgIBNQhDj6EZRiNJy-n0rp3kPnVdY',
  authDomain: 'textbook-9601c.firebaseapp.com',
  projectId: 'textbook-9601c',
  storageBucket: 'textbook-9601c.firebasestorage.app',
  messagingSenderId: '354398633560',
  appId: '1:354398633560:web:7446ea659454cfa868942d',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // no I and O: they look like 1 and 0
const TTL = 12 * 3600 * 1000;                  // a room older than this is free again
const roomRef = code => doc(db, 'duels', code);
const playerRef = (code, id) => doc(db, 'duels', code, 'players', id);

// every device has its own id (so the teacher can make a room from two devices)
const clientId = (() => {
  try {
    let id = localStorage.getItem('story-solitaire-client');
    if (!id) { id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); localStorage.setItem('story-solitaire-client', id); }
    return id;
  } catch (e) { return Math.random().toString(36).slice(2); }
})();

window.StoryOnline = {
  clientId,
  ttl: TTL,
  // signed in, anonymously if nobody is (wait until Firebase has restored a saved session first)
  async ready() {
    await auth.authStateReady();
    if (!auth.currentUser) await signInAnonymously(auth);
  },
  async createRoom(rc) {
    await this.ready();
    for (let tries = 0; tries < 8; tries++) {
      const code = Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
      const old = await getDoc(roomRef(code));
      if (old.exists()) {
        if (Date.now() - (old.data().updated || 0) < TTL) continue;
        await deleteDoc(roomRef(code));        // an old room: it is free again
      }
      const now = Date.now();
      await setDoc(roomRef(code), { code, host: clientId, created: now, updated: now, rc, phase: 'wait', board: [], win: null });
      return code;
    }
    throw new Error('busy');
  },
  async getRoom(code) {
    await this.ready();
    const s = await getDoc(roomRef(code));
    return s.exists() ? s.data() : null;
  },
  watchRoom(code, cb, err) { return onSnapshot(roomRef(code), s => cb(s.exists() ? s.data() : null), err); },
  updateRoom(code, patch) { return updateDoc(roomRef(code), { ...patch, updated: Date.now() }); },
  setPlayer(code, id, data) { return setDoc(playerRef(code, id), data, { merge: true }); },
  watchPlayers(code, cb, err) {
    return onSnapshot(collection(db, 'duels', code, 'players'), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);
  },
  serverTime: () => serverTimestamp(),
};
window.dispatchEvent(new Event('story-online-ready'));
