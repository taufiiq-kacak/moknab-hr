'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Users, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

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

interface AdminCalendarViewProps {
  staffList: StaffProfile[]
  shifts: Shift[]
  leaves: LeaveRequest[]
  attendance: AttendanceLog[]
  holidays: Record<string, string>
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminCalendarView({ staffList, shifts, leaves, attendance, holidays }: AdminCalendarViewProps) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
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

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate()

  const getDateString = (day: number) => {
    const y = currentYear
    const m = String(currentMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Get Roster Status for a Day
  const getDayRoster = (day: number) => {
    const dateStr = getDateString(day)
    const dateObj = new Date(currentYear, currentMonth, day)
    const isFriday = dateObj.getDay() === 5

    // 1. Staff on Approved Leave
    const holidayName = holidays[dateStr] || null

    const onLeave = staffList.filter((s) => {
      return leaves.some((l) => {
        if (l.staff_id !== s.id) return false
        const start = new Date(l.start_date)
        const end = new Date(l.end_date)
        const current = new Date(currentYear, currentMonth, day)
        start.setHours(0,0,0,0)
        end.setHours(0,0,0,0)
        current.setHours(0,0,0,0)
        return current >= start && current <= end
      })
    })

    // 2. Staff Scheduled to Work
    const rosteredToWork = (isFriday || holidayName)
      ? []
      : staffList.filter((s) => {
          if (!s.shift_id) return false
          // Exclude if on leave
          const isOnLeave = onLeave.some((ol) => ol.id === s.id)
          return !isOnLeave
        })

    // 3. Staff Off / Rest Day
    const offDuty = (isFriday || holidayName)
      ? staffList
      : staffList.filter((s) => !s.shift_id)

    // 4. Attendance list for this day
    const dayAttendance = attendance.filter((a) => a.date === dateStr)

    return {
      isFriday,
      holidayName,
      onLeave,
      rosteredToWork,
      offDuty,
      dayAttendance
    }
  }

  const selectedDayRoster = getDayRoster(selectedDay)
  const selectedDateObj = new Date(currentYear, currentMonth, selectedDay)
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-MY', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  // Format times helper
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-scale-in">
      {/* Calendar Card (Spans 2 cols on xl screens) */}
      <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-brand-red" />
              {MONTHS[currentMonth]} {currentYear}
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={handlePrevMonth}
                type="button"
                className="p-2 text-brand-navy hover:bg-gray-50 rounded-xl border border-gray-150 transition-colors"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleNextMonth}
                type="button"
                className="p-2 text-brand-navy hover:bg-gray-50 rounded-xl border border-gray-150 transition-colors"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {DAYS_OF_WEEK.map((d, index) => (
              <span
                key={d}
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  index === 5 ? 'text-brand-red' : 'text-brand-grey'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-transparent" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const isSelected = selectedDay === day
              const roster = getDayRoster(day)

              let cellStyle = 'bg-white hover:border-gray-300 border border-gray-150'
              if (roster.isFriday) {
                cellStyle = 'bg-gray-50 text-gray-400 border border-gray-150/50'
              } else if (roster.holidayName) {
                cellStyle = 'bg-amber-50/70 text-amber-800 border border-amber-200'
              }

              if (isSelected) {
                cellStyle = 'bg-brand-red text-white border border-brand-red font-bold shadow-md shadow-brand-red/10 scale-105 transition-transform'
              }

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  type="button"
                  className={`relative aspect-square flex flex-col justify-between p-1.5 rounded-xl text-left transition-all ${cellStyle}`}
                >
                  <span className="text-[11px] font-bold">{day}</span>

                  {/* Summary indicators inside cells */}
                  <div className="w-full space-y-0.5 mt-auto">
                    {roster.isFriday ? (
                      <span className={`block text-[8px] font-bold text-center uppercase tracking-wide py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        Off
                      </span>
                    ) : roster.holidayName ? (
                      <span className={`block text-[8px] font-bold text-center uppercase tracking-wide py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 font-bold'
                      }`}>
                        Holiday
                      </span>
                    ) : (
                      <>
                        {roster.rosteredToWork.length > 0 && (
                          <span className={`block text-[8px] font-bold text-center py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-brand-light text-brand-blue'
                          }`}>
                            W: {roster.rosteredToWork.length}
                          </span>
                        )}
                        {roster.onLeave.length > 0 && (
                          <span className={`block text-[8px] font-bold text-center py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-red-50 text-brand-red'
                          }`}>
                            L: {roster.onLeave.length}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-brand-grey font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-gray-50 border border-gray-200" />
            <span>Friday Off Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-brand-light border border-brand-blue/15" />
            <span>Scheduled Working Count (W)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-red-50 border border-brand-red/15" />
            <span>Approved Staff Leave Count (L)</span>
          </div>
        </div>
      </div>

      {/* Roster Drilldown Panel (1 col) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-5 flex flex-col h-full justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-brand-navy">Daily Roster Details</h4>
              <p className="text-[10px] text-brand-grey">{formattedSelectedDate}</p>
            </div>
            <Users className="h-4.5 w-4.5 text-brand-red" />
          </div>

          <div className="space-y-5 mt-4">
            {/* 1. Working Shifts breakdown */}
            {selectedDayRoster.holidayName ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-1.5 shadow-sm">
                <AlertCircle className="h-5 w-5 text-amber-600 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-brand-navy">Public Holiday (Cuti Umum)</p>
                <p className="text-sm font-extrabold text-amber-900">{selectedDayRoster.holidayName}</p>
                {selectedDayRoster.isFriday ? (
                  <p className="text-[10px] text-amber-700/80 font-medium mt-1">Weekend Rest Day (Friday) overlaps with this public holiday.</p>
                ) : (
                  <p className="text-[10px] text-amber-700/80 font-medium">HQ is closed. Staff are off duty.</p>
                )}
              </div>
            ) : selectedDayRoster.isFriday ? (
              <div className="bg-gray-50/50 border border-gray-150/50 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-brand-navy">Friday Weekend Rest Day</p>
                <p className="text-[10px] text-brand-grey mt-1">HQ is closed. No shifts rostered.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="block text-[9px] font-bold text-brand-grey uppercase tracking-wider">Shift Roster ({selectedDayRoster.rosteredToWork.length} scheduled)</span>

                {shifts.map((shift) => {
                  const staffInShift = selectedDayRoster.rosteredToWork.filter((s) => s.shift_id === shift.id)

                  return (
                    <div key={shift.id} className="border border-gray-100 rounded-xl p-3.5 space-y-2.5 bg-gray-50/20">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-blue bg-brand-light px-2 py-0.5 rounded-full border border-brand-blue/10">
                          {shift.name}
                        </span>
                        <span className="text-[9px] text-brand-grey font-semibold">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </span>
                      </div>

                      {staffInShift.length > 0 ? (
                        <div className="divide-y divide-gray-100/50">
                          {staffInShift.map((staff) => {
                            // Check if clocked in today
                            const checkInRecord = selectedDayRoster.dayAttendance.find((a) => a.staff_id === staff.id)

                            return (
                              <div key={staff.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                                <span className="text-xs font-semibold text-brand-navy">{staff.name}</span>
                                {checkInRecord ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    Clocked In
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    Absent
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">No staff scheduled for this shift.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 2. Staff on Leave */}
            {selectedDayRoster.onLeave.length > 0 && (
              <div className="space-y-2">
                <span className="block text-[9px] font-bold text-brand-grey uppercase tracking-wider">Approved Leave ({selectedDayRoster.onLeave.length})</span>
                <div className="divide-y divide-gray-100 border border-red-100/50 rounded-xl p-3 bg-red-50/10">
                  {selectedDayRoster.onLeave.map((staff) => {
                    const leave = leaves.find((l) => {
                      if (l.staff_id !== staff.id) return false
                      const start = new Date(l.start_date)
                      const end = new Date(l.end_date)
                      const current = new Date(currentYear, currentMonth, selectedDay)
                      start.setHours(0,0,0,0)
                      end.setHours(0,0,0,0)
                      current.setHours(0,0,0,0)
                      return current >= start && current <= end
                    })

                    return (
                      <div key={staff.id} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                        <span className="text-xs font-semibold text-brand-navy">{staff.name}</span>
                        <span className="text-[9px] text-brand-red bg-red-50 px-2 py-0.5 rounded-md border border-brand-red/10 font-bold">
                          {leave?.leave_type || 'Leave'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
