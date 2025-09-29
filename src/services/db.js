import { db, storage, auth as firebaseAuth } from './firebase'
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, query, where, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const useLocalApi = process.env.REACT_APP_USE_LOCAL_API === 'true'
export const usingLocalApi = useLocalApi
const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000'

// Helper: current authenticated user's uid
const currentUid = () => firebaseAuth?.currentUser?.uid || null

// Products
export async function createProduct(product, mediaFiles = []) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const form = new FormData()
    form.append('product', JSON.stringify(product))
    for (const f of mediaFiles) form.append('media', f)
    const url = `${apiBase}/api/products`
    console.debug('[db] createProduct via local API', { url })
    const res = await fetch(url, { method: 'POST', body: form, headers: { 'x-user-id': uid } })
    if (!res.ok) {
      let detail = ''
      try {
        const j = await res.json()
        detail = j?.error || JSON.stringify(j)
      } catch (e) {
        detail = await res.text()
      }
      throw new Error(`Failed to create product (HTTP ${res.status}): ${detail}`)
    }
    const data = await res.json()
    return data.id
  }

  // Upload media: Prefer Cloudinary unsigned upload if configured, otherwise use Firebase Storage.
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  const cloudFolder = process.env.REACT_APP_CLOUDINARY_FOLDER || 'flowlink/products'
  const useCloudinary = Boolean(cloudName && uploadPreset)

  const uploadedUrls = []
  for (const file of mediaFiles) {
    let uploaded = false
    if (useCloudinary) {
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('upload_preset', uploadPreset)
        if (cloudFolder) form.append('folder', cloudFolder)
        const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        console.info('[cloudinary] uploading', { endpoint, name: file.name, size: file.size })
        const res = await fetch(endpoint, { method: 'POST', body: form })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        uploadedUrls.push(data.secure_url)
        console.info('[cloudinary] uploaded', { url: data.secure_url })
        uploaded = true
      } catch (err) {
        console.warn('[cloudinary] upload failed or misconfigured; falling back to Firebase Storage.', err)
      }
    }
    if (!uploaded) {
      // Firebase Storage fallback
      const storagePath = `products/${Date.now()}-${file.name}`
      const storageRef = ref(storage, storagePath)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      uploadedUrls.push(url)
      console.info('[storage] uploaded', { url })
    }
  }

  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    images: uploadedUrls,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function listProducts({ status = 'All' } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) return []
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const url = `${apiBase}/api/products${qs}`
    console.debug('[db] listProducts via local API', { url })
    const res = await fetch(url, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error(`Failed to list products (HTTP ${res.status})`)
    return await res.json()
  }
  // Firestore path
  if (!uid) return []
  const col = collection(db, 'products')
  const baseQ = query(col, where('uid', '==', uid))
  const qy = status && status !== 'All' ? query(baseQ, where('status', '==', status)) : baseQ
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateProduct(productId, updates) {
  if (useLocalApi) throw new Error('Not implemented for local API')
  const d = doc(db, 'products', productId)
  await updateDoc(d, { ...updates, updatedAt: serverTimestamp() })
}

export async function deleteProduct(productId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/products/${productId}`, { method: 'DELETE', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to delete product')
    return true
  }
  await deleteDoc(doc(db, 'products', productId))
  return true
}

// Customers
export async function createCustomer(customer) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    // You can implement a local endpoint similarly; for now fallback to no-op
    const res = await fetch(`${apiBase}/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': uid }, body: JSON.stringify(customer) })
    if (!res.ok) throw new Error('Failed to create customer')
    const data = await res.json()
    return data.id
  }
  const docRef = await addDoc(collection(db, 'customers'), {
    ...customer,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function listCustomers({ status = 'All' } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) return []
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${apiBase}/api/customers${qs}`, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to list customers')
    return await res.json()
  }
  if (!uid) return []
  const col = collection(db, 'customers')
  const baseQ = query(col, where('uid', '==', uid))
  const qy = status && status !== 'All' ? query(baseQ, where('status', '==', status)) : baseQ
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateCustomer(customerId, updates) {
  if (useLocalApi) throw new Error('Not implemented for local API')
  const d = doc(db, 'customers', customerId)
  await updateDoc(d, { ...updates, updatedAt: serverTimestamp() })
}

export async function deleteCustomer(customerId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/customers/${customerId}`, { method: 'DELETE', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to delete customer')
    return true
  }
  await deleteDoc(doc(db, 'customers', customerId))
  return true
}

// Profiles
export async function getUserProfile(uid) {
  try {
    const d = doc(db, 'profiles', uid)
    const snap = await getDoc(d)
    return snap.exists() ? snap.data() : null
  } catch (e) {
    // If offline and no cache, return null instead of throwing
    return null
  }
}

export async function upsertUserProfile(uid, profile) {
  const d = doc(db, 'profiles', uid)
  await setDoc(
    d,
    {
      ...profile,
      uid,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  )
}

// Profile photo upload
export async function uploadProfilePhoto(uid, file) {
  const storageRef = ref(storage, `profiles/${uid}-${Date.now()}-${file.name}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  await upsertUserProfile(uid, { photoURL: url })
  return url
}

// Discounts
export async function createDiscount(discount) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
      body: JSON.stringify(discount)
    })
    if (!res.ok) throw new Error('Failed to create discount')
    const data = await res.json()
    return data.id
  }
  const docRef = await addDoc(collection(db, 'discounts'), {
    ...discount,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function listDiscounts({ status = 'All' } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) return []
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${apiBase}/api/discounts${qs}`, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to list discounts')
    return await res.json()
  }
  if (!uid) return []
  const col = collection(db, 'discounts')
  const baseQ = query(col, where('uid', '==', uid))
  const qy = status && status !== 'All' ? query(baseQ, where('status', '==', status)) : baseQ
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteDiscount(discountId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/discounts/${discountId}`, { method: 'DELETE', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to delete discount')
    return true
  }
  await deleteDoc(doc(db, 'discounts', discountId))
  return true
}


