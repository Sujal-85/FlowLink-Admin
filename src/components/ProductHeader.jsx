import React from 'react'
import { 
  Search, 
  Grid3X3, 
  Bell,
  Menu
} from 'lucide-react'

const ProductHeader = ({ onDiscard, onSave, onToggleChat = () => {}, onToggleMobileMenu = () => {} }) => {
  return (
    <header className="bg-[#1a1a1a] h-[60px] flex items-center justify-between px-3 md:px-5 shadow w-full">
      {/* Left: Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-2">
        <button onClick={onToggleMobileMenu} className="md:hidden p-2 text-white bg-gray-800 rounded-xl shadow-lg">
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <img className="w-9 h-9 object-contain" src="/flowlink-logo-white.png" alt="flowlink logo" />
          <span className="text-white text-[20px] font-normal font-mate">FlowLink</span>
        </div>
      </div>

      {/* Center: Search hint (hidden on mobile) */}
      <div className="hidden md:block flex-1 max-w-[600px] mx-4 md:mx-10">
        <div className="h-9 rounded-[10px] bg-[#303030] text-[#bdc1ca] px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={16} />
            <span className="text-sm">Search</span>
          </div>
          <div className="flex items-center gap-1">
            <Grid3X3 size={16} />
            <span className="text-sm">K</span>
          </div>
        </div>
      </div>

      {/* Right: Chat + Bell + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          className="w-9 h-9 bg-[#303030] rounded flex items-center justify-center text-[#bdc1ca]"
          onClick={onToggleChat}
          title="Open chat"
        >
          {/* simple chat bubble glyph */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"/>
          </svg>
        </button>
        <div className="w-9 h-9 bg-[#303030] rounded flex items-center justify-center text-[#bdc1ca]">
          <Bell size={16} />
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-lg bg-white text-[#1a1a1a] text-sm" onClick={onDiscard}>Discard</button>
          <button className="h-9 px-3 rounded-lg bg-brand-green text-white text-sm" onClick={onSave}>Save</button>
        </div>
      </div>
    </header>
  )
}

export default ProductHeader

