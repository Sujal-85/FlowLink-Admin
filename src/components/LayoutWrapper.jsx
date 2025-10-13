import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Header from './Header'
import Sidebar from './Sidebar'
import ChatbotDrawer from './ChatbotDrawer'

const LayoutWrapper = ({ children, isLoading = false, customHeader = null, contentClassName = 'px-3 md:px-6 pt-2 md:pt-4 pb-2' }) => {
  const [showChat, setShowChat] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleChat = () => setShowChat(v => !v);
  const toggleMobileMenu = () => setIsMobileMenuOpen(v => !v);

  return (
    <div className="h-screen flex flex-col bg-[#f1f1f1]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-[1000]">
        {customHeader
          ? React.cloneElement(customHeader, { onToggleChat: toggleChat, onToggleMobileMenu: toggleMobileMenu })
          : <Header onToggleChat={toggleChat} onToggleMobileMenu={toggleMobileMenu} />}
      </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] flex-1 overflow-hidden">
        {/* Fixed Sidebar */}
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />

        {/* Dynamic Main Content */}
                                        <main className="app-main p-0 overflow-y-auto">
          {isLoading ? (
                        <div className="flex items-center justify-center h-full">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-[#3aa93f] rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={contentClassName}>
                {children}
              </div>
            </motion.div>
          )}
          <ChatbotDrawer open={showChat} onClose={() => setShowChat(false)} />
        </main>
      </div>
    </div>
  )
}

export default LayoutWrapper

