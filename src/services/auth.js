import { auth as firebaseAuth, googleProvider, microsoftProvider } from './firebase'
import { upsertUserProfile } from './db'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup, signInWithRedirect } from 'firebase/auth'

// Lightweight wrapper around Firebase Auth used by PrivateRoute and pages
const auth = {
  isAuthenticated: false,
  unsubscribe: null,
  initAuthListener(callback) {
    if (this.unsubscribe) {
      if (callback) callback(firebaseAuth.currentUser || null)
      return
    }
    this.unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      this.isAuthenticated = !!user
      if (user) {
        try { await upsertUserProfile(user.uid, { displayName: user.displayName || '', email: user.email || '', photoURL: user.photoURL || '' }) } catch {}
      }
      if (callback) callback(user)
    })
  },
  async loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    this.isAuthenticated = true
    return cred
  },
  async loginWithGoogle() {
    try {
      const cred = await signInWithPopup(firebaseAuth, googleProvider)
      const u = cred.user
      try { await upsertUserProfile(u.uid, { displayName: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' }) } catch {}
      this.isAuthenticated = true
      return cred
    } catch (err) {
      // Fallback for COOP/popup restrictions
      await signInWithRedirect(firebaseAuth, googleProvider)
    }
  },
  async loginWithMicrosoft() {
    try {
      const cred = await signInWithPopup(firebaseAuth, microsoftProvider)
      const u = cred.user
      try { await upsertUserProfile(u.uid, { displayName: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '' }) } catch {}
      this.isAuthenticated = true
      return cred
    } catch (err) {
      // Fallback for COOP/popup restrictions
      await signInWithRedirect(firebaseAuth, microsoftProvider)
    }
  },
  async logout() {
    await signOut(firebaseAuth)
    this.isAuthenticated = false
  }
}

export default auth
