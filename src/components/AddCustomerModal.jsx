import React, { useState, useEffect } from 'react'
import LayoutWrapper from '../components/LayoutWrapper'
import { createCustomer } from '../services/db'
const AddCustomerModal = ({ onClose, onAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    language: 'English [Default]',
    email: '',
    phoneCountry: 'IN',
    phoneNumber: '',
    marketingEmails: false,
    marketingSMS: false,
    collectTax: 'Automatic',
    notes: '',
    tags: ''
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const id = await createCustomer(formData)
      if (typeof onAdded === 'function') {
        onAdded({ id, ...formData })
      }
      onClose && onClose()
    } catch (err) {
      alert('Failed to save customer')
    }
  }

  useEffect(() => {
    // Simulate loading time for content
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

//   const handleDiscard = () => {
//     setIsSaving(true)
//     setTimeout(() => {
//       history.push('/')
//     }, 1000)
//   }


  return (
    <LayoutWrapper isLoading={false}>
    <div className="flex-1 p-6 bg-[#f1f1f1] overflow-y-auto">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>→</span>
            <span className="text-[#303030]">New customer</span>
          </div>
          <button className="w-9 h-9 rounded hover:bg-gray-200 flex items-center justify-center" onClick={onClose} type="button" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid [grid-template-columns:1fr_320px] gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Customer Overview */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#303030] text-sm font-semibold font-manrope mb-4">Customer overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">First name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Last name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <label className="text-sm text-[#303030] font-semibold">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  >
                    <option value="English [Default]">English [Default]</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                  <p className="text-xs text-gray-500 m-0">This customer will receive notifications in this language.</p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <label className="text-sm text-[#303030] font-semibold">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <label className="text-sm text-[#303030] font-semibold">Phone number</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.phoneCountry}
                      onChange={(e) => handleInputChange('phoneCountry', e.target.value)}
                      className="w-[120px] px-2 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    >
                      <option value="IN">🇮🇳 +91</option>
                      <option value="US">🇺🇸 +1</option>
                      <option value="UK">🇬🇧 +44</option>
                      <option value="CA">🇨🇦 +1</option>
                    </select>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Phone number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-start gap-2 text-sm text-[#303030]">
                    <input
                      type="checkbox"
                      checked={formData.marketingEmails}
                      onChange={(e) => handleInputChange('marketingEmails', e.target.checked)}
                      disabled
                    />
                    Customer agreed to receive marketing emails.
                  </label>
                </div>

                <div className="mt-2">
                  <label className="flex items-start gap-2 text-sm text-[#303030]">
                    <input
                      type="checkbox"
                      checked={formData.marketingSMS}
                      onChange={(e) => handleInputChange('marketingSMS', e.target.checked)}
                      disabled
                    />
                    Customer agreed to receive SMS marketing text messages.
                  </label>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500 m-0">
                    You should ask your customers for permission before you subscribe them to your marketing emails or SMS.
                  </p>
                </div>
              </div>

              {/* Default Address */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#303030] text-sm font-semibold font-manrope">Default address</h3>
                <p className="text-xs text-gray-500 mb-3">The primary address of this customer</p>
                <button type="button" className="inline-flex items-center gap-2 h-9 px-3 border border-gray-300 rounded-lg bg-white text-sm text-[#303030]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add address
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              </div>

              {/* Tax Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-[#303030] text-sm font-semibold font-manrope">Tax details</h3>
                <p className="text-xs text-gray-500 mb-3">Tax settings</p>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[#303030] font-semibold">Collect tax</label>
                  <select
                    value={formData.collectTax}
                    onChange={(e) => handleInputChange('collectTax', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Notes */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#303030] text-sm font-semibold font-manrope">Notes</h3>
                  <button type="button" className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500">Notes are private and won't be shared with the customer.</p>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add notes about this customer..."
                  rows="4"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none resize-y"
                />
              </div>

              {/* Tags */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#303030] text-sm font-semibold font-manrope">Tags</h3>
                  <button type="button" className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Add tags..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" className="h-9 px-4 rounded-lg border border-gray-300 bg-white text-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="h-9 px-4 rounded-lg bg-brand-green text-white text-sm">
              Save customer
            </button>
          </div>
        </form>
      </div>
    </div>
    </LayoutWrapper>
  )
}

export default AddCustomerModal
