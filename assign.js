// "Assign work" and Classroom Manager: the classes with their students, and the place where the
// lists of assign-pages.js are kept (so the teacher finds them on every device).
// Classroom Manager is another Firebase project (Realtime Database): it reads users/<uid>/classes and
// writes only users/<uid>/bookAssign. Firebase is loaded the first time a page of "Assign work" is opened,
// so students never download it.

const FB = 'https://www.gstatic.com/firebasejs/10.14.1/';
const CM_CONFIG = {
  apiKey: 'AIzaSyA6O12KFRkZ4gGBi2LEGKZni33c3a2NBcU',
  authDomain: 'classroomanager.firebaseapp.com',
  databaseURL: 'https://classroomanager-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'classroomanager',
  storageBucket: 'classroomanager.firebasestorage.app',
  messagingSenderId: '995055049853',
  appId: '1:995055049853:web:5b3674ae12f7c0b504e514',
};

const pages = typeof ASSIGN === 'undefined' ? null : ASSIGN; // assign-pages.js
let fb = null;     // the Firebase functions, with auth and db of Classroom Manager
let user = null;
let starting = null;

const arr = v => (Array.isArray(v) ? v : Object.values(v || {})).filter(Boolean);

async function start() {
  const [{ initializeApp, getApps }, authMod, dbMod] = await Promise.all([
    import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-database.js'),
  ]);
  const app = getApps().find(a => a.name === 'classroom-manager') || initializeApp(CM_CONFIG, 'classroom-manager');
  fb = { ...authMod, ...dbMod, auth: authMod.getAuth(app), db: dbMod.getDatabase(app) };
  // the sign-in is kept on this device: wait until Firebase has read it
  user = await new Promise(res => { const off = fb.onAuthStateChanged(fb.auth, u => { off(); res(u); }); });
  if (user) await load();
}

async function load() {
  try {
    const [cls, saved] = await Promise.all([
      fb.get(fb.ref(fb.db, `users/${user.uid}/classes`)),
      fb.get(fb.ref(fb.db, `users/${user.uid}/bookAssign`)),
    ]);
    pages.setClasses(arr(cls.val()).map(c => ({
      id: String(c.id),
      name: c.name || 'Class',
      students: arr(c.students).map(s => s.fullName || s.displayName || s.name || '').filter(Boolean),
    })), user.email);
    // kept as text: the Realtime Database would drop empty lists and boxes
    const v = saved.val();
    let data = null;
    try { data = v?.json ? JSON.parse(v.json) : null; } catch { /* broken: the one on this device stays */ }
    pages.fromCloud(data);
  } catch (err) {
    console.error('Classroom Manager:', err);
    alert('Could not read Classroom Manager: ' + err.message);
  }
}

window.assignCloud = {
  async connect() {
    if (!fb) await (starting ||= start());
    const provider = new fb.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { user = (await fb.signInWithPopup(fb.auth, provider)).user; } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') alert('Could not connect: ' + err.message);
      return;
    }
    await load();
  },
  async push(state) {
    if (!user) return;
    try {
      await fb.update(fb.ref(fb.db, `users/${user.uid}`), { bookAssign: { json: JSON.stringify(state), updated: state.updated } });
    } catch (err) { console.error('Classroom Manager: the lists were saved only on this device.', err); }
  },
};

// the first time a page of "Assign work" is opened
if (pages) {
  const check = () => {
    if (!document.querySelector('.spread.current[data-asg]') || starting) return;
    starting = start().catch(err => { console.error('Classroom Manager:', err); starting = null; });
  };
  document.addEventListener('spreadchange', check);
  check();
}
