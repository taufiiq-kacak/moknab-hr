'use client'

import { useActionState } from 'react'
import { updateOfficeLocationAction } from '@/app/actions/admin'
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react'

interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

interface OfficeFormProps {
  office: OfficeLocation
}

export default function OfficeLocationForm({ office }: OfficeFormProps) {
  const [state, formAction, isPending] = useActionState(updateOfficeLocationAction, null)

  return (
    <form
      action={formAction}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50/50 space-y-5"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-brand-navy flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-brand-blue" />
          HQ Geofence Setup
        </h3>
        <p className="text-[11px] text-brand-grey">Configure office coordinates and allowable check-in radius.</p>
      </div>

      <input type="hidden" name="id" value={office.id} />
      <input type="hidden" name="name" value={office.name} />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="latitude" className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
              Latitude
            </label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              required
              defaultValue={office.latitude}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
              Longitude
            </label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              required
              defaultValue={office.longitude}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="radiusMeters" className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-1.5">
            Geofence Radius (meters)
          </label>
          <input
            id="radiusMeters"
            name="radiusMeters"
            type="number"
            required
            defaultValue={office.radius_meters}
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-3 text-brand-navy text-xs focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue transition-all"
          />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs text-red-600 font-medium animate-scale-in">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100 text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-scale-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Coordinates updated successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center items-center rounded-xl bg-brand-blue py-2.5 px-4 text-xs font-semibold text-white hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            Saving...
          </>
        ) : (
          'Update Geofence'
        )}
      </button>
    </form>
  )
}
