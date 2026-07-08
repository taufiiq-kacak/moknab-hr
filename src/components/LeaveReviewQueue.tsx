'use client'

import { useTransition, useState } from 'react'
import { reviewLeaveAction } from '@/app/actions/leave'
import { Calendar, FileText, Check, X, AlertCircle, Clock } from 'lucide-react'

interface Staff {
  name: string
  staff_id: string
}

interface PendingLeave {
  id: string
  leave_type: 'MC' | 'Emergency'
  start_date: string
  end_date: string
  reason: string
  created_at: string
  staff: Staff
}

interface LeaveReviewQueueProps {
  pendingRequests: PendingLeave[]
}

function formatDateRange(startDateStr: string, endDateStr: string) {
  try {
    const formatDate = (str: string) => {
      const [year, month, day] = str.split('-')
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
      return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    if (startDateStr === endDateStr) {
      return formatDate(startDateStr)
    }
    return `${formatDate(startDateStr)} - ${formatDate(endDateStr)}`
  } catch {
    return `${startDateStr} to ${endDateStr}`
  }
}

export default function LeaveReviewQueue({ pendingRequests }: LeaveReviewQueueProps) {
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReview = (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id)
    setError(null)

    startTransition(async () => {
      try {
        const res = await reviewLeaveAction(id, status)
        if (res?.error) {
          setError(res.error)
        }
      } catch {
        setError('An unexpected network error occurred.')
      } finally {
        setProcessingId(null)
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-2 text-xs font-medium text-red-700 animate-scale-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {pendingRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingRequests.map((req) => {
            const isLoading = isPending && processingId === req.id

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 flex flex-col justify-between gap-5 transition-all duration-200 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-brand-navy text-sm">{req.staff?.name}</h4>
                      <p className="text-[10px] text-brand-grey font-medium mt-0.5">
                        ID: {req.staff?.staff_id} • Type: {req.leave_type}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-brand-navy">
                    <Calendar className="h-4 w-4 text-brand-blue" />
                    {formatDateRange(req.start_date, req.end_date)}
                  </div>

                  <div className="bg-brand-light/30 border border-brand-light/10 rounded-xl p-3.5 text-xs text-brand-navy leading-relaxed">
                    <span className="text-[9px] font-bold text-brand-grey uppercase block mb-1">Reason</span>
                    {req.reason}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
                  <button
                    onClick={() => handleReview(req.id, 'rejected')}
                    disabled={isLoading || isPending}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50/50 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview(req.id, 'approved')}
                    disabled={isLoading || isPending}
                    className="flex items-center justify-center gap-1.5 px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 text-center text-brand-grey border border-gray-50/50">
          <p className="text-xs">No pending leave requests to review.</p>
        </div>
      )}
    </div>
  )
}
