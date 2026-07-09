'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Download, Calendar, Users, Clock, Filter, RefreshCw } from 'lucide-react'
import CustomDatePicker from '@/components/CustomDatePicker'
import CustomSelect from '@/components/CustomSelect'

interface Shift {
  name: string
  start_time: string
}

interface Staff {
  name: string
  staff_id: string
  shifts: Shift | null
}

interface AttendanceRecord {
  id: string
  date: string
  clock_in_at: string
  clock_out_at: string | null
  clock_in_lat: number
  clock_in_lng: number
  clock_out_lat: number | null
  clock_out_lng: number | null
  is_breached: boolean
  breached_at: string | null
  last_known_lat: number | null
  last_known_lng: number | null
  staff: Staff
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
  staffMembers: { id: string; name: string; staff_id: string }[]
  shifts: { id: string; name: string }[]
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
    const myTime = formatter.format(date)
    
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

function formatDate(dateStr: string) {
  try {
    const [year, month, day] = dateStr.split('-')
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AttendanceTable({ records, staffMembers, shifts }: AttendanceTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Filter States (Read from URL or default)
  const [staffId, setStaffId] = useState(searchParams.get('staffId') || '')
  const [shiftId, setShiftId] = useState(searchParams.get('shiftId') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const handleApplyFilters = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (staffId) params.set('staffId', staffId)
    if (shiftId) params.set('shiftId', shiftId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    startTransition(() => {
      router.push(`/admin/attendance?${params.toString()}`)
    })
  }

  const handleClearFilters = () => {
    setStaffId('')
    setShiftId('')
    setStartDate('')
    setEndDate('')
    startTransition(() => {
      router.push('/admin/attendance')
    })
  }

  const handleExportCSV = () => {
    const headers = [
      'Staff Name',
      'Staff ID',
      'Date',
      'Clock In Local Time',
      'Clock In Coordinates',
      'Clock Out Local Time',
      'Clock Out Coordinates',
      'Shift',
      'Status',
    ]

    const rows = records.map((rec) => {
      const shiftStart = rec.staff?.shifts?.start_time || '00:00:00'
      const late = isLate(rec.clock_in_at, shiftStart)
      const clockInCoords = `${rec.clock_in_lat}, ${rec.clock_in_lng}`
      const clockOutCoords = rec.clock_out_lat ? `${rec.clock_out_lat}, ${rec.clock_out_lng}` : '-'

      return [
        rec.staff?.name || 'Unknown',
        rec.staff?.staff_id || '-',
        rec.date,
        formatTime(rec.clock_in_at),
        clockInCoords,
        formatTime(rec.clock_out_at),
        clockOutCoords,
        rec.staff?.shifts?.name || 'None',
        late ? 'Late' : 'On Time',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Moknab_Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const staffOptions = [
    { value: '', label: 'All Staff' },
    ...staffMembers.map((sm) => ({ value: sm.id, label: `${sm.name} (${sm.staff_id})` })),
  ]

  const shiftOptions = [
    { value: '', label: 'All Shifts' },
    ...shifts.map((s) => ({ value: s.id, label: s.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-semibold text-brand-navy flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-brand-blue" />
            Filters
          </h3>
          {isPending && <RefreshCw className="h-4 w-4 animate-spin text-brand-blue" />}
        </div>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-end">
            <CustomSelect
              label="Staff Member"
              value={staffId}
              onChange={(val) => setStaffId(val)}
              options={staffOptions}
            />
          </div>

          <div className="flex items-end">
            <CustomSelect
              label="Shift"
              value={shiftId}
              onChange={(val) => setShiftId(val)}
              options={shiftOptions}
            />
          </div>

          <div className="flex items-end">
            <CustomDatePicker
              name="startDate"
              label="Start Date"
              value={startDate}
              onChange={(val) => setStartDate(val)}
            />
          </div>

          <div className="flex items-end">
            <CustomDatePicker
              name="endDate"
              label="End Date"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              align="right"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-brand-grey hover:bg-gray-50 active:scale-95 transition-all focus:outline-none cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-opacity-90 active:scale-95 transition-all shadow-md shadow-brand-blue/10 focus:outline-none cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-brand-navy">Attendance Logs</h3>
            <p className="text-[11px] text-brand-grey">Detailed log matching geofences, shifts, and timestamps.</p>
          </div>
          {records.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-xl hover:bg-opacity-95 shadow-lg shadow-brand-blue/5 hover:shadow-brand-blue/15 transition-all focus:outline-none"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-navy uppercase tracking-wider bg-gray-50/50">
                <th className="py-4 px-6 min-w-[160px] whitespace-nowrap">Name</th>
                <th className="py-4 px-6 min-w-[100px] whitespace-nowrap">Staff ID</th>
                <th className="py-4 px-6 min-w-[120px] whitespace-nowrap">Date</th>
                <th className="py-4 px-6 min-w-[110px] whitespace-nowrap">Shift</th>
                <th className="py-4 px-6 min-w-[160px] whitespace-nowrap">Clock In</th>
                <th className="py-4 px-6 min-w-[160px] whitespace-nowrap">Clock Out</th>
                <th className="py-4 px-6 min-w-[120px] whitespace-nowrap">Late Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-brand-navy">
              {records.length > 0 ? (
                records.map((rec) => {
                  const shiftStart = rec.staff?.shifts?.start_time || '00:00:00'
                  const late = isLate(rec.clock_in_at, shiftStart)

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-brand-navy whitespace-nowrap">
                        {rec.staff?.name || 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-brand-grey font-medium whitespace-nowrap">
                        {rec.staff?.staff_id || '-'}
                      </td>
                      <td className="py-4 px-6 font-medium text-brand-navy whitespace-nowrap">
                        {formatDate(rec.date)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {rec.staff?.shifts?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-light text-brand-blue font-bold text-[10px] tracking-wide border border-brand-blue/10 whitespace-nowrap">
                            {rec.staff.shifts.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-brand-navy">{formatTime(rec.clock_in_at)}</div>
                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                          GPS: {rec.clock_in_lat.toFixed(4)}, {rec.clock_in_lng.toFixed(4)}
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {rec.clock_out_at ? (
                          <>
                            <div className="font-semibold text-brand-navy">{formatTime(rec.clock_out_at)}</div>
                            <div className="text-[9px] text-gray-400 font-medium mt-0.5">
                              GPS:{' '}
                              {rec.clock_out_lat
                                ? `${rec.clock_out_lat.toFixed(4)}, ${rec.clock_out_lng?.toFixed(4)}`
                                : '-'}
                            </div>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] bg-gray-50 text-gray-500 font-semibold border border-gray-200/60 uppercase tracking-wider">
                            On Shift
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {late ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-red-50 text-red-600 font-bold border border-red-100 uppercase tracking-wider">
                              Late
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 uppercase tracking-wider">
                              On Time
                            </span>
                          )}
                          {rec.is_breached && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-600 font-bold border border-amber-100 uppercase tracking-wider animate-pulse" title={rec.breached_at ? `Breached at ${formatTime(rec.breached_at)}` : ''}>
                              ⚠️ Left Geofence
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-grey">
                    No attendance records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
