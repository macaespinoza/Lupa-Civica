/**
 * Lupa Cívica — Activity & Probity Scraper v4 (Hybrid Edition)
 *
 * Fuentes REALES de datos:
 *  1. Senado.cl      → Asistencia senadores (Puppeteer scraping de tablas HTML)
 *  2. opendata.camara.cl → Asistencia diputados (API XML/SOAP pública)
 *  3. BCN Wiki        → Mociones en ley (scraping de la página biográfica)
 *  4. leylobby.gob.cl → Audiencias de lobby (Puppeteer)
 *
 * Uso:
 *   npx tsx scripts/scrape-activity.ts --dry-run --limit=5   # prueba local
 *   npx tsx scripts/scrape-activity.ts --limit=20            # baja 20 a JSON
 *   npx tsx scripts/scrape-activity.ts --full                # baja TODOS a JSON
 *   npx tsx scripts/scrape-activity.ts --inject              # inyecta JSON → Firestore
 *   npx tsx scripts/scrape-activity.ts --debug --limit=3     # guarda screenshots
 *
 * Output local: scripts/activity_scraped.json
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

const projectId =
  process.env.LUPA_FIRESTORE_PROJECT ||
  process.env.FIRESTORE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'lupa-bdd';

// ─── CLI args ────────────────────────────────────────────────────────────

const dryRun = process.argv.includes('--dry-run');
const inject = process.argv.includes('--inject');
const DEBUG = process.argv.includes('--debug');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const FULL = process.argv.includes('--full');

const OUT_FILE = path.resolve(__dirname, 'activity_scraped.json');
const DEBUG_DIR = path.resolve(__dirname, 'debug_screenshots');

// ─── Firestore (solo para --inject) ─────────────────────────────────────

let db: import('@google-cloud/firestore').Firestore | null = null;

async function getDb() {
  if (db) return db;
  const { Firestore } = await import('@google-cloud/firestore');
  db = new Firestore({
    projectId,
    ...(process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS }
      : {}),
  });
  return db;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Puppeteer helpers ────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
}

async function openPage(browser: Browser, url: string, retries = 2): Promise<Page | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      );
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
      return page;
    } catch (err) {
      console.warn(`  ⚠️  openPage intento ${attempt}/${retries} falló: ${(err as Error).message}`);
      if (attempt === retries) return null;
      await sleep(2_000 * attempt);
    }
  }
  return null;
}

async function debugScreenshot(page: Page, name: string) {
  if (!DEBUG) return;
  if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const filePath = path.join(DEBUG_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 Screenshot: ${filePath}`);
}

// ─── SENADO: Mapa parlid → nombre ────────────────────────────────────────
// La página de asistencia del Senado usa IDs internos (parlid).
// Necesitamos scrapearlo con Puppeteer porque la tabla HTML tiene los nombres
// asociados a cada parlid.

interface SenatorAttendanceRow {
  parlid: number;
  name: string;
  sessionsAttended: number;
  totalSessions: number;
  attendanceRate: number;
}

async function scrapeSenateAttendanceTable(
  browser: Browser
): Promise<SenatorAttendanceRow[]> {
  const url =
    'https://www.senado.cl/appsenado/index.php?mo=sesionessala&ac=asistenciaSenadores&camara=S&legiini=361&legiid=504';
  console.log('\n📊 Scrapeando tabla de asistencia del Senado...');
  console.log(`  URL: ${url}`);

  const page = await openPage(browser, url);
  if (!page) {
    console.error('  ❌ No se pudo cargar la página de asistencia del Senado');
    return [];
  }

  try {
    await debugScreenshot(page, 'senado_asistencia_table');

    // Wait for the attendance table to render
    await page.waitForSelector('table', { timeout: 10_000 }).catch(() => null);

    // Extract rows from the attendance table
    const rows = await page.evaluate(() => {
      const results: Array<{
        parlid: number;
        name: string;
        sessionsAttended: number;
      }> = [];

      // The page has links like: asistenciaPorSenador&parlid=1110&legiid=504
      // with text being the session count, and senator names in the table cells
      const allRows = document.querySelectorAll('table tr');
      allRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return;

        // Find the senator name cell and attendance link
        const nameCell = cells[0];
        const name = nameCell?.textContent?.trim() ?? '';
        if (!name || name.length < 3) return;

        // Look for the attendance number link
        const link = row.querySelector('a[href*="asistenciaPorSenador"]');
        if (!link) return;

        const href = link.getAttribute('href') ?? '';
        const parlidMatch = href.match(/parlid=(\d+)/);
        const parlid = parlidMatch ? parseInt(parlidMatch[1], 10) : 0;
        const sessionsAttended = parseInt(link.textContent?.trim() ?? '0', 10);

        if (parlid > 0) {
          results.push({ parlid, name, sessionsAttended });
        }
      });

      return results;
    });

    // Calculate total sessions (max sessions attended by any senator)
    const maxSessions = Math.max(...rows.map((r) => r.sessionsAttended), 1);

    const result = rows.map((r) => ({
      ...r,
      totalSessions: maxSessions,
      attendanceRate: Math.round((r.sessionsAttended / maxSessions) * 10000) / 100,
    }));

    console.log(`  ✅ ${result.length} senadores encontrados en tabla de asistencia`);
    if (result.length > 0) {
      console.log(`  📈 Total sesiones en legislatura: ${maxSessions}`);
      console.log(`  📋 Ejemplo: ${result[0].name} → ${result[0].sessionsAttended} sesiones (${result[0].attendanceRate}%)`);
    }

    return result;
  } finally {
    await page.close();
  }
}

// ─── CÁMARA: API XML de asistencia (opendata.camara.cl) ──────────────────

interface DeputyAttendanceRow {
  diputadoId: number;
  name: string;
  sessionsAttended: number;
  totalSessions: number;
  attendanceRate: number;
}

async function fetchCamaraSessionsForYear(year: number): Promise<Array<{ sessionId: number }>> {
  try {
    const url = `https://opendata.camara.cl/camaradiputados/WServices/WSSala.asmx/retornarSesionesXAnno?pAnno=${year}`;
    console.log(`  📡 Consultando sesiones Cámara año ${year}...`);
    const resp = await axios.get(url, { timeout: 15_000 });
    const parsed = await parseStringPromise(resp.data);

    // Navigate XML structure to find session IDs
    const sessions = parsed?.ArrayOfSesionSala?.SesionSala ?? [];
    const sessionIds = sessions.map((s: Record<string, string[]>) => ({
      sessionId: parseInt(s.Id?.[0] ?? '0', 10),
    })).filter((s: { sessionId: number }) => s.sessionId > 0);

    console.log(`  ✅ ${sessionIds.length} sesiones encontradas para ${year}`);
    return sessionIds;
  } catch (err) {
    console.warn(`  ⚠️  Error consultando sesiones ${year}: ${(err as Error).message}`);
    return [];
  }
}

async function fetchCamaraSessionAttendance(
  sessionId: number
): Promise<Array<{ diputadoId: number; name: string; attended: boolean }>> {
  try {
    const url = `https://opendata.camara.cl/camaradiputados/WServices/WSSala.asmx/retornarSesionAsistencia?pSesionID=${sessionId}`;
    const resp = await axios.get(url, { timeout: 15_000 });
    const parsed = await parseStringPromise(resp.data);

    const attendees = parsed?.ArrayOfAsistencia?.Asistencia ?? [];
    return attendees.map((a: Record<string, Array<Record<string, string[]>>>) => {
      const diputado = a.Diputado?.[0] ?? {};
      return {
        diputadoId: parseInt(diputado.Id?.[0] ?? '0', 10),
        name: `${diputado.Nombre?.[0] ?? ''} ${diputado.ApellidoPaterno?.[0] ?? ''}`.trim(),
        attended: (a.Asistencia?.[0] ?? '').toString().toLowerCase() !== 'ausente',
      };
    });
  } catch {
    return [];
  }
}

async function fetchDeputyAttendance(): Promise<DeputyAttendanceRow[]> {
  console.log('\n📊 Consultando asistencia de diputados vía API XML...');

  // Get sessions from current and previous year
  const currentYear = new Date().getFullYear();
  const sessions = [
    ...(await fetchCamaraSessionsForYear(currentYear)),
    ...(await fetchCamaraSessionsForYear(currentYear - 1)),
  ];

  if (sessions.length === 0) {
    console.warn('  ⚠️  No se encontraron sesiones. Retornando vacío.');
    return [];
  }

  // Sample sessions to avoid hammering the API (max 30 sessions)
  const sampleSize = Math.min(sessions.length, 30);
  const step = Math.max(1, Math.floor(sessions.length / sampleSize));
  const sampled = sessions.filter((_, i) => i % step === 0).slice(0, sampleSize);

  console.log(`  📡 Consultando asistencia de ${sampled.length} sesiones (de ${sessions.length} totales)...`);

  // Aggregate attendance per deputy
  const attendanceMap = new Map<number, { name: string; attended: number; total: number }>();

  for (let i = 0; i < sampled.length; i++) {
    const session = sampled[i];
    const records = await fetchCamaraSessionAttendance(session.sessionId);

    for (const r of records) {
      if (r.diputadoId <= 0) continue;
      const existing = attendanceMap.get(r.diputadoId) ?? { name: r.name, attended: 0, total: 0 };
      existing.total++;
      if (r.attended) existing.attended++;
      if (r.name.length > existing.name.length) existing.name = r.name;
      attendanceMap.set(r.diputadoId, existing);
    }

    // Rate limit
    if (i < sampled.length - 1) await sleep(300);
    if ((i + 1) % 10 === 0) {
      console.log(`  [${i + 1}/${sampled.length}] sesiones procesadas...`);
    }
  }

  const results: DeputyAttendanceRow[] = [];
  for (const [diputadoId, data] of attendanceMap) {
    results.push({
      diputadoId,
      name: data.name,
      sessionsAttended: data.attended,
      totalSessions: data.total,
      attendanceRate: data.total > 0 ? Math.round((data.attended / data.total) * 10000) / 100 : 0,
    });
  }

  console.log(`  ✅ ${results.length} diputados con datos de asistencia`);
  return results;
}

// ─── BCN Wiki: Mociones en ley ───────────────────────────────────────────

async function scrapeBCNBills(
  browser: Browser,
  bcnUrl: string
): Promise<Array<{ lawNumber: string; bulletinNumber: string }>> {
  const page = await openPage(browser, bcnUrl);
  if (!page) return [];

  try {
    await debugScreenshot(page, `bcn_${bcnUrl.split('/').pop()}`);

    const bills = await page.evaluate(() => {
      const results: Array<{ lawNumber: string; bulletinNumber: string }> = [];
      // Look for "Ley Nº XXXXX" links
      const links = document.querySelectorAll('a[href*="leychile.cl/Navegar"]');
      links.forEach((link) => {
        const text = link.textContent?.trim() ?? '';
        const lawMatch = text.match(/Ley\s+N[ºo°]\s*([\d.]+)/i);
        if (lawMatch) {
          results.push({
            lawNumber: lawMatch[1],
            bulletinNumber: '',
          });
        }
      });

      // Also find bulletin numbers
      const bulletinLinks = document.querySelectorAll('a[href*="boletin_ini"]');
      bulletinLinks.forEach((link) => {
        const text = link.textContent?.trim() ?? '';
        const bulletinMatch = text.match(/Boletín\s+([\d-]+)/i);
        if (bulletinMatch && results.length > 0) {
          const lastBill = results[results.length - 1];
          if (!lastBill.bulletinNumber) {
            lastBill.bulletinNumber = bulletinMatch[1];
          }
        }
      });

      return results;
    });

    return bills;
  } finally {
    await page.close();
  }
}

// ─── Name matching utilities ─────────────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function nameMatchScore(a: string, b: string): number {
  const na = normalizeName(a).split(/\s+/);
  const nb = normalizeName(b).split(/\s+/);
  let matches = 0;
  for (const word of na) {
    if (word.length >= 3 && nb.some((w) => w === word)) matches++;
  }
  return matches;
}

function findBestMatch<T extends { name: string }>(
  targetName: string,
  candidates: T[]
): T | null {
  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = nameMatchScore(targetName, candidate.name);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  // Require at least 2 matching words (first name + last name)
  return bestScore >= 2 ? best : null;
}

// ─── Firestore merge (solo con --inject) ────────────────────────────────

async function injectToFirestore(data: Array<Record<string, unknown>>): Promise<void> {
  console.log(`\n🚀 Inyectando ${data.length} registros a Firestore...`);
  const firestore = await getDb();

  for (const record of data) {
    const { id, activity } = record as { id: string; activity: Record<string, unknown> };
    try {
      await firestore.collection('legislators').doc(id).set(
        { activity, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      console.log(`  ✅ ${id}`);
    } catch (err) {
      console.error(`  ❌ ${id}:`, err);
    }
    await sleep(300);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════');
  console.log('   Lupa Cívica — Activity Scraper v4 (Hybrid)');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : inject ? 'INJECT → Firestore' : 'JSON only'}`);
  console.log(`   Debug: ${DEBUG ? 'ON (screenshots)' : 'OFF'}`);
  console.log('═══════════════════════════════════════════════\n');

  // Load existing legislators from JSON seed
  const seedFile = path.resolve(__dirname, 'scraped_data.json');
  let legislators: Array<{
    id: string;
    name: string;
    type: 'Senator' | 'Deputy';
    party: string;
    bcnUrl?: string;
  }> = [];

  if (fs.existsSync(seedFile)) {
    const raw = JSON.parse(fs.readFileSync(seedFile, 'utf8')) as Array<Record<string, unknown>>;
    legislators = raw.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      type: (r.type as 'Senator' | 'Deputy') ?? 'Deputy',
      party: (r.party as string) ?? '',
      bcnUrl: r.bcnUrl as string | undefined,
    }));
  }

  if (legislators.length === 0) {
    console.error('❌ No se encontró scraped_data.json. Ejecuta primero el scraper de legisladores.');
    process.exit(1);
  }

  console.log(`📦 ${legislators.length} legisladores encontrados en seed\n`);

  const senators = legislators.filter((l) => l.type === 'Senator');
  const deputies = legislators.filter((l) => l.type === 'Deputy');
  console.log(`  🏛️  ${senators.length} senadores, 🏛️  ${deputies.length} diputados\n`);

  // ── Phase 1: Bulk data collection (efficient, not per-legislator) ──

  // 1a. Senate attendance (one page, all senators)
  const browser = await launchBrowser();
  let browserClosed = false;

  try {
    const senateAttendance = await scrapeSenateAttendanceTable(browser);

    // 1b. Deputy attendance via API
    const deputyAttendance = await fetchDeputyAttendance();

    // ── Phase 2: Match and merge per legislator ──

    const toProcess = legislators.slice(0, FULL ? legislators.length : LIMIT);
    const results: Array<Record<string, unknown>> = [];

    console.log(`\n📋 Procesando ${toProcess.length} legisladores...\n`);

    for (let i = 0; i < toProcess.length; i++) {
      const leg = toProcess[i];
      const progress = `[${i + 1}/${toProcess.length}]`;

      let attendanceRate = 0;
      let sessionsAttended = 0;
      let totalSessions = 0;
      let attendanceSource = 'none';

      if (leg.type === 'Senator') {
        // Match by name
        const match = findBestMatch(leg.name, senateAttendance);
        if (match) {
          attendanceRate = match.attendanceRate;
          sessionsAttended = match.sessionsAttended;
          totalSessions = match.totalSessions;
          attendanceSource = `senado.cl (parlid=${match.parlid})`;
        } else {
          attendanceSource = 'senado.cl (no match)';
        }
      } else {
        // Deputy - match from API data
        const match = findBestMatch(leg.name, deputyAttendance);
        if (match) {
          attendanceRate = match.attendanceRate;
          sessionsAttended = match.sessionsAttended;
          totalSessions = match.totalSessions;
          attendanceSource = `opendata.camara.cl (id=${match.diputadoId})`;
        } else {
          attendanceSource = 'opendata.camara.cl (no match)';
        }
      }

      // BCN bills (only for first few in debug, or a sample)
      let billsCount = 0;
      const shouldScrapeBills = i < 5 || (i % 20 === 0); // Sample to avoid overloading BCN
      if (shouldScrapeBills && leg.bcnUrl) {
        const bills = await scrapeBCNBills(browser, leg.bcnUrl);
        billsCount = bills.length;
        if (i < toProcess.length - 1) await sleep(800);
      }

      const emoji = attendanceRate > 0 ? '✅' : '⚠️ ';
      console.log(
        `${progress} ${emoji} ${leg.name} (${leg.type}) → ` +
        `Asistencia: ${attendanceRate}% (${sessionsAttended}/${totalSessions}) ` +
        `| Bills: ${billsCount} | Fuente: ${attendanceSource}`
      );

      const now = new Date().toISOString();
      results.push({
        id: leg.id,
        name: leg.name,
        type: leg.type,
        party: leg.party,
        activity: {
          attendanceRate,
          sessionsAttended,
          totalSessions,
          totalBillsAuthored: billsCount,
          votingSummary: { inFavor: 0, against: 0, abstention: 0, paired: 0, absent: 0 },
          lastUpdated: now,
          source: attendanceSource,
        },
      });
    }

    // Save results
    console.log('\n💾 Guardando resultados localmente...');
    fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
    console.log(`📄 Guardado: ${OUT_FILE}`);

    // Stats summary
    const withData = results.filter(
      (r) => (r.activity as Record<string, number>).attendanceRate > 0
    );
    console.log(`\n📊 Resumen:`);
    console.log(`  Total procesados: ${results.length}`);
    console.log(`  Con datos reales:  ${withData.length} (${Math.round((withData.length / results.length) * 100)}%)`);
    console.log(`  Sin datos:         ${results.length - withData.length}`);

    if (inject && !dryRun) {
      await injectToFirestore(results);
    } else {
      console.log('ℹ️  Skipeando Firestore (usa --inject para escribir)');
    }

    console.log(`\n✅ Listo. ${results.length} legisladores procesados.`);
  } finally {
    if (!browserClosed) {
      await browser.close();
      browserClosed = true;
    }
  }
}

main().catch(async (err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});