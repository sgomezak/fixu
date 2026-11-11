'use client';

import { useId, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { buttonStyles, fieldStyles } from '@/components/ui/Sheet';
import { getBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/en';

export function LoginForm() {
  const params = useSearchParams();
  const ids = { email: useId(), err: useId() };
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState(params.get('error') === 'link' ? t.login.linkError : '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(t.login.invalidEmail);
      input.current?.focus();
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;
    setStatus('sending');
    setError('');
    const next = params.get('next');
    const redirect = new URL('/auth/callback', window.location.origin);
    if (next) redirect.searchParams.set('next', next);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: value,
      // Never creates accounts: the owner's user is created once in the Supabase dashboard.
      options: { shouldCreateUser: false, emailRedirectTo: redirect.toString() },
    });
    if (err) {
      setStatus('idle');
      setError(/signup|not allowed|not found/i.test(err.message) ? t.login.notAllowed : t.login.failed);
      input.current?.focus();
      return;
    }
    setStatus('sent');
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5" role="status">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MailCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="text-[1.0625rem] font-semibold">{t.login.sentTitle}</h2>
        <p className="text-[0.9375rem] text-muted">{t.login.sent(email.trim())}</p>
        <button type="button" onClick={() => setStatus('idle')} className={`${buttonStyles.quiet} self-start`}>
          {t.login.again}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.email} className={fieldStyles.label}>{t.login.email}</label>
        <input
          ref={input}
          id={ids.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder={t.login.placeholder}
          value={email}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? ids.err : undefined}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldStyles.input}
        />
        <p id={ids.err} aria-live="polite" className={`${fieldStyles.error} empty:hidden`}>{error}</p>
      </div>
      <button type="submit" disabled={status === 'sending'} className={buttonStyles.primary}>
        {status === 'sending' ? t.login.sending : t.login.submit}
      </button>
    </form>
  );
}
