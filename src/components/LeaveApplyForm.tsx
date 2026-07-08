'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { applyLeaveAction } from '@/app/actions/leave'
import { FileText, CheckCircle2, Loader2 } from 'lucide-react'
import CustomDatePicker from '@/components/CustomDatePicker'

export default function LeaveApplyForm() {
  const [state, formAction, isPending] = useActionState(applyLeaveAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Get local Malaysian date in YYYY-MM-DD format for SSR consistency
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset()
      setStartDate('')
      setEndDate('')
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-5"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-brand-navy">Apply Leave</h3>
        <p className="text-[11px] text-brand-grey">Submit a new medical or emergency leave request.</p>
      </div>

      <div className="space-y-4">
        {/* Leave Type Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2">
            Leave Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-3 text-center text-xs font-semibold text-brand-navy hover:bg-gray-100 transition-all has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue/5 has-[:checked]:text-brand-blue">
              <input
                type="radio"
                name="leaveType"
                value="MC"
                defaultChecked
                className="sr-only"
              />
              MC (Sick Leave)
            </label>
            <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-3 text-center text-xs font-semibold text-brand-navy hover:bg-gray-100 transition-all has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue/5 has-[:checked]:text-brand-blue">
              <input
                type="radio"
                name="leaveType"
                value="Emergency"
                className="sr-only"
              />
              Emergency Leave
            </label>
          </div>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-3">
          <CustomDatePicker
            name="startDate"
            label="Start Date"
            value={startDate}
            onChange={(val) => {
              setStartDate(val)
              // If end date is now before the new start date, reset or shift it
              if (endDate && val > endDate) {
                setEndDate('')
              }
            }}
            minDate={todayStr}
          />
          <CustomDatePicker
            name="endDate"
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate || todayStr}
          />
        </div>

        {/* Reason Textarea */}
        <div>
          <label htmlFor="reason" className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2">
            Reason / Details
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute top-3 left-3">
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
            <textarea
              id="reason"
              name="reason"
              required
              rows={3}
              placeholder="e.g. Medical center checkup or family emergency"
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs text-red-600 font-medium animate-scale-in">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 text-xs text-emerald-700 font-medium flex items-center gap-2 animate-scale-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Leave request submitted successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center items-center rounded-xl bg-brand-blue py-3 px-4 text-xs font-semibold text-white hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          'Submit Request'
        )}
      </button>
    </form>
  )
}
