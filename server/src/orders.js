import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

const orderItemSchema = new mongoose.Schema({
  productId: String,
  title: String,
  name: String,
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  image: String
}, { _id: false })

const shippingAddressSchema = new mongoose.Schema({
  name: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String
}, { _id: false })

const shippingSchema = new mongoose.Schema({
  carrier: String,
  trackingNumber: String,
  trackingStatus: String
}, { _id: false })

const paymentSchema = new mongoose.Schema({
  mode: String, // e.g., COD, Card, UPI, PayPal
  method: String, // alternative field name used by some sources
  amount: { type: Number, default: 0 },
  status: { type: String, default: 'Unpaid' }, // Unpaid | Paid | Partially Paid | Refunded
  transactionId: String,
  paidAt: Date
}, { _id: false })

const orderSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  customerId: { type: String },
  customerName: String,
  customerEmail: String,
  items: [orderItemSchema],
  currency: { type: String, default: 'USD' },
  totalPrice: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' }, // Pending | Approved | Denied | Shipped | Delivered | Cancelled
  shippingAddress: shippingAddressSchema,
  shipping: shippingSchema,
  payment: paymentSchema,
  notes: String
}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)

function normalizeAddress(src) {
  if (!src || typeof src !== 'object') return null
  const get = (...keys) => {
    for (const k of keys) {
      const v = src[k]
      if (v !== undefined && v !== null && String(v).trim() !== '') return v
    }
    return undefined
  }
  // Build name with fallbacks including first/last
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
  const normalized = { name, line1, line2, city, state, postalCode, country, phone }
  if (email) normalized.email = email
  const hasValue = Object.values(normalized).some(v => v)
  return hasValue ? normalized : null
}

// Helper: enrich orders with product titles/images and payment fallbacks
async function enrichOrders(orders) {
  try {
    if (!Array.isArray(orders) || orders.length === 0) return orders
    // Collect productIds that need enrichment
    const ids = []
    for (const o of orders) {
    // Ensure payment defaults
    o.payment = o.payment || {}
    // Map alternative field names
    if (!o.payment.mode && o?.payment?.method) {
      o.payment.mode = o.payment.method
    }
      // Compute item total
      let itemsTotal = 0
      for (const it of (o.items || [])) {
        const q = Number(it?.quantity || 1)
        const p = Number(it?.price || 0)
        if (!Number.isNaN(q) && !Number.isNaN(p)) itemsTotal += q * p
      }
      // Normalize totalPrice
      const numericTotal = typeof o.totalPrice === 'number' ? o.totalPrice : Number(o.totalPrice || 0)
      if (!numericTotal && itemsTotal > 0) {
        o.totalPrice = itemsTotal
      }
      // Default payment amount
      if (o.payment.amount == null || Number(o.payment.amount) === 0) {
        const altTotals = [
          o.payment?.totalPaid,
          o.amountPaid,
          o.amount_paid,
          o.paid,
          o.total,
          o.subtotal,
          o.grand_total,
          o.amount
        ].map((v)=> Number(v || 0))
        const bestAlt = altTotals.find(v => v > 0) || 0
        o.payment.amount = (itemsTotal > 0 ? itemsTotal : (numericTotal || 0)) || bestAlt
      }
      if (!o.payment.mode) o.payment.mode = o?.payment?.method || o.paymentMode || o.modeOfPayment || o.payment_method || o.paymentMethod || o.method || o.payMode || o.payment_type || o.gateway || o.payment_gateway || o.paymentGateway || o.mode || o.pay_method || o.paymentModeType || o.payment_method_type || null
      // Customer name fallback
      if (!o.customerName) {
        // Common root-level variants
        if (o.customer_name && typeof o.customer_name === 'string') o.customerName = o.customer_name
        if (!o.customerName && typeof o.name === 'string') o.customerName = o.name
        const n = o?.shippingAddress?.name
        if (n) o.customerName = n
        else if (o?.customer && (o.customer.firstName || o.customer.lastName)) {
          o.customerName = [o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ').trim()
        }
      }
      if (!o.customerName && o.customerEmail) {
        o.customerName = o.customerEmail
      }
      // Collect product ids if title/image missing
      for (const it of (o.items || [])) {
        // If "name" exists but "title" is missing, map it for UI compatibility
        if (it && !it.title && it.name) it.title = it.name
        if (it && it.productId && (!it.title || !it.image)) ids.push(String(it.productId))
      }
      // Synthesize item from order-level fields if needed
      const orderLevelTitle = o.productTitle || o.productName || o.title || o.name || null
      const orderLevelImage = o.productImage || o.image || (Array.isArray(o.images) && o.images.length ? o.images[0] : null)
      const orderLevelQty = Number(o.quantity || 1)
      const orderLevelPrice = Number(o.amount || o.totalAmount || o.price || o.totalPrice || 0)
      const lineItems = Array.isArray(o.lineItems) ? o.lineItems : (Array.isArray(o.line_items) ? o.line_items : null)
      const productsArr = Array.isArray(o.products) ? o.products : null
      if (!Array.isArray(o.items) || o.items.length === 0) {
        const src = (lineItems && lineItems.length ? lineItems : (productsArr && productsArr.length ? productsArr : null))
        if (src) {
          o.items = src.map(li => ({
            productId: li.productId || li.product_id || li.id || null,
            title: li.title || li.name || li.productTitle || li.product_name,
            image: li.image || li.productImage || (Array.isArray(li.images) && li.images.length ? li.images[0] : undefined),
            quantity: Number(li.quantity || li.qty || 1),
            price: Number(li.price || li.unit_price || li.amount || 0)
          }))
        }
      }
      if (!Array.isArray(o.items) || o.items.length === 0) {
        o.items = [{
          productId: null,
          title: orderLevelTitle || undefined,
          image: orderLevelImage || undefined,
          quantity: Number.isNaN(orderLevelQty) ? 1 : orderLevelQty,
          price: Number.isNaN(orderLevelPrice) ? 0 : orderLevelPrice
        }]
      } else {
        // Fill missing title/image from order-level as last resort
        for (const it of o.items) {
          if (!it.title && orderLevelTitle) it.title = orderLevelTitle
          if (!it.image && orderLevelImage) it.image = orderLevelImage
        }
      }

      // Customer email fallback
      if (!o.customerEmail) {
        o.customerEmail = o?.customer?.email || o?.email || o?.shippingAddress?.email || o?.billingAddress?.email || null
      }

      // Shipping address normalization and fallbacks
      if (!o.shippingAddress || typeof o.shippingAddress !== 'object') {
        const addr = normalizeAddress(o.shippingAddress) || normalizeAddress(o.shipping_address) || normalizeAddress(o.shipping) || normalizeAddress(o.address) || normalizeAddress(o.deliveryAddress) || normalizeAddress(o.billingAddress) || null
        if (addr) o.shippingAddress = addr
      } else {
        // Fill missing pieces from alternates
        const alt = normalizeAddress(o.shipping_address) || normalizeAddress(o.shipping) || normalizeAddress(o.address) || normalizeAddress(o.deliveryAddress) || normalizeAddress(o.billingAddress)
        if (alt) {
          o.shippingAddress = {
            name: o.shippingAddress.name || alt.name,
            line1: o.shippingAddress.line1 || alt.line1,
            line2: o.shippingAddress.line2 || alt.line2,
            city: o.shippingAddress.city || alt.city,
            state: o.shippingAddress.state || alt.state,
            postalCode: o.shippingAddress.postalCode || alt.postalCode,
            country: o.shippingAddress.country || alt.country,
            phone: o.shippingAddress.phone || alt.phone,
            email: o.shippingAddress.email || alt.email
          }
        }
      }
      // Final customer name fallback from normalized shipping
      if (!o.customerName && o?.shippingAddress?.name) {
        o.customerName = o.shippingAddress.name
      }
    }
    const unique = [...new Set(ids)].filter((s) => mongoose.Types.ObjectId.isValid(s))
    const objIds = unique.map((s) => new mongoose.Types.ObjectId(s))
    // Also collect customer identifiers
    const cidSet = new Set()
    const emailSet = new Set()
    const phoneSet = new Set()
    for (const o of orders) {
      if (o.customerId && mongoose.Types.ObjectId.isValid(String(o.customerId))) cidSet.add(String(o.customerId))
      const candEmails = [o.customerEmail, o.email, o?.shippingAddress?.email, o?.billingAddress?.email].filter(Boolean)
      for (const e of candEmails) emailSet.add(String(e).toLowerCase())
      const candPhones = [o?.shippingAddress?.phone, o?.billingAddress?.phone, o?.customer?.phone, o?.phone].filter(Boolean)
      for (const p of candPhones) phoneSet.add(String(p))
    }
    const cids = [...cidSet].map(s => new mongoose.Types.ObjectId(s))
    const emails = [...emailSet]
    const phones = [...phoneSet]

    // Query products minimally
    const products = objIds.length ? await mongoose.connection.db
      .collection('products')
      .find({ _id: { $in: objIds } }, { projection: { title: 1, images: 1 } })
      .toArray() : []
    const pmap = new Map(products.map(p => [String(p._id), p]))

    // Query customers to fill names/emails
    const custCol = mongoose.connection.db.collection('customers')
    const byId = cids.length ? await custCol
      .find({ _id: { $in: cids } }, { projection: { firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } })
      .toArray() : []
    const byEmail = emails.length ? await custCol
      .find({ email: { $in: emails } }, { projection: { firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } })
      .toArray() : []
    const byPhone = phones.length ? await custCol
      .find({ phoneNumber: { $in: phones } }, { projection: { firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } })
      .toArray() : []
    const cmap = new Map(byId.map(c => [String(c._id), c]))
    const cemail = new Map(byEmail.map(c => [String(c.email || '').toLowerCase(), c]))
    const cphone = new Map(byPhone.map(c => [String(c.phoneNumber || ''), c]))
    // Fill missing fields
    for (const o of orders) {
      for (const it of (o.items || [])) {
        const pid = it && it.productId && mongoose.Types.ObjectId.isValid(String(it.productId)) ? String(it.productId) : null
        if (pid && pmap.has(pid)) {
          const p = pmap.get(pid)
          if (!it.title && p?.title) it.title = p.title
          if (!it.image && Array.isArray(p?.images) && p.images.length > 0) it.image = p.images[0]
        }
      }
      const fillFromCustomer = (c) => {
        if (!c) return
        if (!o.customerName) {
          const nm = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
          if (nm) o.customerName = nm
        }
        if (!o.customerEmail && c.email) o.customerEmail = c.email
      }
      if ((!o.customerName || !o.customerEmail) && o.customerId) {
        const cid = String(o.customerId)
        fillFromCustomer(cmap.get(cid))
      }
      if (!o.customerName || !o.customerEmail) {
        const em = (o.customerEmail || o.email || o?.shippingAddress?.email || o?.billingAddress?.email || '').toLowerCase()
        if (em) fillFromCustomer(cemail.get(em))
      }
      if (!o.customerName || !o.customerEmail) {
        const ph = o?.shippingAddress?.phone || o?.billingAddress?.phone || o?.customer?.phone || o?.phone
        if (ph) fillFromCustomer(cphone.get(String(ph)))
      }
    }
  } catch (e) {
    // Best-effort enrichment; ignore errors
  }
  return orders
}

// Create order
router.post('/', async (req, res) => {
  try {
    const userId = req.get('x-user-id') || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const payload = { ...req.body, userId }
    const doc = await Order.create(payload)
    res.status(201).json({ id: doc._id.toString() })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// List orders (optionally filter by status)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const filter = { userId }
    if (status && status !== 'All') filter.status = status
    const docs = await Order.find(filter).sort({ createdAt: -1 }).lean()
    await enrichOrders(docs)
    res.json(docs)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Get single order details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Order.findOne({ _id: id, userId }).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    const [enriched] = await enrichOrders([doc])
    res.json(enriched)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Update status (and optional shipping tracking status)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    const { status, shipping, payment } = req.body || {}
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    if (!status && !shipping && !payment) return res.status(400).json({ error: 'Nothing to update' })

    const update = {}
    if (status) update.status = status
    if (shipping && typeof shipping === 'object') {
      for (const k of Object.keys(shipping)) {
        update[`shipping.${k}`] = shipping[k]
      }
    }
    if (payment && typeof payment === 'object') {
      for (const k of Object.keys(payment)) {
        update[`payment.${k}`] = payment[k]
      }
    }
    const doc = await Order.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true }).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, order: doc })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Approve order
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Order.findOneAndUpdate({ _id: id, userId }, { $set: { status: 'Approved' } }, { new: true }).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, order: doc })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Deny order
router.post('/:id/deny', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Order.findOneAndUpdate({ _id: id, userId }, { $set: { status: 'Denied' } }, { new: true }).lean()
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, order: doc })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router

router.get('/analytics', async (req, res) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days || 7)))
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const end = new Date()
    const start = new Date(end)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))
    const docs = await Order.find({ userId, createdAt: { $gte: start } }).sort({ createdAt: 1 }).lean()
    const series = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      series.push({ date: d.toISOString().slice(0, 10), visitors: 0, orders: 0, revenue: 0 })
    }
    const custCount = new Map()
    for (const o of docs) {
      const key = String(o.customerId || (o.customerEmail || '').toLowerCase() || (o?.shippingAddress?.phone || ''))
      if (key) custCount.set(key, (custCount.get(key) || 0) + 1)
      const dt = new Date(o.createdAt)
      const idx = Math.floor((dt - start) / (24 * 60 * 60 * 1000))
      if (idx < 0 || idx >= days) continue
      let amount = 0
      if (o && o.payment) {
        const p = o.payment
        amount = Number(p.amount || p.totalPaid || o.amountPaid || o.total || o.subtotal || 0) || 0
      }
      if (!amount) {
        let t = 0
        for (const it of (o.items || [])) {
          const q = Number(it?.quantity || 1)
          const pr = Number(it?.price || 0)
          if (!Number.isNaN(q) && !Number.isNaN(pr)) t += q * pr
        }
        amount = t || Number(o.totalPrice || 0) || 0
      }
      series[idx].orders += 1
      series[idx].revenue = Number((series[idx].revenue + amount).toFixed(2))
    }
    const totals_orders = series.reduce((s, r) => s + r.orders, 0)
    const totals_revenue = Number(series.reduce((s, r) => s + r.revenue, 0).toFixed(2))
    const uniqueCustomers = Array.from(custCount.keys()).length
    let returningOrders = 0
    for (const v of custCount.values()) { if (v > 1) returningOrders += v - 1 }
    const conversionRate = totals_orders ? Math.round((returningOrders / totals_orders) * 10000) / 100 : 0
    res.json({ range: `last_${days}_days`, series, totals: { visitors: uniqueCustomers, orders: totals_orders, revenue: totals_revenue, conversionRate } })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})
