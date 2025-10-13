import React, {useEffect, useRef, useState} from 'react'

import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterTabs from '../components/FilterTabs'
import { listOrders, approveOrder, denyOrder, getOrder, updateOrderStatus, listProducts } from '../services/db'
import { AnimatePresence, motion } from 'framer-motion'

const OrdersPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [productIndex, setProductIndex] = useState({}) // map of productId -> product

  const statusOptions = ['All','Pending','Approved','Denied','Shipped','Delivered','Cancelled']

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Load products when filter changes
  useEffect(() => {
    ;(async () => {
      try {
        const items = await listOrders({ status: selectedStatus })
        setOrders(Array.isArray(items) ? items : [])
      } catch (e) {
        setOrders([])
      }
    })()
  }, [selectedStatus, updating])

  useEffect(() => {
    if (!selectedOrderId) return setSelectedOrder(null)
    ;(async () => {
      try {
        const detail = await getOrder(selectedOrderId)
        setSelectedOrder(detail)
      } catch (e) {
        setSelectedOrder(null)
      }
    })()
  }, [selectedOrderId, updating])

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelectedOrderId(null) }
    if (selectedOrderId) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [selectedOrderId])

  // Body scroll-lock when drawer is open
  useEffect(() => {
    if (!selectedOrderId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [selectedOrderId])

  // Focus management: focus close button when opened
  const closeBtnRef = useRef(null)
  useEffect(() => {
    if (selectedOrderId) {
      // delay to ensure element exists
      setTimeout(() => { try { closeBtnRef.current?.focus() } catch {} }, 0)
    }
  }, [selectedOrderId])

  // Load products once to enrich order items (title/image) for UI
  useEffect(() => {
    ;(async () => {
      try {
        const prods = await listProducts({ status: 'All' })
        const m = {}
        for (const p of (prods || [])) {
          const id = String(p._id || p.id || '')
          if (id) m[id] = p
        }
        setProductIndex(m)
      } catch {}
    })()
  }, [])

  const displayId = (o) => o?._id || o?.id || ''
  const fmtDate = (d) => {
    if (!d) return '—'
    const dt = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d?.toDate ? d.toDate() : new Date()
    return isNaN(dt) ? '—' : dt.toLocaleString()
  }
  const fmtMoney = (n, cur='USD') => {
    const amount = typeof n === 'number' ? n : Number(n || 0)
    try { return new Intl.NumberFormat(undefined, { style:'currency', currency: cur }).format(amount) } catch { return `${amount.toFixed(2)} ${cur}` }
  }

  const calcItemsTotal = (o) => {
    let t = 0
    for (const it of (o?.items || [])) {
      const q = Number(it?.quantity || 1)
      const p = Number(it?.price || 0)
      if (!Number.isNaN(q) && !Number.isNaN(p)) t += q * p
    }
    return t
  }

  const normalizeAddress = (src) => {
    if (!src || typeof src !== 'object') return null
    const get = (...keys) => {
      for (const k of keys) {
        const v = src[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') return v
      }
      return undefined
    }
    let name = get('name','fullName','full_name','recipient','contactName','contact_name')
    const first = get('firstName','first_name')
    const last = get('lastName','last_name')
    if (!name && (first || last)) name = [first, last].filter(Boolean).join(' ').trim()
    const line1 = get('line1','address1','address_1','street1','street_1','address','street','line_1')
    const line2 = get('line2','address2','address_2','street2','street_2','apt','apartment','suite','unit','line_2')
    const city = get('city','town','locality')
    const state = get('state','province','region','state_code','stateCode')
    const postalCode = get('postalCode','postal_code','zip','zipCode','postcode')
    const country = get('country','countryName','country_name','countryCode','country_code')
    const phone = get('phone','phoneNumber','phone_number','contact')
    const email = get('email')
    const out = { name, line1, line2, city, state, postalCode, country, phone }
    if (email) out.email = email
    return Object.values(out).some(v => v) ? out : null
  }

  const resolveAddress = (o) => {
    return (
      normalizeAddress(o?.shippingAddress) ||
      normalizeAddress(o?.shipping_address) ||
      normalizeAddress(o?.shipping) ||
      normalizeAddress(o?.address) ||
      normalizeAddress(o?.deliveryAddress) ||
      normalizeAddress(o?.billingAddress) ||
      null
    )
  }

  const resolveFirstItem = (o) => {
    const it = (o?.items || [])[0] || {}
    const pid = it?.productId ? String(it.productId) : ''
    const prod = pid && productIndex[pid] ? productIndex[pid] : null
    const title = it?.title || it?.name || prod?.title || o?.productTitle || o?.productName || o?.title || o?.name || '—'
    const image = it?.image || (Array.isArray(prod?.images) ? prod.images[0] : undefined) || o?.productImage || o?.image || (Array.isArray(o?.images) ? o.images[0] : undefined)
    return { title, image }
  }

  const resolveCustomerName = (o) => {
    return (
      o?.customerName ||
      resolveAddress(o)?.name ||
      [o?.customer?.firstName, o?.customer?.lastName].filter(Boolean).join(' ') ||
      o?.customerEmail || o?.email ||
      '—'
    )
  }

  const resolvePaymentMode = (o) => {
    return (
      o?.payment?.mode || o?.payment?.method ||
      o?.paymentMode || o?.modeOfPayment || o?.payment_method || o?.paymentMethod ||
      o?.method || o?.payMode || o?.payment_type || o?.gateway || o?.payment_gateway || o?.paymentGateway ||
      '—'
    )
  }

  const resolveAmountPaid = (o) => {
    const paid = o?.payment?.amount
    if (paid != null) return Number(paid)
    const total = o?.totalPrice
    if (total != null) return Number(total)
    const tot2 = o?.totals?.total
    if (tot2 != null) return Number(tot2)
    return calcItemsTotal(o)
  }

  const onApprove = async (o) => {
    const id = displayId(o)
    if (!id) return
    setUpdating(true)
    try {
      await approveOrder(id)
    } finally {
      setUpdating(false)
    }
  }

  const onDeny = async (o) => {
    const id = displayId(o)
    if (!id) return
    setUpdating(true)
    try {
      await denyOrder(id)
    } finally {
      setUpdating(false)
    }
  }

  const onUpdateShipping = async (data) => {
    const id = selectedOrderId
    if (!id) return
    setUpdating(true)
    try {
      await updateOrderStatus(id, data)
    } finally {
      setUpdating(false)
    }
  }

  const renderStatusBadge = (status) => {
    const s = (status || 'Pending')
    const map = {
      Pending: 'bg-amber-100 text-amber-800',
      Approved: 'bg-emerald-100 text-emerald-800',
      Denied: 'bg-rose-100 text-rose-800',
      Shipped: 'bg-blue-100 text-blue-800',
      Delivered: 'bg-indigo-100 text-indigo-800',
      Cancelled: 'bg-gray-200 text-gray-700'
    }
    return <span className={`inline-block px-2 py-0.5 rounded text-xs ${map[s] || 'bg-gray-100 text-gray-800'}`}>{s}</span>
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
      <div className="w-full">
        <Helmet>
          <title>Orders - FlowLink</title>
          <meta property="og:title" content="Orders - FlowLink" />
        </Helmet>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 7H9l-1-2H4v14h16V7z"></path>
            </svg>
          </div>
          <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Orders</h1>
        </div>

        <FilterTabs value={selectedStatus} onChange={setSelectedStatus} options={statusOptions} />

        {/* Orders list */}
        {orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((o, i) => {
              const firstItem = resolveFirstItem(o)
              const customerName = resolveCustomerName(o)
              const address = resolveAddress(o)
              const paymentMode = resolvePaymentMode(o)
              const amount = resolveAmountPaid(o)
              const orderId = displayId(o)

              return (
                <div key={orderId || i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-brand-green/20">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-10 h-10 rounded-lg bg-green-800 flex items-center justify-center text-white font-semibold text-sm">
                        #{orderId.slice(-4)}
                      </div> */}
                      {renderStatusBadge(o.status)}
                    </div>
                    <button
                      className="text-xs bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors duration-200"
                      onClick={() => setSelectedOrderId(orderId)}
                    >
                      View Details
                    </button>
                  </div>

                  {/* Product Image & Info */}
                  <div className="flex items-center gap-3 mb-3">
                    {firstItem.image ? (
                      <img src={firstItem.image} alt="" className="w-20 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-[#303030] line-clamp-2">
                        {firstItem.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {o.items?.length || 1} item{(o.items?.length || 1) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Payment */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs text-gray-600 truncate">{customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="text-xs text-gray-600">{paymentMode}</span>
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="text-sm font-semibold text-[#303030]">
                      {fmtMoney(amount, o.currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {fmtDate(o.createdAt)}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      disabled={o.status === 'Approved'}
                      className="flex-1 h-8 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      onClick={() => onApprove(o)}
                    >
                      Approve
                    </button>
                    <button
                      disabled={o.status === 'Denied'}
                      className="flex-1 h-8 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      onClick={() => onDeny(o)}
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 text-gray-500">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7H9l-1-2H4v14h16V7z"></path>
              </svg>
            </div>
            <h2 className="text-[#303030] text-xl font-semibold font-manrope mb-2">Your orders will show here</h2>
            <p className="text-gray-600 text-sm max-w-[520px] mx-auto">As you receive orders, they will appear in this list.</p>
          </div>
        )}

        <div className="py-4 text-center text-sm text-gray-600">
          <span>
            Learn more about <a href="#" className="text-brand-green hover:underline">orders</a>
          </span>
        </div>
      </div>

      {/* Order details drawer */}
      <AnimatePresence>
        {selectedOrderId && (
          <motion.div
            className="fixed inset-0 z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedOrderId(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-full md:w-[400px] bg-white rounded-t-2xl shadow-2xl overflow-hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-drawer-title"
              tabIndex={-1}
              drag="x"
              dragConstraints={{ left: 0, right: 500 }}
              dragElastic={0.04}
              onDragEnd={(e, info) => {
                if (info?.offset?.x > 100 || info?.velocity?.x > 800) {
                  setSelectedOrderId(null)
                }
              }}
            >
              <div className="p-6 border-b bg-gradient-to-r from-brand-green to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 id="order-drawer-title" className="text-xl font-bold">Order Details</h2>
                      <p className="text-white/80 text-sm">#{selectedOrderId?.slice(-6)}</p>
                    </div>
                  </div>
                  <button ref={closeBtnRef} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200" onClick={() => setSelectedOrderId(null)} aria-label="Close">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto h-[calc(100%-80px)]">
                {!selectedOrder ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                  {/* Order Status Progress */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Order Status
                    </h3>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(selectedOrder.status)}
                      <span className="text-sm text-gray-600">•</span>
                      <span className="text-sm text-gray-600">{fmtDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-[#303030]">{selectedOrder.customerName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-[#303030]">{selectedOrder.customerEmail || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium text-[#303030]">{selectedOrder.payment?.mode || selectedOrder.payment?.method || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount Paid</p>
                        <p className="font-medium text-[#303030]">{fmtMoney((selectedOrder.payment?.amount ?? selectedOrder.totalPrice), selectedOrder.currency)}</p>
                      </div>
                      {selectedOrder.payment?.transactionId && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Transaction ID</p>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded text-[#303030]">{selectedOrder.payment.transactionId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Order Items ({selectedOrder.items?.length || 0})
                    </h3>
                    <div className="space-y-3">
                      {(selectedOrder.items || []).map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          {it.image ? (
                            <img
                              alt=""
                              src={it.image}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                console.warn('Failed to load image:', it.image)
                                e.target.src = '/favicon.ico'
                                e.target.onerror = null
                              }}
                              crossOrigin={it.image?.startsWith('http') ? 'anonymous' : undefined}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-[#303030]">{it.title || it.name || 'Item'}</div>
                            <div className="text-xs text-gray-600">Quantity: {it.quantity || 1}</div>
                            {it.price && (
                              <div className="text-xs text-gray-600">
                                Unit Price: {fmtMoney(it.price, selectedOrder.currency)}
                              </div>
                            )}
                            {it.image && (
                              <div className="text-xs text-blue-600 mt-1">
                                Image: {it.image.length > 40 ? `${it.image.substring(0, 40)}...` : it.image}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm text-[#303030]">
                              {fmtMoney((it.price || 0) * (it.quantity || 1), selectedOrder.currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#303030]">Total Amount</span>
                        <span className="font-bold text-lg text-[#303030]">
                          {fmtMoney(selectedOrder.totalPrice, selectedOrder.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Shipping Address
                    </h3>
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-sm text-[#303030] whitespace-pre-line">
                        {(() => {
                          const a = resolveAddress(selectedOrder) || {}
                          const lines = [a.name, a.line1, a.line2, [a.city, a.state, a.postalCode].filter(Boolean).join(', '), a.country, a.phone].filter(Boolean)
                          return lines.length ? lines.join('\n') : '—'
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Status & Management */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#303030] mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Shipping Management
                    </h3>
                    <ShippingForm
                      order={selectedOrder}
                      onUpdate={onUpdateShipping}
                    />
                  </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutWrapper>
  )
}

const ShippingForm = ({ order, onUpdate }) => {
  const [carrier, setCarrier] = useState(order?.shipping?.carrier || '')
  const [trackingNumber, setTrackingNumber] = useState(order?.shipping?.trackingNumber || '')
  const [trackingStatus, setTrackingStatus] = useState(order?.shipping?.trackingStatus || '')
  const [status, setStatus] = useState(order?.status || 'Pending')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCarrier(order?.shipping?.carrier || '')
    setTrackingNumber(order?.shipping?.trackingNumber || '')
    setTrackingStatus(order?.shipping?.trackingStatus || '')
    setStatus(order?.status || 'Pending')
  }, [order])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({ status, shipping: { carrier, trackingNumber, trackingStatus } })
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
          <select className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent" value={status} onChange={e=>setStatus(e.target.value)}>
            {['Pending','Approved','Denied','Shipped','Delivered','Cancelled'].map(s=> (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Carrier</label>
          <input className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent" value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="e.g., DHL, FedEx" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
          <input className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent" value={trackingNumber} onChange={e=>setTrackingNumber(e.target.value)} placeholder="e.g., 1Z999AA1234567890" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Status</label>
          <input className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent" value={trackingStatus} onChange={e=>setTrackingStatus(e.target.value)} placeholder="e.g., In transit, Out for delivery" />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          disabled={saving}
          onClick={handleSave}
          className="w-full h-10 bg-brand-green hover:bg-emerald-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save Updates'
          )}
        </button>
      </div>
    </div>
  )
}

export default OrdersPage
