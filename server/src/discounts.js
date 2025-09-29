import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

const discountSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  method: { type: String, enum: ['code','auto'], default: 'code' },
  code: String,
  type: { type: String, enum: ['percentage','fixed'], default: 'percentage' },
  amount: { type: Number, default: 0 },
  appliesTo: { type: String, default: 'products' },
  status: { type: String, default: 'Active' },
  startsAt: Date,
  endsAt: Date
}, { timestamps: true })

const Discount = mongoose.model('Discount', discountSchema)

router.post('/', async (req, res) => {
  try {
    const userId = req.get('x-user-id') || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const payload = { status: 'Active', ...req.body, userId }
    const doc = await Discount.create(payload)
    res.status(201).json({ id: doc._id.toString() })
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
  const docs = await Discount.find(filter).sort({ createdAt: -1 }).lean()
  res.json(docs)
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Discount.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
