import { createClient } from '@/lib/supabase/server'
import StaffManager from '@/components/StaffManager'
import OfficeLocationForm from '@/components/OfficeLocationForm'

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
  shift_id: string | null
  role: 'staff' | 'admin'
  active: boolean
  shifts: Shift | null
}

interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

export default async function AdminStaffPage() {
  const supabase = await createClient()

  // 1. Fetch staff, shifts, and geofence in parallel
  const [
    staffRawResult,
    shiftsRawResult,
    officeRawResult
  ] = await Promise.all([
    supabase
      .from('staff')
      .select('id, name, phone, staff_id, role, active, shift_id, shifts ( id, name, start_time, end_time )')
      .order('name', { ascending: true }),
    supabase
      .from('shifts')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('office_locations')
      .select('*')
      .limit(1)
      .single()
  ])

  const staffList = (staffRawResult.data || []) as unknown as StaffProfile[]
  const shifts = (shiftsRawResult.data || []) as Shift[]
  const office = officeRawResult.data as OfficeLocation

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Configuration</span>
        <h2 className="text-3xl font-semibold text-brand-navy">Staff & Geofence Settings</h2>
        <p className="text-xs text-brand-grey">Register employees, assign shifts, and manage geofencing coordinates.</p>
      </div>

      {/* Staff directory & configuration controls */}
      <StaffManager staffList={staffList} shifts={shifts} office={office} />
    </div>
  )
}
