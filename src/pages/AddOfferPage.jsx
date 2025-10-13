import React, { useEffect, useState } from 'react'
import LayoutWrapper from '../components/LayoutWrapper'
import { useHistory } from 'react-router-dom'
import { createOffer, listProducts } from '../services/db'
import LoaderOverlay from '../components/LoaderOverlay'
import { Lightbulb } from 'lucide-react'

const AddOfferPage = () => {
  const history = useHistory()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [appliesScope, setAppliesScope] = useState('all') // 'all' | 'selected'
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async()=>{ try { const items = await listProducts({ status: 'All' }); setProducts(Array.isArray(items) ? items : []) } catch {} })() }, [])

  const toggleProduct = (id) => setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  const handleSave = async () => {
    if (!title.trim()) { alert('Title is required'); return }
    try {
      setSaving(true)
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        bannerUrl: bannerUrl.trim() || undefined,
        status: 'Active',
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        productIds: appliesScope === 'selected' ? selectedProductIds : undefined
      }
      await createOffer(payload)
      const t = encodeURIComponent(title.trim() || 'Offer')
      history.push(`/offers?added=1&title=${t}`)
    } catch (e) {
      alert(`Failed to create offer\n\n${e?.message || e}`)
    } finally { setSaving(false) }
  }

  return (
    <LayoutWrapper contentClassName="px-0 md:px-6 pt-2 md:pt-4 pb-2">
      <LoaderOverlay open={saving} label="Saving offer…" />
      <div className="px-0 py-3 md:p-6 min-h-screen">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center"><Lightbulb size={18} /></div>
            <h1 className="text-2xl font-semibold text-gray-800">Create offer</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={()=>history.push('/offers')}>Cancel</button>
            <button className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save offer'}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-1">Offer details</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input className="w-full p-2 border rounded-md" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Diwali Sale" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="w-full p-2 border rounded-md" rows="3" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Banner image URL</label>
                  <input className="w-full p-2 border rounded-md" value={bannerUrl} onChange={e=>setBannerUrl(e.target.value)} placeholder="https://…" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-1">Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Starts at</label>
                  <input type="datetime-local" className="w-full p-2 border rounded-md" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ends at</label>
                  <input type="datetime-local" className="w-full p-2 border rounded-md" value={endsAt} onChange={e=>setEndsAt(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-1">Applies to</h2>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="applies" checked={appliesScope==='all'} onChange={()=>setAppliesScope('all')} /> All products</label>
                <label className="flex items-center gap-2"><input type="radio" name="applies" checked={appliesScope==='selected'} onChange={()=>setAppliesScope('selected')} /> Selected products</label>
              </div>
              {appliesScope==='selected' && (
                <div className="mt-3 max-h-56 overflow-auto border rounded-md">
                  <ul className="divide-y">
                    {products.map(p => {
                      const id = p.id || p._id
                      return (
                        <li key={id} className="flex items-center gap-3 p-2">
                          <input type="checkbox" checked={selectedProductIds.includes(id)} onChange={()=>toggleProduct(id)} />
                          {Array.isArray(p.images) && p.images[0] ? (
                            <img src={p.images[0]} alt={p.title || 'Product'} className="w-9 h-9 object-cover rounded" />
                          ) : (
                            <div className="w-9 h-9 rounded bg-gray-100 border"></div>
                          )}
                          <div className="flex-1 text-sm text-gray-800">{p.title || 'Untitled'}{typeof p.price==='number' ? ` · ₹${p.price}` : ''}</div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-1" />
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default AddOfferPage
