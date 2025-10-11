import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LoaderOverlay = ({ open = false, label = 'Loading…' }) => {
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative flex flex-col items-center gap-3 bg-white rounded-2xl shadow-2xl px-6 py-5"
            initial={{ y: 12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <div className="w-8 h-8 border-2 border-gray-300 border-t-[#1a1a1a] rounded-full animate-spin" />
            <div className="text-sm text-[#111827] font-medium">{label}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoaderOverlay
