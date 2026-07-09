'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
  const loginInput = (formData.get('loginInput') as string || '').trim()
  const password = formData.get('password') as string

  if (!loginInput || !password) {
    return { error: 'Please enter both credentials.' }
  }

  // 1. Look up staff by staff_id or phone number via admin client (secure, bypasses RLS lookup)
  const adminClient = createAdminClient()
  const { data: staff, error: lookupError } = await adminClient
    .from('staff')
    .select('staff_id, role, active')
    .or(`staff_id.eq."${loginInput}",phone.eq."${loginInput}"`)
    .maybeSingle()

  if (lookupError || !staff) {
    return { error: 'Invalid Staff ID or Phone Number.' }
  }

  if (!staff.active) {
    return { error: 'This account has been deactivated.' }
  }

  // 2. Authenticate using the virtual email format
  const virtualEmail = `${staff.staff_id.toLowerCase()}@internal.hr`
  const supabase = await createServerSupabase()
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: virtualEmail,
    password: password,
  })

  if (authError) {
    return { error: 'Incorrect password.' }
  }

  // Redirect based on role
  if (staff.role === 'admin') {
    redirect('/admin')
  } else {
    redirect('/staff')
  }
}

export async function logoutAction() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/')
}

export async function signupStaffAction(prevState: any, formData: FormData) {
  const name = (formData.get('name') as string || '').trim()
  const phone = (formData.get('phone') as string || '').trim()
  const password = formData.get('password') as string

  if (!name || !phone || !password) {
    return { error: 'All fields are required.' }
  }

  const adminClient = createAdminClient()

  // 1. Check if phone is already registered
  const { data: existingPhone } = await adminClient
    .from('staff')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingPhone) {
    return { error: 'This phone number is already registered.' }
  }

  // 2. Auto-generate next STF- id
  const prefix = 'STF-'
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
      shift_id: null, // Starts with no shift (manager will assign later)
      role: 'staff',
      active: true,
    })

  if (dbError) {
    console.error('DB insert error:', dbError)
    await adminClient.auth.admin.deleteUser(authUser.user.id)
    return { error: dbError.message || 'Failed to register staff record.' }
  }

  return { success: true, staffId: finalStaffId }
}
