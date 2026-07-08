import { createClient } from '@/lib/supabase/server'
import ClockInOutForm from '@/components/ClockInOutForm'

function getMalaysiaDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
}

interface Shift {
  name: string
  start_time: string
  end_time: string
}

interface StaffData {
  shifts: Shift | null
}

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-sm font-medium text-brand-grey">Loading staff details...</p>
      </div>
    )
  }

  const todayStr = getMalaysiaDateString()

  // 1. Get today's attendance record (if any)
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('clock_in_at, clock_out_at, date')
    .eq('staff_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  // 2. Fetch shift details
  const { data: staffDataRaw } = await supabase
    .from('staff')
    .select('shifts ( name, start_time, end_time )')
    .eq('id', user.id)
    .single()

  const staffData = staffDataRaw as unknown as StaffData | null
  const shiftInfo = staffData?.shifts || null

  return (
    <div className="space-y-4">
      <ClockInOutForm
        todayRecord={attendanceData || null}
        shiftInfo={shiftInfo}
      />
    </div>
  )
}
