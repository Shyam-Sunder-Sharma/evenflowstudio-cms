"use client";

import React, { useActionState } from "react";
import { loginAction } from "@/actions/authActions";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b] text-zinc-100">
      <div className="w-full max-w-sm">
        {/* Studio Monogram & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 mb-4 shadow-sm">
            <span className="font-mono text-sm font-bold tracking-tighter">EF</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Evenflowstudio
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono uppercase tracking-wider">
            Editorial CMS & Content Lake
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl bg-[#111113] border border-zinc-800/90 p-7 shadow-2xl">
          {state?.error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{state.error}</div>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="admin@evenflowstudio.com"
                  placeholder="admin@evenflowstudio.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#09090b] border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-xs font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="Admin@12345"
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#09090b] border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-xs font-mono transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 rounded-lg bg-[#ccff00] hover:bg-[#b8e600] active:scale-[0.99] text-black font-semibold text-xs tracking-wide transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Editorial Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
            <p className="text-[11px] text-zinc-500 font-mono">
              admin@evenflowstudio.com / Admin@12345
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
