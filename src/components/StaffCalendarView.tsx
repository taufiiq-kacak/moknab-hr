'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'

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

interface StaffCalendarViewProps {
  staff: StaffProfile
  leaves: LeaveRequest[]
  attendance: AttendanceLog[]
  holidays: Record<string, string>
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function StaffCalendarView({ staff, leaves, attendance, holidays }: StaffCalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()) // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate())

  // Navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(1)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(1)
  }

  // Monthly grid math
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Helper to format date key: YYYY-MM-DD
  const getDateString = (day: number) => {
    const y = currentYear
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Check schedules and statuses
  const getDayInfo = (day: number) => {
    const dateStr = getDateString(day)
    const dateObj = new Date(currentYear, currentMonth, day)
    const dayOfWeek = dateObj.getDay() // 5 = Friday
    const isFriday = dayOfWeek === 5

    // 2. Check for public holiday
    const holidayName = holidays[dateStr] || null

    // 3. Check for approved leave
    const activeLeave = leaves.find((l) => {
      const start = new Date(l.start_date)
      const end = new Date(l.end_date)
      // Normalize dates for comparison (discard time)
      const current = new Date(currentYear, currentMonth, day)
      start.setHours(0,0,0,0)
      end.setHours(0,0,0,0)
      current.setHours(0,0,0,0)
      return current >= start && current <= end
    })

    // 4. Check for clock-in attendance
    const attendanceRecord = attendance.find((a) => a.date === dateStr)

    return {
      isFriday,
      holidayName,
      activeLeave,
      attendanceRecord,
      dayOfWeek
    }
  }

  // Selected Day Details
  const selectedDayInfo = getDayInfo(selectedDay)
  const selectedDateObj = new Date(currentYear, currentMonth, selectedDay)
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // Format shift times for display
  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${m} ${ampm}`
    } catch {
      return timeStr
    }
  }

  return (
    <div className="space-y-5 animate-scale-in">
      {/* Calendar Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50/50">
        {/* Month Selector */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-brand-navy">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-1.5">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-2 text-brand-navy hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              type="button"
              className="p-2 text-brand-navy hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {DAYS_OF_WEEK.map((d, index) => (
            <span
              key={d}
              className={`text-[10px] font-bold uppercase tracking-wider ${
                index === 5 ? 'text-red-500' : 'text-brand-grey'
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty paddings */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-transparent" />
          ))}

          {/* Days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1
            const isSelected = selectedDay === day
            const { isFriday, holidayName, activeLeave, attendanceRecord } = getDayInfo(day)

            // Dynamic styles
            let cellStyle = 'bg-gray-50/50 text-brand-navy border border-transparent'

            if (isFriday) {
              cellStyle = 'bg-gray-100/50 text-gray-400 border border-transparent'
            } else if (activeLeave) {
              cellStyle = 'bg-red-50 text-red-600 border border-red-100 font-semibold'
            } else if (holidayName) {
              cellStyle = 'bg-amber-50/70 text-amber-800 border border-amber-200 font-medium'
            } else if (staff.shifts) {
              cellStyle = 'bg-white text-brand-navy border border-gray-150 font-medium hover:border-brand-blue/30'
            }

            if (isSelected) {
              cellStyle = 'bg-brand-navy text-white border border-brand-navy font-bold shadow-sm shadow-brand-navy/10 scale-105 transition-transform'
            }

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                type="button"
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all ${cellStyle}`}
              >
                <span>{day}</span>

                {/* Status Dot / Indicator */}
                <div className="absolute bottom-1 flex gap-0.5 justify-center w-full">
                  {attendanceRecord && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-green-300' : 'bg-green-500'}`} />
                  )}
                  {activeLeave && !isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  )}
                  {holidayName && !isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-brand-grey font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-gray-100 border border-gray-200" />
            <span>Off Day (Cuti)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-white border border-gray-200" />
            <span>Working Shift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-amber-50 border border-amber-200" />
            <span>Public Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-red-50 border border-red-200" />
            <span>On Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Clocked In</span>
          </div>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50/50 space-y-4 animate-scale-in">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-brand-navy">Schedule Details</h4>
            <p className="text-[10px] text-brand-grey">{formattedSelectedDate}</p>
          </div>
          <Calendar className="h-4.5 w-4.5 text-brand-blue" />
        </div>

        <div className="space-y-3.5">
          {/* Public Holiday Banner if active */}
          {selectedDayInfo.holidayName && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wide">Public Holiday (Cuti Umum)</span>
                <p className="text-xs font-bold text-amber-900 mt-0.5">{selectedDayInfo.holidayName}</p>
                <p className="text-[10px] text-amber-700/80 mt-0.5 font-medium">Off day for all staff. Clock-in is not required.</p>
              </div>
            </div>
          )}

          {/* Shift Details row */}
          <div>
            <span className="block text-[9px] font-bold text-brand-grey uppercase tracking-wider mb-1">Schedule Status</span>
            {selectedDayInfo.isFriday ? (
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-200">
                  Friday Rest Day (Cuti Hujung Minggu)
                </span>
                {selectedDayInfo.holidayName && (
                  <p className="text-[10px] text-brand-grey font-medium">
                    Note: Weekend rest day overlaps with {selectedDayInfo.holidayName}.
                  </p>
                )}
              </div>
            ) : selectedDayInfo.activeLeave ? (
              <div className="flex flex-col gap-1 items-start">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                  On Approved Leave ({selectedDayInfo.activeLeave.leave_type})
                </span>
                <span className="text-[10px] text-brand-grey font-medium">
                  Roster overridden for leave duration.
                </span>
              </div>
            ) : selectedDayInfo.holidayName ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                Public Holiday Rest Day
              </span>
            ) : staff.shifts ? (
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100/50">
                  {staff.shifts.name}
                </span>
                <p className="text-xs font-bold text-brand-navy">
                  Work Hours: {formatTime(staff.shifts.start_time)} - {formatTime(staff.shifts.end_time)}
                </p>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No shift assigned</span>
            )}
          </div>

          {/* Clock In status row */}
          <div>
            <span className="block text-[9px] font-bold text-brand-grey uppercase tracking-wider mb-1">Clock Status</span>
            {selectedDayInfo.attendanceRecord ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50/50 border border-green-100/50 p-2.5 rounded-xl">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Clocked in at {new Date(selectedDayInfo.attendanceRecord.clock_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ) : selectedDayInfo.isFriday || selectedDayInfo.activeLeave || selectedDayInfo.holidayName ? (
              <span className="text-xs text-brand-grey font-medium">Rest day / Leave / Public Holiday: Clock-in not required.</span>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50/50 border border-amber-100/50 p-2.5 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>No clock-in record found for this workday.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
