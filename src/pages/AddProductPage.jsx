import React, {useEffect, useState} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'
import NoProductsState from '../components/NoProductsState'
import AddProduct from '../components/AddProduct'
import { listProducts, deleteProduct, exportProductsCsv, importProductsCsv } from '../services/db'
import FilterTabs from '../components/FilterTabs'

const Page1 = (props) => {
    const [isLoading, setIsLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [hasProducts, setHasProducts] = useState(false) // Simulate no products initially
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastProductTitle, setLastProductTitle] = useState('')
  const [products, setProducts] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
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

  // Load products when filter changes
  useEffect(() => {
    ;(async () => {
      try {
        const items = await listProducts({ status: selectedStatus })
        if (Array.isArray(items)) {
          setProducts(items)
          setHasProducts(items.length > 0)
        }
      } catch (e) {
        // non-blocking if API not running
      }
    })()
  }, [selectedStatus])

  // Close bulk modal with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeBulkModal() }
    if (showBulkModal) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [showBulkModal])

  // Dismiss success toast with Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowSuccess(false) }
    if (showSuccess) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [showSuccess])

  // Bulk modal functions
  const openBulkModal = () => setShowBulkModal(true)
  const closeBulkModal = () => { setShowBulkModal(false); setImportSummary(null); setWorking(false) }

  const triggerFilePicker = () => fileInputRef.current && fileInputRef.current.click()
  const onFilePicked = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      setWorking(true)
      const result = await importProductsCsv(file)
      setImportSummary(result)
      // refresh list
      const items = await listProducts({ status: selectedStatus })
      if (Array.isArray(items)) {
        setProducts(items)
        setHasProducts(items.length > 0)
      }
    } catch (err) {
      alert(`Import failed\n\n${err?.message || err}`)
    } finally {
      setWorking(false)
      // reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    try {
      setWorking(true)
      const blob = await exportProductsCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `products-${new Date().toISOString().slice(0,10)}.csv`
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

  const downloadFailuresReport = () => {
    if (!importSummary || !Array.isArray(importSummary.failures) || importSummary.failures.length === 0) return
    const rows = [['Row','Error'], ...importSummary.failures.map(f => [f.row, f.error])]
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? '')
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }).join(',')).join('\r\n') + '\r\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-failures.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleDeleteProduct = async (p) => {
    const pid = p.id || p._id
    if (!pid) return
    if (!window.confirm(`Delete "${p.title || 'product'}"? This action cannot be undone.`)) return
    try {
      await deleteProduct(pid)
      const items = await listProducts({ status: selectedStatus })
      setProducts(Array.isArray(items) ? items : [])
      setHasProducts(Array.isArray(items) && items.length > 0)
    } catch (e) {
      alert(`Failed to delete product\n\n${e?.message || e}`)
    }
  }

  const handleAddProductClick = () => {
    setShowAddProduct(true)
  }

  const handleProductAdded = (p) => {
    setShowAddProduct(false)
    setHasProducts(true) // Switch to list view
    setLastProductTitle(p?.title || 'Product')
    setShowSuccess(true)
    // Auto-hide success after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000)
    // Refresh list to include newly added
    ;(async () => {
      try {
        const items = await listProducts({ status: selectedStatus })
        if (Array.isArray(items)) setProducts(items)
      } catch (e) {}
    })()
  }

  const toggleSelectProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllProducts = () => {
    const allIds = products.map(p => p.id || p._id).filter(Boolean)
    const allSelected = allIds.length > 0 && selectedProductIds.length === allIds.length
    setSelectedProductIds(allSelected ? [] : allIds)
  }

  const handleBulkDeleteProducts = async () => {
    if (selectedProductIds.length === 0) return
    if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)? This action cannot be undone.`)) return
    try {
      for (const id of selectedProductIds) {
        await deleteProduct(id)
      }
      const items = await listProducts({ status: selectedStatus })
      setProducts(Array.isArray(items) ? items : [])
      setHasProducts(Array.isArray(items) && items.length > 0)
      setSelectedProductIds([])
    } catch (e) {
      alert(`Failed to delete selected products\n\n${e?.message || e}`)
    }
  }

  if (showAddProduct) {
    return <AddProduct onProductAdded={handleProductAdded} />
  }

  // Show no products state when no products exist
  if (!hasProducts) {
    return (
      <LayoutWrapper isLoading={isLoading}>
        <NoProductsState onAddProduct={handleAddProductClick} onImport={openBulkModal} />
        {/* Persistent hidden input for CSV import (available even when modal is closed) */}
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onFilePicked} />
        {/* Bulk Import/Export Modal (rendered in empty state too) */}
        <AnimatePresence>
          {showBulkModal && (
            <motion.div
              className="fixed inset-0 z-[9999] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                onClick={closeBulkModal}
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
                  <div className="text-base font-semibold text-[#303030]">Bulk Import/Export</div>
                  <button className="w-8 h-8 rounded-lg hover:bg-gray-100" onClick={closeBulkModal}>✕</button>
                </div>
                <p className="text-xs text-gray-600 mb-4">Use the sample CSV to format your grocery products. You can import products to save time or export all products to CSV (Excel compatible).</p>
                <a className="inline-flex items-center gap-2 text-brand-green text-sm underline mb-4" href="/sample-products.csv" target="_blank" rel="noreferrer">Download sample CSV</a>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="h-10 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={handleExport} disabled={working}>
                    {working ? 'Preparing…' : 'Export CSV'}
                  </button>
                  <button className="h-10 px-3 rounded-lg bg-brand-green text-white text-sm" onClick={triggerFilePicker} disabled={working}>
                    {working ? 'Uploading…' : 'Import from CSV'}
                  </button>
                </div>
                {importSummary && (
                  <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                    <div className="text-sm text-emerald-800 font-medium">Import completed</div>
                    <div className="text-xs text-emerald-700 mt-1">Created: {importSummary.created} · Failed: {importSummary.failed}</div>
                    {Array.isArray(importSummary.failures) && importSummary.failures.length > 0 && (
                      <button className="mt-2 text-xs underline text-emerald-700" onClick={downloadFailuresReport}>Download failure report</button>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
        {/* Success confirmation - centered overlay */}
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
                <div className="text-sm font-medium text-emerald-800">{lastProductTitle} added successfully</div>
                <button className="mt-2 text-xs text-emerald-700 underline" onClick={()=>setShowSuccess(false)}>Dismiss</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* <div className="overflow-x-auto"> */}
      <Helmet>
        <title>Page1 - exported project</title>
        <meta property="og:title" content="Page1 - exported project" />
      </Helmet>
      <div className="bg-white rounded-xl p-6 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <h1 className="text-[#303030] text-[24px] md:text-[28px] font-bold font-manrope m-0">Products</h1>
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={openBulkModal}>Export</button>
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={openBulkModal}>Import</button>
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">More Actions</button>
            <button className="h-9 px-3 rounded-lg bg-brand-green text-white text-sm w-full md:w-auto" onClick={handleAddProductClick}>Add Product</button>
          </div>
        </div>

        {/* Filters */}
        <FilterTabs value={selectedStatus} onChange={setSelectedStatus} />

        {/* Bulk actions */}
        {selectedProductIds.length > 0 && (
          <div className="mb-2 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <span className="text-sm text-rose-800 font-medium">{selectedProductIds.length} selected</span>
            <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={handleBulkDeleteProducts}>Delete selected</button>
          </div>
        )}

        {/* Products List - Responsive */}
        {/* Mobile (cards) */}
        <div className="md:hidden">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={products.length > 0 && selectedProductIds.length === products.map(p=>p.id || p._id).filter(Boolean).length}
              onChange={toggleSelectAllProducts}
            />
            <span className="text-sm text-gray-600">Select all</span>
          </div>

          <div className="divide-y">
            {products.map((p,i)=>{
              const image = (p.images && p.images[0]) || '/favicon.ico'
              const name = p.title || `Product ${i+1}`
              const size = p.weight ? `${p.weight}${p.weightUnit || ''}` : ''
              const status = p.status || 'Active'
              const stock = typeof p.quantity === 'number' ? `${p.quantity} in stock` : '—'
              const cat = p.category || '-'
              const ch = ['onlineStore','shop','pointOfSale'].filter(k => p[k]).length || 0
              const rowId = p.id || p._id
              return (
                <div key={p.id || p._id || i} className="py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedProductIds.includes(rowId)}
                      onChange={() => toggleSelectProduct(rowId)}
                    />
                    <img src={image} alt={name} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1">
                      <div className="text-[#303030] text-sm font-medium">{name}</div>
                      {size && <div className="text-gray-500 text-xs">{size}</div>}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">{status}</span>
                        <span className="text-gray-600">{stock}</span>
                        <span className="text-gray-500">• {cat}</span>
                        <span className="text-gray-500">• {ch} ch</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDeleteProduct(p)}>Delete</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Desktop (table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="w-10 py-2">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.length === products.map(p=>p.id || p._id).filter(Boolean).length}
                    onChange={toggleSelectAllProducts}
                  />
                </th>
                <th className="py-2">Product</th>
                <th className="py-2">Status</th>
                <th className="py-2">Inventory</th>
                <th className="py-2">Category</th>
                <th className="py-2">Channels</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {products.map((p,i)=> {
                const image = (p.images && p.images[0]) || '/favicon.ico'
                const name = p.title || `Product ${i+1}`
                const size = p.weight ? `${p.weight}${p.weightUnit || ''}` : ''
                const status = p.status || 'Active'
                const stock = typeof p.quantity === 'number' ? `${p.quantity} in stock` : '—'
                const cat = p.category || '-'
                const ch = ['onlineStore','shop','pointOfSale'].filter(k => p[k]).length || 0
                const rowId = p.id || p._id
                return (
                  <tr key={p.id || p._id || i} className="border-b last:border-0">
                    <td className="py-3">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(rowId)}
                        onChange={() => toggleSelectProduct(rowId)}
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img src={image} alt={name} className="w-10 h-10 rounded object-cover" />
                        <div>
                          <div className="text-[#303030] font-medium">{name}</div>
                          {size && <div className="text-gray-500 text-xs">{size}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{status}</span></td>
                    <td className="py-3">{stock}</td>
                    <td className="py-3">{cat}</td>
                    <td className="py-3">{ch}</td>
                    <td className="py-3">
                      <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDeleteProduct(p)}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import/Export Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
              onClick={closeBulkModal}
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
                <div className="text-base font-semibold text-[#303030]">Bulk Import/Export</div>
                <button className="w-8 h-8 rounded-lg hover:bg-gray-100" onClick={closeBulkModal}>✕</button>
              </div>
              <p className="text-xs text-gray-600 mb-4">Use the sample CSV to format your grocery products. You can import products to save time or export all products to CSV (Excel compatible).</p>
              <a className="inline-flex items-center gap-2 text-brand-green text-sm underline mb-4" href="/sample-products.csv" target="_blank" rel="noreferrer">Download sample CSV</a>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="h-10 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={handleExport} disabled={working}>
                  {working ? 'Preparing…' : 'Export CSV'}
                </button>
                <button className="h-10 px-3 rounded-lg bg-brand-green text-white text-sm" onClick={triggerFilePicker} disabled={working}>
                  {working ? 'Uploading…' : 'Import from CSV'}
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={onFilePicked} />
              </div>
              {importSummary && (
                <div className="mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="text-sm text-emerald-800 font-medium">Import completed</div>
                  <div className="text-xs text-emerald-700 mt-1">Created: {importSummary.created} · Failed: {importSummary.failed}</div>
                  {Array.isArray(importSummary.failures) && importSummary.failures.length > 0 && (
                    <button className="mt-2 text-xs underline text-emerald-700" onClick={downloadFailuresReport}>Download failure report</button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutWrapper>
  )
}

export default Page1
