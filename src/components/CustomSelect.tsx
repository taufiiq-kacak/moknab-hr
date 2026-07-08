'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  value: string
  onChange: (val: string) => void
  options: Option[]
  placeholder?: string
  name?: string
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Find active option
  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2">
        {label}
      </label>
      {name && <input type="hidden" name={name} value={value} />}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 px-4 text-left text-xs font-semibold text-brand-navy hover:bg-white hover:border-brand-blue/50 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`h-4.5 w-4.5 text-gray-400 shrink-0 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-brand-blue' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute top-[110%] left-0 z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-xl p-1 animate-scale-in max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left rounded-xl px-4 py-2.5 text-xs transition-all duration-150 ${
                  isSelected
                    ? 'bg-brand-light text-brand-blue font-bold'
                    : 'text-brand-navy hover:bg-gray-50 hover:text-brand-navy'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
