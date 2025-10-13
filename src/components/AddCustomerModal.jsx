import React, { useState, useEffect } from 'react'
import LayoutWrapper from './LayoutWrapper'
import { createCustomer, provisionCustomerLogin, updateCustomerPortal } from '../services/db'
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
  const [address, setAddress] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    email: ''
  })

  // Credentials modal state
  const [creds, setCreds] = useState(null) // { portalId, email, password }
  const [showCredsModal, setShowCredsModal] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [copiedField, setCopiedField] = useState('')

  const copyToClipboard = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value || ''))
      setCopiedField(label)
      setTimeout(() => setCopiedField(''), 1200)
    } catch {}
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      // Construct payload with default address if provided
      const payload = { ...formData }
      const hasAnyAddress = [address.line1, address.city, address.state, address.postalCode].some(v => String(v || '').trim())
      if (hasAnyAddress) {
        const name = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || address.name || ''
        const addr = {
          name,
          line1: address.line1 || '',
          line2: address.line2 || '',
          city: address.city || '',
          state: address.state || '',
          postalCode: address.postalCode || '',
          country: address.country || 'India',
          phone: address.phone || formData.phoneNumber || '',
          email: address.email || formData.email || '',
          label: 'shipping',
          isDefault: true
        }
        payload.addresses = [addr]
      }

      const id = await createCustomer(payload)
      if (typeof onAdded === 'function') {
        onAdded({ id, ...payload })
      }
      // Auto-provision storefront login if email is available
      let shouldClose = true
      try {
        let email = (formData.email || address.email || '').trim()
        const name = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Customer'
        if (!email) {
          email = window.prompt(`Enter email for ${name} to create login credentials:`) || ''
        }
        if (email) {
          const pwd = Math.random().toString(36).slice(-10)
          const result = await provisionCustomerLogin({ name, email, password: pwd })
          const portalId = result?.user?.id || '—'
          setCreds({ portalId, email, password: pwd })
          setShowCredsModal(true)
          // Persist to admin server for visibility in customer list
          try { await updateCustomerPortal(id, { email, password: pwd }) } catch (e) { console.warn('Persist portal creds failed:', e) }
          shouldClose = false
        }
      } catch (e) {
        // Non-blocking if provisioning fails
        console.warn('Provision login failed:', e)
      }
      if (shouldClose) {
        onClose && onClose()
      }
    } catch (err) {
      alert('Failed to save customer')
    } finally {
      setIsSaving(false)
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
    <>
    <LayoutWrapper isLoading={false} contentClassName="px-0 md:px-6 pt-2 md:pt-4 pb-2">
    <div className="flex-1 px-0 py-3 md:p-6 bg-[#f1f1f1] overflow-y-auto">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
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
          <div className="grid grid-cols-1 md:[grid-template-columns:1fr_320px] gap-6">
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
                      placeholder="e.g., Sujal"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Last name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="e.g., Khedekar"
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
                    placeholder="e.g., sujal@example.com"
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
                      placeholder="e.g., 9876543210"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Full name</label>
                    <input
                      type="text"
                      value={address.name}
                      onChange={(e)=>setAddress(a=>({ ...a, name: e.target.value }))}
                      placeholder="e.g., Sujal Khedekar"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Phone</label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e)=>setAddress(a=>({ ...a, phone: e.target.value }))}
                      placeholder="e.g., 9876543210"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm text-[#303030] font-semibold">Address line 1</label>
                    <input
                      type="text"
                      value={address.line1}
                      onChange={(e)=>setAddress(a=>({ ...a, line1: e.target.value }))}
                      placeholder="e.g., Flat 12B, Sky View Apartments"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm text-[#303030] font-semibold">Address line 2</label>
                    <input
                      type="text"
                      value={address.line2}
                      onChange={(e)=>setAddress(a=>({ ...a, line2: e.target.value }))}
                      placeholder="e.g., Near City Mall"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">City</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e)=>setAddress(a=>({ ...a, city: e.target.value }))}
                      placeholder="e.g., Pune"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">State</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e)=>setAddress(a=>({ ...a, state: e.target.value }))}
                      placeholder="e.g., Maharashtra"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Postal code</label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e)=>setAddress(a=>({ ...a, postalCode: e.target.value }))}
                      placeholder="e.g., 411001"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-[#303030] font-semibold">Country</label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e)=>setAddress(a=>({ ...a, country: e.target.value }))}
                      placeholder="e.g., India"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm text-[#303030] font-semibold">Email</label>
                    <input
                      type="email"
                      value={address.email}
                      onChange={(e)=>setAddress(a=>({ ...a, email: e.target.value }))}
                      placeholder="e.g., sujal@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none"
                    />
                  </div>
                </div>
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
                  placeholder="e.g., Prefers morning deliveries."
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
                  placeholder="e.g., VIP, bulk-buyer"
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
              {isSaving ? 'Saving…' : 'Save customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </LayoutWrapper>
    {/* Credentials Modal */}
    {showCredsModal && creds && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => { setShowCredsModal(false); onClose && onClose() }} />
        <div className="relative bg-white rounded-xl shadow-2xl w-[92vw] max-w-[560px] p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-semibold text-[#303030]">Customer Login Credentials</div>
            <button className="w-8 h-8 rounded-lg hover:bg-gray-100" onClick={() => { setShowCredsModal(false); onClose && onClose() }}>✕</button>
          </div>
          <p className="text-xs text-gray-600 mb-4">Share these credentials with the customer. Password is hidden by default; click the eye icon to reveal.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Customer ID</label>
              <div className="flex items-center gap-2">
                <input readOnly value={creds.portalId || ''} className="flex-1 h-9 px-3 rounded border border-gray-300 text-sm bg-gray-50" />
                <button type="button" className="h-9 px-3 rounded border text-sm" onClick={() => copyToClipboard('id', creds.portalId)}>
                  {copiedField === 'id' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <div className="flex items-center gap-2">
                <input readOnly value={creds.email || ''} className="flex-1 h-9 px-3 rounded border border-gray-300 text-sm bg-gray-50" />
                <button type="button" className="h-9 px-3 rounded border text-sm" onClick={() => copyToClipboard('email', creds.email)}>
                  {copiedField === 'email' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Password</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input readOnly type={showPwd ? 'text' : 'password'} value={creds.password || ''} className="w-full h-9 px-3 pr-10 rounded border border-gray-300 text-sm bg-gray-50" />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? 'Hide' : 'Show'}>
                    {showPwd ? (
                      // eye-off icon
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.58-1.36 1.43-2.64 2.5-3.76M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12M3 3l18 18"/></svg>
                    ) : (
                      // eye icon
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                <button type="button" className="h-9 px-3 rounded border text-sm" onClick={() => copyToClipboard('pwd', creds.password)}>
                  {copiedField === 'pwd' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button className="h-9 px-4 rounded border" onClick={() => { setShowCredsModal(false); onClose && onClose() }}>Done</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default AddCustomerModal
