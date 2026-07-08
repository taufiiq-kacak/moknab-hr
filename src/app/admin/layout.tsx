import { createClient } from '@/lib/supabase/server'
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper'

interface StaffData {
  name: string
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let adminName = 'Admin'

  if (user) {
    const { data } = await supabase
      .from('staff')
      .select('name')
      .eq('id', user.id)
      .single()

    const staffData = data as unknown as StaffData | null
    if (staffData) {
      adminName = staffData.name
    }
  }

  return (
    <AdminLayoutWrapper adminName={adminName}>
      {children}
    </AdminLayoutWrapper>
  )
}
