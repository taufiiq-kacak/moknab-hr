import { createClient } from '@/lib/supabase/server'
import LeaveReviewQueue from '@/components/LeaveReviewQueue'
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface Staff {
  name: string
  staff_id: string
}

interface LeaveRequest {
  id: string
  leave_type: 'MC' | 'Emergency'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  staff: Staff
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

export default async function AdminLeavePage() {
  const supabase = await createClient()

  // 1. Fetch pending requests
  const { data: pendingRaw } = await supabase
    .from('leave_requests')
    .select(`
      id,
      leave_type,
      start_date,
      end_date,
      reason,
      created_at,
      staff:staff!leave_requests_staff_id_fkey (
        name,
        staff_id
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const pendingRequests = (pendingRaw || []) as unknown as any[]

  // 2. Fetch all requests for history log
  const { data: historyRaw } = await supabase
    .from('leave_requests')
    .select(`
      id,
      leave_type,
      start_date,
      end_date,
      reason,
      status,
      created_at,
      reviewed_at,
      staff:staff!leave_requests_staff_id_fkey (
        name,
        staff_id
      )
    `)
    .order('created_at', { ascending: false })

  const historyRequests = (historyRaw || []) as unknown as LeaveRequest[]

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
    <div className="space-y-10">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Leave Administration</span>
        <h2 className="text-3xl font-semibold text-brand-navy">Review Requests</h2>
        <p className="text-xs text-brand-grey">Approve or reject medical certificates and emergency time-off.</p>
      </div>

      {/* Pending Queue Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pl-1">
          Pending Approval Queue ({pendingRequests.length})
        </h3>
        <LeaveReviewQueue pendingRequests={pendingRequests} />
      </div>

      {/* Leave Logs History List Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-navy uppercase tracking-wider pl-1">
          Full Request History Log ({historyRequests.length})
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-navy uppercase tracking-wider bg-gray-55/20">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Staff ID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Duration Range</th>
                  <th className="py-4 px-6">Reason Given</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-brand-navy">
                {historyRequests.length > 0 ? (
                  historyRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{req.staff?.name}</td>
                      <td className="py-4 px-6">{req.staff?.staff_id}</td>
                      <td className="py-4 px-6 uppercase font-bold text-brand-blue text-[10px]">
                        {req.leave_type}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-brand-blue" />
                          {formatDateRange(req.start_date, req.end_date)}
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold border rounded-lg uppercase tracking-wide ${getStatusStyle(
                            req.status
                          )}`}
                        >
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-grey">
                      No leave requests in system history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
