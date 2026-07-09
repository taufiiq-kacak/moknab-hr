'use client'

import { useActionState, useState } from 'react'
import { signupStaffAction } from '@/app/actions/auth'
import { KeyRound, Smartphone, User, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupStaffAction, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-12 rounded-2xl shadow-xl shadow-brand-blue/5">
        
        {state?.success && state?.staffId ? (
          // Success State view showing their generated Staff ID
          <div className="space-y-6 text-center animate-scale-in">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
                Registration Successful!
              </h2>
              <p className="text-xs text-brand-grey max-w-xs mx-auto leading-relaxed">
                Your staff profile has been registered in the Moknab Johor system. Please save your credentials below.
              </p>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 text-left space-y-3.5">
              <div>
                <span className="block text-[9px] font-bold text-brand-blue uppercase tracking-wide">Your Auto-Generated Staff ID</span>
                <span className="text-xl font-extrabold text-brand-navy tracking-wider select-all block mt-0.5">
                  {state.staffId}
                </span>
                <span className="text-[10px] text-brand-grey block mt-1">You will use this ID to sign in. Click or drag to copy it.</span>
              </div>
            </div>

            <div>
              <Link
                href="/"
                className="group relative flex w-full justify-center items-center gap-1.5 rounded-xl bg-brand-blue py-3.5 px-4 text-sm font-medium text-white hover:bg-opacity-90 hover:shadow-lg hover:shadow-brand-blue/10 active:scale-[0.98] focus:outline-none transition-all duration-200"
              >
                Proceed to Sign In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          // Registration Form View
          <>
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand-blue mb-5">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-brand-navy">
                Staff Registration
              </h2>
              <p className="mt-2 text-sm text-brand-grey leading-relaxed">
                Create your employee account to start clocking in and managing leaves.
              </p>
            </div>

            <form action={formAction} className="mt-8 space-y-6">
              <div className="space-y-5">
                <div>
                  <label 
                    htmlFor="name" 
                    className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Ali bin Ahmad"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-brand-navy placeholder-gray-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue sm:text-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="phone" 
                    className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="e.g. +6012345678"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-3 text-brand-navy placeholder-gray-400 focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue sm:text-sm transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-[10px] font-bold uppercase tracking-wider text-brand-navy mb-2"
                  >
                    Create Password
                  </label>
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

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isPending}
                  className="group relative flex w-full justify-center rounded-xl bg-brand-blue py-3.5 px-4 text-sm font-medium text-white hover:bg-opacity-90 hover:shadow-lg hover:shadow-brand-blue/10 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {isPending ? 'Registering...' : 'Register Account'}
                </button>

                <div className="text-center text-xs text-brand-grey">
                  Already have an account?{' '}
                  <Link 
                    href="/" 
                    className="font-bold text-brand-blue hover:underline cursor-pointer"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
