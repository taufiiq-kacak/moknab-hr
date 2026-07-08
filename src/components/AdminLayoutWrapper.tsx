'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Menu } from 'lucide-react'

interface AdminLayoutWrapperProps {
  adminName: string
  children: React.ReactNode
}

export default function AdminLayoutWrapper({ adminName, children }: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-light">
      {/* Sidebar */}
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden w-full">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center shadow-sm shadow-brand-navy/2">
          <div className="flex items-center gap-3">
            {/* Hamburger Button visible only on mobile/tablet */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-brand-navy hover:bg-gray-50 active:scale-95 transition-all"
              aria-label="Toggle Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm md:text-base font-semibold text-brand-navy">
              Management Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-brand-navy">{adminName}</span>
          </div>
        </header>

        {/* Body content */}
        <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
