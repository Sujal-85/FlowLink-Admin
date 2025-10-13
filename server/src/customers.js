import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'

const router = express.Router()

const addressSchema = new mongoose.Schema({
  name: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  phone: String,
  email: String,
  label: { type: String, default: 'shipping' },
  isDefault: { type: Boolean, default: false }
}, { _id: false })

const customerSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  firstName: String,
  lastName: String,
  language: String,
  email: String,
  phoneCountry: String,
  phoneNumber: String,
  marketingEmails: Boolean,
  marketingSMS: Boolean,
  collectTax: String,
  notes: String,
  tags: String,
  status: { type: String, default: 'Active' },
  addresses: { type: [addressSchema], default: [] },
  // Admin-only portal preview fields (store last provisioned values)
  portalEmail: String,
  portalTempPassword: String,
  portalUpdatedAt: Date
}, { timestamps: true })

const Customer = mongoose.model('Customer', customerSchema)

// CSV helpers
function toCsvValue(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s
}

function buildCsv(rows) {
  return rows.map(r => r.map(toCsvValue).join(',')).join('\r\n') + '\r\n'
}

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

// Multer in-memory uploader for CSV
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', async (req, res) => {
  try {
    const userId = req.get('x-user-id') || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const payload = { status: 'Active', ...req.body, userId }
    const doc = await Customer.create(payload)
    res.status(201).json({ id: doc._id.toString() })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Export customers as CSV
router.get('/export', async (req, res) => {
  try {
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const docs = await Customer.find({ userId }).sort({ createdAt: -1 }).lean()
    const header = [
      'firstName','lastName','email','phoneCountry','phoneNumber','status','language','marketingEmails','marketingSMS','collectTax','tags','notes','addressLine1','addressLine2','addressCity','addressState','addressPostalCode','addressCountry'
    ]
    const rows = [header]
    for (const c of docs) {
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
        addr.line1 || '',
        addr.line2 || '',
        addr.city || '',
        addr.state || '',
        addr.postalCode || '',
        addr.country || ''
      ])
    }
    const csv = buildCsv(rows)
    const filename = `customers-${new Date().toISOString().slice(0,10)}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Import customers from CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'Missing file' })
    const raw = req.file.buffer.toString('utf8')
    const table = parseCsv(raw)
    if (!table.length) return res.status(400).json({ error: 'CSV is empty' })
    const header = table[0].map(h => String(h || '').trim().toLowerCase())
    const idx = (name) => header.indexOf(name)
    const get = (row, name, altNames = []) => {
      const names = [name, ...altNames]
      for (const n of names) {
        const at = idx(n)
        if (at >= 0) return row[at] != null ? String(row[at]).trim() : ''
      }
      return ''
    }
    let created = 0
    const failures = []
    for (let r = 1; r < table.length; r++) {
      const row = table[r]
      if (!row || row.length === 0) continue
      const email = get(row, 'email')
      const phoneNumber = get(row, 'phonenumber', ['phone'])
      if (!email && !phoneNumber) { failures.push({ row: r+1, error: 'Missing email/phoneNumber' }); continue }
      try {
        const doc = {
          userId,
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
        }
        const line1 = get(row, 'addressline1', ['line1'])
        const city = get(row, 'addresscity', ['city'])
        const state = get(row, 'addressstate', ['state'])
        const postalCode = get(row, 'addresspostalcode', ['postalcode'])
        const country = get(row, 'addresscountry', ['country']) || 'India'
        const line2 = get(row, 'addressline2', ['line2'])
        if (line1 || city || state || postalCode) {
          doc.addresses = [{
            name: [doc.firstName, doc.lastName].filter(Boolean).join(' ') || undefined,
            line1, line2, city, state, postalCode, country,
            phone: doc.phoneNumber || undefined,
            email: doc.email || undefined,
            label: 'shipping', isDefault: true
          }]
        }
        await Customer.create(doc)
        created++
      } catch (e) {
        failures.push({ row: r+1, error: e.message })
      }
    }
    res.json({ ok: true, created, failed: failures.length, failures })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/', async (req, res) => {
  const { status } = req.query
  const userId = req.get('x-user-id')
  if (!userId) return res.status(401).json({ error: 'Missing user id' })
  const filter = { userId }
  if (status && status !== 'All') filter.status = status
  const docs = await Customer.find(filter).sort({ createdAt: -1 }).lean()
  res.json(docs)
})

// Update portal credentials (admin convenience only)
router.patch('/:id/portal', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const { email, password } = req.body || {}
    const update = { portalUpdatedAt: new Date() }
    if (typeof email === 'string') update.portalEmail = email
    if (typeof password === 'string') update.portalTempPassword = password
    const doc = await Customer.findOneAndUpdate({ _id: id, userId }, { $set: update }, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Customer.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router





