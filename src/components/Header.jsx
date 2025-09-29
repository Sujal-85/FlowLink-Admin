import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import auth from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Grid3X3, 
  Bell, 
  ChevronDown, 
  Check, 
  Store,
  Menu
} from 'lucide-react'
import SearchBox from './SearchBox'

const Header = ({ onToggleChat = () => {}, onToggleMobileMenu = () => {} }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const history = useHistory();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

    const handleLogout = async () => {
    try {
      await auth.logout()
    } finally {
      setShowLogoutConfirm(false)
      setShowDropdown(false)
      history.push('/login')
    }
  };

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm)
    // Add search functionality here
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#1a1a1a] h-[60px] flex items-center justify-between px-3 md:px-5 shadow w-full">
        <div className="flex items-center">
          {/* Hamburger Menu for mobile */}
          <button onClick={onToggleMobileMenu} className="md:hidden p-2 text-white bg-gray-800 rounded-xl shadow-lg">
            <Menu size={24} />
          </button>
          {/* Logo for desktop */}
          <div className="hidden md:flex items-center gap-2">
            <img className="w-9 h-9 object-contain" src="/flowlink-logo-white.png" alt="flowlink logo" />
            <span className="text-white text-[20px] font-normal font-mate">FlowLink</span>
          </div>
        </div>

        <div className="flex-1 max-w-[600px] mx-4 md:mx-10">
          {/* Full SearchBox for desktop */}
          <div className="hidden md:block">
            <SearchBox 
              placeholder="Search products, customers, orders..."
              onSearch={handleSearch}
            />
          </div>
          {/* Search Icon for mobile */}
          <button onClick={() => setIsMobileSearchOpen(true)} className="md:hidden p-2 text-white">
            <Search size={24} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-9 h-9 bg-[#303030] rounded flex items-center justify-center text-[#bdc1ca]" onClick={onToggleChat} title="Open chat">
            {/* simple chat bubble glyph */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"/>
            </svg>
          </button>
          <div className="w-9 h-9 bg-[#303030] rounded flex items-center justify-center text-[#bdc1ca]">
            <Bell size={16} />
          </div>
          <div ref={dropdownRef} className="relative">
          <div className="flex items-center gap-2 bg-[#616161] rounded px-2 py-1 text-[#d1d1d1] cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="hidden md:inline text-[12px] font-semibold font-manrope">My Store</span>
            <div className="w-[26px] h-[26px] bg-[#24e82a] rounded flex items-center justify-center text-[#1a1a1a] text-[12px] font-semibold">MS</div>
            <ChevronDown size={16} />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-[#e8e8ed] rounded-xl shadow z-[1000] overflow-hidden">
              <div className="py-2">
                <button
                  className="w-full text-left px-4 py-2 text-[#303030] hover:bg-gray-100 text-[16px] font-medium font-manrope"
                  onClick={() => { setShowDropdown(false); history.push('/setting') }}
                >
                  Account
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-[#d11a2a] hover:bg-gray-100 text-[16px] font-medium font-manrope"
                  onClick={() => { setShowDropdown(false); setShowLogoutConfirm(true) }}
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileSearchOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 z-[1900] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSearchOpen(false)}
            />
            <motion.div
              className="fixed top-[60px] left-0 right-0 bg-[#1a1a1a] z-[2000] md:hidden p-4 shadow-md"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <SearchBox 
                  placeholder="Search..."
                  onSearch={(term) => {
                    handleSearch(term);
                    setIsMobileSearchOpen(false);
                  }}
                  autoFocus
                />
                <button onClick={() => setIsMobileSearchOpen(false)} className="text-white text-sm">Cancel</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Centered custom logout confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-[2100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              className="fixed inset-0 z-[2200] flex items-center justify-center p-4"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#111827]">Log out of Flowlink?</h3>
                <p className="text-sm text-gray-600 mt-1">You will be signed out and can sign back in anytime.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className="h-9 rounded-lg border border-gray-300 bg-white text-sm"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="h-9 rounded-lg bg-red-600 text-white text-sm"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header

