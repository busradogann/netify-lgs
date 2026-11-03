import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PDF_DIR =
  "/Users/busradogan/.claude/projects/-Users-busradogan-repos-netify-lgs/5e90d5a1-cfef-435e-b7b7-c80409eefad8/tool-results";

const PDFS = [
  { file: "webfetch-1792587306220-ljgg2j.pdf", year: 2021 },
  { file: "webfetch-1792587306101-iy0lrr.pdf", year: 2022 },
];

function classifyType(typeStr) {
  const t = typeStr.toLowerCase();
  if (t.includes("fen lisesi")) return "fen";
  if (t.includes("sosyal bilimler")) return "sosyal";
  if (t.includes("imam hatip")) return "imam_hatip";
  if (
    t.includes("mesleki") ||
    t.includes("teknik") ||
    t.includes("meslek lisesi")
  )
    return "meslek";
  return "anadolu";
}

async function parsePDF(filePath, year) {
  // Dynamic import pdfplumber equivalent - use child process with python
  const { execSync } = await import("child_process");

  const pythonScript = `
import sys
sys.path.insert(0, '/Users/busradogan/Library/Python/3.9/lib/python/site-packages')
import pdfplumber
import json

pdf = pdfplumber.open("${filePath}")
all_rows = []
for page in pdf.pages:
    text = page.extract_text()
    if not text:
        continue
    for line in text.split('\\n'):
        line = line.strip()
        if not line or line.startswith('2') and 'Yılı' in line:
            continue
        if line.startswith('TERCİH') or line.startswith('İL') or 'TABAN' in line and 'TAVAN' in line:
            continue
        if 'YÜZDELİK' in line or 'DİLİM' in line:
            continue
        all_rows.append(line)
pdf.close()
print(json.dumps(all_rows[:20]))
`;

  try {
    const result = execSync(`python3 -c '${pythonScript.replace(/'/g, "'\"'\"'")}'`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
    const lines = JSON.parse(result);
    console.log(`Year ${year}: ${lines.length} sample lines`);
    for (const line of lines) {
      console.log(`  ${line.substring(0, 120)}`);
    }
  } catch (e) {
    console.error(`Error parsing ${year}: ${e.message}`);
  }
}

async function main() {
  for (const { file, year } of PDFS) {
    const filePath = join(PDF_DIR, file);
    console.log(`\nParsing ${year} PDF...`);
    await parsePDF(filePath, year);
  }
}

main().catch(console.error);
