import { auth as firebaseAuth, googleProvider, microsoftProvider } from './firebase'
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
    this.unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      this.isAuthenticated = !!user
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
