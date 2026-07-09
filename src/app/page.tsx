'use client'

import { useActionState, useState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { KeyRound, Smartphone, ShieldCheck, X } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [showForgotModal, setShowForgotModal] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-xl shadow-brand-blue/5">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand-blue mb-5">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-brand-navy">
            Moknab Johor
          </h2>
          <p className="mt-2 text-sm text-brand-grey leading-relaxed">
            Enter your Staff ID or Phone Number to access the attendance & leave dashboard.
          </p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-5">
            <div>
              <label 
                htmlFor="loginInput" 
                className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2"
              >
                Staff ID or Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Smartphone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="loginInput"
                  name="loginInput"
                  type="text"
                  required
                  placeholder="e.g. STF-01 or +6012345678"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-brand-navy placeholder-gray-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label 
                  htmlFor="password" 
                  className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] font-bold text-brand-blue hover:underline focus:outline-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-brand-navy placeholder-gray-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {state?.error && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-xs text-red-600 font-medium animate-scale-in">
              {state.error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-xl bg-brand-blue py-3.5 px-4 text-sm font-medium text-white hover:bg-opacity-90 hover:shadow-lg hover:shadow-brand-blue/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              {isPending ? 'Verifying...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal Overlay */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-4 animate-scale-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4 text-left">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-1">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-brand-navy">Password Reset Instructions</h3>
              <p className="text-xs text-brand-grey leading-relaxed">
                Because Moknab HR uses secure internal-only accounts, password resets cannot be done via public email.
              </p>
            </div>
            
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 text-[11px] text-brand-navy/90 space-y-2 font-medium">
              <p className="font-bold text-brand-blue uppercase tracking-wide text-[9px] mb-1">How to Reset:</p>
              <p>1. Please notify your <strong>Moknab Manager / Admin</strong>.</p>
              <p>2. The Admin will open the <strong>Admin Dashboard &rarr; Staff Configuration</strong>.</p>
              <p>3. The Admin can edit your profile, type a new password, and click save to update it instantly.</p>
            </div>

            <button
              onClick={() => setShowForgotModal(false)}
              type="button"
              className="w-full py-2.5 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-opacity-95 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
