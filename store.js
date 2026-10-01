/* Облачное хранилище «Parlons Voyage»: вход по почте и паролю (Firebase Auth) и база Firestore с офлайн-кэшем.
   Прогресс каждого человека лежит в его собственной ветке users/<uid>/fr_cards (по документу на карточку)
   и users/<uid>/fr_meta/main (настройки, дни, уроки). Если в config.js нет настроек, файл ничего не делает
   и приложение хранит данные только на устройстве. */
const cfg = window.FIREBASE_CONFIG;

if (cfg) {
  try {
    const [appMod, authMod, fsMod] = await Promise.all([
      import('./vendor/firebase-app.js'),
      import('./vendor/firebase-auth.js'),
      import('./vendor/firebase-firestore.js'),
    ]);
    const app = appMod.initializeApp(cfg);
    const auth = authMod.getAuth(app);

    // Persistent cache: data opens without internet, writes made offline are sent later by Firestore itself.
    let fs;
    try {
      fs = fsMod.initializeFirestore(app, {
        localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
      });
    } catch (e) {
      fs = fsMod.getFirestore(app);
    }

    const report = e => {
      console.error(e);
      if (window.__onWriteError) window.__onWriteError((e && e.code) || 'error');
    };

    const makeApi = uid => {
      const base = 'users/' + uid + '/';
      const cardsRef = fsMod.collection(fs, base + 'fr_cards');
      const metaRef = fsMod.doc(fs, base + 'fr_meta/main');
      return {
        // Writes resolve at once: Firestore keeps them locally and syncs when it can.
        setCard(id, data) { fsMod.setDoc(fsMod.doc(fs, base + 'fr_cards/' + id), JSON.parse(JSON.stringify(data))).catch(report); },
        setMeta(data) { fsMod.setDoc(metaRef, JSON.parse(JSON.stringify(data))).catch(report); },
        onCards(cb, err) {
          return fsMod.onSnapshot(cardsRef, { includeMetadataChanges: true }, s => {
            cb(s.docChanges().map(ch => ({ type: ch.type, id: ch.doc.id, data: ch.doc.data() })), s.metadata);
          }, err);
        },
        onMeta(cb, err) {
          return fsMod.onSnapshot(metaRef, { includeMetadataChanges: true }, s => cb(s.exists() ? s.data() : null, s.metadata), err);
        },
      };
    };

    window.__auth = {
      signIn: (email, password) => authMod.signInWithEmailAndPassword(auth, email, password),
      signUp: (email, password) => authMod.createUserWithEmailAndPassword(auth, email, password),
      reset: email => authMod.sendPasswordResetEmail(auth, email),
      signOut: () => authMod.signOut(auth),
    };

    authMod.onAuthStateChanged(auth, user => {
      if (window.__onAuth) window.__onAuth(user ? { email: user.email, uid: user.uid } : null, user ? makeApi(user.uid) : null);
    });
  } catch (e) {
    console.error('Облачное хранилище не запустилось', e);
  }
}
