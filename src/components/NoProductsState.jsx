import React from 'react'

const NoProductsState = ({ onAddProduct, onImport = () => {} }) => {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Products</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="w-9 h-9 rounded-lg bg-white border border-gray-300 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">Filter</button>
          <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">Sort</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6">
        {/* Add your products section */}
        <div className="grid grid-cols-1 md:[grid-template-columns:1.5fr_1fr] gap-6">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-[#303030]">Add your products</h2>
            <p className="text-sm text-gray-600">Start by stocking your store with products your customers will love</p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <button className="h-9 px-3 bg-brand-green text-white rounded-lg text-sm inline-flex items-center gap-2" onClick={onAddProduct}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add product
              </button>
              <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm inline-flex items-center gap-2" onClick={onImport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Import
              </button>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-4 gap-3 items-center">
            <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <path d="M8 8h8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </div>
            <div className="w-16 h-16 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20"></path>
                <path d="M8 6h8"></path>
                <path d="M6 8h12"></path>
                <path d="M4 10h16"></path>
              </svg>
            </div>
            <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="8" y="4" width="8" height="16" rx="4"></rect>
                <path d="M12 8v8"></path>
              </svg>
            </div>
            <div className="w-16 h-16 rounded-lg bg-yellow-50 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M9 6h6"></path>
                <path d="M9 6v6"></path>
                <path d="M15 6v6"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Find products to sell section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#303030]">Find products to sell</h3>
          <p className="text-sm text-gray-600 max-w-[620px]">
            Have dropshipping or print on demand products shipped directly from the supplier to your customer, and only pay for what you sell.
          </p>
          <button className="mt-3 h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm">
            Browse product sourcing apps
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoProductsState

