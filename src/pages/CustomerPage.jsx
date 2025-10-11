import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'
import AddCustomerModal from '../components/AddCustomerModal'
import FilterTabs from '../components/FilterTabs'
import { listCustomers, deleteCustomer, exportCustomersCsv, importCustomersCsv, provisionCustomerLogin } from '../services/db'

const CustomerPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [customers, setCustomers] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastCustomerName, setLastCustomerName] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [working, setWorking] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    // Simulate loading time for content
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Load customers when filter changes
  useEffect(() => {
    ;(async () => {
      try {
        const items = await listCustomers({ status: selectedStatus })
        setCustomers(Array.isArray(items) ? items : [])
      } catch (e) {
        setCustomers([])
      }
    })()
  }, [selectedStatus, showAddCustomer])

  const toggleSelectCustomer = (id) => {
    setSelectedCustomerIds((prev) => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const toggleSelectAllCustomers = () => {
    const allIds = customers.map(c => c.id || c._id).filter(Boolean)
    const allSelected = allIds.length > 0 && selectedCustomerIds.length === allIds.length
    setSelectedCustomerIds(allSelected ? [] : allIds)
  }

const handleAdded = (c) => {
    const name = [c?.firstName, c?.lastName].filter(Boolean).join(' ') || 'Customer'
    setLastCustomerName(name)
    setShowSuccess(true)
    setShowAddCustomer(false)
    setTimeout(() => setShowSuccess(false), 3000)
}
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowSuccess(false) }
    if (showSuccess) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [showSuccess])

  const handleProvisionLogin = async (c) => {
    try {
      const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Customer'
      let email = c.email || ''
      if (!email) {
        email = window.prompt(`Enter email for ${name}`) || ''
        if (!email) return
      }
      const pwd = Math.random().toString(36).slice(-8)
      await provisionCustomerLogin({ name, email, password: pwd })
      alert(`Login provisioned for ${name}\nEmail: ${email}\nPassword: ${pwd}`)
    } catch (e) {
      alert(`Failed to provision login\n\n${e?.message || e}`)
    }
  }

  // Import/Export helpers
  const openImportModal = () => setShowImportModal(true)
  const closeImportModal = () => { setShowImportModal(false); setImportSummary(null); setWorking(false) }
  const triggerCustomerFilePicker = () => fileInputRef.current && fileInputRef.current.click()
  const onCustomerFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      setWorking(true)
      const result = await importCustomersCsv(file)
      setImportSummary(result)
      // refresh list
      const items = await listCustomers({ status: selectedStatus })
      setCustomers(Array.isArray(items) ? items : [])
    } catch (err) {
      alert(`Import failed\n\n${err?.message || err}`)
    } finally {
      setWorking(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  const handleExportCustomers = async () => {
    try {
      setWorking(true)
      const blob = await exportCustomersCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(`Export failed\n\n${err?.message || err}`)
    } finally {
      setWorking(false)
    }
  }

  const handleDeleteCustomer = async (c) => {
    const cid = c.id || c._id
    if (!cid) return
    const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'customer'
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return
    try {
      await deleteCustomer(cid)
      const items = await listCustomers({ status: selectedStatus })
      setCustomers(Array.isArray(items) ? items : [])
    } catch (e) {
      alert(`Failed to delete customer\n\n${e?.message || e}`)
    }
  }

  const handleBulkDeleteCustomers = async () => {
    if (selectedCustomerIds.length === 0) return
    if (!window.confirm(`Delete ${selectedCustomerIds.length} selected customer(s)? This action cannot be undone.`)) return
    try {
      for (const id of selectedCustomerIds) {
        await deleteCustomer(id)
      }
      const items = await listCustomers({ status: selectedStatus })
      setCustomers(Array.isArray(items) ? items : [])
      setSelectedCustomerIds([])
    } catch (e) {
      alert(`Failed to delete selected customers\n\n${e?.message || e}`)
    }
  }

  const handleAddCustomer = () => {
    setShowAddCustomer(true)
  }

  const handleCloseModal = () => {
    setShowAddCustomer(false)
  }

  // Show Add Customer as full page like Add Product
  if (showAddCustomer) {
    return <AddCustomerModal onClose={handleCloseModal} onAdded={handleAdded} />
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
            <div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[9999]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl border border-emerald-200 px-5 py-4 text-center"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </div>
                <div className="text-sm font-medium text-emerald-800">{lastCustomerName} added successfully</div>
                <button className="mt-2 text-xs text-emerald-700 underline" onClick={()=>setShowSuccess(false)}>Dismiss</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <Helmet>
          <title>Customers - FlowLink</title>
          <meta property="og:title" content="Customers - FlowLink" />
        </Helmet>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Customers</h1>
        </div>

        {/* Filters */}
        <FilterTabs value={selectedStatus} onChange={setSelectedStatus} />

        <div>
          <div className="bg-white rounded-xl p-6">
            {/* Top Section - Customer Management */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
              <div>
                <h2 className="text-lg font-semibold text-[#303030]">Everything customers-related in one place</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage customer details, see customer order history, and group customers into segments.
                </p>
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <button className="h-9 px-3 bg-brand-green text-white rounded-lg text-sm" onClick={handleAddCustomer}>
                    Add customer
                  </button>
                  <button className="h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm" onClick={handleExportCustomers}>Export customers</button>
                  <button className="h-9 px-3 bg-white border border-gray-300 rounded-lg text-sm" onClick={openImportModal}>Import customers</button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <div className="absolute inset-0 rounded-full bg-blue-50 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-gray-200">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-2 bg-white shadow rounded-xl p-2 w-28">
                    <div className="space-y-1">
                      <div className="h-2 rounded bg-gray-200"></div>
                      <div className="h-2 rounded bg-gray-200"></div>
                      <div className="h-2 rounded bg-gray-200"></div>
                    </div>
                    <div className="mt-2 w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Customer Acquisition */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-[#303030]">Get customers with apps</h3>
              <p className="text-sm text-gray-600 max-w-[520px]">Grow your customer list by adding a lead capture form to your store and marketing.</p>
              <button className="mt-3 h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">See app recommendations</button>
            </div>
          </div>
        </div>

        {/* Customers list */}
        {customers.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[#303030] mb-2">Customer list</h3>
            {selectedCustomerIds.length > 0 && (
              <div className="mb-3 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="text-sm text-rose-800 font-medium">{selectedCustomerIds.length} selected</span>
                <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={handleBulkDeleteCustomers}>Delete selected</button>
              </div>
            )}
            {/* Mobile cards */}
            <div className="md:hidden">
              <div className="mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customers.length > 0 && selectedCustomerIds.length === customers.map(c=>c.id || c._id).filter(Boolean).length}
                  onChange={toggleSelectAllCustomers}
                />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
              <div className="divide-y">
                {customers.map((c, i) => {
                  const id = c.id || c._id
                  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || '—'
                  const emailOrPhone = c.email || c.phoneNumber || '—'
                  return (
                    <div key={id || i} className="py-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedCustomerIds.includes(id)}
                          onChange={() => toggleSelectCustomer(id)}
                        />
                        <div className="flex-1">
                          <div className="text-[#303030] text-sm font-medium">{name}</div>
                          <div className="text-xs text-gray-600">{emailOrPhone}</div>
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{c.status || 'Active'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <button className="h-8 px-3 rounded bg-white border border-gray-300 text-gray-800 text-xs" onClick={()=>handleProvisionLogin(c)}>Provision login</button>
                        <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDeleteCustomer(c)}>Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="w-10 py-2">
                      <input
                        type="checkbox"
                        checked={customers.length > 0 && selectedCustomerIds.length === customers.map(c=>c.id || c._id).filter(Boolean).length}
                        onChange={toggleSelectAllCustomers}
                      />
                    </th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {customers.map((c, i) => (
                    <tr key={c.id || c._id || i} className="border-b last:border-0">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(c.id || c._id)}
                          onChange={()=>toggleSelectCustomer(c.id || c._id)}
                        />
                      </td>
                      <td className="py-3">{[c.firstName, c.lastName].filter(Boolean).join(' ') || '—'}</td>
                      <td className="py-3">{c.email || '—'}</td>
                      <td className="py-3">{c.phoneNumber || '—'}</td>
                      <td className="py-3"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{c.status || 'Active'}</span></td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button className="h-8 px-3 rounded bg-white border border-gray-300 text-gray-800 text-xs" onClick={()=>handleProvisionLogin(c)}>Provision login</button>
                          <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDeleteCustomer(c)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import/Export Modal for Customers */}
        <AnimatePresence>
          {showImportModal && (
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                onClick={closeImportModal}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.div
                className="relative bg-white rounded-xl shadow-2xl w-[92vw] max-w-[560px] p-5"
                initial={{ y: 24, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 24, opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold text-[#303030]">Import/Export Customers</div>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100" onClick={closeImportModal}>✕</button>
                </div>
                <p className="text-xs text-gray-600 mb-4">Use the sample CSV to format your customers. You can bulk import or export your customers as CSV (Excel compatible).</p>
                <a className="inline-flex items-center gap-2 text-brand-green text-sm underline mb-4" href="/sample-customers.csv" target="_blank" rel="noreferrer">Download sample CSV</a>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="h-10 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={handleExportCustomers} disabled={working}>
                    {working ? 'Preparing…' : 'Export CSV'}
                  </button>
                  <button className="h-10 px-3 rounded-lg bg-brand-green text-white text-sm" onClick={triggerCustomerFilePicker} disabled={working}>
                    {working ? 'Uploading…' : 'Import from CSV'}
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onCustomerFilePicked} />
                </div>
                {importSummary && (
                  <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                    <div className="text-sm text-emerald-800 font-medium">Import completed</div>
                    <div className="text-xs text-emerald-700 mt-1">Created: {importSummary.created} · Failed: {importSummary.failed}</div>
                    {Array.isArray(importSummary.failures) && importSummary.failures.length > 0 && (
                      <div className="mt-2 max-h-28 overflow-auto text-xs text-emerald-700">
                        {importSummary.failures.slice(0, 5).map((f, i) => (
                          <div key={i}>Row {f.row}: {f.error}</div>
                        ))}
                        {importSummary.failures.length > 5 && <div>… and {importSummary.failures.length - 5} more</div>}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="py-4 text-center text-sm text-gray-600">
          <span>
            Learn more about <a href="#" className="text-brand-green hover:underline">customers</a>
          </span>
        </div>
      </div>
    </LayoutWrapper>
  )
}

export default CustomerPage
