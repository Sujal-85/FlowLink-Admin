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
dotenv.config()

  // Configure Cloudinary (ensure env vars are set in server/.env)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })

const app = express()
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
  price: String,
  trackQuantity: Boolean,
  physicalProduct: Boolean,
  weight: String,
  weightUnit: String,
  chargeTax: Boolean,
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

app.use('/api/customers', customersRouter)
app.use('/api/discounts', discountsRouter)

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))


