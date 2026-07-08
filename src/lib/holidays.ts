export const MALAYSIA_HOLIDAYS: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-02-17': 'Chinese New Year (Day 1)',
  '2026-02-18': 'Chinese New Year (Day 2)',
  '2026-03-20': 'Hari Raya Aidilfitri (Day 1)',
  '2026-03-21': 'Hari Raya Aidilfitri (Day 2)',
  '2026-05-01': 'Labor Day',
  '2026-05-27': 'Hari Raya Haji',
  '2026-05-31': 'Wesak Day',
  '2026-06-01': "Yang di-Pertuan Agong's Birthday",
  '2026-06-16': 'Awal Muharram (Islamic New Year)',
  '2026-08-25': 'Maulidur Rasul (Prophet Birthday)',
  '2026-08-31': 'National Day (Hari Merdeka)',
  '2026-09-16': 'Malaysia Day',
  '2026-11-08': 'Deepavali',
  '2026-12-25': 'Christmas Day',
  // 2025 fallback
  '2025-01-01': "New Year's Day",
  '2025-01-29': 'Chinese New Year (Day 1)',
  '2025-01-30': 'Chinese New Year (Day 2)',
  '2025-03-31': 'Hari Raya Aidilfitri (Day 1)',
  '2025-04-01': 'Hari Raya Aidilfitri (Day 2)',
  '2025-05-01': 'Labor Day',
  '2025-05-12': 'Wesak Day',
  '2025-06-02': "Yang di-Pertuan Agong's Birthday",
  '2025-06-07': 'Hari Raya Haji',
  '2025-06-27': 'Awal Muharram',
  '2025-08-31': 'National Day (Hari Merdeka)',
  '2025-09-05': 'Maulidur Rasul',
  '2025-09-16': 'Malaysia Day',
  '2025-10-20': 'Deepavali',
  '2025-12-25': 'Christmas Day',
}

export async function getMalaysiaHolidays(year: number): Promise<Record<string, string>> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/MY`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    })
    if (res.ok && res.status !== 204) {
      const data = await res.json()
      const apiHolidays: Record<string, string> = {}
      data.forEach((h: any) => {
        apiHolidays[h.date] = h.localName || h.name
      })
      return { ...MALAYSIA_HOLIDAYS, ...apiHolidays }
    }
  } catch (e) {
    console.warn('Failed to fetch public holidays from Nager.Date API, using local fallback:', e)
  }
  return MALAYSIA_HOLIDAYS
}
