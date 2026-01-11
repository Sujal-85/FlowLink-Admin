import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import multer from 'multer'
import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary'
import customersRouter from './customers.js'
import discountsRouter from './discounts.js'
import ordersRouter from './orders.js'
import offersRouter from './offers.js'
import http from 'http'
import { setupAdminSocket } from '../sockets/admin.socket.js'
dotenv.config()

  // Configure Cloudinary (ensure env vars are set in server/.env)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flowlink'
await mongoose.connect(MONGO_URI)

  const uploadsDir = path.resolve(process.cwd(), 'uploads')
  fs.mkdirSync(uploadsDir, { recursive: true })
  app.use('/uploads', express.static(uploadsDir))


  const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadsDir) },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname) }
  })
  const upload = multer({ storage })

const productSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  title: String,
  description: String,
  // Pricing
  price: { type: Number, default: 0 }, // selling price
  mrp: { type: Number, default: 0 },   // maximum retail price (optional)
  // Inventory
  quantity: { type: Number, default: 0 },
  trackQuantity: Boolean,
  continueSelling: { type: Boolean, default: false },
  // Product identifiers
  sku: String,
  barcode: String,
  // Packaging / Unit
  brand: String,
  unit: String,                 // e.g., g, kg, ml, l, piece, pack
  netWeight: { type: Number },  // numeric value (e.g., 500)
  physicalProduct: Boolean,
  weight: String,
  weightUnit: String,
  chargeTax: Boolean,
  taxRate: { type: Number },    // optional GST/VAT percent
  hsn: String,                  // optional HSN/SAC
  expiryDate: Date,             // optional expiry/best before
  status: String,
  images: [String],
  category: String,
  productType: String,
  vendor: String,
  collections: String,
  tags: String,
  themeTemplate: String
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Mount routers
app.use('/api/orders', ordersRouter)
app.use('/api/customers', customersRouter)
app.use('/api/discounts', discountsRouter)
app.use('/api/offers', offersRouter)

app.post('/api/products', upload.array('media', 10), async (req, res) => {
  try {
    const body = JSON.parse(req.body.product || '{}')
    const userId = req.get('x-user-id') || body.userId
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const uploadedUrls = []
    for (const f of (req.files || [])) {
      // Default local URL fallback (served by express static handler)
      const localUrl = `${req.protocol}://${req.get('host')}/uploads/${path.basename(f.path)}`
      let finalUrl = localUrl
      try {
        // Only attempt Cloudinary if credentials are present
        if (
          process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
        ) {
          const result = await cloudinary.uploader.upload(f.path, {
            folder: process.env.CLOUDINARY_FOLDER || 'flowlink/products',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true
          })
          finalUrl = result.secure_url
          // Best-effort cleanup of temp file only when uploaded to Cloudinary
          try { fs.unlinkSync(f.path) } catch (e) {}
        }
      } catch (err) {
        console.warn('[api] Cloudinary upload failed, using local file URL. Reason:', err?.message || err)
        // Keep local file for static serving; do not unlink
      }
      uploadedUrls.push(finalUrl)
    }
    const doc = await Product.create({ ...body, userId, images: uploadedUrls })
    res.status(201).json({ id: doc._id.toString() })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/products', async (req, res) => {
  const { status } = req.query
  const userId = req.get('x-user-id')
  if (!userId) return res.status(401).json({ error: 'Missing user id' })
  const filter = { userId }
  if (status && status !== 'All') filter.status = status
  const docs = await Product.find(filter).sort({ createdAt: -1 }).lean()
  res.json(docs)
})

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Product.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Helpers: CSV
function toCsvValue(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function buildCsv(rows) {
  return rows.map(r => r.map(toCsvValue).join(',')).join('\r\n') + '\r\n'
}

// Export products as CSV
app.get('/api/products/export', async (req, res) => {
  try {
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const docs = await Product.find({ userId }).sort({ createdAt: -1 }).lean()
    const header = [
      'title','brand','category','sku','barcode','unit','netWeight','mrp','price','quantity','expiryDate','taxRate','hsn','description','image'
    ]
    const rows = [header]
    for (const p of docs) {
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
        images[0] || '' // Only export the first image URL
      ])
    }
    const csv = buildCsv(rows)
    const filename = `products-${new Date().toISOString().slice(0,10)}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Minimal CSV parser that handles quotes and commas
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
    if (ch === '\r') { // normalize CRLF
      if (text[i+1] === '\n') { i += 2; row.push(field); rows.push(row); row = []; field = ''; continue }
      i++; continue
    }
    field += ch; i++
  }
  // flush last field
  row.push(field)
  rows.push(row)
  // trim possible trailing empty row due to newline at end
  if (rows.length && rows[rows.length-1].length === 1 && rows[rows.length-1][0] === '') rows.pop()
  return rows
}

// Import products from CSV
app.post('/api/products/import', upload.single('file'), async (req, res) => {
  try {
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    if (!req.file) return res.status(400).json({ error: 'Missing file' })
    const raw = fs.readFileSync(req.file.path, 'utf8')
    // cleanup temp file
    try { fs.unlinkSync(req.file.path) } catch (e) {}
    const table = parseCsv(raw)
    if (!table.length) return res.status(400).json({ error: 'CSV is empty' })
    const header = table[0].map(h => String(h || '').trim().toLowerCase())
    const requiredIdx = header.indexOf('title')
    if (requiredIdx === -1) return res.status(400).json({ error: 'CSV must include a "title" column' })
    const idx = (name) => header.indexOf(name)
    const createdIds = []
    const failures = []
    for (let r = 1; r < table.length; r++) {
      const row = table[r]
      if (!row || row.length === 0) continue
      const get = (name) => {
        const at = idx(name)
        return at >= 0 ? (row[at] != null ? String(row[at]).trim() : '') : ''
      }
      const title = get('title')
      if (!title) { failures.push({ row: r+1, error: 'Missing title' }); continue }
      const priceStr = get('price'); const mrpStr = get('mrp');
      const quantityStr = get('quantity')
      const taxStr = get('taxrate')
      const expiryStr = get('expirydate')
      const netWeightStr = get('netweight')
      const unit = get('unit') || get('weightunit')
      // Get image URL directly from CSV - support multiple column names
      const imageUrl = get('image') || get('imageUrl') || get('image_url') || get('image1') || ''

      // Debug logging for image import
      console.log(`Row ${r+1} - Title: ${title}, Image URL: ${imageUrl}`)

      let finalImageUrl = imageUrl

      // If image URL is provided and Cloudinary is configured, try to upload to Cloudinary
      if (imageUrl && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
          // Check if it's a local file path (not a URL)
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            const localPath = path.resolve(process.cwd(), imageUrl)
            if (fs.existsSync(localPath)) {
              console.log(`Uploading local image to Cloudinary: ${localPath}`)
              const result = await cloudinary.uploader.upload(localPath, {
                folder: process.env.CLOUDINARY_FOLDER || 'flowlink/products',
                resource_type: 'image',
                use_filename: true,
                unique_filename: true
              })
              finalImageUrl = result.secure_url
            }
          }
          // If it's already a URL, keep it as is
        } catch (cloudinaryError) {
          console.warn(`Cloudinary upload failed for ${title}:`, cloudinaryError.message)
          // Keep the original URL if Cloudinary upload fails
        }
      }

      const doc = {
        userId,
        title,
        brand: get('brand') || undefined,
        category: get('category') || undefined,
        sku: get('sku') || undefined,
        barcode: get('barcode') || undefined,
        unit: unit || undefined,
        netWeight: netWeightStr ? Number(netWeightStr) : undefined,
        mrp: mrpStr ? Number(mrpStr) : undefined,
        price: priceStr ? Number(priceStr) : 0,
        quantity: quantityStr ? Number(quantityStr) : 0,
        taxRate: taxStr ? Number(taxStr) : undefined,
        hsn: get('hsn') || undefined,
        description: get('description') || undefined,
        expiryDate: expiryStr ? new Date(expiryStr) : undefined,
        images: finalImageUrl ? [finalImageUrl] : [] // Store as array with single image URL
      }
      try {
        const created = await Product.create(doc)
        createdIds.push(String(created._id))
      } catch (e) {
        failures.push({ row: r+1, error: e.message })
      }
    }
    res.json({ ok: true, created: createdIds.length, failed: failures.length, failures })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/debug/products-with-images', async (req, res) => {
  try {
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const docs = await Product.find({ userId, images: { $exists: true, $ne: [] } }).limit(5).lean()
    res.json(docs.map(p => ({
      id: p._id,
      title: p.title,
      imagesCount: Array.isArray(p.images) ? p.images.length : 0,
      images: Array.isArray(p.images) ? p.images : []
    })))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Setup admin WebSocket functionality
const { io, userSocketMap, adminSocketMap } = setupAdminSocket(server)

const port = process.env.PORT || 5000
server.listen(port, () => console.log(`API listening on http://localhost:${port}`))


