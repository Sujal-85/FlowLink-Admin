import React from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { 
  Home, 
  ClipboardList, 
  Tag, 
  Users, 
  FileText, 
  Building2, 
  BarChart3, 
  Lightbulb, 
  Percent, 
  Settings,
  X
} from 'lucide-react'

const Sidebar = ({ isMobileMenuOpen, closeMobileMenu }) => {
  const location = useLocation()
  const history = useHistory()

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/products', icon: Tag, label: 'Products' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/finances', icon: Building2, label: 'Finances' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/discounts', icon: Percent, label: 'Discounts' },
    { path: '/setting', icon: Settings, label: 'Settings' }
  ]

  // Separate Settings to pin it to the bottom
  const settingsItem = navItems.find((i) => i.path === '/setting')
  const items = navItems.filter((i) => i.path !== '/setting')

  const handleNavigation = (path) => {
    history.push(path)
  }

  return (
    <>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

            <aside 
        className={`fixed md:static top-[60px] md:top-auto left-0 w-[260px] bg-white text-black h-[calc(100vh-60px)] md:h-full z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col overflow-hidden`}>
        <div className="flex justify-between items-center p-4 border-b md:hidden">
          <span className="font-semibold text-lg">Menu</span>
          <button onClick={closeMobileMenu} className="p-1 rounded-md hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="py-4 px-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium'
                        const active = isActive ? 'bg-green-100 text-green-900 border-l-4 border-green-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            return (
              <div 
                key={item.path}
                className={`${base} ${active}`}
                onClick={() => {
                  handleNavigation(item.path);
                  closeMobileMenu();
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </div>
            )
          })}
          </nav>
        </div>

        {/* Bottom pinned Settings */}
        {settingsItem && (
          <div className="p-2 border-t">
            {(() => {
              const Icon = settingsItem.icon
              const isActive = location.pathname === settingsItem.path
              const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium'
              const active = isActive ? 'bg-green-100 text-green-900 border-l-4 border-green-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              return (
                <div
                  className={`${base} ${active}`}
                  onClick={() => {
                    handleNavigation(settingsItem.path)
                    closeMobileMenu()
                  }}
                >
                  <Icon size={20} />
                  <span>{settingsItem.label}</span>
                </div>
              )
            })()}
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar

