import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterTabs from '../components/FilterTabs'
import { useHistory, useLocation } from 'react-router-dom'
import { listOffers, deleteOffer } from '../services/db'
import { Lightbulb } from 'lucide-react'
import SuccessModal from '../components/SuccessModal'

const OffersPage = () => {
  const history = useHistory()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [offers, setOffers] = useState([])
  const [selectedOfferIds, setSelectedOfferIds] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastTitle, setLastTitle] = useState('Offer')

  useEffect(() => { const t = setTimeout(()=>setIsLoading(false), 400); return ()=>clearTimeout(t) }, [])
  useEffect(() => { (async()=>{ try { const items = await listOffers({ status: selectedStatus }); setOffers(Array.isArray(items) ? items : []) } catch { setOffers([]) } })() }, [selectedStatus])

  // Detect success from AddOffer redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const wasAdded = params.get('added')
    const t = params.get('title')
    if (wasAdded) {
      setLastTitle(t || 'Offer')
      setShowSuccess(true)
      setTimeout(()=>setShowSuccess(false), 2800)
      history.replace({ pathname: location.pathname })
    }
  }, [location.search, location.pathname, history])

  const toggleSelectOffer = (id) => setSelectedOfferIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const toggleSelectAllOffers = () => {
    const allIds = offers.map(o => o.id || o._id).filter(Boolean)
    const allSelected = allIds.length > 0 && selectedOfferIds.length === allIds.length
    setSelectedOfferIds(allSelected ? [] : allIds)
  }
  const handleBulkDelete = async () => {
    if (!selectedOfferIds.length) return
    if (!window.confirm(`Delete ${selectedOfferIds.length} selected offer(s)?`)) return
    try { for (const id of selectedOfferIds) await deleteOffer(id); const items = await listOffers({ status: selectedStatus }); setOffers(items) } catch (e) { alert(`Failed to delete offers\n\n${e?.message||e}`) }
  }
  const handleDelete = async (o) => {
    const id = o.id || o._id
    if (!id) return
    if (!window.confirm(`Delete offer "${o.title || 'Offer'}"?`)) return
    try { await deleteOffer(id); const items = await listOffers({ status: selectedStatus }); setOffers(items) } catch (e) { alert(`Failed to delete offer\n\n${e?.message||e}`) }
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
      <div className="w-full">
        <SuccessModal open={showSuccess} title={`${lastTitle} created successfully`} onClose={()=>setShowSuccess(false)} />
        <Helmet>
          <title>Offers - FlowLink</title>
        </Helmet>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center"><Lightbulb size={18} /></div>
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Offers</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={()=>history.push('/offers/new')}>Create offer</button>
          </div>
        </div>

        {/* Filters */}
        <FilterTabs value={selectedStatus} onChange={setSelectedStatus} />

        {/* Center card when empty */}
        {offers.length === 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
            <div className="text-sm text-gray-600">No offers yet. Create your first offer to highlight promotions in your store.</div>
            <button className="mt-3 h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={()=>history.push('/offers/new')}>Create offer</button>
          </div>
        )}

        {offers.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            {selectedOfferIds.length > 0 && (
              <div className="mb-3 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="text-sm text-rose-800 font-medium">{selectedOfferIds.length} selected</span>
                <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={handleBulkDelete}>Delete selected</button>
              </div>
            )}

            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="w-10 py-2">
                      <input type="checkbox" checked={offers.length>0 && selectedOfferIds.length===offers.map(o=>o.id||o._id).filter(Boolean).length} onChange={toggleSelectAllOffers} />
                    </th>
                    <th className="py-2">Banner</th>
                    <th className="py-2">Title</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Active</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {offers.map((o,i)=> (
                    <tr key={o.id||o._id||i} className="border-b last:border-0">
                      <td className="py-3"><input type="checkbox" checked={selectedOfferIds.includes(o.id||o._id)} onChange={()=>toggleSelectOffer(o.id||o._id)} /></td>
                      <td className="py-3">
                        {o.bannerUrl ? (
                          <img src={o.bannerUrl} alt={o.title || 'Offer'} className="w-14 h-10 object-cover rounded border" />
                        ) : (
                          <div className="w-14 h-10 rounded bg-gray-100 border" />
                        )}
                      </td>
                      <td className="py-3">{o.title || '—'}</td>
                      <td className="py-3"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{o.status || 'Active'}</span></td>
                      <td className="py-3">{o.startsAt ? new Date(o.startsAt).toLocaleDateString() : '—'} {o.endsAt ? `- ${new Date(o.endsAt).toLocaleDateString()}` : ''}</td>
                      <td className="py-3"><button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDelete(o)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}

export default OffersPage
