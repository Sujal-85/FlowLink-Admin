import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Edit2 } from 'lucide-react'

const ChatbotDrawer = ({ open, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
        {/* Backdrop for mobile */}
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[1100] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="fixed top-[60px] right-0 h-[calc(100vh-60px)] w-full md:w-[420px] bg-white border-l border-[#e8e8ed] shadow-md flex flex-col z-[1200]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
        >
          <div className="h-12 px-3 border-b border-[#e8e8ed] flex items-center justify-between">
            <div className="text-[#303030] text-sm font-semibold font-manrope">New conversation ▾</div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="Edit"><Edit2 size={14} /></button>
              <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="Maximize"><Maximize2 size={14} /></button>
              <button className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center" aria-label="Close" onClick={onClose}><X size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">🤖</div>
              <div>
                <div className="text-sm font-semibold text-[#303030]">Hey Sujal</div>
                <div className="text-xs text-gray-600">How can I help?</div>
              </div>
            </div>

            <div className="border border-[#e8e8ed] rounded-xl p-3">
              <div className="text-sm font-semibold text-[#303030] mb-2">What's new?</div>
              <div className="flex flex-col gap-2">
                {[
                  'Add store name',
                  'Add your first product',
                  'Design your store',
                  'Unlock your store',
                  'Set up a payment provider',
                  'Review your shipping rates',
                  'Customize your domain',
                ].map(item => (
                  <div className="flex items-center gap-2" key={item}>
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-sm text-[#303030]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-14 px-3 border-t border-[#e8e8ed] flex items-center gap-2">
            <input className="flex-1 h-9 px-3 border border-[#e8e8ed] rounded-lg outline-none" type="text" placeholder="Ask anything..." />
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 rounded hover:bg-gray-100" title="Attach">📎</button>
              <button className="w-9 h-9 rounded hover:bg-gray-100" title="Emoji">😊</button>
              <button className="w-9 h-9 rounded bg-brand-green text-white" title="Send">🎤</button>
            </div>
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default ChatbotDrawer

