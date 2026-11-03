import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const BASE_URL = "https://fenbilimleri.org/lgs-taban-puanlari";
const __dirname = dirname(fileURLToPath(import.meta.url));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseScore(text) {
  if (!text || text === "—" || text === "-") return null;
  const cleaned = text.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseQuota(text) {
  if (!text || text === "—" || text === "-") return null;
  const num = parseInt(text.replace(/\D/g, ""), 10);
  return isNaN(num) ? null : num;
}

function classifySchoolType(program) {
  const p = program.toLowerCase();
  if (p.includes("fen lisesi")) return "fen";
  if (p.includes("sosyal bilimler")) return "sosyal";
  if (p.includes("imam hatip") || p.includes("anadolu ihl"))
    return "imam_hatip";
  if (
    p.includes("mesleki") ||
    p.includes("teknik") ||
    p.includes("meslek lisesi")
  )
    return "meslek";
  return "anadolu";
}

function extractLanguage(program) {
  const p = program.toLowerCase();
  if (p.includes("almanca")) return "Almanca";
  if (p.includes("fransızca")) return "Fransızca";
  if (p.includes("ingilizce")) return "İngilizce";
  return null;
}

async function getProvinceUrls() {
  const html = await fetchPage(`${BASE_URL}/`);
  const $ = cheerio.load(html);
  const urls = [];
  $("select").first().find("option").each((_, el) => {
    const val = $(el).attr("value");
    if (val && val.startsWith("http")) {
      const name = $(el).text().trim().replace(/\s*\(.*\)/, "");
      urls.push({ url: val, province: name });
    }
  });
  return urls;
}

async function getDistrictUrls(provinceUrl) {
  const html = await fetchPage(provinceUrl);
  const $ = cheerio.load(html);
  const districts = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (
      href &&
      href.startsWith(provinceUrl) &&
      href !== provinceUrl &&
      href.length > provinceUrl.length + 1 &&
      !href.includes("#")
    ) {
      const districtSlug = href
        .replace(provinceUrl, "")
        .replace(/\/$/, "");
      if (districtSlug && !districtSlug.includes("/")) {
        districts.push({ url: href, name: text.replace(/\s*\(.*\)/, "") });
      }
    }
  });
  // Remove duplicates
  const seen = new Set();
  return districts.filter((d) => {
    if (seen.has(d.url)) return false;
    seen.add(d.url);
    return true;
  });
}

function parseSchoolTable(html, province, district) {
  const $ = cheerio.load(html);
  const rows = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 6) return;

    const name = $(cells[0]).text().trim();
    const program = $(cells[1]).text().trim();
    const score2026_1 = parseScore($(cells[2]).text().trim());
    const score2026_2 = parseScore($(cells[3]).text().trim());
    const score2025 = parseScore($(cells[4]).text().trim());
    const quota = parseQuota($(cells[5]).text().trim());
    const type = classifySchoolType(program);
    const language = extractLanguage(program);

    rows.push({
      name,
      program,
      type,
      language,
      city: province,
      district: district || province,
      quota,
      score2026_1,
      score2026_2,
      score2025,
    });
  });
  return rows;
}

async function scrapeProvince(provinceUrl, province) {
  const html = await fetchPage(provinceUrl);
  const districtUrls = await getDistrictUrls(provinceUrl);

  const allRows = [];

  if (districtUrls.length > 0) {
    for (const dist of districtUrls) {
      await sleep(300);
      try {
        const distHtml = await fetchPage(dist.url);
        const rows = parseSchoolTable(distHtml, province, dist.name);
        allRows.push(...rows);
        process.stdout.write(`  ${dist.name}: ${rows.length} program\n`);
      } catch (e) {
        console.error(`  ERROR ${dist.name}: ${e.message}`);
      }
    }
  } else {
    const rows = parseSchoolTable(html, province, province);
    allRows.push(...rows);
  }

  return allRows;
}

async function main() {
  console.log("Fetching province list...");
  const provinces = await getProvinceUrls();
  console.log(`Found ${provinces.length} provinces\n`);

  const allSchools = [];

  for (const prov of provinces) {
    console.log(`\n--- ${prov.province} ---`);
    await sleep(500);
    try {
      const rows = await scrapeProvince(prov.url, prov.province);
      allSchools.push(...rows);
      console.log(`  Total: ${rows.length} programs`);
    } catch (e) {
      console.error(`ERROR ${prov.province}: ${e.message}`);
    }
  }

  console.log(`\n\nTotal scraped: ${allSchools.length} programs`);

  // Save raw data to JSON first
  const outPath = join(__dirname, "schools-raw.json");
  writeFileSync(outPath, JSON.stringify(allSchools, null, 2));
  console.log(`Saved raw data to ${outPath}`);

  // Group by unique school (name + city + district)
  const schoolMap = new Map();
  for (const row of allSchools) {
    const key = `${row.name}||${row.city}||${row.district}`;
    if (!schoolMap.has(key)) {
      schoolMap.set(key, {
        name: row.name,
        type: row.type,
        city: row.city,
        district: row.district,
        programs: [],
      });
    }
    schoolMap.get(key).programs.push(row);
  }

  console.log(`Unique schools: ${schoolMap.size}`);

  // Save summary
  const types = {};
  for (const s of allSchools) {
    types[s.type] = (types[s.type] || 0) + 1;
  }
  console.log("\nBy type:", types);
  console.log(`\nScraping complete. Data saved to schools-raw.json`);
  console.log("Run insert-schools.mjs next to load into Supabase.");
}

main().catch(console.error);
