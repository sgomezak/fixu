// Baseline profile from the brief (§4). Seeded as editable settings in Phase 1; read-only defaults until then.
// TBD values stay null until provided — never guessed.
export const profileDefaults = {
  timezone: 'Europe/Madrid',
  homeCity: 'Madrid',
  work: { start: '09:00', endRange: ['19:00', '20:00'], assumedEnd: '19:30', commuteMin: 30, getReadyMin: 60 },
  recurring: [
    {
      name: 'Afterwork',
      weekday: 4, // Thursday (ISO)
      time: '20:00',
      condition: 'inMadridThatWeek',
      sideEffects: ['noWorkoutThursdayEvening', 'noWorkoutFridayMorning'],
    },
  ],
  gym: { goalPerWeek: 3, travelToGymMin: 5, defaultSessionMin: 75 },
  sideHustle: { projects: ['YouTube channel', 'FixU app'], weeklyTargetHours: null as number | null },
  social: { examples: ['golf', 'friends & family plans'], weeklyTarget: null as number | null },
  health: { heightCm: 185, weightKg: 70, targetWeightKg: 76, stepsDailyAvgTarget: 8000, mealsPerDay: 3, proteinGPerKg: 1.8 },
  finance: { monthlySavingsGoalEur: 200, currency: 'EUR' },
  notifications: { nightlyCheckin: '22:00', sundayReport: 'Sunday 19:00' },
} as const;

/** Wake time derived from work start minus commute and get-ready time. */
export function derivedWakeTime(p = profileDefaults): string {
  const [h, m] = p.work.start.split(':').map(Number);
  const total = h * 60 + m - p.work.commuteMin - p.work.getReadyMin;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
