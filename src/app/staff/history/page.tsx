import { createClient } from '@/lib/supabase/server'
import { Calendar, ArrowRight } from 'lucide-react'

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

function formatTime(isoStr: string | null) {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleTimeString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: records } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Attendance Logs</span>
        <h2 className="text-3xl font-semibold text-brand-navy">History</h2>
        <p className="text-xs text-brand-grey">Review your check-ins and check-outs for the past 30 days.</p>
      </div>

      <div className="space-y-4">
        {records && records.length > 0 ? (
          records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50/50 flex items-center justify-between transition-all duration-200 hover:shadow-md hover:shadow-brand-blue/5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-brand-navy font-medium text-sm">
                  <Calendar className="h-4 w-4 text-brand-blue" />
                  {formatDate(record.date)}
                </div>
                <p className="text-[10px] text-brand-grey">Verified Coordinates</p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div className="min-w-[60px]">
                  <span className="text-[9px] font-bold text-brand-grey uppercase block">In</span>
                  <span className="text-sm font-medium text-brand-navy">{formatTime(record.clock_in_at)}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300" />
                <div className="min-w-[60px]">
                  <span className="text-[9px] font-bold text-brand-grey uppercase block">Out</span>
                  <span className="text-sm font-medium text-brand-navy">{formatTime(record.clock_out_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-brand-grey border border-gray-50/50">
            <p className="text-sm">No attendance records found yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
