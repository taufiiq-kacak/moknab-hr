'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, History, CalendarDays } from 'lucide-react'

export default function StaffBottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/staff') {
      return pathname === '/staff'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-gray-100 py-3 px-6 flex justify-around items-center shadow-lg shadow-black/20">
      <Link
        href="/staff"
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${
          isActive('/staff') && pathname === '/staff'
            ? 'text-brand-blue scale-105'
            : 'text-gray-400 hover:text-brand-navy'
        }`}
      >
        <Clock className="h-5.5 w-5.5 stroke-[2.2]" />
        <span className="text-[10px] font-medium">Clock</span>
      </Link>
      <Link
        href="/staff/history"
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${
          isActive('/staff/history')
            ? 'text-brand-blue scale-105'
            : 'text-gray-400 hover:text-brand-navy'
        }`}
      >
        <History className="h-5.5 w-5.5 stroke-[2.2]" />
        <span className="text-[10px] font-medium">History</span>
      </Link>
      <Link
        href="/staff/calendar"
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${
          isActive('/staff/calendar')
            ? 'text-brand-blue scale-105'
            : 'text-gray-400 hover:text-brand-navy'
        }`}
      >
        <CalendarDays className="h-5.5 w-5.5 stroke-[2.2]" />
        <span className="text-[10px] font-medium">Calendar</span>
      </Link>
      <Link
        href="/staff/leave"
        className={`flex flex-col items-center gap-1 transition-all duration-200 ${
          isActive('/staff/leave')
            ? 'text-brand-blue scale-105'
            : 'text-gray-400 hover:text-brand-navy'
        }`}
      >
        <CalendarDays className="h-5.5 w-5.5 stroke-[2.2]" />
        <span className="text-[10px] font-medium">Leave</span>
      </Link>
    </nav>
  )
}
