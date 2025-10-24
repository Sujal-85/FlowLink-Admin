import React, { useEffect, useState, useCallback } from 'react'
import { auth } from '../services/firebase'
import { Helmet } from 'react-helmet'
import { BarChart3, Calendar, IndianRupee, Plus, Edit2, ExternalLink, MoreHorizontal } from 'lucide-react'
import LayoutWrapper from '../components/LayoutWrapper'

const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
const formatNum = (n) => new Intl.NumberFormat('en-IN').format(n)

const RevenueChart = ({ series }) => {
  const max = Math.max(1, ...series.map(s => s.revenue || 0))
  const last = series.length ? series[series.length - 1] : null
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-sm font-semibold text-[#303030] mb-3">Total sales over time</div>
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div className="font-semibold">{last ? formatINR(last.revenue) : '₹0'}</div>
          <div>Last 7 days</div>
        </div>
        <div className="my-6 h-40 flex items-end gap-2 px-2">
          {series.map((p) => {
            const h = Math.round(((p.revenue || 0) / max) * 100)
            return (
              <div key={p.date} className="flex-1 flex flex-col items-end justify-end">
                <div className="w-full bg-gradient-to-t from-green-200 to-green-500 rounded" style={{ height: `${h}%` }} />
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500">
          {series.map((p) => (
            <span key={p.date} className="text-center">
              {new Date(p.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>{last ? new Date(last.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
          <span className="flex-1" />
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, underline }) => {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${underline ? 'pb-2' : ''}`}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold text-[#303030]">{value}</div>
      {underline && <div className="mt-2 h-[2px] bg-gray-200 w-full" />}
    </div>
  )
}

const PlaceholderChart = ({ title }) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {title && <div className="text-sm font-semibold text-[#303030] mb-3">{title}</div>}
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div className="font-semibold">₹0</div>
          <div>—</div>
        </div>
        <div className="my-6 h-24 bg-gradient-to-b from-gray-100 to-white rounded border border-dashed border-gray-300" />
        <div className="grid grid-cols-11 gap-1 text-[10px] text-gray-500">
          {['12 AM','2 AM','4 AM','6 AM','8 AM','10 AM','12 PM','2 PM','4 PM','6 PM','9 PM'].map((t) => (
            <span key={t} className="text-center">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> Sep 21, 2025</span>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"/> Sep 20, 2025</span>
        </div>
      </div>
    </div>
  )
}

const ListPanel = () => {
  const rows = [
    'Gross sales',
    'Discounts',
    'Returns',
    'Net sales',
    'Shipping charges',
    'Return fees',
    'Taxes',
    'Total sales',
  ]
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-sm font-semibold text-[#303030] mb-3">Total sales breakdown</div>
      <div className="divide-y divide-gray-200">
        {rows.map((r, idx) => (
          <div key={r} className={`flex items-center justify-between py-2 ${idx === rows.length-1 ? 'font-semibold' : ''}`}>
            <span className="text-sm text-brand-green cursor-pointer hover:underline">{r}</span>
            <span className="text-sm text-[#303030]">₹0.00</span>
            <span className="text-gray-400">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const EmptyPanel = ({ title }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm">
    <div className="text-sm font-semibold text-[#303030] mb-2">{title}</div>
    <div className="text-sm text-gray-600">No data for this date range</div>
  </div>
)

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const load = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const uid = auth?.currentUser?.uid
      if (!uid) throw new Error('Not signed in')
      const res = await fetch(`/api/orders/analytics?days=7`, { headers: { Accept: 'application/json', 'x-user-id': uid } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setIsLoading(false)
      return
    } catch (e) {
      setError(e?.message || 'Unable to load analytics data. Please ensure the server is running and you are signed in.')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <LayoutWrapper isLoading={isLoading}>
            <div>
        <Helmet>
          <title>Analytics - FlowLink</title>
          <meta property="og:title" content="Analytics - FlowLink" />
        </Helmet>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Analytics</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="h-9 px-3 rounded-full bg-[#1a1a1a] text-white text-sm">Today</button>
            <button className="h-9 px-3 rounded-full bg-white border border-gray-300 text-sm inline-flex items-center gap-2">
              <Calendar size={14} />
              Compare to: Sep 20, 2025
            </button>
            <button className="h-9 px-3 rounded-full bg-white border border-gray-300 text-sm inline-flex items-center gap-2">
              <IndianRupee size={14} /> INR ₹
            </button>
            <div className="flex items-center gap-1 ml-2">
              <button className="w-9 h-9 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="External"><ExternalLink size={14} /></button>
              <button className="w-9 h-9 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="Edit"><Edit2 size={14} /></button>
              <button className="w-9 h-9 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="More"><MoreHorizontal size={16} /></button>
            </div>
            <button className="h-9 px-3 rounded-lg bg-brand-green text-white text-sm inline-flex items-center gap-2">
              <Plus size={16} /> New exploration
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={load} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Gross sales" value={data ? formatINR(data.totals.revenue) : '—'} underline />
          <StatCard title="Returning customer rate" value={data ? `${data.totals.conversionRate}%` : '—'} underline />
          <StatCard title="Orders fulfilled" value={data ? formatNum(data.totals.orders) : '—'} underline />
          <StatCard title="Orders" value={data ? formatNum(data.totals.orders) : '—'} underline />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div>
            {data ? <RevenueChart series={data.series} /> : (error ? <EmptyPanel title="Analytics unavailable" /> : <PlaceholderChart title="Total sales over time" />)}
          </div>
          <div>
            <ListPanel />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <EmptyPanel title="Total sales by sales channel" />
          <PlaceholderChart title="Average order value over time" />
          <EmptyPanel title="Total sales by product" />
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default AnalyticsPage

