'use client';

import { useId, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { buttonStyles, fieldStyles } from '@/components/ui/Sheet';
import { getBrowserClient } from '@/lib/supabase/client';
import { t } from '@/lib/i18n/en';

export function LoginForm() {
  const params = useSearchParams();
  const ids = { email: useId(), err: useId(), code: useId(), codeErr: useId() };
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const initial = params.get('error');
  const [error, setError] = useState(initial === 'link' ? t.login.linkError : initial === 'denied' ? t.login.notAllowed : '');

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
      // The account is created on first sign-in; the server only lets FIXU_OWNER_EMAIL in.
      options: { shouldCreateUser: true, emailRedirectTo: redirect.toString() },
    });
    if (err) {
      setStatus('idle');
      setError(/signups? not allowed/i.test(err.message) ? t.login.notAllowed : /rate limit|too many/i.test(err.message) ? t.login.rateLimited : `${t.login.failed} (${err.message})`);
      input.current?.focus();
      return;
    }
    setStatus('sent');
  };

  // The 6-digit code works in any browser; the link only in the browser that asked for it.
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\s/g, '');
    if (!/^\d{6,8}$/.test(token)) {
      setCodeError(t.login.badCode);
      return;
    }
    const supabase = getBrowserClient();
    if (!supabase) return;
    setVerifying(true);
    setCodeError('');
    const { error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
    if (err) {
      setVerifying(false);
      setCodeError(t.login.badCode);
      return;
    }
    const next = params.get('next');
    window.location.assign(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MailCheck size={22} aria-hidden="true" />
        </span>
        <h2 className="text-[1.0625rem] font-semibold">{t.login.sentTitle}</h2>
        <p role="status" className="text-[0.9375rem] text-muted">{t.login.sent(email.trim())}</p>
        <form onSubmit={verify} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={ids.code} className={fieldStyles.label}>{t.login.code}</label>
            <input
              id={ids.code}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              spellCheck={false}
              maxLength={10}
              placeholder={t.login.codePlaceholder}
              value={code}
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? ids.codeErr : undefined}
              onChange={(e) => setCode(e.target.value)}
              className={`${fieldStyles.input} tabular tracking-[0.3em]`}
            />
            <p id={ids.codeErr} aria-live="polite" className={`${fieldStyles.error} empty:hidden`}>{codeError}</p>
          </div>
          <button type="submit" disabled={verifying} className={buttonStyles.primary}>
            {verifying ? t.login.verifying : t.login.verify}
          </button>
        </form>
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
