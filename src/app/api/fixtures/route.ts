import { NextResponse } from 'next/server';
import { getFixtures } from '@/modules/daily/fixtures.server';

export const revalidate = 21600; // 6 h

export async function GET() {
  return NextResponse.json(await getFixtures());
}
