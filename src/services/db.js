import { db, storage, auth as firebaseAuth } from './firebase'
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, query, where, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const useLocalApi = process.env.REACT_APP_USE_LOCAL_API === 'true'
export const usingLocalApi = useLocalApi
const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000'
const customerApiBase = process.env.REACT_APP_CUSTOMER_API_BASE || 'http://localhost:5001/api'

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

  // Prefer uploaded URLs; if none, use any image URLs provided in product.images (e.g., from CSV)
  const finalImages = uploadedUrls.length ? uploadedUrls : (Array.isArray(product.images) ? product.images : [])

  const docRef = await addDoc(collection(db, 'products'), {
    ...product,
    images: finalImages,
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

// CSV helpers and API
function csvEscape(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return (/[",\n\r]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s
}

const CSV_HEADER = [
  'title','brand','category','sku','barcode','unit','netWeight','mrp','price','quantity','expiryDate','taxRate','hsn','description','image'
]

function buildCsvRows(products = []) {
  const rows = [CSV_HEADER]
  for (const p of products) {
    const images = Array.isArray(p.images) ? p.images : []
    rows.push([
      p.title || '',
      p.brand || '',
      p.category || '',
      p.sku || '',
      p.barcode || '',
      p.unit || (p.weightUnit || ''),
      p.netWeight != null ? p.netWeight : (p.weight || ''),
      p.mrp != null ? p.mrp : '',
      p.price != null ? p.price : '',
      p.quantity != null ? p.quantity : '',
      p.expiryDate ? new Date(p.expiryDate).toISOString().slice(0,10) : '',
      p.taxRate != null ? p.taxRate : '',
      p.hsn || '',
      p.description || '',
      images[0] || ''
    ])
  }
  return rows
}

function rowsToCsv(rows) {
  return rows.map(r => r.map(csvEscape).join(',')).join('\r\n') + '\r\n'
}

export async function exportProductsCsv() {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const url = `${apiBase}/api/products/export`
    const res = await fetch(url, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to export CSV')
    const blob = await res.blob()
    return blob
  }
  // Firestore fallback: build CSV on client
  const products = await listProducts({ status: 'All' })
  const csv = rowsToCsv(buildCsvRows(products))
  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

export async function importProductsCsv(file) {
  const uid = currentUid()
  if (!file) throw new Error('No file provided')
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const form = new FormData()
    form.append('file', file)
    const url = `${apiBase}/api/products/import`
    const res = await fetch(url, { method: 'POST', body: form, headers: { 'x-user-id': uid } })
    if (!res.ok) {
      let detail = ''
      try { const j = await res.json(); detail = j?.error || JSON.stringify(j) } catch (e) { detail = await res.text() }
      throw new Error(`Failed to import CSV (HTTP ${res.status}): ${detail}`)
    }
    return await res.json()
  }
  // Firestore fallback: simple client-side CSV parse + createProduct (no media)
  const text = await file.text()
  const rows = parseCsv(text)
  if (!rows.length) throw new Error('CSV is empty')
  const header = rows[0].map(h => String(h || '').trim().toLowerCase())
  const idx = (name) => header.indexOf(name)
  const required = idx('title')
  if (required === -1) throw new Error('CSV must include a "title" column')
  let created = 0
  const failures = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const get = (name) => { const at = idx(name); return at >= 0 ? (row[at] != null ? String(row[at]).trim() : '') : '' }
    const title = get('title')
    if (!title) { failures.push({ row: r+1, error: 'Missing title' }); continue }
    try {
      const img = get('image') || get('imageurl') || get('image_url') || get('image1') || ''
      await createProduct({
        title,
        brand: get('brand') || undefined,
        category: get('category') || undefined,
        sku: get('sku') || undefined,
        barcode: get('barcode') || undefined,
        unit: get('unit') || undefined,
        netWeight: get('netweight') || undefined,
        mrp: get('mrp') || undefined,
        price: get('price') || undefined,
        quantity: get('quantity') || undefined,
        taxRate: get('taxrate') || undefined,
        hsn: get('hsn') || undefined,
        description: get('description') || undefined,
        images: img ? [img] : []
      })
      created++
    } catch (e) {
      failures.push({ row: r+1, error: e.message })
    }
  }
  return { ok: true, created, failed: failures.length, failures }
}

// Minimal CSV parser
function parseCsv(text) {
  const rows = []
  let i = 0, field = '', row = [], inQuotes = false
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ',') { row.push(field); field = ''; i++; continue }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    if (ch === '\r') { if (text[i+1] === '\n') { i += 2; row.push(field); rows.push(row); row = []; field = ''; continue } i++; continue }
    field += ch; i++
  }
  row.push(field); rows.push(row)
  if (rows.length && rows[rows.length-1].length === 1 && rows[rows.length-1][0] === '') rows.pop()
  return rows
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

// Persist last provisioned portal credentials on the admin server
export async function updateCustomerPortal(customerId, { email, password } = {}) {
  const uid = currentUid()
  if (!customerId) throw new Error('customerId required')
  if (!useLocalApi) return { ok: true } // Firestore mode: skip
  if (!uid) throw new Error('Not authenticated')
  const res = await fetch(`${apiBase}/api/customers/${encodeURIComponent(customerId)}/portal`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    let msg
    try { const j = await res.json(); msg = j?.error || JSON.stringify(j) } catch { msg = await res.text() }
    throw new Error(msg || 'Failed to update portal credentials')
  }
  return await res.json()
}

// Customers CSV export/import
export async function exportCustomersCsv() {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/customers/export`, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to export customers')
    return await res.blob()
  }
  const customers = await listCustomers({ status: 'All' })
  const rows = [[
    'firstName','lastName','email','phoneCountry','phoneNumber','status','language','marketingEmails','marketingSMS','collectTax','tags','notes','addressLine1','addressLine2','addressCity','addressState','addressPostalCode','addressCountry'
  ]]
  for (const c of customers) {
    const addr = Array.isArray(c.addresses) && c.addresses.length ? c.addresses[0] : {}
    rows.push([
      c.firstName || '',
      c.lastName || '',
      c.email || '',
      c.phoneCountry || '',
      c.phoneNumber || '',
      c.status || 'Active',
      c.language || '',
      c.marketingEmails ? 'true' : 'false',
      c.marketingSMS ? 'true' : 'false',
      c.collectTax || '',
      c.tags || '',
      c.notes || '',
      addr?.line1 || '',
      addr?.line2 || '',
      addr?.city || '',
      addr?.state || '',
      addr?.postalCode || '',
      addr?.country || ''
    ])
  }
  const csv = rowsToCsv(rows)
  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

export async function importCustomersCsv(file) {
  const uid = currentUid()
  if (!file) throw new Error('No file provided')
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${apiBase}/api/customers/import`, { method: 'POST', body: form, headers: { 'x-user-id': uid } })
    if (!res.ok) {
      let detail = ''
      try { const j = await res.json(); detail = j?.error || JSON.stringify(j) } catch (e) { detail = await res.text() }
      throw new Error(`Failed to import customers (HTTP ${res.status}): ${detail}`)
    }
    return await res.json()
  }
  // Firestore fallback: parse client-side and createCustomer
  const text = await file.text()
  const rows = parseCsv(text)
  if (!rows.length) throw new Error('CSV is empty')
  const header = rows[0].map(h => String(h || '').trim().toLowerCase())
  const idx = (name) => header.indexOf(name)
  const get = (row, name, alt = []) => {
    const names = [name, ...alt]
    for (const n of names) { const at = idx(n); if (at >= 0) return row[at] != null ? String(row[at]).trim() : '' }
    return ''
  }
  let created = 0
  const failures = []
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue
    const email = get(row, 'email')
    const phoneNumber = get(row, 'phonenumber', ['phone'])
    if (!email && !phoneNumber) { failures.push({ row: r+1, error: 'Missing email/phoneNumber' }); continue }
    try {
      const customer = {
        firstName: get(row, 'firstname', ['first_name']) || undefined,
        lastName: get(row, 'lastname', ['last_name']) || undefined,
        email: email || undefined,
        phoneCountry: get(row, 'phonecountry') || 'IN',
        phoneNumber: phoneNumber || undefined,
        status: get(row, 'status') || 'Active',
        language: get(row, 'language') || undefined,
        marketingEmails: /^(true|1|yes)$/i.test(get(row, 'marketingemails')) || false,
        marketingSMS: /^(true|1|yes)$/i.test(get(row, 'marketingsms')) || false,
        collectTax: get(row, 'collecttax') || undefined,
        tags: get(row, 'tags') || undefined,
        notes: get(row, 'notes') || undefined,
        addresses: []
      }
      const line1 = get(row, 'addressline1', ['line1'])
      const city = get(row, 'addresscity', ['city'])
      const state = get(row, 'addressstate', ['state'])
      const postalCode = get(row, 'addresspostalcode', ['postalcode'])
      const country = get(row, 'addresscountry', ['country']) || 'India'
      const line2 = get(row, 'addressline2', ['line2'])
      if (line1 || city || state || postalCode) {
        customer.addresses = [{
          name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || undefined,
          line1, line2, city, state, postalCode, country,
          phone: customer.phoneNumber || undefined,
          email: customer.email || undefined,
          label: 'shipping', isDefault: true
        }]
      }
      await createCustomer(customer)
      created++
    } catch (e) {
      failures.push({ row: r+1, error: e.message })
    }
  }
  return { ok: true, created, failed: failures.length, failures }
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

// Generic public asset upload (e.g., shop logo/cover)
export async function uploadPublicAsset(file, { folder = process.env.REACT_APP_CLOUDINARY_FOLDER || 'flowlink/assets' } = {}) {
  if (!file) throw new Error('No file provided')
  // Try Cloudinary unsigned upload if configured
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
  if (cloudName && uploadPreset) {
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', uploadPreset)
      if (folder) form.append('folder', folder)
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
      const res = await fetch(endpoint, { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      return data.secure_url
    } catch (e) {
      // fall back to Firebase Storage below
    }
  }
  // Firebase storage fallback
  const storagePath = `${(folder || 'assets').replace(/\/$/, '')}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
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

// Offers (admin)
export async function createOffer(offer) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
      body: JSON.stringify(offer)
    })
    if (!res.ok) throw new Error('Failed to create offer')
    const data = await res.json()
    return data.id
  }
  const docRef = await addDoc(collection(db, 'offers'), {
    ...offer,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function listOffers({ status = 'All' } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) return []
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const res = await fetch(`${apiBase}/api/offers${qs}`, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to list offers')
    return await res.json()
  }
  if (!uid) return []
  const col = collection(db, 'offers')
  const baseQ = query(col, where('uid', '==', uid))
  const qy = status && status !== 'All' ? query(baseQ, where('status', '==', status)) : baseQ
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deleteOffer(offerId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/offers/${offerId}`, { method: 'DELETE', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to delete offer')
    return true
  }
  await deleteDoc(doc(db, 'offers', offerId))
  return true
}

// Customer storefront portal provisioning
export async function provisionCustomerLogin({ name, email, password, shop } = {}) {
  const uid = currentUid()
  if (!email) throw new Error('email required')
  const body = { name: name || '', email, password: password || '', shop }
  // Prefer provision endpoint (upsert)
  let res = await fetch(`${customerApiBase}/auth/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(uid ? { 'x-user-id': uid } : {}) },
    body: JSON.stringify(body)
  })
  // Fallback for older servers that may not have /auth/provision
  if (res.status === 404) {
    res = await fetch(`${customerApiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(uid ? { 'x-user-id': uid } : {}) },
      body: JSON.stringify(body)
    })
  }
  if (!res.ok) {
    let msg
    try { const j = await res.json(); msg = j?.error || JSON.stringify(j) } catch { msg = await res.text() }
    throw new Error(msg || 'Failed to provision login')
  }
  return await res.json()
}



// Orders
export async function createOrder(order) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
      body: JSON.stringify(order)
    })
    if (!res.ok) throw new Error('Failed to create order')
    const data = await res.json()
    return data.id
  }
  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function listOrders({ status = 'All' } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) return []
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    const url = `${apiBase}/api/orders${qs}`
    const res = await fetch(url, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to list orders')
    return await res.json()
  }
  if (!uid) return []
  const col = collection(db, 'orders')
  const baseQ = query(col, where('uid', '==', uid))
  const qy = status && status !== 'All' ? query(baseQ, where('status', '==', status)) : baseQ
  const snap = await getDocs(qy)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getOrder(orderId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/orders/${orderId}`, { headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to get order')
    return await res.json()
  }
  const d = doc(db, 'orders', orderId)
  const snap = await getDoc(d)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Shops (Customer storefront mapping)
export async function upsertShop({ slug, name, description, logo, cover }) {
  const uid = currentUid()
  if (!uid) throw new Error('Not authenticated')
  const res = await fetch(`${customerApiBase}/shops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: uid, slug, name, description, logo, cover })
  })
  if (!res.ok) {
    let msg
    try { const j = await res.json(); msg = j?.error || JSON.stringify(j) } catch { msg = await res.text() }
    throw new Error(`Failed to upsert shop: ${msg}`)
  }
  return await res.json()
}

export async function getShop(slug) {
  if (!slug) return null
  const uid = currentUid()
  const res = await fetch(`${customerApiBase}/shops/${encodeURIComponent(slug)}`, {
    headers: uid ? { 'x-user-id': uid } : undefined
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to fetch shop')
  return await res.json()
}

export async function approveOrder(orderId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/orders/${orderId}/approve`, { method: 'POST', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to approve order')
    const data = await res.json()
    return data?.order || null
  }
  const d = doc(db, 'orders', orderId)
  await updateDoc(d, { status: 'Approved', updatedAt: serverTimestamp() })
  const snap = await getDoc(d)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function denyOrder(orderId) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/orders/${orderId}/deny`, { method: 'POST', headers: { 'x-user-id': uid } })
    if (!res.ok) throw new Error('Failed to deny order')
    const data = await res.json()
    return data?.order || null
  }
  const d = doc(db, 'orders', orderId)
  await updateDoc(d, { status: 'Denied', updatedAt: serverTimestamp() })
  const snap = await getDoc(d)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateOrderStatus(orderId, { status, shipping, payment } = {}) {
  const uid = currentUid()
  if (useLocalApi) {
    if (!uid) throw new Error('Not authenticated')
    const res = await fetch(`${apiBase}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
      body: JSON.stringify({ status, shipping, payment })
    })
    if (!res.ok) throw new Error('Failed to update order status')
    const data = await res.json()
    return data?.order || null
  }
  const d = doc(db, 'orders', orderId)
  const updates = { updatedAt: serverTimestamp() }
  if (status) updates.status = status
  if (shipping && typeof shipping === 'object') {
    for (const k of Object.keys(shipping)) {
      updates[`shipping.${k}`] = shipping[k]
    }
  }
  if (payment && typeof payment === 'object') {
    for (const k of Object.keys(payment)) {
      updates[`payment.${k}`] = payment[k]
    }
  }
  await updateDoc(d, updates)
  const snap = await getDoc(d)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
