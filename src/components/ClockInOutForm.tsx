'use client'

import { useState } from 'react'
import { clockInAction, clockOutAction } from '@/app/actions/attendance'
import { MapPin, Navigation, Check, Loader2, AlertCircle } from 'lucide-react'

interface AttendanceRecord {
  clock_in_at: string | null
  clock_out_at: string | null
  date: string
}

interface ClockInOutFormProps {
  todayRecord: AttendanceRecord | null
  shiftInfo: {
    name: string
    start_time: string
    end_time: string
  } | null
}

export default function ClockInOutForm({ todayRecord, shiftInfo }: ClockInOutFormProps) {
  const [status, setStatus] = useState<'idle' | 'locating' | 'verifying' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successType, setSuccessType] = useState<'in' | 'out' | null>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const hasClockedIn = !!todayRecord?.clock_in_at
  const hasClockedOut = !!todayRecord?.clock_out_at

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':')
      const hr = parseInt(hours, 10)
      const ampm = hr >= 12 ? 'PM' : 'AM'
      const formattedHr = hr % 12 || 12
      return `${formattedHr}:${minutes} ${ampm}`
    } catch {
      return timeStr
    }
  }

  const handleClockAction = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('Geolocation is not supported by your browser.')
      return
    }

    setStatus('locating')
    setErrorMessage('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setStatus('verifying')

        try {
          if (!hasClockedIn) {
            const res = await clockInAction(latitude, longitude)
            if (res.error) {
              setStatus('error')
              setErrorMessage(res.error)
            } else if (res.success) {
              setSuccessType('in')
              setDistance(res.distance ?? null)
              setStatus('success')
              setTimeout(() => {
                window.location.reload()
              }, 2200)
            }
          } else {
            const res = await clockOutAction(latitude, longitude)
            if (res.error) {
              setStatus('error')
              setErrorMessage(res.error)
            } else if (res.success) {
              setSuccessType('out')
              setStatus('success')
              setTimeout(() => {
                window.location.reload()
              }, 2200)
            }
          }
        } catch (err) {
          setStatus('error')
          setErrorMessage('A network error occurred. Please try again.')
        }
      },
      (error) => {
        setStatus('error')
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Location permission denied. Please allow location access to clock in.')
            break
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location information is unavailable.')
            break
          case error.TIMEOUT:
            setErrorMessage('Location request timed out. Please try again.')
            break
          default:
            setErrorMessage('An unknown location error occurred.')
            break
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-scale-in bg-white rounded-2xl p-8 shadow-sm">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <svg
            className="h-12 w-12 stroke-current"
            viewBox="0 0 52 52"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="animate-draw-check"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
              d="M14 27l8 8 16-16"
            />
          </svg>
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-xl font-semibold text-brand-navy">
            {successType === 'in' ? 'Clocked In' : 'Clocked Out'}
          </h3>
          <p className="text-sm text-brand-grey">
            {successType === 'in' ? 'Have a productive shift!' : 'Rest well! See you tomorrow.'}
          </p>
          {distance !== null && (
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Verified inside office geofence ({distance}m)
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shift Overview Card */}
      {shiftInfo && (
        <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between border border-gray-50">
          <div>
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Assigned Shift</span>
            <h4 className="text-lg font-semibold text-brand-navy mt-0.5">{shiftInfo.name}</h4>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">Schedule</span>
            <p className="text-sm font-semibold text-brand-navy mt-0.5">
              {formatTime(shiftInfo.start_time)} - {formatTime(shiftInfo.end_time)}
            </p>
          </div>
        </div>
      )}

      {/* Main interactive button card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-8 border border-gray-50">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-brand-navy">
            {hasClockedOut 
              ? 'Shift Completed' 
              : hasClockedIn 
              ? 'Clock Out' 
              : 'Clock In'}
          </h3>
          <p className="text-xs text-brand-grey max-w-[240px] mx-auto">
            {hasClockedOut
              ? "You've clocked out for today. See you tomorrow!"
              : hasClockedIn
              ? 'Ensure you are within the office radius when checking out.'
              : 'Tap to register your arrival. System checks GPS coordinates.'}
          </p>
        </div>

        {/* Big Action Button */}
        {!hasClockedOut ? (
          <button
            onClick={handleClockAction}
            disabled={status === 'locating' || status === 'verifying'}
            className={`relative flex h-48 w-48 flex-col items-center justify-center rounded-full border-4 border-brand-light shadow-2xl transition-all duration-300 active:scale-[0.96] disabled:opacity-80 focus:outline-none ${
              hasClockedIn
                ? 'bg-brand-navy text-white hover:bg-opacity-95 shadow-brand-navy/10'
                : 'bg-brand-blue text-white hover:bg-opacity-95 shadow-brand-blue/15'
            }`}
          >
            {status === 'locating' || status === 'verifying' ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
                <span className="text-xs font-medium">
                  {status === 'locating' ? 'Locating...' : 'Verifying...'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Navigation className={`h-12 w-12 ${hasClockedIn ? 'rotate-180' : ''} text-white animate-pulse`} />
                <span className="text-base font-semibold tracking-wide">
                  {hasClockedIn ? 'Clock Out' : 'Clock In'}
                </span>
              </div>
            )}
          </button>
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gray-50 border-4 border-gray-100 text-gray-400">
            <Check className="h-16 w-16" />
          </div>
        )}

        {/* Live Coordinate Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-brand-grey">
          <MapPin className="h-4 w-4 text-brand-blue" />
          <span>HQ Office geofence checking active</span>
        </div>
      </div>

      {/* Error notification banner */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-3.5 items-start text-red-700 animate-scale-in">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-semibold text-sm">Action Blocked</h5>
            <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Today's Log Card (if checked in) */}
      {hasClockedIn && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 border border-gray-50">
          <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Today's Logs</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-light/40 rounded-xl p-3">
              <span className="text-[9px] font-bold text-brand-grey uppercase">Clock In</span>
              <p className="text-sm font-semibold text-brand-navy mt-0.5">
                {todayRecord.clock_in_at ? new Date(todayRecord.clock_in_at).toLocaleTimeString('en-MY', {
                  timeZone: 'Asia/Kuala_Lumpur',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : '-'}
              </p>
            </div>
            <div className="bg-brand-light/40 rounded-xl p-3">
              <span className="text-[9px] font-bold text-brand-grey uppercase">Clock Out</span>
              <p className="text-sm font-semibold text-brand-navy mt-0.5">
                {todayRecord.clock_out_at ? new Date(todayRecord.clock_out_at).toLocaleTimeString('en-MY', {
                  timeZone: 'Asia/Kuala_Lumpur',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
