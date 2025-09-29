import React from 'react'
import { motion } from 'framer-motion'

const ContentLoader = ({ message = "Loading..." }) => {
  return (
    <motion.div 
      className="content-loader"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="circular-loader">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
      </div>
      <p className="loader-message">{message}</p>
    </motion.div>
  )
}

export default ContentLoader

