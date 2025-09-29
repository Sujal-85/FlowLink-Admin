import React, { useState } from 'react';
import LayoutWrapper from './LayoutWrapper';
import { ChevronLeft, Search, Calendar, Clock, Tag } from 'lucide-react';
import { useHistory } from 'react-router-dom';
import { createDiscount } from '../services/db';

const AddDiscount = () => {
  const history = useHistory();
  const [method, setMethod] = useState('code');
  const [discountCode, setDiscountCode] = useState('');
  const [valueType, setValueType] = useState('percentage'); // 'percentage' | 'fixed'
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
        status: 'Active',
        startsAt: new Date().toISOString(),
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
      <div className="p-6 min-h-screen font-sans">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* <button className="p-2 rounded-md hover:bg-gray-200">
            <ChevronLeft size={24} />
          </button> */}
          <h1 className="text-2xl font-semibold text-gray-800 ml-2">Create discount</h1>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-sm" onClick={()=>history.push('/discounts')}>Cancel</button>
            <button className="h-9 px-3 rounded-lg bg-[#1a1a1a] text-white text-sm" onClick={handleSave}>Save discount</button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Amount off products Card */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-1">Amount off products</h2>
              <p className="text-sm text-gray-500 mb-4">Offer a discount on specific products or collections.</p>
              
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
                        placeholder="e.g. SUMMER10"
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateCode}
                        className="ml-4 text-sm font-semibold text-blue-600 hover:underline whitespace-nowrap">
                        Generate random code
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Customers must enter this code at checkout.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Value Card */}
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
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Applies to</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Specific collections</option>
                  <option>Specific products</option>
                </select>
                <div className="relative mt-2">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search collections" className="w-full p-2 pl-10 border border-gray-300 rounded-md" />
                  <button className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-md">Browse</button>
                </div>
              </div>
            </div>

            {/* Other Cards stubbed from screenshots */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Eligibility</h2>
              <div className="space-y-2 text-sm">
                <label className="flex items-center"><input type="radio" name="eligibility" className="mr-2" defaultChecked /> All customers</label>
                <label className="flex items-center"><input type="radio" name="eligibility" className="mr-2" /> Specific customer segments</label>
                <label className="flex items-center"><input type="radio" name="eligibility" className="mr-2" /> Specific customers</label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Minimum purchase requirements</h2>
              <div className="space-y-2 text-sm">
                <label className="flex items-center"><input type="radio" name="purchase-req" className="mr-2" defaultChecked /> No minimum requirements</label>
                <label className="flex items-center"><input type="radio" name="purchase-req" className="mr-2" /> Minimum purchase amount (₹)</label>
                <label className="flex items-center"><input type="radio" name="purchase-req" className="mr-2" /> Minimum quantity of items</label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Maximum discount uses</h2>
              <div className="space-y-2 text-sm">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Limit number of times this discount can be used in total</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Limit to one use per customer</label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Combinations</h2>
              <div className="space-y-2 text-sm">
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Product discounts</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Order discounts</label>
                <label className="flex items-center"><input type="checkbox" className="mr-2" /> Shipping discounts</label>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Active dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" defaultValue="2025-09-21" className="w-full p-2 pl-10 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start time (IST)</label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="time" defaultValue="23:53" className="w-full p-2 pl-10 border border-gray-300 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" /> Set end date</label>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Summary</h2>
              <p className="text-sm text-gray-500 mb-4">No discount code yet</p>
              <div className="text-sm space-y-2">
                <p className="font-semibold text-gray-800">Type</p>
                <p className="text-gray-600">Amount off products</p>
                <div className="flex items-center text-gray-600">
                  <Tag size={16} className="mr-2" />
                  <span>Product discount</span>
                </div>
                <p className="font-semibold text-gray-800 pt-2">Details</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>All customers</li>
                  <li>No minimum purchase requirement</li>
                  <li>No usage limits</li>
                  <li>Can't combine with other discounts</li>
                  <li>Active from today</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Sales channel access</h2>
              <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" /> Allow discount to be featured on selected channels</label>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
};

export default AddDiscount;