
import fs from 'fs';
import path from 'path';

interface ScrapedLegislator {
  id: string;
  name: string;
  type: string;
  bcnUrl: string;
  party: string;
  email: string;
  bio: string;
  imageUrl: string;
  region: string;
}

function verifyData() {
  const dataPath = path.join(__dirname, 'scraped_data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Archivo no encontrado');
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let legislators: ScrapedLegislator[] = JSON.parse(rawData);

  console.log(`\n--- REPORTE DE CALIDAD INICIAL ---`);
  console.log(`Total de registros en JSON: ${legislators.length}`);

  // 1. Detectar duplicados
  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const uniqueLegislators: ScrapedLegislator[] = [];
  const duplicates: string[] = [];

  for (const leg of legislators) {
    if (seenIds.has(leg.id) || seenUrls.has(leg.bcnUrl)) {
      duplicates.push(`${leg.name} (${leg.id})`);
    } else {
      seenIds.add(leg.id);
      seenUrls.add(leg.bcnUrl);
      uniqueLegislators.push(leg);
    }
  }

  console.log(`Duplicados encontrados: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('Muestra de duplicados:', duplicates.slice(0, 5).join(', '));
  }

  // 2. Verificar integridad de campos
  const issues = {
    missingBio: 0,
    missingEmail: 0,
    missingImage: 0,
    undefinedParty: 0,
    undefinedRegion: 0
  };

  uniqueLegislators.forEach(leg => {
    if (!leg.bio || leg.bio.includes('Biografía en proceso')) issues.missingBio++;
    if (!leg.email || leg.email.includes('undefined')) issues.missingEmail++;
    if (!leg.imageUrl || leg.imageUrl.includes('ui-avatars')) issues.missingImage++;
    if (leg.party === 'Por definir' || !leg.party) issues.undefinedParty++;
    if (leg.region === 'Por definir' || !leg.region) issues.undefinedRegion++;
  });

  console.log(`\n--- PROBLEMAS DE DATOS (en registros únicos) ---`);
  console.log(`Bios incompletas: ${issues.missingBio}`);
  console.log(`Emails sospechosos: ${issues.missingEmail}`);
  console.log(`Imágenes por defecto: ${issues.missingImage}`);
  console.log(`Partidos no detectados: ${issues.undefinedParty}`);
  console.log(`Regiones no detectadas: ${issues.undefinedRegion}`);

  const senators = uniqueLegislators.filter(l => l.type === 'Senator').length;
  const deputies = uniqueLegislators.filter(l => l.type === 'Deputy').length;

  console.log(`\n--- ESTADÍSTICAS FINALES ---`);
  console.log(`Senadores únicos: ${senators} (Esperados: 50)`);
  console.log(`Diputados únicos: ${deputies} (Esperados: 155)`);
  console.log(`Total real: ${uniqueLegislators.length} / 205`);

  // 3. Guardar versión limpia
  fs.writeFileSync(
    path.join(__dirname, 'scraped_data_clean.json'), 
    JSON.stringify(uniqueLegislators, null, 2)
  );
  console.log(`\n✅ Archivo limpio guardado como 'scraped_data_clean.json'`);
}

verifyData();
