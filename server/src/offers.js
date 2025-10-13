import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

const offerSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  title: { type: String, required: true },
  description: String,
  bannerUrl: String,
  status: { type: String, default: 'Active' },
  startsAt: Date,
  endsAt: Date,
  productIds: { type: [String], default: undefined }
}, { timestamps: true })

const Offer = mongoose.model('Offer', offerSchema)

router.post('/', async (req, res) => {
  try {
    const userId = req.get('x-user-id') || req.body.userId
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const payload = { status: 'Active', ...req.body, userId }
    const doc = await Offer.create(payload)
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
  const docs = await Offer.find(filter).sort({ createdAt: -1 }).lean()
  res.json(docs)
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.get('x-user-id')
    if (!userId) return res.status(401).json({ error: 'Missing user id' })
    const doc = await Offer.findOneAndDelete({ _id: id, userId })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

export default router
