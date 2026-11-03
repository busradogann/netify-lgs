import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);
const questions = JSON.parse(readFileSync(new URL("./questions.json", import.meta.url), "utf-8"));

console.log(`Inserting ${questions.length} questions...`);

const batchSize = 100;
let inserted = 0;

for (let i = 0; i < questions.length; i += batchSize) {
  const batch = questions.slice(i, i + batchSize);
  const { error } = await supabase.from("questions").insert(batch);
  if (error) {
    console.error(`Batch ${i} error:`, error.message);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`  ${inserted}/${questions.length}`);
}

console.log("Done!");
