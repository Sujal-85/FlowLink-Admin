import React, { useEffect, useState } from 'react';
import LayoutWrapper from './LayoutWrapper';
import { useHistory } from 'react-router-dom';
import { createDiscount, listProducts } from '../services/db';
import LoaderOverlay from './LoaderOverlay'
import { Percent } from 'lucide-react'

const AddDiscount = () => {
  const history = useHistory();
  const [method, setMethod] = useState('code');
  const [discountCode, setDiscountCode] = useState('');
  const [valueType, setValueType] = useState('percentage'); // 'percentage' | 'fixed'
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [appliesScope, setAppliesScope] = useState('all'); // 'all' | 'selected'
  const [products, setProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    ;(async () => {
      try { const items = await listProducts({ status: 'All' }); setProducts(Array.isArray(items) ? items : []) } catch {}
    })()
  }, [])

  const toggleProduct = (id) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDiscountCode(result);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        method,
        code: discountCode || undefined,
        type: valueType,
        amount: Number(amount) || 0,
        productIds: appliesScope === 'selected' ? selectedProductIds : undefined,
      };
      const id = await createDiscount(payload);
      setIsSaving(false);
      const qs = `?added=1&code=${encodeURIComponent(discountCode || 'Discount')}`;
      history.push(`/discounts${qs}`);
    } catch (e) {
      setIsSaving(false);
      alert(`Failed to create discount\n\n${e?.message || e}`);
    }
  };

  return (
    <LayoutWrapper>
      <LoaderOverlay open={isSaving} label="Saving discount…" />
      <div className="p-6 min-h-screen font-sans">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1e1f22] text-white flex items-center justify-center"><Percent size={18} /></div>
            <h1 className="text-2xl font-semibold text-gray-800">Create discount</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={()=>history.push('/discounts')}>Cancel</button>
            <button className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={handleSave}>Save discount</button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Discount basics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-1">Discount details</h2>
              <p className="text-sm text-gray-500 mb-4">Set how your discount is applied.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <div className="flex rounded-md border border-gray-300 w-min">
                    <button 
                      onClick={() => setMethod('code')}
                      className={`px-4 py-2 text-sm rounded-l-md ${method === 'code' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>
                      Discount code
                    </button>
                    <button 
                      onClick={() => setMethod('auto')}
                      className={`px-4 py-2 text-sm rounded-r-md border-l border-gray-300 ${method === 'auto' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>
                      Automatic discount
                    </button>
                  </div>
                </div>

                {method === 'code' && (
                  <div>
                    <label htmlFor="discount-code" className="block text-sm font-medium text-gray-700 mb-1">Discount Code</label>
                    <div className='flex items-center'>
                      <input 
                        id="discount-code" 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md" 
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateCode}
                        className="ml-4 text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap">
                        Generate code
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Customers must enter this code at checkout.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Discount value */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Discount Value</h2>
              <div className="flex items-center gap-4">
                <select
                  className="w-1/3 p-2 border border-gray-300 rounded-md"
                  value={valueType === 'percentage' ? 'Percentage' : 'Fixed amount'}
                  onChange={(e)=>setValueType(e.target.value === 'Fixed amount' ? 'fixed' : 'percentage')}
                >
                  <option>Percentage</option>
                  <option>Fixed amount</option>
                </select>
                <div className="relative w-2/3">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e)=>setAmount(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{valueType === 'percentage' ? '%' : ''}</span>
                </div>
              </div>
            </div>

            {/* Applies to */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Applies to</h2>
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="applies" checked={appliesScope==='all'} onChange={()=>setAppliesScope('all')} />
                  All products
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="applies" checked={appliesScope==='selected'} onChange={()=>setAppliesScope('selected')} />
                  Selected products
                </label>
              </div>
              {appliesScope === 'selected' && (
                <div className="mt-3 max-h-56 overflow-auto border rounded-md">
                  {products.length === 0 && (
                    <div className="p-3 text-sm text-gray-500">No products found.</div>
                  )}
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
                          <div className="flex-1 text-sm text-gray-800">{p.title || 'Untitled'}{typeof p.price === 'number' ? ` · ₹${p.price}` : ''}</div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
            
          </div>
          <div className="md:col-span-1"></div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default AddDiscount;