import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet } from 'react-helmet'
import { useHistory } from 'react-router-dom'
import { 
  ChevronDown, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  MoreHorizontal,
  Code,
  Wand2,
  Upload,
  Image,
  Link as LinkIcon,
  Smile,
  DollarSign,
  Package,
  Truck,
  Settings,
  Info,
  Plus
} from 'lucide-react'
import LayoutWrapper from '../components/LayoutWrapper'
import ProductHeader from '../components/ProductHeader'
import { auth, googleProvider } from '../services/firebase'
import { signInWithPopup } from 'firebase/auth'
import { createProduct, usingLocalApi } from '../services/db'

const AddProduct = ({ onProductAdded }) => {
  const history = useHistory()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef(null)
  const editorContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [aiKeywords, setAiKeywords] = useState('')
  const [aiTone, setAiTone] = useState('Expert')
  const [mediaFiles, setMediaFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    brand: '',
    category: '',
    vendor: '',
    sku: '',
    barcode: '',
    mrp: 0,
    price: 0,
    chargeTax: true,
    taxRate: 0,
    hsn: '',
    trackQuantity: true,
    quantity: 0,
    continueSelling: false,
    unit: 'kg',
    netWeight: 0,
    expiryDate: '', // yyyy-mm-dd
    status: 'Active'
  })

  useEffect(() => {
    // Simulate loading time for content
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)
    
    return () => clearTimeout(timer)
  }, [])

  // Close AI popup on outside click or Escape
  useEffect(() => {
    if (!showAIPopup) return
    const handleDocMouseDown = (e) => {
      if (!editorContainerRef.current) return
      if (!editorContainerRef.current.contains(e.target)) {
        setShowAIPopup(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowAIPopup(false)
    }
    document.addEventListener('mousedown', handleDocMouseDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDocMouseDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showAIPopup])

  const handleDiscard = () => {
    setIsSaving(true)
    setTimeout(() => {
      history.push('/')
    }, 1000)
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL')
    if (!url) return
    runCmd('createLink', url)
  }

  const insertEmoji = () => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    range.insertNode(document.createTextNode(' 😊 '))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      // Ensure user is signed in for Firebase Storage rules
      if (!auth.currentUser) {
        try {
          await signInWithPopup(auth, googleProvider)
        } catch (authErr) {
          console.warn('[AddProduct] Sign-in skipped or failed', authErr)
        }
      }
      const files = mediaFiles.map(m => m.file).filter(Boolean)
      const id = await createProduct(productData, files)
      setIsSaving(false)
      if (typeof onProductAdded === 'function') {
        onProductAdded({ id, ...productData })
      } else {
        history.push('/products')
      }
    } catch (e) {
      console.error('[AddProduct] save failed', e)
      setIsSaving(false)
      const base = `Failed to save product.\n\n${e?.message || e}`
      const hint = usingLocalApi
        ? `\n\nTroubleshooting (Local API):\n• Ensure the API is running at REACT_APP_API_BASE (default http://localhost:5000).\n• From \'server\\', run: npm start (or node src/index.js).\n• Check terminal for MongoDB connection and any API errors.`
        : `\n\nTroubleshooting (Firestore):\n• Ensure you are signed in (Firebase Auth).\n• Check Firestore rules allow writes for your user.\n• Verify Firebase config and network connectivity.`
      alert(base + hint)
    }
  }

  const handleInputChange = (field, value) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Description toolbar handlers (simple execCommand-based demo)
  const runCmd = (cmd, value = null) => {
    // Focus editor before command
    if (editorRef.current) editorRef.current.focus()
    document.execCommand(cmd, false, value)
  }

  const insertCodeBlock = () => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    const code = document.createElement('pre')
    code.style.padding = '8px'
    code.style.background = '#f3f4f6'
    code.style.borderRadius = '6px'
    code.textContent = sel.toString() || '/* code */'
    range.deleteContents()
    range.insertNode(code)
  }

  const toggleAIPopup = () => setShowAIPopup(v => !v)
  const generateAI = () => {
    if (!editorRef.current) return
    const seed = aiKeywords || 'organic cotton, relaxed fit'
    const text = `Made from ${seed}. Designed with comfort in mind. Perfect for everyday wear.`
    const p = document.createElement('p')
    p.textContent = text
    editorRef.current.appendChild(p)
    setShowAIPopup(false)
    setAiKeywords('')
  }

  // Media handlers
  const openFilePicker = () => fileInputRef.current && fileInputRef.current.click()
  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || [])
    const withPreview = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f)
    }))
    setMediaFiles(prev => [...prev, ...withPreview])
  }

  const onDropFiles = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    const withPreview = files.map(f => ({ file: f, url: URL.createObjectURL(f) }))
    setMediaFiles(prev => [...prev, ...withPreview])
  }

  const removeMediaAt = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <>
      <Helmet>
        <title>Add Product - FlowLink</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mate:ital@0;1&family=Manrope:wght@200..800&display=swap" rel="stylesheet" />
      </Helmet>
      
      <LayoutWrapper 
        isLoading={isLoading} 
        customHeader={<ProductHeader onDiscard={handleDiscard} onSave={handleSave} />}
      >
        <div className="flex-1 p-6 bg-[#f1f1f1] overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-[#303030] text-[28px] font-bold font-manrope m-0">Add product</h1>
          </div>

          {/* Grocery details */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Grocery details</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-600">Brand</label>
                <input
                  type="text"
                  value={productData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Amul, Nestlé"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[rgba(58,169,63,0.1)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-600">SKU</label>
                <input
                  type="text"
                  value={productData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Internal stock code"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-600">Barcode</label>
                <input
                  type="text"
                  value={productData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="EAN/UPC (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:[grid-template-columns:1fr_320px] gap-6 w-full">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Title and Description */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Title</label>
                  <input 
                    type="text" 
                    placeholder="Short sleeve t-shirt"
                    value={productData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[rgba(58,169,63,0.1)]"
                  />
                </div>
                
                <div className="flex flex-col gap-3 mt-4">
                  <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Description</label>
                  <div ref={editorContainerRef} className="border border-gray-300 rounded-xl bg-white focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-700 relative" aria-label="Description editor">
                    <div className="flex items-center gap-1 px-2.5 py-2 bg-white border-b border-gray-200 rounded-t-xl overflow-x-auto whitespace-nowrap" role="toolbar" aria-label="Formatting options">
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Assistant" onClick={toggleAIPopup}><Wand2 size={16} /></button>
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />
                      <select className="h-7 px-2 border border-gray-200 rounded bg-white text-xs font-manrope" aria-label="Block type" onChange={(e)=>runCmd('formatBlock', e.target.value)}>
                        <option value="p">Paragraph</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                      </select>
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Bold" onClick={()=>runCmd('bold')}><Bold size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Italic" onClick={()=>runCmd('italic')}><Italic size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Underline" onClick={()=>runCmd('underline')}><Underline size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Text color" onClick={()=>runCmd('foreColor', '#111827')}>A</button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Insert link" onClick={insertLink}><LinkIcon size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Emoji" onClick={insertEmoji}><Smile size={16} /></button>
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Align left" onClick={()=>runCmd('justifyLeft')}><AlignLeft size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Align center" onClick={()=>runCmd('justifyCenter')}><AlignCenter size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Align right" onClick={()=>runCmd('justifyRight')}><AlignRight size={16} /></button>
                      <div className="w-px h-5 bg-gray-200 mx-0.5" />
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="More" onClick={()=>alert('More actions coming soon') }><MoreHorizontal size={16} /></button>
                      <button className="flex items-center justify-center w-7 h-7 rounded text-gray-600 hover:bg-gray-200" title="Code" onClick={insertCodeBlock}><Code size={16} /></button>
                    </div>
                    <div className="p-3 min-h-[140px] text-sm font-manrope outline-none" ref={editorRef} contentEditable suppressContentEditableWarning>
                    </div>
                    {showAIPopup && (
                      <div className="absolute top-10 left-2 w-[380px] bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50">
                        <div className="font-bold text-slate-900 mb-2">Generate product description</div>
                        <label className="block text-gray-700 text-xs mb-1">Features and keywords</label>
                        <input
                          className="w-full h-[38px] border border-slate-300 rounded-[10px] px-2.5 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700"
                          type="text"
                          placeholder="e.g., organic cotton, relaxed fit"
                          value={aiKeywords}
                          onChange={(e)=>setAiKeywords(e.target.value)}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <select className="h-[30px] border border-gray-200 rounded px-2" value={aiTone} onChange={(e)=>setAiTone(e.target.value)}>
                            <option>Expert</option>
                            <option>Friendly</option>
                            <option>Playful</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="button" className="bg-gray-100 border border-gray-200 rounded h-[30px] px-2 cursor-pointer" title="Settings">⚙️</button>
                            <button type="button" className="bg-gray-200 text-gray-600 rounded h-[30px] px-3 cursor-pointer" onClick={generateAI}>Generate</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Media */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Media</label>
                <div
                  className={`flex items-center justify-center min-h-[140px] border border-dashed border-gray-300 rounded-xl bg-white ${isDragOver ? 'ring-2 ring-blue-600' : ''}`}
                  role="region"
                  aria-label="Product media upload"
                  onDragOver={(e)=>{e.preventDefault(); setIsDragOver(true)}}
                  onDragLeave={()=>setIsDragOver(false)}
                  onDrop={onDropFiles}
                >
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3">
                      <button type="button" className="h-[30px] px-3 bg-white border border-gray-200 rounded-full text-[13px] text-gray-900 cursor-pointer" onClick={openFilePicker}>Upload new</button>
                      <button type="button" className="bg-none border-none p-0 text-[13px] text-gray-700 cursor-pointer" onClick={openFilePicker}>Select existing</button>
                    </div>
                    <p className="mt-2 text-gray-500 text-xs">Accepts images, videos, or 3D models</p>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,model/*" style={{display:'none'}} onChange={onFilesSelected} />
                </div>
                {mediaFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mediaFiles.map((m, idx) => (
                      <div key={idx} className="w-24 h-24 border border-gray-200 rounded overflow-hidden bg-gray-50 relative">
                        <img className="w-full h-full object-cover block" src={m.url} alt={`media-${idx}`} />
                        <button className="absolute top-1 right-1 w-6 h-6 rounded bg-white/80 text-gray-700" title="Remove" onClick={()=>removeMediaAt(idx)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Pricing</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">MRP</label>
                    <input
                      type="number"
                      value={productData.mrp}
                      onChange={(e) => handleInputChange('mrp', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      placeholder="e.g., 120"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">Selling price</label>
                    <input
                      type="number"
                      value={productData.price}
                      onChange={(e) => handleInputChange('price', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      placeholder="e.g., 99"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">HSN/SAC (optional)</label>
                    <input
                      type="text"
                      value={productData.hsn}
                      onChange={(e) => handleInputChange('hsn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      placeholder="e.g., 0402"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chargeTax"
                      checked={productData.chargeTax}
                      onChange={(e) => handleInputChange('chargeTax', e.target.checked)}
                    />
                    <label className="m-0 font-normal cursor-pointer" htmlFor="chargeTax">Charge tax on this product</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 w-24">Tax rate %</label>
                    <input
                      type="number"
                      value={productData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Inventory</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="trackQuantity"
                      checked={productData.trackQuantity}
                      onChange={(e) => handleInputChange('trackQuantity', e.target.checked)}
                    />
                    <label className="m-0 font-normal cursor-pointer" htmlFor="trackQuantity">Track quantity</label>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <label className="block text-[#303030] text-sm font-semibold font-manrope">Quantity</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none"></span>
                      <input 
                        type="text" 
                        value={productData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        className="w-full pl-20 px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="continueSelling"
                      checked={productData.continueSelling}
                      onChange={(e) => handleInputChange('continueSelling', e.target.checked)}
                    />
                    <label className="m-0 font-normal cursor-pointer" htmlFor="continueSelling">Continue selling when out of stock</label>
                  </div>
                  
                  <p className="text-gray-500 text-xs font-manrope m-0 leading-snug">
                    This won't affect Shopify POS. Staff will see a warning, but can complete when available inventory reaches zero and below.
                  </p>
                </div>
              </div>

              {/* Unit & Expiry */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Unit & Expiry</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">Unit</label>
                    <select
                      value={productData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="pcs">pcs</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">Net weight/qty</label>
                    <input
                      type="number"
                      value={productData.netWeight}
                      onChange={(e) => handleInputChange('netWeight', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600">Expiry date</label>
                    <input
                      type="date"
                      value={productData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Variants removed for grocery simplification */}

              {/* SEO section removed for simplicity */}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6 order-last md:order-none">
              {/* Status */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <label className="block text-[#303030] text-sm font-semibold font-manrope mb-3">Status</label>
                <select 
                  value={productData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Publishing removed */}

              {/* Product Organization */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[#303030] text-sm font-semibold font-manrope">Product organization</label>
                  <button className="flex items-center justify-center w-6 h-6 rounded text-gray-600 hover:bg-gray-100"><Info size={16} /></button>
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="block text-[#303030] text-sm font-semibold font-manrope">Category</label>
                  <input 
                    type="text" 
                    value={productData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                  />
                  <p className="text-gray-500 text-xs font-manrope m-0">Used for grouping and search.</p>
                </div>
                
                <div className="flex flex-col gap-3 mt-4">
                  <label className="block text-[#303030] text-sm font-semibold font-manrope">Vendor</label>
                  <input 
                    type="text" 
                    value={productData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-manrope bg-white focus:outline-none"
                  />
                </div>
              </div>
              {/* Theme template removed */}
            </div>
          </div>
        </div>
      </LayoutWrapper>

      {/* Saving Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-green rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#303030] text-base font-medium font-manrope">Processing...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AddProduct