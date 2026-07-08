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
