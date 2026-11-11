import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Logo } from '@/components/brand/Logo';
import { t } from '@/lib/i18n/en';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: t.login.title };

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <Logo />
      <div className="flex flex-col gap-2">
        <h1 className="text-[1.875rem] leading-tight font-semibold">{t.login.title}</h1>
        <p className="text-[0.9375rem] text-muted">{t.login.body}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
