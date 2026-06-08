"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Anchor, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { signIn, signUp, type AuthResult } from "@/lib/auth-actions";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    action,
    {},
  );

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-sm">
      {/* ブランド */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Anchor className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">
          NY33 Company Dock
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isLogin ? "アカウントにログイン" : "アカウントを作成"}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            パスワード
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={6}
              placeholder="6文字以上"
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-bad-weak px-3 py-2.5 text-sm text-bad"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}
        {state.message && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg bg-good-weak px-3 py-2.5 text-sm text-good"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLogin ? "ログイン" : "登録する"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? (
          <>
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              新規登録
            </Link>
          </>
        ) : (
          <>
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="font-bold text-primary hover:underline">
              ログイン
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
