const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found.')
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
  console.error('Error: Please populate credentials in .env.local first.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function run() {
  console.log('Syncing shifts in database...')

  const shiftsToSync = [
    { name: 'Shift A', start_time: '05:00:00', end_time: '17:30:00' },
    { name: 'Shift B', start_time: '06:00:00', end_time: '17:30:00' },
    { name: 'Shift C', start_time: '07:00:00', end_time: '18:00:00' }
  ]

  for (const shift of shiftsToSync) {
    const { data: existing, error: checkError } = await supabase
      .from('shifts')
      .select('id')
      .eq('name', shift.name)
      .maybeSingle()

    if (checkError) {
      console.error(`Error checking ${shift.name}:`, checkError)
      continue
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from('shifts')
        .update({
          start_time: shift.start_time,
          end_time: shift.end_time
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error(`Error updating ${shift.name}:`, updateError)
      } else {
        console.log(`Successfully updated ${shift.name} to ${shift.start_time} - ${shift.end_time}`)
      }
    } else {
      const { error: insertError } = await supabase
        .from('shifts')
        .insert(shift)

      if (insertError) {
        console.error(`Error inserting ${shift.name}:`, insertError)
      } else {
        console.log(`Successfully inserted new ${shift.name}: ${shift.start_time} - ${shift.end_time}`)
      }
    }
  }

  console.log('Shifts sync completed.')
}

run().catch(console.error)
