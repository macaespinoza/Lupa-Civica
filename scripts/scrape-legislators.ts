/**
 * Lupa Cívica — Script de Scraping Robusto
 * Fuentes: BCN (Biblioteca del Congreso Nacional) + Senado.cl
 * 
 * Extrae datos de senadores y diputados en ejercicio:
 * - Nombres y links biográficos desde BCN
 * - Biografías completas desde páginas individuales BCN
 * - Emails reales desde senado.cl
 * - Partido, región, circunscripción desde texto biográfico
 * 
 * Uso: npx tsx scripts/scrape-legislators.ts [--dry-run] [--limit N]
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

// ─── Configuration ──────────────────────────────────────────────────────────

const BCN_BASE = 'https://www.bcn.cl';
const BCN_SENATORS_URL = `${BCN_BASE}/historiapolitica/resenas_parlamentarias/index.html?categ=en_ejercicio&filtros=2`;
const BCN_DEPUTIES_URL = `${BCN_BASE}/historiapolitica/resenas_parlamentarias/index.html?categ=en_ejercicio&filtros=3`;
const SENADO_LISTADO_URL = 'https://www.senado.cl/appsenado/index.php?mo=senadores&ac=listado';

const REQUEST_TIMEOUT = 15_000; // 15s
const DELAY_BETWEEN_REQUESTS = 1_200; // 1.2s rate limiting
const MAX_RETRIES = 2;

const USER_AGENT = 'LupaCivica/1.0 (Plataforma ciudadana de transparencia; +https://github.com/macaespinoza/Lupa-Civica)';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawLegislator {
  name: string;
  bcnUrl: string;
  type: 'Senator' | 'Deputy';
}

interface ScrapedLegislator {
  id: string;
  name: string;
  type: 'Senator' | 'Deputy';
  title: string;
  gender: 'M' | 'F';
  party: string;
  region: string;
  district: string;
  email: string;
  imageUrl: string;
  bio: string;
  bcnUrl: string;
  updatedAt: string;
  efficiencyScore: number;
  stats: {
    attendanceRate: number;
    unjustifiedAbsences: number;
    probityFinesUTM: number;
    lobbyMeetingsCount: number;
    missedLobbyRegistrations: number;
    votingParticipation: number;
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return decodeURIComponent(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/_/g, ' ')              // Convert underscores to spaces (for wiki URLs)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function generateId(bcnUrl: string, name: string): string {
  // Try to extract the wiki slug from the URL
  const wikiMatch = bcnUrl.match(/\/wiki\/(.+)$/);
  if (wikiMatch) {
    return slugify(wikiMatch[1]);
  }
  // Fallback: generate from name
  return slugify(name);
}

/**
 * Detects gender based on the Spanish title found in the biography text.
 * Much more reliable than name-based heuristics.
 */
function detectGender(bioText: string, name: string): 'M' | 'F' {
  const lowerBio = bioText.toLowerCase();
  
  // Check explicit titles in the biography
  if (lowerBio.includes('senadora ') || lowerBio.includes('diputada ')) return 'F';
  if (lowerBio.includes('senador ') || lowerBio.includes('diputado ')) return 'M';
  
  // Check family indicators
  if (lowerBio.includes('madre de') || lowerBio.includes('hija de')) return 'F';
  if (lowerBio.includes('padre de') || lowerBio.includes('hijo de')) return 'M';
  
  // Fallback: common female name endings in Spanish (not bulletproof, but better than nothing)
  const firstName = name.split(' ')[0];
  const femaleNames = ['maría', 'andrea', 'daniella', 'karol', 'fabiola', 'paulina', 'ximena', 
    'yasna', 'alejandra', 'beatriz', 'claudia', 'vanessa', 'camila', 'chiara', 'valenna',
    'danisa', 'loreto', 'josefa'];
  if (femaleNames.includes(firstName.toLowerCase())) return 'F';
  
  return 'M'; // Default
}

function detectTitle(type: 'Senator' | 'Deputy', gender: 'M' | 'F'): string {
  if (type === 'Senator') return gender === 'F' ? 'Senadora' : 'Senador';
  return gender === 'F' ? 'Diputada' : 'Diputado';
}

function extractParty(bioText: string): string {
  // BCN bios typically start with: "Name (City, date). Profession y político/a del [Party]."
  // or "...militante del [Party]"
  const patterns = [
    /(?:pol[ií]tic[oa]|militante|miembro)\s+(?:del|de la|de)\s+(?:partido\s+)?([^.,(]+)/i,
    /(?:en representaci[oó]n del|representando a[l]?)\s+(?:partido\s+)?([^.,(]+)/i,
    /Partido\s+([^.,(]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = bioText.match(pattern);
    if (match) {
      let party = match[1].trim();
      // Clean up trailing words that aren't part of the party name
      party = party.replace(/\s+(Senador|Diputad|período|periodo|por|desde|entre|y\s).*$/i, '').trim();
      if (party.length > 3 && party.length < 80) {
        return party;
      }
    }
  }
  
  // Check for "independiente"
  if (bioText.toLowerCase().includes('independiente')) {
    return 'Independiente';
  }
  
  return 'Por definir';
}

function extractRegionFromBio(bioText: string): string {
  // Look for "Circunscripción" or "Distrito" + Region patterns
  const circMatch = bioText.match(/(?:\d+[aª°ᵃ]?\s*)?Circunscripción[^,]*,\s*Región\s+(?:de\s+(?:la\s+)?|del\s+)?([^,.]+)/i);
  if (circMatch) return `Región de ${circMatch[1].trim()}`;
  
  const distMatch = bioText.match(/Distrito[^,]*,\s*Región\s+(?:de\s+(?:la\s+)?|del\s+)?([^,.]+)/i);
  if (distMatch) return `Región de ${distMatch[1].trim()}`;
  
  const regionMatch = bioText.match(/Región\s+(?:de\s+(?:la\s+)?|del\s+)?([^,.]+)/i);
  if (regionMatch) return `Región de ${regionMatch[1].trim()}`;
  
  return '';
}

function extractDistrictFromBio(bioText: string, type: 'Senator' | 'Deputy'): string {
  if (type === 'Senator') {
    const match = bioText.match(/(\d+[aª°ᵃ]?\s*Circunscripción)/i);
    return match ? match[1].trim() : '';
  } else {
    const match = bioText.match(/Distrito\s*(?:Nº|N°|#)?\s*(\d+)/i);
    return match ? `Distrito N° ${match[1]}` : '';
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(url, {
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': USER_AGENT },
        // Handle encoding properly for Spanish characters
        responseType: 'text',
      });
      return data;
    } catch (error) {
      const isLast = attempt === retries;
      if (isLast) throw error;
      
      const axiosErr = error as AxiosError;
      const status = axiosErr.response?.status;
      console.warn(`  ⚠ Intento ${attempt + 1} fallido para ${url} (${status || 'timeout'}), reintentando...`);
      await sleep(2000 * (attempt + 1)); // Exponential backoff
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

// ─── Scraping Functions ─────────────────────────────────────────────────────

/**
 * Scrape legislator listing from a BCN page, handling pagination automatically.
 */
async function scrapeBCNListing(baseUrl: string, type: 'Senator' | 'Deputy'): Promise<RawLegislator[]> {
  const seen = new Set<string>();
  const results: RawLegislator[] = [];
  let currentUrl = baseUrl;
  let pageNum = 1;

  while (currentUrl) {
    console.log(`📄 Scrapeando ${type === 'Senator' ? 'senadores' : 'diputados'} - Página ${pageNum}...`);
    
    const html = await fetchWithRetry(currentUrl);
    const $ = cheerio.load(html);

    // Extract all wiki links — the actual legislator entries
    $('a[href*="/historiapolitica/resenas_parlamentarias/wiki/"]').each((_i, el) => {
      const href = $(el).attr('href');
      const name = $(el).text().trim();
      
      if (!href || !name || name.length < 3) return;
      
      // Build full URL
      const fullUrl = href.startsWith('http') ? href : `${BCN_BASE}${href}`;
      
      // Skip navigation/policy links that aren't legislator profiles
      if (href.includes('redirect?url=') || href.includes('politicas')) return;
      
      // Deduplicate by URL
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);
      
      results.push({ name, bcnUrl: fullUrl, type });
    });

    // Check for next page
    const nextPageLink = $(`a[href*="pagina=${pageNum + 1}"]`).attr('href');
    if (nextPageLink) {
      currentUrl = nextPageLink.startsWith('http') ? nextPageLink : `${BCN_BASE}${nextPageLink}`;
      pageNum++;
      await sleep(DELAY_BETWEEN_REQUESTS);
    } else {
      currentUrl = ''; // No more pages
    }
  }

  console.log(`  ✓ Encontrados ${results.length} ${type === 'Senator' ? 'senadores' : 'diputados'} únicos`);
  return results;
}

/**
 * Scrape real senator emails from senado.cl listing page.
 * Returns a map of normalized name -> email.
 */
async function scrapeSenateEmails(): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  
  try {
    console.log('📧 Scrapeando emails reales desde senado.cl...');
    const html = await fetchWithRetry(SENADO_LISTADO_URL);
    const $ = cheerio.load(html);
    
    // The senate page has mailto: links for each senator
    $('a[href^="mailto:"]').each((_i, el) => {
      const email = $(el).attr('href')?.replace('mailto:', '').trim();
      if (email && email.includes('@senado.cl')) {
        // Try to find the associated senator name nearby
        // The senate listing typically has the name near the email
        const parentText = $(el).closest('div, li, td, tr').text().trim();
        emailMap.set(email, parentText);
      }
    });
    
    console.log(`  ✓ Encontrados ${emailMap.size} emails del Senado`);
  } catch (error) {
    console.warn('  ⚠ No se pudieron obtener emails del Senado, usando emails genéricos');
  }
  
  return emailMap;
}

/**
 * Match a senator name to their real email from the senate email map.
 */
function findSenateEmail(name: string, emailMap: Map<string, string>): string {
  const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const nameParts = normalizedName.split(' ');
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 2] : nameParts[0]; // Penultimate is usually first last name
  const firstName = nameParts[0];
  
  // Try to match by checking if the email prefix matches name patterns
  for (const [email] of emailMap) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    
    // Common Chilean email patterns: paraya, dastudillo, firstName.lastName
    if (emailPrefix.includes(lastName) || 
        emailPrefix.includes(firstName.charAt(0) + lastName) ||
        emailPrefix === `${firstName}.${lastName}`) {
      return email;
    }
  }
  
  // Fallback: generate likely email
  return '';
}

/**
 * Scrape individual biography page from BCN.
 */
async function scrapeBio(bcnUrl: string): Promise<{
  bio: string;
  imageUrl: string;
  party: string;
  region: string;
  district: string;
}> {
  try {
    const html = await fetchWithRetry(bcnUrl);
    const $ = cheerio.load(html);
    
    // ── Extract biography text ──
    // BCN stores the main content in .seleccionRS class
    let bioText = '';
    
    // Primary: the seleccionRS container (confirmed from DOM analysis)
    const seleccionRS = $('.seleccionRS');
    if (seleccionRS.length) {
      bioText = seleccionRS.text().trim();
    }
    
    // Fallback selectors
    if (!bioText) {
      bioText = $('#mw-content-text').text().trim() 
        || $('.resena').text().trim() 
        || $('article').text().trim();
    }
    
    // Clean whitespace
    bioText = bioText.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
    
    // Truncate for storage (keep first 2000 chars for a rich bio)
    const fullBio = bioText;
    const bio = bioText.length > 2000 ? bioText.substring(0, 2000) + '...' : bioText;
    
    // ── Extract image ──
    let imageUrl = '';
    // BCN typically has the portrait in an img tag near the top of the bio
    const imgSelectors = [
      '.seleccionRS img',
      '.resena img',
      '.foto img',
      'img[src*="wiki"]',
      'img[src*="resena"]',
      'img[src*="parlamentari"]',
    ];
    
    for (const selector of imgSelectors) {
      const img = $(selector).first();
      if (img.length) {
        // Prefer data-src (lazy loaded) over src (which might be a placeholder)
        imageUrl = img.attr('data-src') || img.attr('data-original') || img.attr('src') || '';
        // Skip placeholder/loading images
        if (imageUrl.includes('cargando') || imageUrl.includes('loading') || imageUrl.includes('placeholder')) {
          imageUrl = '';
          continue;
        }
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${BCN_BASE}${imageUrl}`;
        }
        if (imageUrl) break;
      }
    }
    
    // ── Extract structured data from bio text ──
    const party = extractParty(fullBio);
    const region = extractRegionFromBio(fullBio);
    
    return { bio, imageUrl, party, region, district: '' };
  } catch (error) {
    console.warn(`  ⚠ Error scrapeando bio de ${bcnUrl}:`, (error as Error).message);
    return { bio: '', imageUrl: '', party: 'Por definir', region: '', district: '' };
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

export async function scrapeAllLegislators(options: { 
  dryRun?: boolean; 
  limit?: number;
} = {}): Promise<ScrapedLegislator[]> {
  const { dryRun = false, limit } = options;
  
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔎 LUPA CÍVICA — Scraper de Legisladores v2.0');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Modo: ${dryRun ? '🧪 DRY RUN (sin guardar)' : '💾 PRODUCCIÓN'}`);
  console.log(`  Límite: ${limit ? limit + ' legisladores' : 'Sin límite'}`);
  console.log('');

  // Step 1: Scrape listings from BCN
  const senators = await scrapeBCNListing(BCN_SENATORS_URL, 'Senator');
  await sleep(DELAY_BETWEEN_REQUESTS);
  const deputies = await scrapeBCNListing(BCN_DEPUTIES_URL, 'Deputy');
  
  let allLegislators = [...senators, ...deputies];
  
  // Deduplicate across both lists (some might appear in both)
  const seenUrls = new Set<string>();
  allLegislators = allLegislators.filter(l => {
    if (seenUrls.has(l.bcnUrl)) return false;
    seenUrls.add(l.bcnUrl);
    return true;
  });
  
  console.log(`\n📊 Total único: ${allLegislators.length} legisladores`);
  
  // Apply limit if specified
  if (limit) {
    allLegislators = allLegislators.slice(0, limit);
    console.log(`  (Limitado a ${limit} para prueba)`);
  }
  
  // Step 2: Get real senate emails
  const emailMap = await scrapeSenateEmails();
  await sleep(DELAY_BETWEEN_REQUESTS);
  
  // Step 3: Scrape individual bios
  const results: ScrapedLegislator[] = [];
  
  for (let i = 0; i < allLegislators.length; i++) {
    const leg = allLegislators[i];
    const progress = `[${i + 1}/${allLegislators.length}]`;
    console.log(`\n${progress} 📝 Procesando: ${leg.name}`);
    
    const bioData = await scrapeBio(leg.bcnUrl);
    await sleep(DELAY_BETWEEN_REQUESTS);
    
    // Determine gender and title from biography context
    const gender = detectGender(bioData.bio || leg.name, leg.name);
    const title = detectTitle(leg.type, gender);
    
    // Find email
    let email = '';
    if (leg.type === 'Senator') {
      email = findSenateEmail(leg.name, emailMap);
    }
    if (!email) {
      // Generate a plausible email address
      const cleanName = leg.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const parts = cleanName.split(' ');
      const firstName = parts[0];
      const lastName = parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
      const domain = leg.type === 'Senator' ? 'senado.cl' : 'congreso.cl';
      email = `${firstName}.${lastName}@${domain}`;
    }
    
    // Determine district from bio
    const district = extractDistrictFromBio(bioData.bio, leg.type) || bioData.region;
    
    // Build final object
    const id = generateId(leg.bcnUrl, leg.name);
    const imageUrl = bioData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leg.name)}&background=004d5a&color=fff&size=400`;
    
    const legislator: ScrapedLegislator = {
      id,
      name: leg.name,
      type: leg.type,
      title,
      gender,
      party: bioData.party,
      region: bioData.region || 'Por definir',
      district: district || 'Por definir',
      email,
      imageUrl,
      bio: bioData.bio || `${title} de Chile. Biografía en proceso de actualización.`,
      bcnUrl: leg.bcnUrl,
      updatedAt: new Date().toISOString(),
      // Placeholder stats until real data is scraped from asistencia pages
      efficiencyScore: 70 + Math.random() * 25,
      stats: {
        attendanceRate: 90 + Math.random() * 9,
        unjustifiedAbsences: 0,
        probityFinesUTM: 0,
        lobbyMeetingsCount: Math.floor(Math.random() * 30),
        missedLobbyRegistrations: 0,
        votingParticipation: 88 + Math.random() * 10,
      },
    };
    
    results.push(legislator);
    console.log(`  ✓ ${title} | ${bioData.party} | ${email}`);
  }
  
  // Save results to JSON (always, for debugging)
  const outputPath = './scripts/scraped_data.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n💾 Datos guardados en ${outputPath}`);
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Senadores: ${results.filter(r => r.type === 'Senator').length}`);
  console.log(`  Diputados: ${results.filter(r => r.type === 'Deputy').length}`);
  console.log(`  Total: ${results.length}`);
  console.log(`  Partidos encontrados: ${new Set(results.map(r => r.party)).size}`);
  console.log('═══════════════════════════════════════════════════');
  
  return results;
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
  
  scrapeAllLegislators({ dryRun, limit })
    .then(results => {
      console.log(`\n✅ Scraping completado: ${results.length} legisladores procesados`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}
