import type { CategorySlug } from "../types";

/** Strips HTML from source text (HN post bodies contain markup). Output is plain text. */
export function plainText(html: string): string {
  return html
    .replace(/<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const RULES: [CategorySlug, RegExp][] = [
  ["ai-ml", /\b(llm|gpt|ai|ml|machine learning|neural|model|agent|rag|embedding|diffusion|transformer|inference)\b/i],
  ["devtools", /\b(cli|compiler|debugger|ide|editor|git|terminal|sdk|api|framework|library|database|devops|kubernetes|docker|lint)\b/i],
  ["hardware", /\b(esp32|arduino|raspberry|fpga|pcb|sensor|firmware|robot|3d print|keyboard|hardware|microcontroller)\b/i],
  ["finance", /\b(finance|budget|invoice|payment|stock|crypto|tax|accounting|bank)\b/i],
  ["healthcare", /\b(health|medical|patient|clinic|fitness|sleep|mental|therapy)\b/i],
  ["education", /\b(learn|course|student|teach|education|tutor|flashcard|quiz)\b/i],
  ["sustainability", /\b(climate|energy|solar|carbon|sustainab|recycl|emission)\b/i],
  ["design", /\b(design|figma|font|typography|color|ui kit|icon|css)\b/i],
  ["automation", /\b(automat|workflow|scraper|bot|cron|pipeline|integration)\b/i],
  ["productivity", /\b(note|todo|calendar|productivity|email|focus|bookmark|organi[sz]e)\b/i],
  ["social-impact", /\b(nonprofit|accessib|refugee|community|volunteer|disabilit)\b/i],
  ["startups", /\b(saas|startup|launch|founder|customers|mrr)\b/i],
  ["experimental", /\b(webgpu|wasm|quantum|experimental|toy|art|generative|game)\b/i],
];

export function guessCategory(text: string): CategorySlug {
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return "open-source";
}

export function guessStack(it: { signals: { language?: string | null; topics?: string[] } }): string[] {
  const out: string[] = [];
  if (it.signals.language) out.push(it.signals.language);
  for (const t of it.signals.topics ?? []) if (out.length < 5 && !out.includes(t)) out.push(t);
  return out;
}
