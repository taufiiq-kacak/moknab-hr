'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { createStaffAction, updateStaffAction } from '@/app/actions/admin'
import { UserPlus, Edit2, Loader2, CheckCircle2, UserCheck, X, Search, ShieldAlert, Settings } from 'lucide-react'
import OfficeLocationForm from './OfficeLocationForm'
import CustomSelect from './CustomSelect'

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
  shifts?: Shift | null
}

interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

interface StaffManagerProps {
  staffList: StaffProfile[]
  shifts: Shift[]
  office: OfficeLocation | null
}

export default function StaffManager({ staffList, shifts, office }: StaffManagerProps) {
  const [activeTab, setActiveTab] = useState<'directory' | 'register' | 'geofence'>('directory')
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Controlled form states
  const [editShiftId, setEditShiftId] = useState('')
  const [editRole, setEditRole] = useState<'staff' | 'admin'>('staff')
  const [createShiftId, setCreateShiftId] = useState('')
  const [createRole, setCreateRole] = useState<'staff' | 'admin'>('staff')

  const [createState, createAction, isCreatePending] = useActionState(createStaffAction, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateStaffAction, null)

  const createFormRef = useRef<HTMLFormElement>(null)

  // Reset create form on success
  useEffect(() => {
    if (createState?.success && createFormRef.current) {
      createFormRef.current.reset()
      setCreateShiftId('')
      setCreateRole('staff')
    }
  }, [createState])

  // Clear editing state on success and return to directory
  useEffect(() => {
    if (updateState?.success) {
      setEditingStaff(null)
      setActiveTab('directory')
    }
  }, [updateState])

  // Auto-switch to register/edit tab when editing starts
  useEffect(() => {
    if (editingStaff) {
      setEditShiftId(editingStaff.shift_id || '')
      setEditRole(editingStaff.role)
      setActiveTab('register')
    }
  }, [editingStaff])

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  )

  const shiftOptions = [
    { value: '', label: 'None (No Shift)' },
    ...shifts.map((s) => ({ value: s.id, label: s.name })),
  ]

  const roleOptions = [
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admin' },
  ]

  // Column sorting states
  const [sortField, setSortField] = useState<'name' | 'staff_id' | 'phone' | 'role' | 'active'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: 'name' | 'staff_id' | 'phone' | 'role' | 'active') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = (bVal || '').toLowerCase()
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-6">
      {/* Apple-style Segmented Control Selector */}
      <div className="flex justify-start">
        <div className="inline-flex rounded-xl bg-gray-100 p-1 gap-1 border border-gray-250/10 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setEditingStaff(null)
              setActiveTab('directory')
            }}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'directory'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-grey hover:text-brand-navy'
            }`}
          >
            Staff Directory
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'register'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-grey hover:text-brand-navy'
            }`}
          >
            {editingStaff ? 'Edit Staff Profile' : 'Register Staff'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingStaff(null)
              setActiveTab('geofence')
            }}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'geofence'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-brand-grey hover:text-brand-navy'
            }`}
          >
            HQ Geofence Setup
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="transition-all duration-200">
        {/* TAB 1: STAFF DIRECTORY TABLE */}
        {activeTab === 'directory' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50/50 overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-navy">Staff Directory</h3>
                <p className="text-[11px] text-brand-grey">Manage details, roles, schedules, and active status.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-brand-navy uppercase tracking-wider bg-gray-50/50">
                    <th 
                      onClick={() => handleSort('name')}
                      className="py-4 px-6 min-w-[160px] whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Name
                        {sortField === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('staff_id')}
                      className="py-4 px-6 min-w-[100px] whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Staff ID
                        {sortField === 'staff_id' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('phone')}
                      className="py-4 px-6 min-w-[130px] whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Phone
                        {sortField === 'phone' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th className="py-4 px-6 min-w-[130px] whitespace-nowrap select-none">
                      Assigned Shift
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      className="py-4 px-6 min-w-[100px] whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Role
                        {sortField === 'role' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('active')}
                      className="py-4 px-6 min-w-[100px] whitespace-nowrap cursor-pointer hover:bg-gray-100/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        {sortField === 'active' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th className="py-4 px-6 min-w-[80px] text-right whitespace-nowrap select-none">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-brand-navy">
                  {sortedStaff.length > 0 ? (
                    sortedStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-brand-navy whitespace-nowrap">
                          {staff.name}
                        </td>
                        <td className="py-4 px-6 text-brand-grey font-medium whitespace-nowrap">
                          {staff.staff_id}
                        </td>
                        <td className="py-4 px-6 text-brand-navy whitespace-nowrap">
                          {staff.phone}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {staff.shifts?.name ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-light text-brand-blue font-bold text-[10px] tracking-wide border border-brand-blue/10">
                              {staff.shifts.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-4 px-6 capitalize text-brand-navy font-medium whitespace-nowrap">
                          {staff.role}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {staff.active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100 uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-500 font-bold text-[10px] border border-gray-200 uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingStaff(staff)}
                            className="p-1.5 hover:bg-brand-light rounded-lg text-brand-blue transition-colors focus:outline-none"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-brand-grey">
                        No matching staff members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER/EDIT STAFF FORM */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto animate-scale-in">
            {editingStaff ? (
              /* EDIT STAFF FORM */
              <form
                action={updateAction}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-5"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-brand-navy flex items-center gap-1.5">
                      <UserCheck className="h-4.5 w-4.5 text-brand-blue" />
                      Edit Profile
                    </h3>
                    <p className="text-[10px] text-brand-grey">Modify parameters for {editingStaff.name}.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStaff(null)
                      setActiveTab('directory')
                    }}
                    className="p-1.5 text-gray-400 hover:text-brand-navy rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <input type="hidden" name="id" value={editingStaff.id} />

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      defaultValue={editingStaff.name}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5 opacity-60">
                        Staff ID (Readonly)
                      </label>
                      <input
                        name="staffId"
                        type="text"
                        readOnly
                        defaultValue={editingStaff.staff_id}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-100 py-2.5 px-3 text-brand-navy text-xs focus:outline-none cursor-not-allowed opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                        Phone
                      </label>
                      <input
                        name="phone"
                        type="text"
                        required
                        defaultValue={editingStaff.phone}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Change Password (optional)
                    </label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Leave blank to keep same"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <CustomSelect
                      label="Shift"
                      name="shiftId"
                      value={editShiftId}
                      onChange={(val) => setEditShiftId(val)}
                      options={shiftOptions}
                    />
                    <CustomSelect
                      label="Role"
                      name="role"
                      value={editRole}
                      onChange={(val) => setEditRole(val as 'staff' | 'admin')}
                      options={roleOptions}
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Account Status
                    </span>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 text-xs text-brand-navy font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="active"
                          value="true"
                          defaultChecked={editingStaff.active === true}
                          className="accent-brand-blue h-4 w-4"
                        />
                        Active
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs text-brand-navy font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="active"
                          value="false"
                          defaultChecked={editingStaff.active === false}
                          className="accent-brand-blue h-4 w-4"
                        />
                        Deactivated
                      </label>
                    </div>
                  </div>
                </div>

                {updateState?.error && (
                  <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs text-red-600 font-medium">
                    {updateState.error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStaff(null)
                      setActiveTab('directory')
                    }}
                    className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-xs font-semibold text-brand-navy hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatePending}
                    className="flex-1 flex justify-center items-center rounded-xl bg-brand-blue py-2.5 px-4 text-xs font-semibold text-white hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isUpdatePending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Saving Updates...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER STAFF FORM */
              <form
                ref={createFormRef}
                action={createAction}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-5"
              >
                <div className="space-y-0.5 border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-semibold text-brand-navy flex items-center gap-1.5">
                    <UserPlus className="h-4.5 w-4.5 text-brand-blue" />
                    Register Staff
                  </h3>
                  <p className="text-[10px] text-brand-grey">Enroll a new staff member.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Full Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Phone
                    </label>
                    <input
                      name="phone"
                      type="text"
                      required
                      placeholder="e.g. +6012345678"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
                      Initial Password
                    </label>
                    <input
                      name="password"
                      type="password"
                      required
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <CustomSelect
                      label="Shift"
                      name="shiftId"
                      value={createShiftId}
                      onChange={(val) => setCreateShiftId(val)}
                      options={shiftOptions}
                    />
                    <CustomSelect
                      label="Role"
                      name="role"
                      value={createRole}
                      onChange={(val) => setCreateRole(val as 'staff' | 'admin')}
                      options={roleOptions}
                    />
                  </div>
                </div>

                {createState?.error && (
                  <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs text-red-600 font-medium">
                    {createState.error}
                  </div>
                )}

                {createState?.success && (
                  <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Staff registered successfully.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreatePending}
                  className="w-full flex justify-center items-center rounded-xl bg-brand-blue py-2.5 px-4 text-xs font-semibold text-white hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreatePending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Creating...
                    </>
                  ) : (
                    'Register Staff'
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: HQ GEOFENCE SETUP FORM */}
        {activeTab === 'geofence' && office && (
          <div className="max-w-xl mx-auto animate-scale-in">
            <OfficeLocationForm office={office} />
          </div>
        )}
      </div>
    </div>
  )
}
