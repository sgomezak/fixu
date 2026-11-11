'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BatteryMedium, ChevronLeft, ChevronRight, Dumbbell, Footprints, Moon, Scale, Zap } from 'lucide-react';
import { Card, PageHeader, StatusBadge } from '@/components/ui';
import { buttonStyles } from '@/components/ui/Sheet';
import { DayBars } from '@/components/charts/DayBars';
import { addDays, diffDays, startOfWeek, todayIn, type ISODate } from '@/lib/dates';
import { statusFor } from '@/lib/goals';
import { t } from '@/lib/i18n/en';
import { profileDefaults } from '@/lib/profile';
import { zoned } from '@/lib/tz';
import { countWorkouts, fatigueFor, isWorkout, latestDate, summariseWeek, type GarminActivity, type GarminDay } from '@/modules/health/garmin';
import { useCalendarData } from '@/modules/daily/store';

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o });
const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const n0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const isDate = (v: string | null): v is ISODate => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

function Stat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="tabular text-[1.375rem] leading-tight font-semibold">
        {value}
        {unit && <span className="ml-1 text-[0.875rem] font-medium text-muted">{unit}</span>}
      </span>
      <span className="text-[0.8125rem] text-muted">{label}</span>
    </div>
  );
}

function GoalCard({ icon: Icon, title, status, children }: { icon: typeof Footprints; title: string; status: Parameters<typeof StatusBadge>[0]['status']; children: React.ReactNode }) {
  return (
    <Card as="li" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-full bg-surface-2"><Icon size={18} aria-hidden="true" /></span>
          {title}
        </span>
        <StatusBadge status={status} />
      </div>
      {children}
    </Card>
  );
}

export function HealthView({ daily, activities }: { daily: GarminDay[]; activities: GarminActivity[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const today = todayIn();
  const latest = latestDate(daily)!;
  const week = isDate(params.get('week')) ? startOfWeek(params.get('week')!) : startOfWeek(latest);
  const go = (w: ISODate) => router.replace(`${pathname}?week=${w}`, { scroll: false });

  const s = useMemo(() => summariseWeek(daily, activities, week), [daily, activities, week]);
  const cal = useCalendarData();
  const manualGym = cal.events
    .filter((e) => e.area === 'gym' && e.state === 'done')
    .map((e) => zoned(e.startsAt).date)
    .filter((d) => d >= s.days[0] && d <= s.days[6]);
  const w = countWorkouts(s.workouts, manualGym);

  // How much of the week has passed (past weeks: all of it).
  const elapsed = Math.max(0, Math.min(1, diffDays(today, s.days[0]) / 7));
  const target = profileDefaults.gym.goalPerWeek;
  const stepsTarget = profileDefaults.health.stepsDailyAvgTarget;
  const workoutStatus = statusFor(w.total, target, elapsed);
  const stepsStatus = s.stepsAvg == null ? 'noData' : s.stepsAvg >= stepsTarget ? 'onTrack' : s.stepsAvg >= stepsTarget * 0.9 ? 'atRisk' : elapsed >= 1 ? 'behind' : 'atRisk';
  const fatigue = fatigueFor(daily, latest);

  const dayLabel = (d: string) => fmt({ weekday: 'narrow' }).format(asDate(d));
  const dayLong = (d: string) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(asDate(d));
  const range = fmt({ day: 'numeric', month: 'short', year: 'numeric' }).formatRange(asDate(s.days[0]), asDate(s.days[6]));
  const hasPrev = daily[0].date < s.days[0];
  const hasNext = latest > s.days[6];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.health.title} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button type="button" disabled={!hasPrev} onClick={() => go(addDays(week, -7))} aria-label={t.health.prevWeek} className={`${buttonStyles.icon} disabled:opacity-40`}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button type="button" disabled={!hasNext} onClick={() => go(addDays(week, 7))} aria-label={t.health.nextWeek} className={`${buttonStyles.icon} disabled:opacity-40`}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <h2 className="tabular ml-1 text-[1.0625rem] font-semibold" aria-live="polite">{range}</h2>
        </div>
        <p className="text-[0.8125rem] text-muted">{t.health.synced(fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(asDate(latest)))}</p>
      </div>

      <Card className={`flex items-start gap-3 ${fatigue.level === 'tired' ? 'border-risk/40 bg-risk-soft' : ''}`}>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${fatigue.level === 'tired' ? 'bg-surface text-risk' : 'bg-primary-soft text-primary'}`}>
          <Zap size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[0.8125rem] font-medium text-muted">{t.health.fatigueTitle}</h2>
          <p className="font-semibold">{t.health.fatigue[fatigue.level]}</p>
          {fatigue.reasons.length > 0 && <p className="text-[0.875rem] text-ink">{fatigue.reasons.map((r) => t.health.fatigue[r]).join(' · ')}</p>}
          <p className="text-[0.8125rem] text-muted">{t.health.fatigueFor(dayLong(latest))}</p>
        </div>
      </Card>

      <section aria-labelledby="goals-h" className="flex flex-col gap-3">
        <h2 id="goals-h" className="text-[1.375rem] font-semibold">{t.health.goals}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          <GoalCard icon={Dumbbell} title={t.health.workouts} status={workoutStatus}>
            <p className="tabular text-[1.875rem] leading-none font-semibold">
              {w.total}<span className="text-[1rem] font-medium text-muted"> / {target}</span>
            </p>
            <div role="progressbar" aria-label={t.health.workouts} aria-valuemin={0} aria-valuemax={target} aria-valuenow={w.total} className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className={`h-full rounded-full ${workoutStatus === 'behind' ? 'bg-catchup' : 'bg-primary'}`} style={{ width: `${Math.min(100, (w.total / target) * 100)}%` }} />
            </div>
            <p className="text-[0.875rem] text-muted">{t.health.workoutsDetail(w.garmin, w.manual)}. {t.health.workoutsRule}</p>
          </GoalCard>
          <GoalCard icon={Footprints} title={t.health.steps} status={stepsStatus}>
            <p className="tabular text-[1.875rem] leading-none font-semibold">
              {s.stepsAvg != null ? n0.format(s.stepsAvg) : '—'}
              <span className="ml-1 text-[1rem] font-medium text-muted">{t.health.stepsAvg}</span>
            </p>
            <p className="text-[0.875rem] text-muted">{t.health.stepsTarget(n0.format(stepsTarget))}. {t.health.stepsDays(s.daysWithData)}.</p>
          </GoalCard>
        </ul>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <DayBars
            title={t.health.stepsChart}
            target={stepsTarget}
            targetLabel={`${t.health.target} ${n0.format(stepsTarget)}`}
            noValue={t.health.noValue}
            tableCaption={t.health.tableCaption(t.health.stepsChart)}
            dayHead={t.health.day}
            valueHead={t.health.value}
            bars={s.days.map((d, i) => ({ key: d, label: dayLabel(d), long: dayLong(d), value: s.byDay[i]?.steps ?? null, display: s.byDay[i]?.steps != null ? `${n1.format(s.byDay[i]!.steps! / 1000)}k` : '' }))}
          />
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 font-semibold"><Moon size={18} aria-hidden="true" /> {t.health.sleep}</div>
          <div className="flex gap-8">
            <Stat value={s.sleepAvg != null ? n1.format(s.sleepAvg) : '—'} unit={t.health.sleepAvg} label={s.sleepScoreAvg != null ? t.health.sleepScore(n0.format(s.sleepScoreAvg)) : ''} />
          </div>
          <DayBars
            title={t.health.sleepChart}
            target={8}
            targetLabel={`${t.health.target} 8 h`}
            noValue={t.health.noValue}
            tableCaption={t.health.tableCaption(t.health.sleepChart)}
            dayHead={t.health.day}
            valueHead={t.health.value}
            bars={s.days.map((d, i) => ({ key: d, label: dayLabel(d), long: dayLong(d), value: s.byDay[i]?.sleepH ?? null, display: s.byDay[i]?.sleepH != null ? n1.format(s.byDay[i]!.sleepH!) : '' }))}
          />
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-semibold"><BatteryMedium size={18} aria-hidden="true" /> {t.health.recovery}</div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value={s.rhrAvg != null ? n0.format(s.rhrAvg) : '—'} unit={t.health.bpm} label={t.health.rhr} />
          <Stat value={s.hrvAvg != null ? n0.format(s.hrvAvg) : '—'} unit={t.health.ms} label={t.health.hrv} />
          <Stat value={s.bbHighAvg != null ? n0.format(s.bbHighAvg) : '—'} label={t.health.bodyBattery} />
          <Stat value={s.stressAvg != null ? n0.format(s.stressAvg) : '—'} label={t.health.stress} />
        </div>
      </Card>

      <section aria-labelledby="act-h" className="flex flex-col gap-3">
        <h2 id="act-h" className="text-[1.375rem] font-semibold">{t.health.activities}</h2>
        {s.activities.length ? (
          <ul className="flex flex-col divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
            {s.activities.map((a) => (
              <li key={a.start} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {a.name}
                    {isWorkout(a) && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[0.75rem] font-medium text-ink">{t.health.workoutTag}</span>}
                  </p>
                  <p className="text-[0.8125rem] text-muted">{fmt({ weekday: 'short', day: 'numeric', month: 'short' }).format(asDate(a.date))} · {a.start.slice(11, 16)}</p>
                </div>
                <p className="tabular shrink-0 text-right text-[0.875rem] text-muted">
                  {a.durMin != null && <span className="block text-ink">{n0.format(a.durMin)} {t.health.minutes}</span>}
                  {a.distKm != null && <span>{n1.format(a.distKm)} {t.health.km}</span>}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.9375rem] text-muted">{t.health.noActivities}</p>
        )}
      </section>

      <Card className="flex items-start gap-3 border-dashed">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-2"><Scale size={18} aria-hidden="true" /></span>
        <div>
          <h2 className="font-semibold">{t.health.weightTitle}</h2>
          <p className="text-[0.875rem] text-muted">{t.health.weightBody}</p>
        </div>
      </Card>
    </div>
  );
}
