'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'
import { LayoutDashboard, Users, ClipboardCheck, CalendarRange, LogOut, Calendar } from 'lucide-react'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-brand-navy/35 backdrop-blur-[2px] lg:hidden transition-all duration-300 animate-scale-in"
        />
      )}

      {/* Sidebar Aside Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-navy text-white flex flex-col shrink-0 min-h-screen transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue block">Moknab Johor</span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">Admin Panel</h2>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/admin"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/admin') && pathname === '/admin'
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Overview
          </Link>

          <Link
            href="/admin/staff"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/admin/staff')
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            Staff Management
          </Link>

          <Link
            href="/admin/calendar"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/admin/calendar')
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Calendar className="h-5 w-5 shrink-0" />
            Shift Calendar
          </Link>

          <Link
            href="/admin/attendance"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/admin/attendance')
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ClipboardCheck className="h-5 w-5 shrink-0" />
            Attendance Records
          </Link>

          <Link
            href="/admin/leave"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive('/admin/leave')
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <CalendarRange className="h-5 w-5 shrink-0" />
            Leave Requests
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 focus:outline-none"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
