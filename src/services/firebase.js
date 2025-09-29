// Firebase initialization for Auth, Firestore, and Storage
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Prefer environment variables; fallback to placeholders for local dev.
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyBHna-sAWDDJw03gBLnC1B2clrgYUo5MV8',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'flowlink-24f55.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'flowlink-24f55',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'flowlink-24f55.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '789325270587',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '789325270587:web:8a33dd627cca10af96961e'
}

const app = initializeApp(firebaseConfig)

// Core services
export const auth = getAuth(app)
// Enable offline persistence with an IndexedDB cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
// Use explicit gs:// bucket to avoid domain resolution issues
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`)
console.info('[firebase] Using storage bucket:', firebaseConfig.storageBucket)

// Providers
export const googleProvider = new GoogleAuthProvider()
export const microsoftProvider = new OAuthProvider('microsoft.com')

export default app


