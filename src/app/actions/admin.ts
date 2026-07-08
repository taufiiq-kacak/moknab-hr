'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createStaffAction(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase()

  // 1. Validate Caller is Admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  const { data: caller } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || caller.role !== 'admin') {
    return { error: 'Unauthorized. Admins only.' }
  }

  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const password = formData.get('password') as string
  const shiftId = formData.get('shiftId') as string || null
  const role = formData.get('role') as 'staff' | 'admin'

  if (!name || !phone || !password || !role) {
    return { error: 'All fields (except Shift) are required.' }
  }

  const adminClient = createAdminClient()

  // Auto-increment Staff ID generation
  const prefix = role === 'admin' ? 'ADM-' : 'STF-'
  const { data: existingIds } = await adminClient
    .from('staff')
    .select('staff_id')

  let maxNum = 0
  if (existingIds) {
    existingIds.forEach((item) => {
      const sid = item.staff_id || ''
      if (sid.startsWith(prefix)) {
        const numPart = sid.substring(prefix.length)
        const parsed = parseInt(numPart, 10)
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed
        }
      }
    })
  }

  let signupError = null
  let authUser = null
  let finalStaffId = ''
  let currentNum = maxNum + 1
  let attempts = 0

  while (attempts < 30) {
    finalStaffId = `${prefix}${String(currentNum).padStart(2, '0')}`
    const virtualEmail = `${finalStaffId.toLowerCase()}@internal.hr`

    const { data, error } = await adminClient.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true,
    })

    // If email exists, increment index and retry
    if (error && (error.status === 422 || error.message.toLowerCase().includes('already'))) {
      currentNum++
      attempts++
      continue
    }

    signupError = error
    authUser = data
    break
  }

  if (signupError || !authUser?.user) {
    console.error('Signup error:', signupError)
    return { error: signupError?.message || 'Failed to create auth credentials.' }
  }

  // 3. Insert staff metadata
  const { error: dbError } = await adminClient
    .from('staff')
    .insert({
      id: authUser.user.id,
      name,
      phone,
      staff_id: finalStaffId,
      shift_id: shiftId || null,
      role,
      active: true,
    })

  if (dbError) {
    console.error('DB insert error:', dbError)
    // Clean up created user if db record insertion failed
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return { error: dbError.message || 'Failed to register staff record.' }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateStaffAction(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase()

  // Validate Caller
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  const { data: caller } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || caller.role !== 'admin') {
    return { error: 'Unauthorized.' }
  }

  const id = formData.get('id') as string
  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const staffId = (formData.get('staffId') as string || '').trim()
  const password = formData.get('password') as string
  const shiftId = formData.get('shiftId') as string || null
  const active = formData.get('active') === 'true'
  const role = formData.get('role') as 'staff' | 'admin'

  if (!id || !name || !phone || !staffId || !role) {
    return { error: 'All fields are required.' }
  }

  const adminClient = createAdminClient()

  // 1. Sync credentials in Supabase Auth (Virtual email / optional new password)
  const virtualEmail = `${staffId.toLowerCase()}@internal.hr`
  const updatePayload: any = { email: virtualEmail }
  if (password) {
    updatePayload.password = password
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
    id,
    updatePayload
  )

  if (authUpdateError) {
    console.error('Auth update error:', authUpdateError)
    return { error: authUpdateError.message || 'Failed to sync credentials.' }
  }

  // 2. Update staff profile details
  const { error: dbError } = await adminClient
    .from('staff')
    .update({
      name,
      phone,
      staff_id: staffId,
      shift_id: shiftId || null,
      role,
      active,
    })
    .eq('id', id)

  if (dbError) {
    console.error('DB update error:', dbError)
    return { error: dbError.message || 'Failed to update database profile.' }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateOfficeLocationAction(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase()

  // Validate Admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  const { data: caller } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!caller || caller.role !== 'admin') {
    return { error: 'Unauthorized.' }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const latitude = parseFloat(formData.get('latitude') as string)
  const longitude = parseFloat(formData.get('longitude') as string)
  const radiusMeters = parseInt(formData.get('radiusMeters') as string, 10)

  if (!id || !name || isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
    return { error: 'Invalid parameters. Please review your coordinates.' }
  }

  const { error: dbError } = await supabase
    .from('office_locations')
    .update({
      name,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (dbError) {
    console.error('Office update error:', dbError)
    return { error: 'Failed to update geofence coordinates.' }
  }

  revalidatePath('/admin/staff')
  revalidatePath('/staff')
  return { success: true }
}
