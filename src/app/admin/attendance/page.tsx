import { createClient } from '@/lib/supabase/server'
import AttendanceTable from '@/components/AttendanceTable'

interface SearchParams {
  staffId?: string
  shiftId?: string
  startDate?: string
  endDate?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function AdminAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // 1. Fetch Staff List (for filters)
  const { data: staffMembers } = await supabase
    .from('staff')
    .select('id, name, staff_id')
    .eq('role', 'staff')
    .order('name', { ascending: true })

  // 2. Fetch Shifts (for filters)
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id, name')
    .order('name', { ascending: true })

  // 3. Build Query for Attendance Records
  let query = supabase
    .from('attendance')
    .select(`
      id,
      date,
      clock_in_at,
      clock_out_at,
      clock_in_lat,
      clock_in_lng,
      clock_out_lat,
      clock_out_lng,
      staff (
        name,
        staff_id,
        shift_id,
        shifts (
          name,
          start_time
        )
      )
    `)

  if (params.staffId) {
    query = query.eq('staff_id', params.staffId)
  }

  if (params.startDate) {
    query = query.gte('date', params.startDate)
  }

  if (params.endDate) {
    query = query.lte('date', params.endDate)
  }

  const { data: recordsRaw } = await query
    .order('date', { ascending: false })
    .order('clock_in_at', { ascending: false })

  let records = recordsRaw || []

  // 4. In-memory filter for shift_id since it's nested
  if (params.shiftId) {
    records = records.filter(
      (rec: any) => rec.staff && rec.staff.shift_id === params.shiftId
    )
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Audit logs</span>
        <h2 className="text-3xl font-semibold text-brand-navy">Attendance Records</h2>
        <p className="text-xs text-brand-grey">Audit historical shift logs, check geofences, and export for payroll.</p>
      </div>

      <AttendanceTable
        records={records as any}
        staffMembers={staffMembers || []}
        shifts={shifts || []}
      />
    </div>
  )
}
