/**
 * Lupa Cívica — Activity & Probity Scraper
 * Enriches legislator profiles in Firestore with:
 *  1. Senate API (bill sponsorships + votes via XML)
 *  2. Chamber attendance scraping (BCN / camara.cl)
 *  3. Probity & Lobby data (infoprobidad.cl / infosegura.srcei.cl)
 *
 * Usage:
 *   npx tsx scripts/scrape-activity.ts --dry-run
 *   npx tsx scripts/scrape-activity.ts --limit 5
 *   npx tsx scripts/scrape-activity.ts            # full run → Firestore
 */

import axios, { type AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { Firestore } from '@google-cloud/firestore';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'lupa-bdd';
const db = new Firestore({ projectId });
import type {
  BillSponsorship,
  VoteRecord,
  AttendanceDetail,
  LegislatorActivity,
  PropertyDeclaration,
  BusinessParticipation,
  LobbyMeeting,
  ProbityFine,
  LegislatorProbity,
} from '@/lib/types';

const parseXML = promisify(parseString);

// ─── CLI args ────────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

// ─── Config ──────────────────────────────────────────────────────────────

const SENADO_XML_BASE = 'https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=';
const BCN_ATTENDANCE_BASE = 'https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki';
const CAMARA_ATTENDANCE = 'https://www.camara.cl/camara/diputados.aspx';
const INFO_PROBIDAD = 'https://www.infoprobidad.cl';
const INFO_SEGURA = 'https://infosegura.srcei.cl';

const REQUEST_TIMEOUT = 20_000;
const DELAY_MS = 1_500;
const MAX_RETRIES = 2;

const USER_AGENT =
  'LupaCivica/1.0 (Plataforma ciudadana de transparencia; +https://lupacivica.cl)';

const OUT_FILE = path.join(__dirname, 'activity_scraped.json');

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Helper: robust HTTP GET ──────────────────────────────────────────────

async function httpGet<T>(
  url: string,
  retries = MAX_RETRIES,
  label = url
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': USER_AGENT },
      });
      return res.data as string;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      const msg = status ? ` [HTTP ${status}]` : `[${axiosErr.code}]`;
      if (attempt === retries) {
        console.warn(`⚠️  FAIL after ${retries} attempts: ${label}${msg}`);
        return '';
      }
      console.warn(`⚠️  Attempt ${attempt}/${retries} failed: ${label}${msg}. Retrying…`);
      await sleep(2_000 * attempt);
    }
  }
  return '';
}

// ─── 1. SENADO API — Bill Sponsorships & Votes (XML) ──────────────────────

interface SenateBillRaw {
  NUMERO_BOLETIN?: string;
  TITULO?: string;
  ESTADO?: string;
  URGENCIA?: string;
  FECHA?: string;
  AUTOR?: string | string[];
  VOTACIONES?: {
    VOTACION?: Array<{
      NUMERO?: string;
      FECHA?: string;
      CAMARA?: string;
      RESULTADO?: string;
    }>;
  };
}

async function fetchSenateBillsXML(bulletinNumber: string): Promise<BillSponsorship[]> {
  const url = `${SENADO_XML_BASE}${bulletinNumber}`;
  const xml = await httpGet(url, 2, `SenateBill XML: ${bulletinNumber}`);
  if (!xml) return [];

  try {
    const parsed = await parseXML(xml, { explicitArray: false }) as { BOLETIN?: SenateBillRaw };
    const bill = parsed.BOLETIN;
    if (!bill || !bill.NUMERO_BOLETIN) return [];

    const urgencyMap: Record<string, BillSponsorship['urgencyLevel']> = {
      'SUMA': 'SUMA',
      'URGENTE': 'URGENTE',
      'URGENCIA_SUMA': 'SUMA',
      'URGENCIA_DISCUSION': 'DISCUSIÓN',
    };

    const sponsorship: BillSponsorship = {
      bulletinNumber: bill.NUMERO_BOLETIN,
      title: bill.TITULO ?? '',
      status: bill.ESTADO ?? '',
      urgencyLevel: bill.URGENCIA ? (urgencyMap[bill.URGENCIA] ?? 'NO') : undefined,
      date: bill.FECHA ?? '',
      chamber: 'Senado',
    };

    return [sponsorship];
  } catch (parseErr) {
    console.warn(`  ⚠️  XML parse error for ${bulletinNumber}:`, (parseErr as Error).message);
    return [];
  }
}

async function fetchSenatorVotes(senatorId: string): Promise<VoteRecord[]> {
  const url = `https://tramitacion.senado.cl/wspublico/tramitacion2.php?sesion=BC&primera=0&offset=0&boletin=`;
  const xml = await httpGet(url, 1, `SenatorVotes: ${senatorId}`);
  if (!xml) return [];

  try {
    const parsed = await parseXML(xml, { explicitArray: false }) as { VOTACIONES?: { VOTACION?: Array<{ BOLETIN?: string; TITULO?: string; FECHA?: string; RESULTADO?: string; TIPO_VOTACION?: string }> } };
    const rawVotes = parsed.VOTACIONES?.VOTACION ?? [];
    const voteMap: Record<string, VoteRecord['vote']> = {
      'APROBADO': 'A favor',
      'RECHAZADO': 'En contra',
      'ABSTENCION': 'Abstención',
      'PAREO': 'Pareo',
      'AUSENTE': 'Ausente',
    };

    return rawVotes.map((v) => ({
      bulletinNumber: v.BOLETIN ?? '',
      billTitle: v.TITULO ?? '',
      date: v.FECHA ?? '',
      vote: voteMap[v.TIPO_VOTACION ?? ''] ?? 'Ausente',
      chamber: 'Senado',
    }));
  } catch {
    return [];
  }
}

// ─── 2. BCN / CAMARA — Attendance Scraping ────────────────────────────────

async function scrapeBCNAttendance(bcnUrl: string): Promise<{ rate: number; details: AttendanceDetail[] }> {
  const html = await httpGet(bcnUrl, 2, `BCN bio: ${bcnUrl}`);
  if (!html) return { rate: 0, details: [] };

  const $ = cheerio.load(html);
  const text = $.text();

  const rateMatch = text.match(/asistencia[:\s]+(?:(\d+(?:\.\d+)?)\s*%)/i) ||
    text.match(/(?:tasa|porcentaje)\s+de\s+asistencia[:\s]+(?:(\d+(?:\.\d+)?)\s*%)/i);

  const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;

  const absenceTypes = ['Médica', 'Comisión', 'Personal', 'Licencia', 'Injustificada'];
  const details: AttendanceDetail[] = [];

  const periodMatch = text.match(/período?\s+(?:202\d|20\d\d)/i);
  const period = periodMatch ? periodMatch[0] : 'Período 2022-2026';

  const detail: AttendanceDetail = {
    period,
    present: 0,
    absent: 0,
    justifiedAbsences: { medical: 0, commission: 0, personal: 0, license: 0 },
    unjustifiedAbsences: 0,
  };

  absenceTypes.forEach((type) => {
    const m = text.match(new RegExp(`${type}[:\\s]+(\\d+)`, 'i'));
    if (m) {
      const count = parseInt(m[1], 10);
      if (type === 'Injustificada') detail.unjustifiedAbsences = count;
      else if (type === 'Médica') detail.justifiedAbsences.medical = count;
      else if (type === 'Comisión') detail.justifiedAbsences.commission = count;
      else if (type === 'Personal') detail.justifiedAbsences.personal = count;
      else if (type === 'Licencia') detail.justifiedAbsences.license = count;
    }
  });

  if (rate > 0) {
    detail.present = Math.round(rate);
    detail.absent = 100 - detail.present;
  }

  details.push(detail);
  return { rate, details };
}

async function scrapeCamaraAttendance(deputyId: string): Promise<{ rate: number; details: AttendanceDetail[] }> {
  const url = `${CAMARA_ATTENDANCE}`;
  const html = await httpGet(url, 2, 'Camara attendance list');
  if (!html) return { rate: 0, details: [] };

  const $ = cheerio.load(html);
  const rows = $('table.listado tbody tr');
  const details: AttendanceDetail[] = [];

  rows.each((_, row) => {
    const cells = $('td', row);
    if (cells.length < 4) return;
    const idText = $(cells[0]).text().trim();
    if (!idText.includes(deputyId)) return;

    const rateText = $(cells[2]).text().trim();
    const rate = parseFloat(rateText.replace('%', '').trim()) || 0;

    details.push({
      period: 'Período 2022-2026',
      present: rate,
      absent: 100 - rate,
      justifiedAbsences: { medical: 0, commission: 0, personal: 0, license: 0 },
      unjustifiedAbsences: 0,
    });
  });

  return { rate: details[0]?.present ?? 0, details };
}

// ─── 3. PROBIDUM / LOBBY — Probity data extraction ──────────────────────

async function scrapeProbityData(name: string): Promise<{
  properties: PropertyDeclaration[];
  businesses: BusinessParticipation[];
  fines: ProbityFine[];
  totalMeetings: number;
  recentMeetings: LobbyMeeting[];
}> {
  const searchUrl = `${INFO_PROBIDAD}/search?q=${encodeURIComponent(name)}`;
  const html = await httpGet(searchUrl, 2, `Probity search: ${name}`);
  if (!html) return { properties: [], businesses: [], fines: [], totalMeetings: 0, recentMeetings: [] };

  const $ = cheerio.load(html);
  const properties: PropertyDeclaration[] = [];
  const businesses: BusinessParticipation[] = [];
  const fines: ProbityFine[] = [];

  $('div.property-row, table.propiedades tr').each((_, el) => {
    const desc = $(el).find('td').first().text().trim();
    if (desc) {
      properties.push({
        type: 'Otro',
        description: desc,
      });
    }
  });

  $('div.business-row, table.participaciones tr').each((_, el) => {
    const cells = $('td', el);
    if (cells.length >= 2) {
      const company = $(cells[0]).text().trim();
      const role = $(cells[1]).text().trim();
      if (company) {
        businesses.push({ companyName: company, role });
              }
            }
          });

  $('div.fine-row, table.sanciones tr').each((_, el) => {
    const cells = $('td', el);
    if (cells.length >= 3) {
      const yearText = $(cells[0]).text().trim();
      const reason = $(cells[1]).text().trim();
      const amountText = $(cells[2]).text().trim();
      const year = parseInt(yearText, 10) || new Date().getFullYear();
      const amount = parseFloat(amountText.replace(/[^\d.]/g, '')) || undefined;
      fines.push({
        year,
        sanctionType: amount ? 'Multa UTM' : 'Amonestación',
        amount,
        reason,
        ley: '20.880',
        resolved: true,
      });
    }
  });

  return { properties, businesses, fines, totalMeetings: 0, recentMeetings: [] };
}

async function scrapeLobbyMeetings(name: string): Promise<{ count: number; meetings: LobbyMeeting[] }> {
  const searchUrl = `${INFO_SEGURA}/buscar/?nombre=${encodeURIComponent(name)}`;
  const html = await httpGet(searchUrl, 2, `Lobby search: ${name}`);
  if (!html) return { count: 0, meetings: [] };

  const $ = cheerio.load(html);
  const meetings: LobbyMeeting[] = [];

  $('table.registros tr, div.meeting-item').each((_, el) => {
    const cells = $('td', el);
    if (cells.length >= 3) {
      const date = $(cells[0]).text().trim();
      const subject = $(cells[1]).text().trim();
      const institution = $(cells[2]).text().trim();
      if (date && subject) {
        meetings.push({ date, subject, institution });
      }
    }
  });

  return { count: meetings.length, meetings: meetings.slice(0, 20) };
}

// ─── Firestore merge ────────────────────────────────────────────────────

async function updateFirestore(
  legislatorId: string,
  activity: LegislatorActivity,
  probity: LegislatorProbity
): Promise<void> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would merge activity + probity for: ${legislatorId}`);
    return;
  }
  try {
    const docRef = db.collection('legislators').doc(legislatorId);
    await docRef.set({ activity, probity }, { merge: true });
    console.log(`  ✅ Updated: ${legislatorId}`);
  } catch (err) {
    console.error(`  ❌ Firestore error for ${legislatorId}:`, err);
  }
}

// ─── Main orchestrator ──────────────────────────────────────────────────

async function processLegislator(
  id: string,
  name: string,
  type: 'Senator' | 'Deputy',
  party: string,
  bcnUrl?: string
): Promise<void> {
  console.log(`\n📋 Processing: ${name} (${type})`);
  const now = new Date().toISOString();

  // ── 1. Senate activity
  let recentBills: BillSponsorship[] = [];
  let votingHistory: VoteRecord[] = [];

  if (type === 'Senator') {
    const bulletinNumbers = [
      '001', '002', '003', '004', '005',
      '010', '011', '012', '020', '021',
      '022', '023', '024', '025', '030',
    ];
    for (const bn of bulletinNumbers) {
      const bills = await fetchSenateBillsXML(bn.padStart(5, '0'));
      recentBills.push(...bills);
      await sleep(DELAY_MS);
    }
    votingHistory = await fetchSenatorVotes(id);
  }

  // ── 2. Attendance
  const { rate, details } = bcnUrl
    ? await scrapeBCNAttendance(bcnUrl)
    : await scrapeCamaraAttendance(id);

  const activity: LegislatorActivity = {
    totalBillsAuthored: recentBills.filter((b) => b.bulletinNumber).length,
    totalBillsCoAuthored: 0,
    recentBills: recentBills.slice(0, 10),
    votingHistory: votingHistory.slice(0, 50),
    votingSummary: {
      inFavor: votingHistory.filter((v) => v.vote === 'A favor').length,
      against: votingHistory.filter((v) => v.vote === 'En contra').length,
      abstention: votingHistory.filter((v) => v.vote === 'Abstención').length,
      paired: votingHistory.filter((v) => v.vote === 'Pareo').length,
      absent: votingHistory.filter((v) => v.vote === 'Ausente').length,
    },
    attendanceRate: rate,
    attendanceDetails: details,
    unjustifiedAbsences: details[0]?.unjustifiedAbsences ?? 0,
    lastUpdated: now,
    source: type === 'Senator' ? 'senado.cl' : 'camara.cl',
  };

  // ── 3. Probity
  const probitySearchName = `${name.split(' ')[0]} ${name.split(' ').pop()}`;
  const [probityData, lobbyData] = await Promise.all([
    scrapeProbityData(probitySearchName),
    scrapeLobbyMeetings(probitySearchName),
  ]);

  const probity: LegislatorProbity = {
    totalLobbyMeetings: lobbyData.count,
    recentLobbyMeetings: lobbyData.meetings,
    missedLobbyRegistrations: 0,
    totalProperties: probityData.properties.length,
    properties: probityData.properties,
    totalBusinessParticipations: probityData.businesses.length,
    businesses: probityData.businesses,
    totalFines: probityData.fines.length,
    fines: probityData.fines,
    pendingSanctions: 0,
    lastUpdated: now,
    source: 'infoprobidad.cl',
  };

  // Save locally
  const localRecord = { id, name, type, party, activity, probity };
  const existing = fs.existsSync(OUT_FILE)
    ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) as Array<Record<string, unknown>>
    : [];
  const idx = existing.findIndex((r) => (r as { id: string }).id === id);
  if (idx >= 0) existing[idx] = localRecord;
  else existing.push(localRecord);
  fs.writeFileSync(OUT_FILE, JSON.stringify(existing, null, 2));
  console.log(`  💾 Saved locally → activity_scraped.json`);

  // Merge to Firestore
  await updateFirestore(id, activity, probity);
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════');
  console.log('   Lupa Cívica — Activity Scraper');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no Firestore writes)' : 'LIVE (Firestore merge)'}`);
  console.log('═══════════════════════════════════════\n');

  if (dryRun) {
    console.log('⚡ DRY RUN active — no data will be written to Firestore\n');
  }

  // Load existing legislator IDs from Firestore
  let legislatorDocs: Array<{ id: string; name: string; type: 'Senator' | 'Deputy'; party: string; bcnUrl?: string }> = [];

  try {
    const snapshot = await db.collection('legislators').get();
    legislatorDocs = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? '',
        type: (data.type as 'Senator' | 'Deputy') ?? 'Deputy',
        party: data.party ?? '',
        bcnUrl: data.bcnUrl ?? undefined,
      };
    });
    console.log(`📦 Found ${snapshot.size} legislators in Firestore\n`);
  } catch (err) {
    console.error('❌ Could not fetch from Firestore:', err);
    process.exit(1);
  }

  const toProcess = legislatorDocs.slice(0, LIMIT);
  let processed = 0;

  for (const leg of toProcess) {
    if (!leg.name) continue;
    await processLegislator(leg.id, leg.name, leg.type, leg.party, leg.bcnUrl);
    processed++;
    if (processed < toProcess.length) await sleep(DELAY_MS);
  }

  console.log(`\n✅ Done. Processed ${processed}/${legislatorDocs.length} legislators.`);
  console.log(`📄 Local output: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});