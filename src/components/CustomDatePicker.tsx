'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomDatePickerProps {
  name: string
  label: string
  value: string // YYYY-MM-DD
  onChange: (val: string) => void
  minDate?: string // YYYY-MM-DD
  align?: 'left' | 'right'
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function CustomDatePicker({ name, label, value, onChange, minDate, align = 'left' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const initialDate = value ? new Date(value) : today
  const [viewDate, setViewDate] = useState(initialDate)

  // Sync state if initial value changes
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value))
    }
  }, [value])

  // Close calendar popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const handleDaySelect = (dayNum: number) => {
    const selected = new Date(year, month, dayNum)
    const yyyy = selected.getFullYear()
    const mm = String(selected.getMonth() + 1).padStart(2, '0')
    const dd = String(selected.getDate()).padStart(2, '0')
    onChange(`${yyyy}-${mm}-${dd}`)
    setIsOpen(false)
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date'
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      return date.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Check if a date is before minDate
  const isBeforeMinDate = (y: number, m: number, d: number) => {
    if (!minDate) return false
    
    // Create dates with 00:00:00 time to compare just the date parts
    const current = new Date(y, m, d)
    current.setHours(0, 0, 0, 0)
    
    const [minY, minM, minD] = minDate.split('-').map(Number)
    const min = new Date(minY, minM - 1, minD)
    min.setHours(0, 0, 0, 0)
    
    return current < min
  }

  const isTodayDisabled = minDate ? isBeforeMinDate(today.getFullYear(), today.getMonth(), today.getDate()) : false

  // Generate grid cells
  const cells = []
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(<div key={`empty-${i}`} className="w-8 h-8" />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isSelected = value === currentDayStr
    const isToday =
      today.getDate() === d &&
      today.getMonth() === month &&
      today.getFullYear() === year

    const disabled = isBeforeMinDate(year, month, d)

    cells.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={disabled}
        onClick={() => handleDaySelect(d)}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
          isSelected
            ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20 scale-105'
            : disabled
            ? 'text-gray-200 cursor-not-allowed font-normal'
            : isToday
            ? 'border border-brand-blue text-brand-blue bg-brand-light/35'
            : 'text-brand-navy hover:bg-gray-100'
        }`}
      >
        {d}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2">
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 px-4 text-left text-xs font-medium text-brand-navy hover:bg-white hover:border-brand-blue/50 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
      >
        <Calendar className="h-4.5 w-4.5 text-gray-400 shrink-0" />
        <span className={value ? 'text-brand-navy font-semibold' : 'text-gray-400'}>
          {formatDateDisplay(value)}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute top-[110%] z-50 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-[280px] animate-scale-in ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}>
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-xs font-bold text-brand-navy">
              {MONTH_NAMES[month]} {year}
            </h4>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1 justify-items-center">
            {cells}
          </div>

          {/* Helpers footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            {!isTodayDisabled ? (
              <button
                type="button"
                onClick={() => {
                  const y = today.getFullYear()
                  const m = String(today.getMonth() + 1).padStart(2, '0')
                  const d = String(today.getDate()).padStart(2, '0')
                  onChange(`${y}-${m}-${d}`)
                  setViewDate(today) // reset view calendar to today
                  setIsOpen(false)
                }}
                className="text-[10px] font-bold text-brand-blue hover:underline"
              >
                Select Today
              </button>
            ) : (
              <span className="text-[10px] text-gray-300 font-medium">Past unavailable</span>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-bold text-gray-400 hover:text-brand-navy"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
