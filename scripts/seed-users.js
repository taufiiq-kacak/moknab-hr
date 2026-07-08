const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found. Please create it first.')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach((line) => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    env[key] = value
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
  console.error('Error: Please populate NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('Starting seed operations...')

  // Get Default Shift A ID
  const { data: shifts, error: shiftError } = await supabase
    .from('shifts')
    .select('id')
    .eq('name', 'Shift A')
    .limit(1)

  if (shiftError || !shifts || shifts.length === 0) {
    console.error('Error: Shift A not found. Did you run the schema SQL script in your Supabase SQL editor first?', shiftError)
    process.exit(1)
  }
  const shiftId = shifts[0].id

  // 1. Create Admin credentials
  const adminId = 'ADM-01'
  const adminEmail = `${adminId.toLowerCase()}@internal.hr`
  console.log(`Creating Admin auth user: ${adminId} (${adminEmail})...`)

  const { data: authAdmin, error: authAdminError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: 'password123',
    email_confirm: true,
  })

  if (authAdminError) {
    console.warn(`Auth admin user warning: ${authAdminError.message}. Proceeding to create/update staff record...`)
  }

  // Double check user id, fallback to lookup if user already exists in auth
  let finalAdminUid = authAdmin?.user?.id
  if (!finalAdminUid) {
    console.log('Admin auth user already exists. Attempting to link/insert profile record...')
    // Retrieve existing user ID by mapping
    const { data: existingUser } = await supabase.from('staff').select('id').eq('staff_id', adminId).maybeSingle()
    if (existingUser) {
      finalAdminUid = existingUser.id
    }
  }

  if (finalAdminUid) {
    const { error: dbAdminError } = await supabase
      .from('staff')
      .upsert({
        id: finalAdminUid,
        name: 'Manager Abu',
        phone: '+60123456789',
        staff_id: adminId,
        role: 'admin',
        active: true,
      })
    if (dbAdminError) console.error('Failed to link Admin profile record:', dbAdminError.message)
    else console.log('Admin account (ADM-01 / password123) verified!')
  }

  // 2. Create Staff credentials
  const staffId = 'STF-01'
  const staffEmail = `${staffId.toLowerCase()}@internal.hr`
  console.log(`Creating Staff auth user: ${staffId} (${staffEmail})...`)

  const { data: authStaff, error: authStaffError } = await supabase.auth.admin.createUser({
    email: staffEmail,
    password: 'password123',
    email_confirm: true,
  })

  if (authStaffError) {
    console.warn(`Auth staff user warning: ${authStaffError.message}. Proceeding to create/update staff record...`)
  }

  let finalStaffUid = authStaff?.user?.id
  if (!finalStaffUid) {
    // Retrieve existing user ID by mapping
    const { data: existingUser } = await supabase.from('staff').select('id').eq('staff_id', staffId).maybeSingle()
    if (existingUser) {
      finalStaffUid = existingUser.id
    }
  }

  if (finalStaffUid) {
    const { error: dbStaffError } = await supabase
      .from('staff')
      .upsert({
        id: finalStaffUid,
        name: 'Ali bin Ahmad',
        phone: '+60198765432',
        staff_id: staffId,
        shift_id: shiftId,
        role: 'staff',
        active: true,
      })
    if (dbStaffError) console.error('Failed to link Staff profile record:', dbStaffError.message)
    else console.log('Staff account (STF-01 / password123) verified!')
  }

  console.log('Credentials seeding completed successfully.')
}

seed()
