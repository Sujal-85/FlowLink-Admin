import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Tag, Users, Percent, ArrowRight, CalendarDays } from 'lucide-react'
import LayoutWrapper from '../components/LayoutWrapper'
import { useHistory } from 'react-router-dom'
import { listProducts, listCustomers, listDiscounts } from '../services/db'

const FlowLinkHome = (props) => {
  const history = useHistory()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    products: { total: 0, active: 0, draft: 0, archived: 0 },
    customers: { total: 0 },
    discounts: { total: 0, active: 0 }
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [recentCustomers, setRecentCustomers] = useState([])
  const [recentDiscounts, setRecentDiscounts] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const [prods, custs, discs] = await Promise.all([
          listProducts({ status: 'All' }),
          listCustomers({ status: 'All' }),
          listDiscounts({ status: 'All' })
        ])
        const pc = { total: prods.length, active: 0, draft: 0, archived: 0 }
        for (const p of prods) {
          const s = (p.status || 'Active')
          if (s === 'Active') pc.active++
          else if (s === 'Draft') pc.draft++
          else if (s === 'Archived') pc.archived++
        }
        const dc = { total: discs.length, active: 0 }
        for (const d of discs) if ((d.status || 'Active') === 'Active') dc.active++
        setMetrics({
          products: pc,
          customers: { total: custs.length },
          discounts: dc
        })
        setRecentProducts(prods.slice(0, 5))
        setRecentCustomers(custs.slice(0, 5))
        setRecentDiscounts(discs.slice(0, 5))
      } catch (e) {
        // Non-blocking; keep defaults
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <>
      <Helmet>
        <title>FlowLink Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mate:ital@0;1&family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
      </Helmet>
      
      <LayoutWrapper isLoading={false}>
        {/* Title and quick actions */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Overview</h1>
            <p className="text-gray-600 text-sm mt-1">Key metrics and recent activity</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={() => history.push('/products')}>Add product</button>
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={() => history.push('/customers')}>Add customer</button>
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={() => history.push('/discounts/new')}>Create discount</button>
          </div>
        </div>

        {/* Metrics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Products</div>
              <Tag size={18} className="text-gray-400" />
            </div>
            <div className="mt-2 text-[28px] font-bold text-[#303030]">{metrics.products.total}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Active {metrics.products.active}</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">Draft {metrics.products.draft}</span>
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">Archived {metrics.products.archived}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Customers</div>
              <Users size={18} className="text-gray-400" />
            </div>
            <div className="mt-2 text-[28px] font-bold text-[#303030]">{metrics.customers.total}</div>
            <div className="mt-2 text-xs text-gray-500">Total customers</div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">Discounts</div>
              <Percent size={18} className="text-gray-400" />
            </div>
            <div className="mt-2 text-[28px] font-bold text-[#303030]">{metrics.discounts.total}</div>
            <div className="mt-2 text-xs text-gray-500">Active {metrics.discounts.active}</div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#303030] text-base font-semibold">Recent products</h3>
              <button className="text-sm text-[#1a1a1a] inline-flex items-center gap-1" onClick={() => history.push('/products')}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y">
              {(loading ? Array.from({ length: 3 }) : recentProducts).map((p, i) => {
                if (loading) return (
                  <div key={i} className="py-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                )
                const image = (p.images && p.images[0]) || '/favicon.ico'
                const name = p.title || `Product ${i+1}`
                const status = p.status || 'Active'
                const dt = p.createdAt ? (p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)) : null
                return (
                  <div key={p.id || p._id || i} className="py-3 flex items-center gap-3">
                    <img src={image} alt={name} className="w-9 h-9 rounded object-cover" />
                    <div className="flex-1">
                      <div className="text-sm text-[#303030] font-medium">{name}</div>
                      <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <CalendarDays size={12} /> {dt ? dt.toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{status}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#303030] text-base font-semibold">Recent customers</h3>
              <button className="text-sm text-[#1a1a1a] inline-flex items-center gap-1" onClick={() => history.push('/customers')}>
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="divide-y">
              {(loading ? Array.from({ length: 3 }) : recentCustomers).map((c, i) => {
                if (loading) return (
                  <div key={i} className="py-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                )
                const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '—'
                const dt = c.createdAt ? (c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt)) : null
                return (
                  <div key={c.id || c._id || i} className="py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f2f2f2] text-[#303030] flex items-center justify-center text-xs font-semibold">
                      {name.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-[#303030] font-medium">{name}</div>
                      <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                        <CalendarDays size={12} /> {dt ? dt.toLocaleDateString() : '—'}
                      </div>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{c.status || 'Active'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Discounts activity */}
        <div className="mt-6 bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#303030] text-base font-semibold">Recent discounts</h3>
            <button className="text-sm text-[#1a1a1a] inline-flex items-center gap-1" onClick={() => history.push('/discounts')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="divide-y">
            {(loading ? Array.from({ length: 3 }) : recentDiscounts).map((d, i) => {
              if (loading) return (
                <div key={i} className="py-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              )
              const dt = d.startsAt ? (d.startsAt.toDate ? d.startsAt.toDate() : new Date(d.startsAt)) : null
              return (
                <div key={d.id || d._id || i} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#f4f4f5] text-[#303030] flex items-center justify-center text-xs font-semibold">
                    <Percent size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#303030] font-medium">{d.code || '—'}</div>
                    <div className="text-xs text-gray-500 inline-flex items-center gap-1">
                      <CalendarDays size={12} /> {dt ? dt.toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{d.status || 'Active'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </LayoutWrapper>
    </>
  )
}

export default FlowLinkHome