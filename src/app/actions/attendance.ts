'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Haversine formula to compute distance in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // distance in meters
}

// Helper to get local Malaysian date string (YYYY-MM-DD)
function getMalaysiaDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
}

export async function clockInAction(lat: number, lng: number) {
  const supabase = await createServerSupabase()
  
  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  // 2. Fetch office configurations for geofencing
  const { data: office, error: officeError } = await supabase
    .from('office_locations')
    .select('latitude, longitude, radius_meters')
    .limit(1)
    .single()

  if (officeError || !office) {
    return { error: 'HQ Office location details are not set.' }
  }

  // 3. Compute distance
  const distance = getDistanceMeters(lat, lng, office.latitude, office.longitude)
  if (distance > office.radius_meters) {
    return {
      error: `Outside Geofence: You are ${Math.round(distance)}m from the office. Please move inside the ${office.radius_meters}m boundary to clock in.`,
    }
  }

  // 4. Validate if already clocked in today
  const todayStr = getMalaysiaDateString()
  const { data: existing, error: existingError } = await supabase
    .from('attendance')
    .select('id')
    .eq('staff_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  if (existing) {
    return { error: 'You have already clocked in today.' }
  }

  // 5. Insert clock-in record
  const { error: insertError } = await supabase
    .from('attendance')
    .insert({
      staff_id: user.id,
      date: todayStr,
      clock_in_at: new Date().toISOString(),
      clock_in_lat: lat,
      clock_in_lng: lng,
    })

  if (insertError) {
    console.error('Clock-in error:', insertError)
    return { error: 'Failed to record clock-in. Please try again.' }
  }

  revalidatePath('/staff')
  revalidatePath('/admin')
  return { success: true, distance: Math.round(distance) }
}

export async function clockOutAction(lat: number, lng: number) {
  const supabase = await createServerSupabase()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  // 2. Find today's attendance record
  const todayStr = getMalaysiaDateString()
  const { data: record, error: recordError } = await supabase
    .from('attendance')
    .select('id, clock_out_at')
    .eq('staff_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  if (recordError || !record) {
    return { error: 'No clock-in record found for today. You must clock in first.' }
  }

  if (record.clock_out_at) {
    return { error: 'You have already clocked out today.' }
  }

  // 3. Update clock-out columns
  const { error: updateError } = await supabase
    .from('attendance')
    .update({
      clock_out_at: new Date().toISOString(),
      clock_out_lat: lat,
      clock_out_lng: lng,
    })
    .eq('id', record.id)

  if (updateError) {
    console.error('Clock-out error:', updateError)
    return { error: 'Failed to record clock-out. Please try again.' }
  }

  revalidatePath('/staff')
  revalidatePath('/admin')
  return { success: true }
}

export async function reportGeofenceBreachAction(lat: number, lng: number) {
  const supabase = await createServerSupabase()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  // 2. Fetch office configurations for geofencing
  const { data: office, error: officeError } = await supabase
    .from('office_locations')
    .select('latitude, longitude, radius_meters')
    .limit(1)
    .single()

  if (officeError || !office) {
    return { error: 'Office location details are not set.' }
  }

  // 3. Compute distance from office
  const distance = getDistanceMeters(lat, lng, office.latitude, office.longitude)
  if (distance <= office.radius_meters) {
    // User is still inside, no breach
    return { success: true, breached: false }
  }

  // 4. Find today's attendance record
  const todayStr = getMalaysiaDateString()
  const { data: record, error: recordError } = await supabase
    .from('attendance')
    .select('id, clock_out_at, is_breached')
    .eq('staff_id', user.id)
    .eq('date', todayStr)
    .maybeSingle()

  if (recordError || !record) {
    return { error: 'No active clock-in session found.' }
  }

  // If already clocked out or already flagged, no update needed
  if (record.clock_out_at || record.is_breached) {
    return { success: true, breached: true }
  }

  // 5. Flag geofence breach
  const { error: updateError } = await supabase
    .from('attendance')
    .update({
      is_breached: true,
      breached_at: new Date().toISOString(),
      last_known_lat: lat,
      last_known_lng: lng,
    })
    .eq('id', record.id)

  if (updateError) {
    console.error('Breach update error:', updateError)
    return { error: 'Failed to report breach.' }
  }

  revalidatePath('/staff')
  revalidatePath('/admin')
  return { success: true, breached: true }
}
