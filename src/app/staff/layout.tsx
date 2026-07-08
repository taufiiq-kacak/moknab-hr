import { createClient } from '@/lib/supabase/server'
import { logoutAction } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import StaffBottomNav from '@/components/StaffBottomNav'

interface Shift {
  name: string
}

interface StaffData {
  name: string
  shifts: Shift | null
}

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let staffName = 'Staff Member'
  let shiftName = ''

  if (user) {
    const { data } = await supabase
      .from('staff')
      .select('name, shifts ( name )')
      .eq('id', user.id)
      .single()

    const staffData = data as unknown as StaffData | null
    if (staffData) {
      staffName = staffData.name
      shiftName = staffData.shifts?.name || ''
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-light pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-35 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-blue">
            {shiftName ? `${shiftName} Active` : 'Staff Portal'}
          </span>
          <h1 className="text-xl font-semibold text-brand-navy truncate max-w-[200px] mt-0.5">
            {staffName}
          </h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors focus:outline-none"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </header>

      {/* Content wrapper */}
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <StaffBottomNav />
    </div>
  )
}
