import React from 'react'
import { motion } from 'framer-motion'

const Loader = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-white flex items-center justify-center z-[9999]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <div className="relative w-32 h-24 mx-auto overflow-hidden">
          <motion.img
            src="/flowlink-logo-black.png"
            alt="FlowLink Logo"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1,
              ease: 'easeOut',
            }}
          />
          <motion.div
            className="absolute top-0 -left-full w-full h-full"
            style={{
              background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.5,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </div>
        <motion.h1
          className="mt-4 text-3xl font-bold text-gray-800 font-mate"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 1.0, 
            duration: 0.8, 
            ease: 'easeOut' 
          }}
        >
          FlowLink
        </motion.h1>
      </div>
    </motion.div>
  )
}

export default Loader

