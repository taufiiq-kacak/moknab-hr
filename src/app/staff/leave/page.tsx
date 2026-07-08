import { createClient } from '@/lib/supabase/server'
import LeaveApplyForm from '@/components/LeaveApplyForm'
import { CalendarDays, Clock, CheckCircle2, XCircle } from 'lucide-react'

function formatDateRange(startDateStr: string, endDateStr: string) {
  try {
    const formatDate = (str: string) => {
      const [year, month, day] = str.split('-')
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
      return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    }

    if (startDateStr === endDateStr) {
      return formatDate(startDateStr)
    }
    return `${formatDate(startDateStr)} - ${formatDate(endDateStr)}`
  } catch {
    return `${startDateStr} to ${endDateStr}`
  }
}

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch own leave requests
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('staff_id', user.id)
    .order('created_at', { ascending: false })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-100'
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-3.5 w-3.5" />
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />
      default:
        return <Clock className="h-3.5 w-3.5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Time Off</span>
        <h2 className="text-3xl font-semibold text-brand-navy">Leave Requests</h2>
        <p className="text-xs text-brand-grey">Request leave and track your submission statuses.</p>
      </div>

      {/* Leave Application Form */}
      <LeaveApplyForm />

      {/* Leave History List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider pl-1">Request History</h4>
        {requests && requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50/50 space-y-3 transition-all duration-200 hover:shadow-md hover:shadow-brand-blue/5"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-brand-navy font-semibold text-sm">
                    <CalendarDays className="h-4 w-4 text-brand-blue" />
                    {formatDateRange(req.start_date, req.end_date)}
                  </div>
                  <span className="inline-block text-[9px] font-bold tracking-wider text-brand-blue uppercase">
                    Type: {req.leave_type}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold border rounded-lg uppercase tracking-wide ${getStatusStyle(
                    req.status
                  )}`}
                >
                  {getStatusIcon(req.status)}
                  {req.status}
                </span>
              </div>

              <div className="text-xs text-brand-navy bg-brand-light/35 rounded-xl p-3 leading-relaxed border border-brand-light/10">
                <span className="font-semibold block text-[9px] text-brand-grey uppercase mb-0.5">Reason</span>
                {req.reason}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-brand-grey border border-gray-50/50">
            <p className="text-sm">No leave requests submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
