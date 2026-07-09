import { createClient } from '@/lib/supabase/server'
import { Users, Clock, AlertTriangle, CalendarRange, UserMinus } from 'lucide-react'

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
  shifts: Shift | null
}

interface AttendanceRecord {
  id: string
  staff_id: string
  clock_in_at: string
  clock_out_at: string | null
  date: string
}

interface ActiveLeave {
  staff_id: string
  leave_type: string
  status: string
}

function getMalaysiaDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
}

function isLate(clockInIso: string, shiftStartTimeStr: string) {
  try {
    const date = new Date(clockInIso)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const myTime = formatter.format(date) // e.g. "08:31:02"
    
    const [inHr, inMin, inSec] = myTime.split(':').map((x) => parseInt(x, 10))
    const [shiftHr, shiftMin, shiftSec] = shiftStartTimeStr.split(':').map((x) => parseInt(x, 10))

    if (inHr > shiftHr) return true
    if (inHr === shiftHr && inMin > shiftMin) return true
    if (inHr === shiftHr && inMin === shiftMin && inSec > shiftSec) return true
    return false
  } catch {
    return false
  }
}

function formatTime(isoStr: string | null) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleTimeString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const todayStr = getMalaysiaDateString()

  // 1. Fetch dashboard data in parallel
  const [
    staffDataRawResult,
    attendanceDataResult,
    activeLeavesDataResult
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, staff_id, phone, shifts ( id, name, start_time, end_time )')
      .eq('role', 'staff')
      .eq('active', true),
    supabase
      .from('attendance')
      .select('*')
      .eq('date', todayStr),
    supabase
      .from('leave_requests')
      .select('staff_id, leave_type, status')
      .eq('status', 'approved')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
  ])

  const staffList = (staffDataRawResult.data || []) as unknown as StaffProfile[]
  const todayAttendance = (attendanceDataResult.data || []) as AttendanceRecord[]
  const activeLeaves = (activeLeavesDataResult.data || []) as ActiveLeave[]

  // Computations
  const totalStaff = staffList.length
  const presentCount = todayAttendance.length
  const leaveCount = activeLeaves.length

  // Build lookups
  const attendanceMap = new Map<string, AttendanceRecord>()
  todayAttendance.forEach((rec) => attendanceMap.set(rec.staff_id, rec))

  const leaveMap = new Map<string, ActiveLeave>()
  activeLeaves.forEach((lv) => leaveMap.set(lv.staff_id, lv))

  let lateCount = 0
  const loggedInStaff = staffList
    .map((staff) => {
      const record = attendanceMap.get(staff.id)
      if (!record) return null
      
      const shiftStart = staff.shifts?.start_time || '00:00:00'
      const checkLate = isLate(record.clock_in_at, shiftStart)
      if (checkLate) lateCount++

      return {
        ...staff,
        record,
        isLate: checkLate,
      }
    })
    .filter(Boolean) as (StaffProfile & { record: AttendanceRecord; isLate: boolean })[]

  const absentStaff = staffList
    .filter((staff) => !attendanceMap.has(staff.id))
    .map((staff) => {
      const leave = leaveMap.get(staff.id)
      return {
        ...staff,
        onLeave: !!leave,
        leaveType: leave?.leave_type || null,
      }
    })

  const absentCount = absentStaff.filter((s) => !s.onLeave).length

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Console</span>
        <h2 className="text-3xl font-semibold text-brand-navy">Today's Overview</h2>
        <p className="text-xs text-brand-grey">Real-time attendance analysis for {new Date(todayStr).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Total Active Staff</span>
            <h3 className="text-3xl font-bold text-brand-navy">{totalStaff}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-light text-brand-blue flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Present Today</span>
            <h3 className="text-3xl font-bold text-brand-navy">{presentCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-light text-brand-blue flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Late Arrivals</span>
            <h3 className="text-3xl font-bold text-brand-navy">{lateCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-light text-brand-blue flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Approved Leave</span>
            <h3 className="text-3xl font-bold text-brand-navy">{leaveCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-light text-brand-blue flex items-center justify-center">
            <CalendarRange className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Today's Logs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-brand-navy">Today's Attendance Logs ({presentCount})</h4>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {loggedInStaff.length > 0 ? (
              loggedInStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-3.5 bg-brand-light/30 border border-brand-light/10 rounded-xl hover:bg-brand-light/50 transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-semibold text-brand-navy">{staff.name}</h5>
                      {staff.record.is_breached && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-50 text-amber-600 font-bold border border-amber-100 uppercase tracking-wide animate-pulse">
                          ⚠️ Left Geofence
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-[10px] text-brand-grey font-medium">
                      <span>ID: {staff.staff_id}</span>
                      <span>•</span>
                      <span>Shift: {staff.shifts?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex gap-2 items-center text-[10px] font-semibold">
                        <span className="text-brand-grey uppercase">In:</span>
                        <span className="text-brand-navy">{formatTime(staff.record.clock_in_at)}</span>
                        {staff.isLate ? (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-50 text-red-600 font-bold border border-red-100 uppercase tracking-wide">Late</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 uppercase tracking-wide">On Time</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center text-[10px] font-semibold mt-1">
                        <span className="text-brand-grey uppercase">Out:</span>
                        <span className="text-brand-navy">{formatTime(staff.record.clock_out_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-grey text-center py-8">No staff clocked in yet today.</p>
            )}
          </div>
        </div>

        {/* Column 2: Not Clocked In / Absent / On Leave */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 space-y-4">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <h4 className="text-sm font-semibold text-brand-navy">Not Clocked In Today ({absentCount + leaveCount})</h4>
            <UserMinus className="h-4 w-4 text-brand-grey" />
          </div>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {absentStaff.length > 0 ? (
              absentStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100/50 rounded-xl"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-brand-navy">{staff.name}</h5>
                    <div className="flex gap-2 text-[10px] text-brand-grey font-medium mt-0.5">
                      <span>ID: {staff.staff_id}</span>
                      <span>•</span>
                      <span>Assigned: {staff.shifts?.name || 'No Shift'}</span>
                    </div>
                  </div>
                  <div>
                    {staff.onLeave ? (
                      <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-brand-light text-brand-blue border border-red-100 uppercase tracking-wider">
                        On Leave ({staff.leaveType})
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">
                        Absent
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-brand-grey text-center py-8">All staff have clocked in today!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
