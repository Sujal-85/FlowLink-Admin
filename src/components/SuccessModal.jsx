import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SuccessModal = ({ open, title = 'Success', message = '', onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-[92vw] max-w-[460px] p-6 text-center"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="text-base font-semibold text-[#111827]">{title}</div>
            {message ? <div className="mt-1 text-sm text-gray-600">{message}</div> : null}
            <div className="mt-5">
              <button
                className="h-9 px-4 rounded-lg bg-[#1a1a1a] text-white text-sm"
                onClick={onClose}
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SuccessModal
