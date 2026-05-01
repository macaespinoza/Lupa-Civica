
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function scrapeBCN() {
  const url = 'https://www.bcn.cl/historiapolitica/resenas_parlamentarias/index.html?categ=en_ejercicio&filtros=2';
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    console.log('HTML Length:', data.length);
    // Log first 1000 chars of body
    console.log('Body snippet:', $('body').html()?.substring(0, 1000));

    const legislators: { name: string; link: string | null }[] = [];
    
    // Trying more generic selectors
    $('a[href*="/historiapolitica/resenas_parlamentarias/wiki/"]').each((i, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href');
      if (name && name.length > 5) {
        legislators.push({
          name,
          link: link ? `https://www.bcn.cl${link}` : null
        });
      }
    });

    console.log(`Found ${legislators.length} legislators on BCN.`);
    return legislators;
  } catch (error) {
    console.error('Error scraping BCN:', error);
    return [];
  }
}

async function scrapeBio(url: string) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    // The main biography content is in .box-content.seleccionRS
    const bioContainer = $('.box-content.seleccionRS');
    
    // We want the text but also maybe handle sub-headings
    // For now, let's just get all text from this container
    let bioText = bioContainer.text().trim();

    if (!bioText) {
        // Fallback to older known selectors if structure changes
        bioText = $('#mw-content-text').text().trim() || $('.resena').text().trim();
    }
    
    // Clean up: remove excessive newlines and spaces
    bioText = bioText.replace(/\s+/g, ' ').replace(/\n+/g, ' ');
    
    // Truncate for a "summary" style return if it's too long
    return bioText.length > 500 ? bioText.substring(0, 1000) + '...' : bioText;
  } catch (error) {
    console.error(`Error scraping bio from ${url}:`, error);
    return '';
  }
}

async function run() {
  const list = await scrapeBCN();
  const results: any[] = [];
  
  // Limiting for safety in this environment
  for (const leg of list.slice(0, 5)) {
    console.log(`Scraping bio for ${leg.name}...`);
    const bio = leg.link ? await scrapeBio(leg.link) : '';
    results.push({ ...leg, bio });
  }

  fs.writeFileSync('./scripts/scraped_data.json', JSON.stringify(results, null, 2));
  console.log('Results saved to ./scripts/scraped_data.json');
}

run();
