import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import LayoutWrapper from '../components/LayoutWrapper';
import { Download, Percent } from 'lucide-react';
import { useHistory, useLocation } from 'react-router-dom';
import FilterTabs from '../components/FilterTabs';
import { listDiscounts, deleteDiscount } from '../services/db';

const DiscountsPage = () => {
  const history = useHistory();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [discounts, setDiscounts] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCode, setLastCode] = useState('Discount');
  const [selectedDiscountIds, setSelectedDiscountIds] = useState([]);
  
  const refresh = async (status) => {
    const items = await listDiscounts({ status: status ?? selectedStatus });
    setDiscounts(Array.isArray(items) ? items : []);
  }

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    ;(async () => {
      try { await refresh(selectedStatus) } catch (e) { setDiscounts([]) }
    })();
  }, [selectedStatus]);

  // Detect success from AddDiscount redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wasAdded = params.get('added');
    const code = params.get('code');
    if (wasAdded) {
      setLastCode(code || 'Discount');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Clean the URL
      history.replace({ pathname: location.pathname });
    }
  }, [location.search, location.pathname, history]);

  const handleDeleteDiscount = async (d) => {
    const did = d.id || d._id;
    if (!did) return;
    const name = d.code || 'discount';
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteDiscount(did);
      await refresh();
    } catch (e) {
      alert(`Failed to delete discount\n\n${e?.message || e}`);
    }
  }

  const toggleSelectDiscount = (id) => {
    setSelectedDiscountIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const toggleSelectAllDiscounts = () => {
    const allIds = discounts.map(d => d.id || d._id).filter(Boolean);
    const allSelected = allIds.length > 0 && selectedDiscountIds.length === allIds.length;
    setSelectedDiscountIds(allSelected ? [] : allIds);
  }

  const handleBulkDeleteDiscounts = async () => {
    if (selectedDiscountIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedDiscountIds.length} selected discount(s)? This action cannot be undone.`)) return;
    try {
      for (const id of selectedDiscountIds) {
        await deleteDiscount(id);
      }
      await refresh();
      setSelectedDiscountIds([]);
    } catch (e) {
      alert(`Failed to delete selected discounts\n\n${e?.message || e}`);
    }
  }

  return (
    <LayoutWrapper isLoading={isLoading}>
      <div className="max-w-[1100px]">
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-xl shadow-xl border border-emerald-200 px-5 py-4 text-center">
              <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </div>
              <div className="text-sm font-medium text-emerald-800">{lastCode} created successfully</div>
              <button className="mt-2 text-xs text-emerald-700 underline" onClick={()=>setShowSuccess(false)}>Dismiss</button>
            </div>
          </div>
        )}
        <Helmet>
          <title>Discounts - FlowLink</title>
        </Helmet>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center">
              <Percent size={18} />
            </div>
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Discounts</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg bg-gray-200 text-gray-400 text-sm inline-flex items-center gap-2 cursor-not-allowed" disabled>
              <Download size={16} /> Export
            </button>
            <button
              className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm shadow-sm"
              onClick={() => history.push('/discounts/new')}
            >
              Create discount
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterTabs value={selectedStatus} onChange={setSelectedStatus} />

        {/* Center card */}
        <div className="bg-white rounded-xl p-10 border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center text-center w-full">
            {/* Image Container */}
            <div className="w-[420px] h-[200px] flex items-center justify-center mb-2">
              <img
                src="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/all/assets/empty-state-discount-IqX-GiQmgbHG.svg"
                alt="Discount Illustration"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="mt-4 text-[#303030] text-base font-semibold">Manage discounts and promotions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add discount codes and automatic discounts that apply at checkout.
            </p>
            <p className="text-sm text-gray-600">
              You can also use discounts with{' '}
              <a href="#" className="text-blue-600 hover:underline">
                compare at prices
              </a>
              .
            </p>
            <button
              className="mt-4 h-9 px-4 rounded-lg bg-[#1a1a1a] text-white text-sm"
              onClick={() => history.push('/discounts/new')}
            >
              Create discount
            </button>
          </div>
        </div>

        {/* Discounts table */}
        {discounts.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            {selectedDiscountIds.length > 0 && (
              <div className="mb-3 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <span className="text-sm text-rose-800 font-medium">{selectedDiscountIds.length} selected</span>
                <button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={handleBulkDeleteDiscounts}>Delete selected</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600 border-b">
                    <th className="w-10 py-2">
                      <input
                        type="checkbox"
                        checked={discounts.length > 0 && selectedDiscountIds.length === discounts.map(d=>d.id || d._id).filter(Boolean).length}
                        onChange={toggleSelectAllDiscounts}
                      />
                    </th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Starts</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {discounts.map((d, i) => (
                    <tr key={d.id || d._id || i} className="border-b last:border-0">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedDiscountIds.includes(d.id || d._id)}
                          onChange={()=>toggleSelectDiscount(d.id || d._id)}
                        />
                      </td>
                      <td className="py-3">{d.code || '—'}</td>
                      <td className="py-3">{d.type || 'percentage'}</td>
                      <td className="py-3">{typeof d.amount === 'number' ? d.amount : '—'}</td>
                      <td className="py-3"><span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">{d.status || 'Active'}</span></td>
                      <td className="py-3">{d.startsAt ? new Date(d.startsAt).toLocaleDateString() : '—'}</td>
                      <td className="py-3"><button className="h-8 px-3 rounded bg-white border border-red-300 text-red-700 text-xs" onClick={()=>handleDeleteDiscount(d)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer link */}
        <div className="py-4 text-center text-sm text-gray-600">
          Learn more about{' '}
          <a href="#" className="text-blue-600 hover:underline">discounts</a>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default DiscountsPage;