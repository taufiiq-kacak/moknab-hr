import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffCalendarView from '@/components/StaffCalendarView'
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
  shift_id: string | null
  shifts: Shift | null
}

interface LeaveRequest {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
}

interface AttendanceLog {
  id: string
  date: string
  clock_in_at: string
}

export default async function StaffCalendarPage() {
  const supabase = await createClient()

  // 1. Fetch Auth User
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/')
  }

  // 2. Fetch Staff Profile with Shift details
  const { data: staffRaw } = await supabase
    .from('staff')
    .select('id, name, shift_id, shifts ( id, name, start_time, end_time )')
    .eq('id', user.id)
    .single()

  const staff = staffRaw as unknown as StaffProfile | null
  if (!staff) {
    redirect('/')
  }

  // 3. Fetch Approved Leave Requests
  const { data: leavesRaw } = await supabase
    .from('leave_requests')
    .select('id, leave_type, start_date, end_date, status')
    .eq('staff_id', user.id)
    .eq('status', 'approved')

  const leaves = (leavesRaw || []) as unknown as LeaveRequest[]

  // 4. Fetch Attendance Logs (for clock-in indicator badges)
  const { data: attendanceRaw } = await supabase
    .from('attendance')
    .select('id, date, clock_in_at')
    .eq('staff_id', user.id)

  const attendance = (attendanceRaw || []) as unknown as AttendanceLog[]

  // 5. Fetch Public Holidays
  const currentYear = new Date().getFullYear()
  const holidays = await getMalaysiaHolidays(currentYear)

  return (
    <div className="space-y-6 max-w-md mx-auto px-4 pb-24 pt-4">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">My Schedule</span>
        <h2 className="text-2xl font-bold text-brand-navy">Work Calendar</h2>
        <p className="text-xs text-brand-grey">View shift schedules, approved leaves, and rest days.</p>
      </div>

      <StaffCalendarView 
        staff={staff} 
        leaves={leaves} 
        attendance={attendance} 
        holidays={holidays}
      />
    </div>
  )
}
