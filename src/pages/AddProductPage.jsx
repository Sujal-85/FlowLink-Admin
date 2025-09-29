import React, {useEffect, useState} from 'react'

import { Helmet } from 'react-helmet'
import LayoutWrapper from '../components/LayoutWrapper'
import NoProductsState from '../components/NoProductsState'
import AddProduct from '../components/AddProduct'
import { listProducts, deleteProduct } from '../services/db'
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
        <NoProductsState onAddProduct={handleAddProductClick} />
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
        {/* Success confirmation banner */}
        {showSuccess && (
          <div className="fixed top-[70px] left-1/2 -translate-x-1/2 z-[1100]">
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              <span className="text-sm font-medium">{lastProductTitle} added successfully</span>
              <button className="ml-2 text-emerald-700 text-xs underline" onClick={()=>setShowSuccess(false)}>Dismiss</button>
            </div>
          </div>
        )}
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
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">Export</button>
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">Import</button>
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

        {/* Products Table (dynamic) */}
        <div className="overflow-x-auto">
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
    {/* </div> */}
    </LayoutWrapper>
  )
}

export default Page1
