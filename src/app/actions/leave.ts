'use server'

import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { sendLeaveNotification } from '@/lib/notifications/whatsapp'
import { revalidatePath } from 'next/cache'

export async function applyLeaveAction(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  // 2. Fetch staff profile for their name
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('name')
    .eq('id', user.id)
    .single()

  if (staffError || !staff) {
    return { error: 'Failed to retrieve staff profile.' }
  }

  const leaveType = formData.get('leaveType') as 'MC' | 'Emergency'
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const reason = (formData.get('reason') as string || '').trim()

  if (!leaveType || !startDate || !endDate || !reason) {
    return { error: 'All fields are required.' }
  }

  // Validate dates
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'Invalid dates selected.' }
  }

  if (start > end) {
    return { error: 'Start date cannot be after end date.' }
  }

  // 3. Insert leave request into database
  const { error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      staff_id: user.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: 'pending',
    })

  if (insertError) {
    console.error('Leave insert error:', insertError)
    return { error: 'Failed to submit leave request. Please try again.' }
  }

  // 4. Trigger WhatsApp Notification
  try {
    await sendLeaveNotification(staff.name, leaveType, startDate, endDate)
  } catch (err) {
    console.error('Failed to trigger WhatsApp notification:', err)
  }

  revalidatePath('/staff/leave')
  revalidatePath('/admin/leave')
  return { success: true }
}

export async function reviewLeaveAction(leaveId: string, status: 'approved' | 'rejected') {
  const supabase = await createServerSupabase()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Authentication required.' }
  }

  // 2. Validate user is an admin
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('role')
    .eq('id', user.id)
    .single()

  if (staffError || !staff || staff.role !== 'admin') {
    return { error: 'Unauthorized. Only admins can review leave requests.' }
  }

  // 3. Update request status
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', leaveId)

  if (updateError) {
    console.error('Leave review error:', updateError)
    return { error: 'Failed to update leave request.' }
  }

  revalidatePath('/staff/leave')
  revalidatePath('/admin/leave')
  revalidatePath('/admin')
  return { success: true }
}
