import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminCalendarView from '@/components/AdminCalendarView'
import { getMalaysiaHolidays } from '@/lib/holidays'

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
}

interface StaffProfile {
  id: string
  name: string
  staff_id: string
  phone: string
  role: 'staff' | 'admin'
  active: boolean
  shift_id: string | null
  shifts: Shift | null
}

interface LeaveRequest {
  id: string
  staff_id: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  staff: {
    name: string
  } | null
}

interface AttendanceLog {
  id: string
  staff_id: string
  date: string
  clock_in_at: string
  clock_out_at: string | null
  staff: {
    name: string
  } | null
}

export default async function AdminCalendarPage() {
  const supabase = await createClient()

  // 1. Validate Caller
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/')
  }

  const { data: caller } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || caller.role !== 'admin') {
    redirect('/')
  }

  // 2. Fetch all Staff
  const { data: staffRaw } = await supabase
    .from('staff')
    .select('id, name, staff_id, phone, role, active, shift_id, shifts ( id, name, start_time, end_time )')
    .order('name', { ascending: true })

  const staffList = (staffRaw || []) as unknown as StaffProfile[]

  // 3. Fetch all Shifts
  const { data: shiftsRaw } = await supabase
    .from('shifts')
    .select('id, name, start_time, end_time')
    .order('name', { ascending: true })

  const shifts = (shiftsRaw || []) as unknown as Shift[]

  // 4. Fetch all Approved Leaves
  const { data: leavesRaw } = await supabase
    .from('leave_requests')
    .select('id, staff_id, leave_type, start_date, end_date, status, staff ( name )')
    .eq('status', 'approved')

  const leaves = (leavesRaw || []) as unknown as LeaveRequest[]

  // 5. Fetch all Attendance Logs
  const { data: attendanceRaw } = await supabase
    .from('attendance')
    .select('id, staff_id, date, clock_in_at, clock_out_at, staff ( name )')

  const attendance = (attendanceRaw || []) as unknown as AttendanceLog[]

  // 6. Fetch Public Holidays
  const currentYear = new Date().getFullYear()
  const holidays = await getMalaysiaHolidays(currentYear)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Roster Overview</span>
        <h2 className="text-2xl font-bold text-brand-navy">Shift & Roster Calendar</h2>
        <p className="text-xs text-brand-grey">Monitor daily shift allocations, rest days, and approved employee leaves.</p>
      </div>

      <AdminCalendarView 
        staffList={staffList}
        shifts={shifts}
        leaves={leaves}
        attendance={attendance}
        holidays={holidays}
      />
    </div>
  )
}
