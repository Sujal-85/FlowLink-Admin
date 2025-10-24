import React, { useEffect, useState } from 'react';
import LayoutWrapper  from '../components/LayoutWrapper';
import { Bell, Phone, Mail, LocateIcon, MapIcon, MapPinCheck } from 'lucide-react';
import { auth as firebaseAuth } from '../services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserProfile, upsertUserProfile, uploadProfilePhoto, upsertShop, getShop, uploadPublicAsset, listProducts, listOrders } from '../services/db'

const Setting = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState({ displayName: '', company: '', role: '', phone: '', location: '', photoURL: '' })
  const [saving, setSaving] = useState(false)
  const [shopForm, setShopForm] = useState({ name: '', slug: '', description: '', logo: '', cover: '' })
  const [shopStatus, setShopStatus] = useState({ loading: false, message: '' })
  const fileInputRef = React.useRef(null)
  const logoInputRef = React.useRef(null)
  const coverInputRef = React.useRef(null)
  const [authReady, setAuthReady] = useState(false)
  const customerApiBase = process.env.REACT_APP_CUSTOMER_API_BASE || 'http://localhost:5001/api'
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState('')

  // Prefill Shop form from localStorage on first mount (no auth needed)
  useEffect(() => {
    const ls = {
      slug: localStorage.getItem('lastShopSlug') || '',
      name: localStorage.getItem('lastShopName') || '',
      description: localStorage.getItem('lastShopDescription') || '',
      logo: localStorage.getItem('lastShopLogo') || '',
      cover: localStorage.getItem('lastShopCover') || ''
    }
    setShopForm(prev => ({
      ...prev,
      name: prev.name || ls.name,
      slug: prev.slug || ls.slug,
      description: prev.description || ls.description,
      logo: prev.logo || ls.logo,
      cover: prev.cover || ls.cover
    }))
    if (ls.slug) {
      ;(async () => {
        try {
          setShopStatus(s => ({ ...s, loading: true }))
          const s = await getShop(ls.slug)
          if (s) setShopForm(prev => ({ ...prev, name: s.name || prev.name, slug: s.slug || prev.slug, description: s.description || prev.description, logo: s.logo || prev.logo, cover: s.cover || prev.cover }))
        } catch (_) {
        } finally {
          setShopStatus(s => ({ ...s, loading: false }))
        }
      })()
    }
  }, [])

  // Persist Shop form fields as the user types (restore unsaved edits on next visit)
  useEffect(() => {
    try {
      localStorage.setItem('lastShopSlug', shopForm.slug || '')
      localStorage.setItem('lastShopName', shopForm.name || '')
      localStorage.setItem('lastShopDescription', shopForm.description || '')
      localStorage.setItem('lastShopLogo', shopForm.logo || '')
      localStorage.setItem('lastShopCover', shopForm.cover || '')
    } catch {}
  }, [shopForm.slug, shopForm.name, shopForm.description, shopForm.logo, shopForm.cover])

  // After auth is ready, hydrate from Firestore profile and storefront API
  useEffect(() => {
    const user = firebaseAuth.currentUser
    if (!user) return
    ;(async () => {
      const data = await getUserProfile(user.uid)
      setProfile({
        displayName: data?.displayName || user.displayName || '',
        company: data?.company || '',
        role: data?.role || '',
        phone: data?.phone || '',
        location: data?.location || '',
        photoURL: data?.photoURL || user.photoURL || ''
      })
      // Preload shop info from profile
      const sName = data?.shopName || ''
      const sSlug = data?.shopSlug || ''
      const fSlug = sSlug || localStorage.getItem('lastShopSlug') || ''
      setShopForm(prev => ({
        ...prev,
        name: sName || prev.name,
        slug: fSlug || prev.slug
      }))
      if (fSlug) {
        try {
          setShopStatus(s => ({ ...s, loading: true }))
          const s = await getShop(fSlug)
          if (s) setShopForm(prev => ({ ...prev, name: s.name || prev.name, slug: s.slug || prev.slug, description: s.description || prev.description, logo: s.logo || prev.logo, cover: s.cover || prev.cover }))
        } catch (_) {
        } finally {
          setShopStatus(s => ({ ...s, loading: false }))
        }
      }
    })()
  }, [authReady])

  // Wait for Firebase auth before loading data
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, () => setAuthReady(true))
    return () => unsub()
  }, [])

  const saveProfile = async () => {
    const user = firebaseAuth.currentUser
    if (!user) return
    try {
      setSaving(true)
      await upsertUserProfile(user.uid, profile)
    } finally {
      setSaving(false)
    }
  }

  const toSlug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9\-\s]/g, '').replace(/\s+/g, '-').replace(/\-+/g, '-')
  const saveShop = async () => {
    const user = firebaseAuth.currentUser
    if (!user) return
    const slug = toSlug(shopForm.slug || shopForm.name)
    if (!slug) {
      setShopStatus({ loading: false, message: 'Please enter a valid shop name or slug' })
      return
    }
    try {
      setShopStatus({ loading: true, message: '' })
      // Pre-check: if nothing changed from existing, show 'Already saved' and skip update
      let existing = null
      try { existing = await getShop(slug) } catch (_) {}
      const desired = {
        name: shopForm.name || slug,
        description: shopForm.description || '',
        logo: (shopForm.logo || '').trim(),
        cover: (shopForm.cover || '').trim()
      }
      if (existing) {
        const same =
          String(existing.name || '') === String(desired.name || '') &&
          String(existing.description || '') === String(desired.description || '') &&
          String(existing.logo || '') === String(desired.logo || '') &&
          String(existing.cover || '') === String(desired.cover || '')
        if (same) {
          setShopStatus({ loading: false, message: '✅ Already saved for this slug' })
          return
        }
      }
      const shop = await upsertShop({ slug, name: desired.name, description: desired.description, logo: desired.logo || undefined, cover: desired.cover || undefined })
      // Update local form immediately
      setShopForm(f => ({ ...f, slug: shop.slug, name: shop.name }))
      // Persist to localStorage for future prefill
      try {
        localStorage.setItem('lastShopSlug', shop.slug || '')
        localStorage.setItem('lastShopName', shop.name || '')
        localStorage.setItem('lastShopDescription', shop.description || '')
        localStorage.setItem('lastShopLogo', shop.logo || '')
        localStorage.setItem('lastShopCover', shop.cover || '')
      } catch {}
      // Try to persist mapping in Firestore profile, but don't fail overall if rules block it
      let note = ''
      try {
        await upsertUserProfile(user.uid, { shopName: shop.name, shopSlug: shop.slug })
      } catch (err) {
        note = ' (profile not updated: ' + (err?.message || 'insufficient permissions') + ')'
      }
      setShopStatus({ loading: false, message: '✅ Shop saved. Storefront: /' + shop.slug + note })
    } catch (e) {
      setShopStatus({ loading: false, message: 'Failed to save shop: ' + (e?.message || 'Unknown error') })
    }
  }

  // Hydrate existing shop details by slug (used by the 'Load' button)
  const hydrateShopFromSlug = async () => {
    const slug = toSlug(shopForm.slug || shopForm.name)
    if (!slug) {
      setShopStatus({ loading: false, message: 'Enter a slug to load shop details' })
      return
    }
    try {
      setShopStatus({ loading: true, message: 'Loading shop…' })
      const s = await getShop(slug)
      if (!s) {
        setShopStatus({ loading: false, message: 'Shop not found for this slug' })
        return
      }
      setShopForm(f => ({
        ...f,
        name: s.name || f.name,
        slug: s.slug || slug,
        description: s.description || f.description,
        logo: s.logo || f.logo,
        cover: s.cover || f.cover
      }))
      try {
        localStorage.setItem('lastShopSlug', s.slug || slug)
        localStorage.setItem('lastShopName', s.name || '')
        localStorage.setItem('lastShopDescription', s.description || '')
        localStorage.setItem('lastShopLogo', s.logo || '')
        localStorage.setItem('lastShopCover', s.cover || '')
      } catch {}
      setShopStatus({ loading: false, message: '✅ Loaded from storefront' })
    } catch (e) {
      setShopStatus({ loading: false, message: 'Failed to load: ' + (e?.message || 'Unknown error') })
    }
  }

  const openFilePicker = () => fileInputRef.current && fileInputRef.current.click()

  const onPhotoSelected = async (e) => {
    const user = firebaseAuth.currentUser
    if (!user) return
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setSaving(true)
    try {
      const url = await uploadProfilePhoto(user.uid, file)
      setProfile(p => ({ ...p, photoURL: url }))
    } finally {
      setSaving(false)
    }
  }

  // Logo/Cover upload handlers (component scope)
  const openLogoPicker = () => logoInputRef.current && logoInputRef.current.click()
  const openCoverPicker = () => coverInputRef.current && coverInputRef.current.click()
  const onLogoSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      setShopStatus({ loading: true, message: 'Uploading logo...' })
      const url = await uploadPublicAsset(file, { folder: 'flowlink/shops/logos' })
      setShopForm(f => ({ ...f, logo: url }))
      setShopStatus({ loading: false, message: '✅ Logo uploaded' })
    } catch (err) {
      setShopStatus({ loading: false, message: 'Failed to upload logo' })
    }
  }
  const onCoverSelected = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      setShopStatus({ loading: true, message: 'Uploading cover...' })
      const url = await uploadPublicAsset(file, { folder: 'flowlink/shops/covers' })
      setShopForm(f => ({ ...f, cover: url }))
      setShopStatus({ loading: false, message: '✅ Cover uploaded' })
    } catch (err) {
      setShopStatus({ loading: false, message: 'Failed to upload cover' })
    }
  }

  // SVG placeholder helpers
  const svgPlaceholder = (text = '•') => {
    const t = String(text || '•').slice(0, 2).toUpperCase()
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#eef2ff'/>
      <stop offset='100%' stop-color='#e0f2fe'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' rx='16' ry='16' fill='url(#g)'/>
  <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='#0f172a' font-family='Arial, sans-serif'>${t}</text>
 </svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  }

  // Order helpers for consistent UI data
  const calcItemsTotal = (o) => {
    let t = 0
    for (const it of (o?.items || [])) {
      const q = Number(it?.quantity || 1)
      const p = Number(it?.price || 0)
      if (!Number.isNaN(q) && !Number.isNaN(p)) t += q * p
    }
    return t
  }
  const getAmount = (o) => {
    const paid = o?.payment?.amount
    if (paid != null) return Number(paid)
    const total = o?.totalPrice
    if (total != null) return Number(total)
    const tot2 = o?.totals?.total
    if (tot2 != null) return Number(tot2)
    return calcItemsTotal(o)
  }
  const getPaymentMethod = (o) => (o?.payment?.mode || o?.payment?.method || '').toUpperCase()
  const getFirstItem = (o) => {
    const it = (o?.items || [])[0] || {}
    const title = it?.title || it?.name || o?.productTitle || o?.productName || o?.title || o?.name || '—'
    const image = it?.image || o?.productImage || o?.image || (Array.isArray(o?.images) && o.images.length ? o.images[0] : undefined)
    return { title, image }
  }

  // Loaders for Orders and Inventory tabs
  const loadOrders = async () => {
    try {
      setOrdersLoading(true)
      setOrdersError('')
      const items = await listOrders({ status: 'All' })
      setOrders(Array.isArray(items) ? items : [])
    } catch (e) {
      setOrdersError(e?.message || 'Failed to load orders')
      try {
        const raw = localStorage.getItem('orderHistory')
        const local = raw ? JSON.parse(raw) : []
        setOrders(Array.isArray(local) ? local : [])
      } catch {
        setOrders([])
      }
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      setInventoryLoading(true)
      setInventoryError('')
      const list = await listProducts({ status: 'All' })
      setInventory(Array.isArray(list) ? list : [])
    } catch (e) {
      setInventoryError(e?.message || 'Failed to load products')
      setInventory([])
    } finally {
      setInventoryLoading(false)
    }
  }

  // Auto-load on tab switch
  useEffect(() => {
    if (!authReady) return
    if (activeTab === 'Orders' || activeTab === 'Payments') {
      loadOrders()
    } else if (activeTab === 'Inventory') {
      loadInventory()
    } else if (activeTab === 'Overview') {
      // Prefetch for dynamic overview cards
      loadOrders()
      loadInventory()
    }
  }, [activeTab, shopForm.slug, authReady])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview': {
        const totalOrders = orders.length
        const pendingOrders = orders.filter(o => String(o?.status || 'Pending') === 'Pending').length
        const totalRevenue = orders.reduce((s,o)=> s + Number(getAmount(o) || 0), 0)
        const now = new Date()
        const thisMonthRevenue = orders
          .filter(o => { const d = new Date(o.createdAt || now); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear() })
          .reduce((s,o)=> s + Number(getAmount(o) || 0), 0)
        const recent = orders.slice(0, 5)
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="border rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white">
                <div className="text-xs text-gray-600">Total Orders</div>
                <div className="text-2xl font-semibold">{totalOrders}</div>
              </div>
              <div className="border rounded-xl p-4">
                <div className="text-xs text-gray-600">Pending Orders</div>
                <div className="text-2xl font-semibold">{pendingOrders}</div>
              </div>
              <div className="border rounded-xl p-4">
                <div className="text-xs text-gray-600">This Month</div>
                <div className="text-2xl font-semibold">₹{thisMonthRevenue}</div>
              </div>
              <div className="border rounded-xl p-4">
                <div className="text-xs text-gray-600">Total Revenue</div>
                <div className="text-2xl font-semibold">₹{totalRevenue}</div>
              </div>
            </div>
            <h3 className="text-sm font-semibold mb-2">Recent Orders</h3>
            {ordersLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-gray-600">No recent orders.</p>
            ) : (
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <div className="min-w-[640px] md:min-w-0">
                  <table className="w-full text-left text-sm border border-gray-200">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2">Item</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((o,i)=> (
                        <tr key={o._id || i} className="border-b">
                          <td className="px-4 py-2">
                            {(() => { const f = getFirstItem(o); return (
                              <div className="flex items-center gap-2">
                                {f.image ? (
                                  <img src={f.image} alt="" className="w-8 h-8 rounded object-cover" onError={(e)=>{ e.currentTarget.src = svgPlaceholder(f.title?.[0] || 'O') }} />
                                ) : (
                                  <img src={svgPlaceholder((f.title||'O')[0])} alt="" className="w-8 h-8 rounded object-cover" />
                                )}
                                <span className="text-sm text-[#303030] line-clamp-1">{f.title}</span>
                              </div>
                            )})()}
                          </td>
                          <td className="py-2">{new Date(o.createdAt || Date.now()).toLocaleString()}</td>
                          <td className="py-2">₹{getAmount(o)}</td>
                          <td className="py-2">{getPaymentMethod(o)} · {o?.payment?.status || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'Orders':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Orders</h3>
              <button onClick={loadOrders} className="text-xs px-2 py-1 border rounded">Refresh</button>
            </div>
            {ordersLoading ? (
              <p className="text-sm text-gray-500">Loading orders...</p>
            ) : ordersError ? (
              <p className="text-sm text-red-600">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-600">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <div className="min-w-[720px] md:min-w-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Item</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Items</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o, i) => (
                        <tr key={o._id || i} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            {(() => { const f = getFirstItem(o); return (
                              <div className="flex items-center gap-2">
                                {f.image ? (
                                  <img src={f.image} alt="" className="w-8 h-8 rounded object-cover" onError={(e)=>{ e.currentTarget.src = svgPlaceholder(f.title?.[0] || 'O') }} />
                                ) : (
                                  <img src={svgPlaceholder((f.title||'O')[0])} alt="" className="w-8 h-8 rounded object-cover" />
                                )}
                                <span className="text-sm text-[#303030] line-clamp-1">{f.title}</span>
                              </div>
                            )})()}
                          </td>
                          <td className="py-2">{new Date(o.createdAt || Date.now()).toLocaleString()}</td>
                          <td className="py-2">{Array.isArray(o.items) ? o.items.length : 0}</td>
                          <td className="py-2 font-semibold">₹{getAmount(o)}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 rounded-full text-xs border">{getPaymentMethod(o) || 'N/A'} · {o?.payment?.status || '—'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'Inventory':
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Inventory</h3>
              <button onClick={loadInventory} className="text-xs px-2 py-1 border rounded">Refresh</button>
            </div>
            {inventoryLoading ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : inventoryError ? (
              <p className="text-sm text-red-600">{inventoryError}</p>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-gray-600">{shopForm.slug ? 'No products found for this shop.' : 'Set up your Shop (slug) to sync inventory.'}</p>
            ) : (
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <div className="min-w-[720px] md:min-w-0">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Image</th>
                        <th className="py-2">Title</th>
                        <th className="py-2">Category</th>
                        <th className="py-2">Price</th>
                        <th className="py-2">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((p, i) => {
                        const img = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.image || '')
                        return (
                          <tr key={p._id || i} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              {img ? (
                                <img src={img} alt="" className="h-8 w-8 rounded object-cover" onError={(e)=>{ const t=e.currentTarget; t.src = svgPlaceholder((p.title||p.name||'P')[0]) }} />
                              ) : (
                                <img src={svgPlaceholder((p.title||p.name||'P')[0])} alt="" className="h-8 w-8 rounded object-cover" />
                              )}
                            </td>
                            <td className="py-2">{p.title || p.name || 'Untitled'}</td>
                            <td className="py-2">{p.category || '—'}</td>
                            <td className="py-2">₹{p.price ?? 0}</td>
                            <td className="py-2">{p.quantity ?? 0}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      case 'Payments': {
        const paid = orders.filter(o => String(o?.payment?.status || '').toLowerCase().includes('paid'))
        const cod = orders.filter(o => String(getPaymentMethod(o) || '').toLowerCase() === 'cod')
        const totalRevenue = orders.reduce((s,o)=> s + Number(getAmount(o) || 0), 0)
        const methodBreakdown = orders.reduce((acc,o)=>{ const k=String(o?.payment?.method||'unknown').toUpperCase(); acc[k]=(acc[k]||0)+1; return acc }, {})
        return (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Payments</h3>
              <button onClick={loadOrders} className="text-xs px-2 py-1 border rounded">Refresh</button>
            </div>
            {ordersLoading ? (
              <p className="text-sm text-gray-500">Loading payments...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="border rounded-lg p-3"><div className="text-xs text-gray-500">Total Revenue</div><div className="text-lg font-semibold">₹{totalRevenue}</div></div>
                  <div className="border rounded-lg p-3"><div className="text-xs text-gray-500">Paid Orders</div><div className="text-lg font-semibold">{paid.length}</div></div>
                  <div className="border rounded-lg p-3"><div className="text-xs text-gray-500">COD Orders</div><div className="text-lg font-semibold">{cod.length}</div></div>
                </div>
                <h4 className="text-sm font-medium mb-2">By Method</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(methodBreakdown).length === 0 ? (
                    <span className="text-xs text-gray-500">No data</span>
                  ) : (
                    Object.entries(methodBreakdown).map(([k,v]) => (
                      <span key={k} className="px-2 py-1 rounded-full bg-gray-100 text-xs border">{k}: {v}</span>
                    ))
                  )}
                </div>
                <h4 className="text-sm font-medium mb-2">Recent Payments</h4>
                <div className="overflow-x-auto -mx-2 md:mx-0">
                  <div className="min-w-[640px] md:min-w-0">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Item</th>
                          <th className="py-2">Date</th>
                          <th className="py-2">Amount</th>
                          <th className="py-2">Method</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map((o, i) => (
                          <tr key={o._id || i} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              {(() => { const f = getFirstItem(o); return (
                                <div className="flex items-center gap-2">
                                  {f.image ? (
                                    <img src={f.image} alt="" className="w-8 h-8 rounded object-cover" onError={(e)=>{ e.currentTarget.src = svgPlaceholder(f.title?.[0] || 'O') }} />
                                  ) : (
                                    <img src={svgPlaceholder((f.title||'O')[0])} alt="" className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <span className="text-sm text-[#303030] line-clamp-1">{f.title}</span>
                                </div>
                              )})()}
                            </td>
                            <td className="py-2">{new Date(o.createdAt || Date.now()).toLocaleString()}</td>
                            <td className="py-2">₹{getAmount(o)}</td>
                            <td className="py-2">{getPaymentMethod(o)}</td>
                            <td className="py-2">{o?.payment?.status || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex">
        <main className="flex-1 p-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h1 className="text-2xl font-medium mb-2">Profile</h1>
            <div className="flex justify-center md:justify-start space-x-4 overflow-x-auto">
              <nav className="flex space-x-4 overflow-x-auto pb-2">
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Overview')}
                >
                  Overview
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Orders')}
                >
                  Orders
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Inventory' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Inventory')}
                >
                  Inventory
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Payments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Payments')}
                >
                  Payments
                </button>
                <button
                  className={`px-3 py-1 text-sm ${activeTab === 'Shop' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('Shop')}
                >
                  Shop
                </button>
              </nav>
            </div>
            <div className="flex flex-col md:flex-row mt-4">
              <div className="w-full md:w-1/3 md:pr-6 mb-6 md:mb-0">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative">
                      <img
                        src={profile.photoURL || firebaseAuth.currentUser?.photoURL || svgPlaceholder(profile.displayName || firebaseAuth.currentUser?.displayName || 'U')}
                        alt="Profile"
                        className="w-24 sm:w-32 h-14 rounded-full object-cover"
                        onError={(e)=>{ const t=e.currentTarget; t.src = svgPlaceholder(profile.displayName || firebaseAuth.currentUser?.displayName || 'U') }}
                      />
                      <button type="button" onClick={openFilePicker} className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center rounded-full bg-white border shadow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5h-2l-2 2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1l-2-2h-2z"/><circle cx="12" cy="13" r="3"/></svg>
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelected} style={{ display: 'none' }} />
                    </div>
                    <div>
                      <input className="text-sm border p-1 rounded w-full mb-1" value={profile.displayName} onChange={(e)=>setProfile(p=>({...p, displayName:e.target.value}))} />
                      <input className="text-sm text-gray-600 border p-1 rounded w-full mb-1" placeholder="Role" value={profile.role} onChange={(e)=>setProfile(p=>({...p, role:e.target.value}))} />
                      <input className="text-sm text-gray-600 border p-1 rounded w-full" placeholder="Company" value={profile.company} onChange={(e)=>setProfile(p=>({...p, company:e.target.value}))} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600"><Phone className="inline mr-1 ]" /> <input className="border p-1 rounded" placeholder="Phone" value={profile.phone} onChange={(e)=>setProfile(p=>({...p, phone:e.target.value}))} /></p>
                  <p className="text-sm text-gray-600"><Mail className="inline mr-1 " /> {firebaseAuth.currentUser?.email || ''}</p>
                  <p className="text-sm text-gray-600"><MapPinCheck className="inline mr-1" /> <input className="border p-1 rounded" placeholder="Location" value={profile.location} onChange={(e)=>setProfile(p=>({...p, location:e.target.value}))} /></p>
                  <button onClick={saveProfile} className="mt-2 bg-green-600 text-white px-3 py-1 text-sm rounded" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </div>
              <div className="w-full md:w-2/3">
                {activeTab === 'Shop' ? (
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-sm font-semibold mb-3">Shop Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Shop Name</label>
                        <input className="w-full border rounded p-2 text-sm" value={shopForm.name} onChange={(e)=> setShopForm(f=>({...f, name: e.target.value, slug: toSlug(e.target.value)}))} placeholder="e.g. Gandhi Store" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">URL Slug</label>
                        <div className="flex gap-2">
                          <input className="flex-1 border rounded p-2 text-sm" value={shopForm.slug} onChange={(e)=> setShopForm(f=>({...f, slug: toSlug(e.target.value)}))} placeholder="e.g. gandhistore" />
                          <button type="button" onClick={hydrateShopFromSlug} className="px-3 py-2 text-xs rounded border">Load</button>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Description</label>
                        <textarea className="w-full border rounded p-2 text-sm" rows={3} value={shopForm.description} onChange={(e)=> setShopForm(f=>({...f, description: e.target.value}))} placeholder="Short tagline about your shop"></textarea>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Logo URL</label>
                        <input className="w-full border rounded p-2 text-sm" value={shopForm.logo} onChange={(e)=> setShopForm(f=>({...f, logo: e.target.value}))} placeholder="https://.../logo.png" />
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={openLogoPicker} className="px-3 py-1 text-xs rounded border">Upload Logo</button>
                          <input ref={logoInputRef} type="file" accept="image/*" onChange={onLogoSelected} style={{ display: 'none' }} />
                        </div>
                        {shopForm.logo && (
                          <img src={shopForm.logo} alt="Logo Preview" className="mt-2 h-12 object-contain border rounded" onError={(e)=>{ const t=e.currentTarget; t.style.display='none'; }} />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cover URL</label>
                        <input className="w-full border rounded p-2 text-sm" value={shopForm.cover} onChange={(e)=> setShopForm(f=>({...f, cover: e.target.value}))} placeholder="https://.../cover.jpg" />
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={openCoverPicker} className="px-3 py-1 text-xs rounded border">Upload Cover</button>
                          <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverSelected} style={{ display: 'none' }} />
                        </div>
                        {shopForm.cover && (
                          <img src={shopForm.cover} alt="Cover Preview" className="mt-2 h-16 w-full object-cover border rounded" onError={(e)=>{ const t=e.currentTarget; t.style.display='none'; }} />
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <button onClick={saveShop} disabled={shopStatus.loading} className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60">{shopStatus.loading ? 'Saving...' : 'Save Shop'}</button>
                      {shopStatus.message && <span className="text-sm text-gray-600">{shopStatus.message}</span>}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">Your storefront will be available at: <code>/:slug</code>, e.g. <code>/gandhistore</code></div>
                  </div>
                ) : renderTabContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </LayoutWrapper>
  );
};

export default Setting;