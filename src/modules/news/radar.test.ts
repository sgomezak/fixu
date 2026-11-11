import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { radarBriefing, radarToItems, type RadarEdition } from './radar';

const sample: RadarEdition = {
  id: '2026-11-11',
  numero: 5,
  publicada: 'Miércoles, 11 de noviembre de 2026',
  publicadaISO: '2026-11-11',
  resumen: ['El queroseno IATA cae un 6,6%…', 'Boeing entregó 49 aviones en octubre…'],
  items: [
    { id: 'iata', sec: 'combustible', title: 'El queroseno cae', summary: '…', source: 'IATA', url: 'https://a' },
    { id: 'volotea', sec: 'competencia', title: 'Volotea casi duplica su oferta en Madrid', summary: '…', source: 'Hosteltur', url: 'https://b', featured: true },
    { id: 'boeing', sec: 'mro', title: 'Boeing entrega 49 aviones', summary: '…', source: 'Spokesman', url: 'https://c' },
  ],
};

describe('Radar.AE → FixU news', () => {
  it('drops the fuel section', () => {
    expect(radarToItems(sample).map((i) => i.group)).toEqual(['competencia', 'mro']);
  });
  it('drops fuel lines from the briefing', () => {
    expect(radarBriefing(sample)).toEqual(['Boeing entregó 49 aviones en octubre…']);
  });
  it('reads a real edition from the radar-ae repo when present', () => {
    const f = '/home/user/radar-ae/public/data/ediciones/2026-11-11.json';
    if (!existsSync(f)) return;
    const items = radarToItems(JSON.parse(readFileSync(f, 'utf8')));
    expect(items.length).toBeGreaterThan(5);
    expect(items.every((i) => i.group !== 'combustible' && i.url.startsWith('http'))).toBe(true);
  });
});
