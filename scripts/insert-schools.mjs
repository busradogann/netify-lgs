import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env vars");
  console.error("Run: source .env.local && node scripts/insert-schools.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH = 100;

async function main() {
  const rawPath = join(__dirname, "lgs_all_data.json");
  const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
  console.log(`Loaded ${raw.length} rows from lgs_all_data.json`);

  // Group by unique school-program (name + city + district + program + language)
  const schoolMap = new Map();
  for (const row of raw) {
    const key = `${row.name}||${row.city}||${row.district}||${row.program}||${row.language}`;
    if (!schoolMap.has(key)) {
      schoolMap.set(key, {
        name: row.name,
        type: row.type,
        city: row.city,
        district: row.district,
        program: row.program,
        language: row.language,
        scores: [],
      });
    }
    schoolMap.get(key).scores.push({
      year: row.year,
      quota: row.quota,
      min_score: row.min_score,
    });
  }

  console.log(`Unique school-programs: ${schoolMap.size}`);

  // Insert schools in batches
  const schoolEntries = [...schoolMap.values()];
  const insertedSchools = [];

  for (let i = 0; i < schoolEntries.length; i += BATCH) {
    const batch = schoolEntries.slice(i, i + BATCH).map((s) => ({
      name: s.name,
      type: s.type,
      city: s.city,
      district: s.district,
      program: s.program,
      language: s.language,
    }));

    const { data, error } = await supabase
      .from("schools")
      .insert(batch)
      .select();

    if (error) {
      console.error(`\nInsert schools error at ${i}: ${error.message}`);
      continue;
    }
    insertedSchools.push(...data);
    process.stdout.write(
      `\rInserted schools: ${insertedSchools.length}/${schoolEntries.length}`
    );
  }
  console.log(`\nInserted ${insertedSchools.length} schools`);

  // Build lookup: match inserted school IDs back to our keys
  const schoolIdMap = new Map();
  const schoolEntriesArr = [...schoolMap.entries()];
  let idx = 0;
  for (const s of insertedSchools) {
    const key = `${s.name}||${s.city}||${s.district}||${s.program}||${s.language}`;
    schoolIdMap.set(key, s.id);
  }

  // Build placement scores from grouped data
  const placements = [];
  for (const [key, school] of schoolMap) {
    const schoolId = schoolIdMap.get(key);
    if (!schoolId) continue;

    for (const score of school.scores) {
      placements.push({
        school_id: schoolId,
        year: score.year,
        quota: score.quota,
        placed: score.quota,
        min_score: score.min_score,
        min_ranking: null,
        max_ranking: null,
      });
    }
  }

  console.log(`Placement scores to insert: ${placements.length}`);

  let insertedPlacements = 0;
  for (let i = 0; i < placements.length; i += BATCH) {
    const batch = placements.slice(i, i + BATCH);
    const { error } = await supabase.from("placement_scores").insert(batch);
    if (error) {
      console.error(`\nInsert placements error at ${i}: ${error.message}`);
      continue;
    }
    insertedPlacements += batch.length;
    process.stdout.write(
      `\rInserted placements: ${insertedPlacements}/${placements.length}`
    );
  }

  console.log(`\nInserted ${insertedPlacements} placement scores`);
  console.log("\nDone!");
}

main().catch(console.error);
