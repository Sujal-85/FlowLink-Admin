import React, { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  Receipt,
  Clock,
  ChevronDown,
  Download,
  Building2,
  Bell,
} from 'lucide-react'
import LayoutWrapper from '../components/LayoutWrapper'

// Small utility: animated counter hook
const useCounter = (target, duration = 800) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let frame = 0
    const total = Math.max(1, Math.round(duration / 16))
    const tick = () => {
      frame += 1
      const progress = frame / total
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (frame < total) requestAnimationFrame(tick)
    }
    tick()
  }, [target, duration])
  return value
}

const StatCard = ({ icon: Icon, label, amount, color = '#2563eb' }) => {
  const animated = useCounter(amount)
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-500 text-sm">{label}</div>
          <div className="text-[#303030] text-2xl font-semibold mt-1">₹{animated.toLocaleString()}</div>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

// Simple SVG Line Chart for Revenue vs Expenses
const LineChart = ({ data, width = 600, height = 220, colors = ['#2563eb', '#64748b'] }) => {
  const padding = { top: 20, right: 20, bottom: 24, left: 36 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxY = Math.max(...data.map(d => Math.max(d.revenue, d.expenses))) * 1.15
  const points = {
    revenue: data.map((d, i) => [
      padding.left + (i / (data.length - 1)) * innerW,
      padding.top + innerH - (d.revenue / maxY) * innerH,
    ]),
    expenses: data.map((d, i) => [
      padding.left + (i / (data.length - 1)) * innerW,
      padding.top + innerH - (d.expenses / maxY) * innerH,
    ]),
  }

  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]},${p[1]}`).join(' ')

  return (
    <svg width={width} height={height} className="w-full">
      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" />

      {/* Revenue */}
      <path d={toPath(points.revenue)} fill="none" stroke={colors[0]} strokeWidth="2" />
      {/* Expenses */}
      <path d={toPath(points.expenses)} fill="none" stroke={colors[1]} strokeWidth="2" strokeDasharray="4 4" />

      {/* Dots */}
      {points.revenue.map((p, i) => (
        <circle key={`r-${i}`} cx={p[0]} cy={p[1]} r="2.5" fill={colors[0]} />
      ))}
      {points.expenses.map((p, i) => (
        <circle key={`e-${i}`} cx={p[0]} cy={p[1]} r="2.5" fill={colors[1]} />
      ))}
    </svg>
  )
}

// Donut Chart
const DonutChart = ({ segments }) => {
  const size = 220
  const stroke = 26
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((s, x) => s + x.value, 0)

  let offset = 0
  return (
    <svg width={size} height={size} className="mx-auto">
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        {segments.map((seg, idx) => {
          const frac = total === 0 ? 0 : seg.value / total
          const length = circumference * frac
          const circle = (
            <circle
              key={idx}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
            />
          )
          offset += length
          return circle
        })}
        <circle r={radius} fill="transparent" stroke="#e5e7eb" strokeWidth={1} />
        <text x="0" y="6" textAnchor="middle" className="fill-[#303030] text-lg font-semibold">Expenses</text>
      </g>
    </svg>
  )
}

const FinancesPage = () => {
  const [range, setRange] = useState('7')
  const [exportOpen, setExportOpen] = useState(false)
  const [partyFilter, setPartyFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  // Mock data
  const stats = {
    revenue: 842000,
    profit: 268400,
    expenses: 573600,
    outstanding: 92000,
  }

  const series = useMemo(() => (
    range === '30'
      ? [
          { revenue: 120000, expenses: 80000 },
          { revenue: 140000, expenses: 100000 },
          { revenue: 110000, expenses: 90000 },
          { revenue: 160000, expenses: 120000 },
          { revenue: 155000, expenses: 100000 },
          { revenue: 170000, expenses: 110000 },
          { revenue: 187000, expenses: 130000 },
        ]
      : [
          { revenue: 98000, expenses: 62000 },
          { revenue: 102000, expenses: 76000 },
          { revenue: 88000, expenses: 64000 },
          { revenue: 120000, expenses: 82000 },
          { revenue: 110000, expenses: 70000 },
          { revenue: 118000, expenses: 76000 },
          { revenue: 136000, expenses: 84000 },
        ]
  ), [range])

  const donut = [
    { label: 'Logistics', value: 38, color: '#2563eb' },
    { label: 'Inventory', value: 34, color: '#0ea5e9' },
    { label: 'Marketing', value: 18, color: '#64748b' },
    { label: 'Others', value: 10, color: '#93c5fd' },
  ]

  const rows = [
    { date: '2025-09-20', party: 'Acme Logistics', type: 'Debit', amount: 32000, status: 'Paid' },
    { date: '2025-09-20', party: 'Bright Stores', type: 'Credit', amount: 52000, status: 'Paid' },
    { date: '2025-09-21', party: 'Delta Inventory', type: 'Debit', amount: 18000, status: 'Pending' },
    { date: '2025-09-21', party: 'Omega Supplies', type: 'Debit', amount: 23000, status: 'Paid' },
    { date: '2025-09-22', party: 'Retail Hub', type: 'Credit', amount: 76000, status: 'Pending' },
  ]

  const filteredRows = rows.filter(r =>
    (partyFilter === 'All' || r.party === partyFilter) &&
    (statusFilter === 'All' || r.status === statusFilter) &&
    (search === '' || r.party.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <LayoutWrapper isLoading={false}>
      <div className="max-w-[1200px]">
        <Helmet>
          <title>Finances - FlowLink</title>
        </Helmet>

        {/* Header: Title + Range + Export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Finances Overview</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm inline-flex items-center gap-2">
                <Clock size={16} />
                {range === '7' ? 'Last 7 days' : range === '30' ? 'Last 30 days' : 'Custom'}
                <ChevronDown size={16} />
              </button>
              <div className="absolute hidden" />
            </div>
            <div className="relative">
              <button onClick={() => setExportOpen(v => !v)} className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm inline-flex items-center gap-2">
                <Download size={16} /> Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow z-20">
                  {['CSV', 'PDF', 'Excel'].map(x => (
                    <div key={x} className="px-3 py-2 text-sm text-[#303030] hover:bg-gray-50 cursor-pointer" onClick={() => setExportOpen(false)}>{x}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={IndianRupee} label="Total Revenue" amount={stats.revenue} color="#2563eb" />
          <StatCard icon={TrendingUp} label="Net Profit" amount={stats.profit} color="#0ea5e9" />
          <StatCard icon={Receipt} label="Expenses" amount={stats.expenses} color="#64748b" />
          <StatCard icon={Wallet} label="Outstanding Payments" amount={stats.outstanding} color="#93c5fd" />
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[#303030]">Revenue vs Expenses</div>
              <div className="text-xs text-gray-500">Professional blue accents</div>
            </div>
            <LineChart data={series} />
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-700">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-[#2563eb] rounded-full"></span> Revenue</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-[#64748b] rounded-full"></span> Expenses</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-semibold text-[#303030]">Category-wise Expenses</div>
            <DonutChart segments={donut} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {donut.map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded" style={{ background: d.color }} />
                  <span className="text-[#303030]">{d.label}</span>
                  <span className="text-gray-600">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="text-sm font-semibold text-[#303030]">Transactions</div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm"
                placeholder="Search by party"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
              />
              <select className="h-9 px-3 border border-gray-300 rounded-lg text-sm" value={partyFilter} onChange={(e)=>setPartyFilter(e.target.value)}>
                {['All','Acme Logistics','Bright Stores','Delta Inventory','Omega Supplies','Retail Hub'].map(p=> (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select className="h-9 px-3 border border-gray-300 rounded-lg text-sm" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                {['All','Paid','Pending'].map(s=> (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filteredRows.map((r, i) => (
              <div key={i} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#303030]">{r.party}</div>
                    <div className="text-xs text-gray-500">{r.date}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded ${r.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                      <span className={`px-2 py-0.5 rounded ${r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </div>
                  </div>
                  <div className="text-[#303030] text-sm font-semibold">₹{r.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-600 border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Party</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-2 pr-3">{r.date}</td>
                    <td className="py-2 pr-3">{r.party}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${r.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.type}</span>
                    </td>
                    <td className="py-2 pr-3">₹{r.amount.toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${r.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default FinancesPage
