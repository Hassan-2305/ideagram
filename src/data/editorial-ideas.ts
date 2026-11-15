import type { CategorySlug, Difficulty } from "@/lib/types";

export interface EditorialIdea {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solution: string;
  insight: string;
  category: CategorySlug;
  difficulty: Difficulty;
  buildTime: string;
  stack: string[];
  tags: string[];
  audience: string;
  alternatives: string[];
  mvp: string[];
  challenges: string[];
}

export const EDITORIAL_IDEAS: EditorialIdea[] = [
  // ───────────── ai-ml ─────────────
  {
    slug: "prompt-regression-diff",
    title: "Prompt Regression Diff for Model Upgrades",
    summary:
      "Run a folder of saved prompt cases against two model versions and see exactly which outputs changed, ranked by how different they are.",
    problem:
      "Teams ship features built on a prompt, then a model gets deprecated or upgraded and nobody knows what quietly broke. Eyeballing ten outputs in a playground does not catch the one case in fifty that now returns malformed JSON or a different tone.",
    solution:
      "Store prompt cases as plain files (input, optional expected substring or JSON schema). A CLI runs every case against model A and model B, stores both outputs in SQLite, and renders a diff page sorted by embedding distance plus hard checks such as schema validity and length drift. Failing cases can be promoted into a permanent regression set with one command.",
    insight:
      "Prompt quality is a regression-testing problem, not a creativity problem. A diff view sorted by surprise turns an afternoon of manual spot-checking into five minutes of reviewing the ten outputs that actually moved.",
    category: "ai-ml",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["TypeScript", "Node.js", "SQLite", "Zod", "Vitest"],
    tags: ["evals", "prompts", "testing", "cli"],
    audience: "Developers who run an LLM-backed feature in production and dread model version changes.",
    alternatives: [
      "promptfoo covers evals but is configuration-heavy for a quick A/B between two model versions.",
      "LangSmith offers dataset runs but ties you to its platform and tracing setup.",
    ],
    mvp: [
      "Define a case file format (YAML with input and checks).",
      "Write a runner that calls two model IDs and saves outputs to SQLite.",
      "Add JSON-schema and substring checks.",
      "Generate a static HTML diff report sorted by change magnitude.",
    ],
    challenges: [
      "Nondeterminism means a single run per case can mislead; you need repeated samples or temperature 0.",
      "Embedding distance flags harmless rewordings as big changes unless thresholds are tuned.",
    ],
  },
  {
    slug: "local-meeting-redactor",
    title: "Local-First Meeting Transcriber That Redacts Before Cloud",
    summary:
      "Transcribe calls on-device with Whisper, strip names and numbers locally, and only then let a cloud model summarize the sanitized text.",
    problem:
      "Consultants and clinicians want AI meeting summaries but are not allowed to upload raw client audio or transcripts to a third party. Most note-taking bots join the call and ship everything off-device by default.",
    solution:
      "A Tauri desktop app records system audio, runs whisper.cpp locally, then passes the transcript through an on-device named-entity model (ONNX) that replaces people, companies, emails and numbers with stable placeholders like PERSON_2. Only the placeholder text is sent to the summarizer, and the app maps the placeholders back in the final notes on your machine.",
    insight:
      "Privacy-preserving AI does not require a local LLM. A reversible redaction layer lets you use the best hosted model while the sensitive mapping table never leaves the laptop.",
    category: "ai-ml",
    difficulty: "intermediate",
    buildTime: "3–5 weeks",
    stack: ["Tauri", "whisper.cpp", "ONNX Runtime", "SQLite", "Rust", "React"],
    tags: ["privacy", "whisper", "desktop", "summarization"],
    audience: "Lawyers, therapists, consultants and journalists who handle confidential conversations.",
    alternatives: [
      "Otter and Fireflies join calls and process audio in the cloud, which many confidentiality agreements forbid.",
      "MacWhisper transcribes locally but leaves summarization and redaction to you.",
    ],
    mvp: [
      "Capture audio from a file and run whisper.cpp through a Rust sidecar.",
      "Add an NER pass that swaps entities for placeholders and stores the mapping.",
      "Send redacted text to a summary API and re-hydrate the result.",
      "Show a diff view so the user can confirm what was masked.",
    ],
    challenges: [
      "NER models miss unusual names and domain jargon, so a miss can leak data; a manual review step is essential.",
      "Capturing system audio differs on Windows, macOS and Linux.",
    ],
  },
  {
    slug: "label-noise-finder",
    title: "Label Noise Finder for Image Datasets",
    summary:
      "Use cross-validated model confidence to surface the images in your training set most likely to be mislabeled, with a fast keyboard review UI.",
    problem:
      "Small teams training classifiers on scraped or crowd-labeled data discover that accuracy plateaus because a few percent of labels are simply wrong. Finding them by browsing thousands of thumbnails is slow and nobody does it twice.",
    solution:
      "Compute embeddings with a pretrained vision model, train a simple classifier with k-fold cross-validation, and flag samples where out-of-fold predictions confidently disagree with the given label (the confident learning approach). A FastAPI and React review UI shows flagged images in a grid, lets you press a key to relabel, keep or discard, and exports a cleaned manifest.",
    insight:
      "Fixing the worst 2 percent of labels often beats a bigger model, and the model itself is the best detector of its own bad training data.",
    category: "ai-ml",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["PyTorch", "scikit-learn", "cleanlab", "FastAPI", "React", "CLIP embeddings"],
    tags: ["datasets", "labeling", "computer-vision", "mlops"],
    audience: "ML engineers and researchers building image classifiers from noisy data.",
    alternatives: [
      "cleanlab implements the algorithm but ships no purpose-built review interface.",
      "Label Studio supports annotation but does not tell you which labels to doubt first.",
    ],
    mvp: [
      "Load a folder dataset and compute CLIP embeddings.",
      "Run 5-fold logistic regression and rank samples by disagreement.",
      "Build a grid review UI with keyboard shortcuts.",
      "Export a corrected CSV and a before/after accuracy comparison.",
    ],
    challenges: [
      "Genuinely ambiguous classes look like noise and can mislead reviewers.",
      "Class imbalance skews which samples get flagged.",
      "Embedding quality limits detection on specialist domains such as medical images.",
    ],
  },

  // ───────────── devtools ─────────────
  {
    slug: "env-drift-checker",
    title: "Env Drift Checker for Teams and CI",
    summary:
      "A git hook and CI step that compares required environment variables across .env.example, your machine, and your deploy platform, and names what is missing.",
    problem:
      "A new variable gets added on one branch, works locally for the author, and then production crashes at 2am because nobody added it to the host. Onboarding is the same pain: a new hire spends an hour reading stack traces to discover missing keys.",
    solution:
      "A tiny CLI parses a typed schema file (or infers it from .env.example and code references to process.env), then checks the local environment and, via platform APIs such as Vercel or Fly, the remote one. It reports missing, unused and mistyped keys without ever printing secret values, and runs as a pre-push hook and a CI job.",
    insight:
      "Config drift is mostly a visibility problem. Diffing key names, never values, gets you 90 percent of the benefit with none of the secret-handling risk.",
    category: "devtools",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["TypeScript", "Node.js", "commander", "Zod", "GitHub Actions"],
    tags: ["config", "cli", "ci", "onboarding"],
    audience: "Small engineering teams deploying web apps to managed platforms.",
    alternatives: [
      "dotenv-linter checks formatting but not whether keys exist in the deployed environment.",
      "t3-env validates at app startup, which is after the broken deploy has already happened.",
    ],
    mvp: [
      "Parse .env.example and scan source for process.env usage.",
      "Compare against the current shell environment and print a table.",
      "Add a Vercel API adapter for remote keys.",
      "Ship a GitHub Action wrapper.",
    ],
    challenges: [
      "Dynamic access like process.env[name] defeats static scanning.",
      "Each hosting platform has a different API and permission model.",
    ],
  },
  {
    slug: "flaky-test-quarantine",
    title: "Flaky Test Quarantine Bot",
    summary:
      "Read CI test reports, detect tests that fail then pass on retry, and automatically open a tracked issue and mark them as quarantined.",
    problem:
      "A flaky test erodes trust: developers re-run red builds without reading them, and then ignore a real failure. Teams know which tests are flaky from folklore but nobody owns the list, so it never shrinks.",
    solution:
      "A GitHub Action uploads JUnit XML from every run to a small service that stores results in SQLite keyed by test name and commit. When the same test fails and passes on the same commit, it is marked flaky, an issue is opened with the failure history and the last five stack traces, and a quarantine file lists it so the test runner can skip or soft-fail it.",
    insight:
      "The cheapest, most reliable flake signal is a pass and a fail on identical code. You do not need ML, only bookkeeping that nobody had time to do.",
    category: "devtools",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["TypeScript", "GitHub Actions", "Octokit", "SQLite", "JUnit XML"],
    tags: ["ci", "testing", "github", "reliability"],
    audience: "Teams with a slow CI pipeline and a growing pile of ignored red builds.",
    alternatives: [
      "BuildPulse and Datadog CI Visibility detect flakes but are paid hosted products.",
      "Jest and pytest retry plugins hide flakes rather than tracking them.",
    ],
    mvp: [
      "Parse JUnit XML and store per-commit results.",
      "Detect same-commit pass/fail pairs.",
      "Open or update a GitHub issue per flaky test.",
      "Emit a quarantine list consumed by the test runner.",
    ],
    challenges: [
      "Tests that fail on infrastructure issues look flaky but are not test bugs.",
      "Quarantine can become a graveyard unless issues have owners and deadlines.",
    ],
  },
  {
    slug: "migration-lock-linter",
    title: "Postgres Migration Lock Linter With Dry-Run",
    summary:
      "Parse a SQL migration, flag statements that take long exclusive locks, and rehearse it on a copy of production-sized data before you run it for real.",
    problem:
      "A seemingly harmless ALTER TABLE or CREATE INDEX on a large Postgres table blocks writes for minutes and takes the site down. Reviewers rarely know which statements acquire which locks, and staging databases are too small to reveal the problem.",
    solution:
      "Use libpg_query to parse the migration into statements, then apply rules (adding a column with a volatile default, non-concurrent index creation, foreign keys without NOT VALID) mapped to lock levels from the PostgreSQL docs. Optionally spin up a Docker Postgres seeded with synthetic rows at the target size, run the migration, and record how long the lock was held using pg_locks sampling.",
    insight:
      "Most migration outages repeat a short list of known patterns. Encoding that list with real timing evidence turns tribal knowledge into a failing CI check.",
    category: "devtools",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Go", "libpg_query", "PostgreSQL", "Docker", "pg_locks", "GitHub Actions"],
    tags: ["postgres", "migrations", "linting", "ops"],
    audience: "Backend teams running Postgres with tables large enough that locks matter.",
    alternatives: [
      "squawk lints migrations statically but does not measure lock duration.",
      "strong_migrations covers Rails only and relies on convention.",
    ],
    mvp: [
      "Parse SQL with libpg_query and detect five high-risk patterns.",
      "Annotate each finding with the lock mode and a safer alternative.",
      "Add a Docker-based dry-run with generated rows.",
      "Publish results as a PR comment.",
    ],
    challenges: [
      "Synthetic data distributions can hide index and bloat effects.",
      "Lock behavior varies across Postgres major versions.",
    ],
  },

  // ───────────── productivity ─────────────
  {
    slug: "interruption-ledger",
    title: "Interruption Ledger: One Key to Log Every Break in Focus",
    summary:
      "A tray app where a single global hotkey logs who or what interrupted you, then shows weekly patterns you can take to your team.",
    problem:
      "People feel constantly interrupted but cannot prove it, so conversations about focus time stay vague. Time trackers record what you worked on, not what pulled you away, and writing a note mid-flow is itself an interruption.",
    solution:
      "A Tauri tray app registers a global hotkey. One press logs a timestamp; an optional second key picks a source (Slack, person, meeting, self-distraction) from a short radial menu. A SQLite store feeds a weekly view with interruption counts by source and hour, and a shareable image summarizing the pattern.",
    insight:
      "A measurement that costs under a second gets recorded; one that costs ten does not. The data is persuasive precisely because it is crude and self-reported.",
    category: "productivity",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Tauri", "Svelte", "SQLite", "Rust"],
    tags: ["focus", "tracking", "desktop", "habits"],
    audience: "Knowledge workers and managers who want evidence about fragmented attention.",
    alternatives: [
      "RescueTime tracks app usage but cannot tell a chat ping from a self-initiated switch.",
      "Manual spreadsheets work but are abandoned within days.",
    ],
    mvp: [
      "Register a global hotkey and write timestamps to SQLite.",
      "Add a quick source picker.",
      "Build a weekly heatmap.",
      "Export a PNG summary.",
    ],
    challenges: [
      "Global hotkeys behave differently per OS and may conflict with other apps.",
      "Self-reporting is biased, so the tool should present it as a conversation starter rather than proof.",
    ],
  },
  {
    slug: "reading-queue-decay",
    title: "Reading Queue That Forgets On Purpose",
    summary:
      "A browser extension where saved articles expire after two weeks unless you spend one of three weekly keep tokens on them.",
    problem:
      "Read-later apps become graveyards with thousands of saved links. Saving feels like progress, so the habit continues while the actual reading never happens and the guilt grows.",
    solution:
      "A WebExtension stores saved pages in IndexedDB with a countdown. Each week you receive three keep tokens that reset the timer on an item; everything else is archived to a plain export file at expiry rather than kept in the active list. A popup shows the queue as a short list sorted by days remaining, forcing a decision on each item.",
    insight:
      "Scarcity changes behavior. A limited queue turns saving from a free action into a small commitment, which is what makes reading actually happen.",
    category: "productivity",
    difficulty: "intermediate",
    buildTime: "2 weeks",
    stack: ["WebExtension API", "TypeScript", "IndexedDB", "Readability.js", "Preact"],
    tags: ["reading", "browser-extension", "attention", "habits"],
    audience: "Heavy web readers with a bloated Pocket or Instapaper backlog.",
    alternatives: [
      "Pocket and Instapaper store unlimited items with no pressure to finish.",
      "Readwise Reader adds triage tools but still defaults to keeping everything.",
    ],
    mvp: [
      "Save page title, URL and Readability text with a timestamp.",
      "Show the queue with days remaining.",
      "Implement weekly keep tokens.",
      "Archive expired items to a downloadable JSON/Markdown file.",
    ],
    challenges: [
      "Cross-browser WebExtension differences, especially Safari.",
      "Users may hate losing items, so the archive and undo flow matters.",
    ],
  },
  {
    slug: "calendar-constraint-scheduler",
    title: "Constraint-Solver Scheduler for Recurring Chores and Habits",
    summary:
      "Feed it your calendar, energy windows and a list of recurring tasks, and a CP-SAT solver proposes a week that respects all your rules.",
    problem:
      "People with irregular calendars rebuild their plan by hand every Sunday: gym three times, deep work blocks of 90 minutes, no calls after school pickup. Todo apps list tasks but never place them, and auto-schedulers behave like black boxes you do not trust.",
    solution:
      "Read busy times from Google Calendar or an ICS feed and express rules as constraints: minimum gaps, preferred time windows, no more than two intense tasks a day, tasks that must precede others. Google OR-Tools CP-SAT finds a feasible schedule that maximizes preference scores, and the UI explains which constraint blocked a task when the week is infeasible.",
    insight:
      "Scheduling is a constraint satisfaction problem with a forty-year toolbox, and showing why something does not fit is more valuable than silently moving it.",
    category: "productivity",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Python", "OR-Tools CP-SAT", "FastAPI", "Google Calendar API", "ICS", "React"],
    tags: ["scheduling", "optimization", "calendar", "planning"],
    audience: "Freelancers and parents juggling variable calendars and recurring commitments.",
    alternatives: [
      "Reclaim and Motion auto-schedule but are opaque about trade-offs and are paid subscriptions.",
      "Plain calendar apps require manual placement every week.",
    ],
    mvp: [
      "Import busy blocks from an ICS file.",
      "Model tasks with duration, window and weekly frequency.",
      "Solve and render the proposed week.",
      "Add an infeasibility explainer listing conflicting rules.",
    ],
    challenges: [
      "Writing constraints is a UX problem; most users will not write rules in code.",
      "Solutions must stay stable week to week or users stop trusting them.",
    ],
  },

  // ───────────── startups ─────────────
  {
    slug: "interview-coverage-map",
    title: "Customer Interview Coverage Map",
    summary:
      "Track which customer segments, roles and situations you have interviewed so far, and see the blind spots before you build.",
    problem:
      "Founders do ten interviews, all with friends-of-friends in the same role, then conclude the market wants their product. Notes live in scattered docs, so nobody can see that nobody has talked to buyers at small companies or to people who churned.",
    solution:
      "A lightweight app where you define the dimensions you care about (role, company size, current tool, buying stage) and tag every interview. A matrix view shows counts per cell with empty cells highlighted, and each cell links to quotes you pasted in. A rule such as at least three interviews per cell before building flips cells from red to green.",
    insight:
      "Confirmation bias hides in who you talk to, not only in what you ask. Making the sampling gaps visible forces the uncomfortable calls.",
    category: "startups",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Next.js", "SQLite", "Drizzle ORM", "Tailwind CSS"],
    tags: ["customer-discovery", "research", "validation", "founders"],
    audience: "Pre-seed founders and product managers running discovery interviews.",
    alternatives: [
      "Dovetail and Notion databases store interviews but do not visualize sampling coverage.",
      "Spreadsheets can do it but nobody maintains the matrix.",
    ],
    mvp: [
      "Define dimensions and values.",
      "Add interviews with tags and quotes.",
      "Render the coverage matrix.",
      "Export a one-page summary.",
    ],
    challenges: [
      "Choosing the right dimensions is itself a judgment call the tool cannot make.",
      "Small cell counts invite false precision.",
    ],
  },
  {
    slug: "churn-postmortem-inbox",
    title: "Churn Postmortem Inbox",
    summary:
      "When a Stripe subscription cancels, send a one-question email, then cluster the replies into themes you can act on.",
    problem:
      "Cancellation surveys with dropdown reasons produce answers like Too expensive that hide the real cause. Founders of small SaaS products never see the plain-text reason, and the few who reply are scattered across inboxes.",
    solution:
      "Listen to Stripe customer.subscription.deleted webhooks, wait 24 hours, and send a plain-text email from the founder asking one open question. Replies arrive at an inbound address, are stored in Postgres, embedded and clustered, and shown in a dashboard that lists themes with verbatim quotes and the plan, tenure and revenue of those customers.",
    insight:
      "A personal email asking one open question gets more honest answers than a form, and pairing replies with revenue shows which reason actually costs money.",
    category: "startups",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["Stripe Webhooks", "Resend", "Postgres", "Next.js", "OpenAI embeddings", "HDBSCAN"],
    tags: ["churn", "saas", "stripe", "feedback"],
    audience: "Solo founders and small teams running subscription products on Stripe.",
    alternatives: [
      "Churnkey and ProfitWell Retain offer cancellation flows but focus on save offers rather than learning.",
      "Manually emailing churned users works but never becomes a system.",
    ],
    mvp: [
      "Handle the Stripe cancellation webhook and queue an email.",
      "Receive replies through an inbound email service.",
      "Store replies with customer metadata.",
      "Cluster replies and list themes with revenue totals.",
    ],
    challenges: [
      "Reply rates are low, so themes need volume or careful reading.",
      "Email deliverability and consent rules vary by region.",
    ],
  },
  {
    slug: "price-test-bandit",
    title: "Bayesian Price Experiments for Stripe Products",
    summary:
      "Test several price points on a live Stripe checkout using Thompson sampling, with guardrails against showing wildly different prices to similar customers.",
    problem:
      "Most small startups set their price by gut feeling and change it rarely, because a classic A/B test needs more traffic than they have and feels risky. Raising prices blindly could lose revenue; never testing leaves money on the table.",
    solution:
      "A service assigns each new visitor a price from a small set of Stripe Prices using Thompson sampling over revenue per visitor, so traffic shifts gradually toward better-performing prices. Guardrails cap the spread between prices, hold each visitor to one price via a cookie, and stop the test when the posterior probability that one option is best passes a threshold.",
    insight:
      "With low traffic, a bandit that learns while it earns is more practical than a fixed A/B test, and Bayesian posteriors honestly show when you still do not know.",
    category: "startups",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Stripe Prices API", "Postgres", "Python", "FastAPI", "Thompson sampling", "Next.js"],
    tags: ["pricing", "experimentation", "bayesian", "stripe"],
    audience: "Founders with a few thousand monthly visitors who want data-backed pricing.",
    alternatives: [
      "Price Intelligently and Paddle offer pricing consulting rather than self-serve experiments.",
      "General A/B tools like Optimizely are not wired to revenue per visitor on Stripe.",
    ],
    mvp: [
      "Create three Stripe Prices and assign them with a cookie.",
      "Log checkout sessions and revenue per assignment.",
      "Implement Thompson sampling with a Beta-Bernoulli model on conversion.",
      "Show a dashboard with posterior intervals.",
    ],
    challenges: [
      "Showing different prices can annoy customers or raise fairness and legal questions in some markets.",
      "Revenue per visitor has a heavy tail, so simple conversion models can mislead.",
    ],
  },

  // ───────────── education ─────────────
  {
    slug: "faded-worked-examples",
    title: "Faded Worked Examples Generator for Math Practice",
    summary:
      "Generate algebra problems with fully worked solutions that lose one more step each time, moving a learner from watching to doing.",
    problem:
      "Students either stare at a full solution and think they understand, or get a blank problem and freeze. Worksheets rarely sit in between, though research on worked examples suggests gradually removing steps helps novices.",
    solution:
      "Use SymPy to generate problems of a given type with controlled difficulty and compute each solution step. The UI shows the first problem with all steps, the next with the last step missing, then the last two missing, and so on until the learner solves it alone. KaTeX renders the math, and a check against SymPy validates each entered step.",
    insight:
      "The scaffolding level is the real product. Making the fade automatic means every learner gets a custom ramp rather than one worksheet for all.",
    category: "education",
    difficulty: "beginner",
    buildTime: "1–2 weeks",
    stack: ["Next.js", "SymPy", "FastAPI", "KaTeX", "PostgreSQL"],
    tags: ["math", "pedagogy", "scaffolding", "practice"],
    audience: "Secondary school students and tutors teaching algebra.",
    alternatives: [
      "Khan Academy gives hints on request but does not systematically fade support.",
      "Textbook worked examples are static and cannot be regenerated.",
    ],
    mvp: [
      "Generate linear equations with SymPy and record solution steps.",
      "Render a fade ladder of five stages.",
      "Validate typed answers per step.",
      "Move up a stage after two correct answers.",
    ],
    challenges: [
      "Free-form step entry is hard to parse; multiple choice steps are a simpler first version.",
      "Choosing which step to remove first matters pedagogically.",
    ],
  },
  {
    slug: "code-memory-cards",
    title: "Spaced Repetition Cards From Your Own Commits",
    summary:
      "Turn code you wrote months ago into fill-in-the-blank review cards scheduled by the FSRS algorithm.",
    problem:
      "Developers forget the tricky patterns they once figured out, such as a SQL window function or a regex, and rediscover them painfully. Generic flashcard decks teach other people's examples, not the specific idioms you actually use.",
    solution:
      "A VS Code extension scans your git history, uses tree-sitter to pick small self-contained functions or expressions you authored, and blanks one meaningful token or line. Cards are stored in SQLite and scheduled with the open-source FSRS algorithm, then surfaced as a short daily review inside the editor.",
    insight:
      "Your own code is the most relevant study material you have, and retrieval practice beats re-reading documentation.",
    category: "education",
    difficulty: "intermediate",
    buildTime: "3–4 weeks",
    stack: ["VS Code Extension API", "TypeScript", "tree-sitter", "SQLite", "FSRS", "isomorphic-git"],
    tags: ["spaced-repetition", "learning", "code", "vscode"],
    audience: "Developers learning a new language or returning to an old codebase.",
    alternatives: [
      "Anki is powerful but requires hand-written cards.",
      "Exercism and LeetCode teach generic problems rather than your own idioms.",
    ],
    mvp: [
      "Extract candidate functions from git blame for one language.",
      "Create cloze cards by removing a single node.",
      "Schedule with FSRS and store in SQLite.",
      "Show a five-card review panel.",
    ],
    challenges: [
      "Auto-selected snippets can be trivial or lack context.",
      "Blanking the right token without ambiguous answers is hard.",
    ],
  },
  {
    slug: "misconception-diagnoser",
    title: "Misconception Diagnoser From Wrong Answers",
    summary:
      "Multiple-choice questions where every wrong option maps to a specific misconception, so a pattern of wrong answers reveals what a student actually believes.",
    problem:
      "Teachers see that a student got a question wrong but not why. Two students picking different wrong answers need different explanations, yet most quiz tools only report a score.",
    solution:
      "Author questions where each distractor is tagged with a named misconception, such as adding denominators when adding fractions. The app records choices across a short quiz, computes which misconceptions recur using a simple Bayesian update, and suggests a targeted follow-up question and explanation. Teachers see a class-level map of the most common misconceptions.",
    insight:
      "A wrong answer is data about a mental model. Designing distractors on purpose turns every quiz into a diagnostic test.",
    category: "education",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["Next.js", "PostgreSQL", "Python", "Item Response Theory", "Prisma", "D3.js"],
    tags: ["assessment", "diagnostics", "teachers", "misconceptions"],
    audience: "Math and science teachers who want to teach to the confusion, not the score.",
    alternatives: [
      "Eedi builds diagnostic questions for maths but is a closed, curriculum-specific platform.",
      "Google Forms quizzes grade right or wrong without diagnosing causes.",
    ],
    mvp: [
      "Author 20 questions for one topic with tagged distractors.",
      "Record per-student answer patterns.",
      "Compute misconception likelihoods.",
      "Show a class heatmap and recommended next questions.",
    ],
    challenges: [
      "Writing good distractors takes real subject expertise.",
      "Students can guess, so single answers are weak evidence and patterns need several questions.",
    ],
  },

  // ───────────── healthcare ─────────────
  {
    slug: "appointment-prep-sheet",
    title: "One-Page Symptom Timeline for Doctor Visits",
    summary:
      "Log symptoms in seconds as they happen, then print a clean one-page timeline to hand your doctor, stored only on your own device.",
    problem:
      "In a ten-minute appointment people forget when symptoms started, what made them worse and what they already tried. Doctors then rely on vague recall, and patients leave remembering what they should have said.",
    solution:
      "A PWA with big one-tap entries: symptom, severity from 1 to 5, and optional trigger tags such as meal, exercise or stress. Data stays in IndexedDB with no account. Before an appointment the app generates a PDF with a timeline chart, a list of what was tried and questions the patient wants to ask.",
    insight:
      "Good clinical conversations start with good histories, and a timeline the patient made while symptoms were fresh beats memory at the clinic.",
    category: "healthcare",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Next.js", "IndexedDB", "react-pdf", "Recharts", "PWA"],
    tags: ["patient-tools", "privacy", "pdf", "symptom-tracking"],
    audience: "Patients with recurring or hard-to-describe symptoms.",
    alternatives: [
      "Apple Health and Symptom Tracker apps collect data but are not designed around a handoff document.",
      "Paper diaries are easy but not searchable or chartable.",
    ],
    mvp: [
      "Add a one-tap symptom entry screen.",
      "Store entries locally in IndexedDB.",
      "Render a timeline chart.",
      "Export a one-page PDF with a questions list.",
    ],
    challenges: [
      "Must avoid presenting any interpretation as a diagnosis.",
      "Local-only storage means data is lost if the device is lost, so export and backup matter.",
    ],
  },
  {
    slug: "phone-tremor-log",
    title: "30-Second Hand Tremor Log From a Phone's Motion Sensors",
    summary:
      "Record a short steady-hand test with the phone's accelerometer and chart tremor frequency and amplitude over weeks to share with a clinician.",
    problem:
      "People living with essential tremor or Parkinson's disease are asked at appointments how their tremor has been, but symptoms fluctuate day to day and recall is poor. Clinic measurements capture a single moment.",
    solution:
      "A PWA reads DeviceMotion data while the user holds the phone steady for 30 seconds, runs a Fourier transform to find the dominant frequency and power in the 3 to 12 Hz band, and stores one data point per session with medication timing notes. A trend chart and CSV export let the patient show a clinician objective change over time without claiming a diagnosis.",
    insight:
      "A phone is a calibrated-enough motion sensor in everyone's pocket; the value is in repeated, consistent measurements rather than any single accurate reading.",
    category: "healthcare",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["DeviceMotion API", "TypeScript", "FFT.js", "IndexedDB", "PWA", "Chart.js"],
    tags: ["tremor", "sensors", "patient-data", "pwa"],
    audience: "People with movement disorders and the clinicians who treat them.",
    alternatives: [
      "Apple Watch Parkinson's features exist but need a specific device and are not exportable per session.",
      "Clinical rating scales are subjective and captured only at visits.",
    ],
    mvp: [
      "Capture accelerometer samples for 30 seconds.",
      "Compute dominant frequency and band power with an FFT.",
      "Store sessions with notes and show a trend.",
      "Export CSV.",
    ],
    challenges: [
      "Sensor sampling rates and axes differ across phones, and iOS requires a permission prompt for motion data.",
      "Results must be framed as personal tracking, not medical measurement.",
    ],
  },
  {
    slug: "pillbox-interaction-check",
    title: "Offline Interaction Flagger for Caregiver Pillboxes",
    summary:
      "Scan or search a loved one's medication list and surface label-listed interactions from public data, entirely offline, with a printable summary for the pharmacist.",
    problem:
      "Family caregivers manage a dozen prescriptions across several prescribers, often with supplements added on top. Nobody holds the full list, and checking interactions online means pasting private health data into ad-filled websites.",
    solution:
      "Bundle RxNorm concept data and openFDA drug label text into a local SQLite database with FTS5. Users add medications by name or by scanning the barcode, and the app normalizes each to an RxNorm ingredient, then searches label interaction sections for mentions of the other ingredients. Hits are shown with the source text and a printable list of questions for the pharmacist.",
    insight:
      "The goal is not to replace a pharmacist but to arrive at the pharmacy with a short, sourced list of things to ask, without sharing the list with anyone.",
    category: "healthcare",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["React Native", "SQLite FTS5", "RxNorm", "openFDA", "Python", "ML Kit barcode scanning"],
    tags: ["medication", "caregivers", "offline", "privacy"],
    audience: "Family caregivers managing medications for older relatives.",
    alternatives: [
      "Drugs.com and Medscape checkers are web-based and require sending medication lists to the site.",
      "Pharmacy apps only know prescriptions filled at that pharmacy.",
    ],
    mvp: [
      "Build a data pipeline from RxNorm and openFDA labels into SQLite.",
      "Implement medication search with normalization to ingredients.",
      "Search interaction sections for other listed ingredients.",
      "Print a summary with sources and disclaimers.",
    ],
    challenges: [
      "Free-text label parsing misses and over-matches, so a clear not-medical-advice framing and source quoting are essential.",
      "Keeping the offline data current requires a reliable update pipeline.",
    ],
  },

  // ───────────── sustainability ─────────────
  {
    slug: "standby-power-hunter",
    title: "Standby Power Hunter From Smart Plug Logs",
    summary:
      "Plug appliances into smart plugs for a week, upload the logs, and get a ranked list of devices wasting power while idle.",
    problem:
      "Households want to cut electricity use but the whole-house meter cannot tell which device is the culprit. Old set-top boxes, gaming consoles and chargers can draw power all day, yet nobody wants to read a spreadsheet to find out.",
    solution:
      "Cheap smart plugs running Tasmota or Shelly firmware expose power readings over MQTT or HTTP. A Streamlit app ingests a CSV or pulls readings, finds each device's idle baseline using a low percentile of its power distribution, converts it into annual kilowatt-hours and cost at the user's tariff, and ranks devices by savings from unplugging.",
    insight:
      "The idle baseline, not the peak, is what silently costs money, and the 5th percentile of a week of data finds it without any machine learning.",
    category: "sustainability",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Tasmota", "Shelly plugs", "MQTT", "Python", "pandas", "Streamlit"],
    tags: ["energy", "smart-home", "data-analysis", "savings"],
    audience: "Renters and homeowners wanting concrete electricity savings.",
    alternatives: [
      "Kill A Watt meters give instant readings but no long-term idle analysis.",
      "Home Assistant energy dashboards show consumption but do not rank standby waste.",
    ],
    mvp: [
      "Read a CSV of timestamped watt readings.",
      "Compute a baseline per device with a low percentile.",
      "Convert to kWh per year and cost.",
      "Display a ranked bar chart.",
    ],
    challenges: [
      "Some devices have low standby but regular cycles, such as fridges, and should be excluded from the unplug advice.",
      "Plug accuracy is poor at very low wattages.",
    ],
  },
  {
    slug: "low-carbon-chore-scheduler",
    title: "Home Chore Scheduler That Chases Low-Carbon Electricity",
    summary:
      "Delay the dishwasher, EV charging or water heater to the cleanest hours of the grid forecast, without the user lifting a finger.",
    problem:
      "The carbon intensity of the electricity grid swings several-fold between a windy night and a still evening, but householders run appliances when it suits them and have no practical way to see the forecast or act on it.",
    solution:
      "A Home Assistant integration or Node-RED flow reads the UK Carbon Intensity API (or Electricity Maps where available), picks the lowest-carbon window within the user's deadline, and triggers smart plugs or an EV charger via MQTT. A small dashboard reports estimated grams of CO2 avoided against running immediately.",
    insight:
      "Shifting flexible loads costs nothing in comfort, and automation removes the willpower problem that keeps most demand-shifting ideas from working.",
    category: "sustainability",
    difficulty: "intermediate",
    buildTime: "2 weeks",
    stack: ["Home Assistant", "Node-RED", "MQTT", "UK Carbon Intensity API", "Shelly relays"],
    tags: ["carbon", "smart-home", "grid", "ev"],
    audience: "Smart home owners and EV drivers who want lower-carbon electricity use.",
    alternatives: [
      "Octopus Agile tariffs shift by price, which often but not always correlates with carbon.",
      "Electricity Maps shows data but does not control your devices.",
    ],
    mvp: [
      "Fetch a 48-hour carbon intensity forecast.",
      "Choose the best contiguous window before a deadline.",
      "Trigger a smart plug at the chosen time.",
      "Log estimated CO2 avoided.",
    ],
    challenges: [
      "Forecast accuracy varies, so decisions should tolerate error.",
      "Appliance start behavior differs; many dishwashers need a physical start.",
    ],
  },
  {
    slug: "smallholder-ndvi-alerts",
    title: "Satellite Greenness Alerts for Smallholder Fields",
    summary:
      "Use free Sentinel-2 imagery to compute vegetation health per field and send an SMS when one drops behind its neighbors.",
    problem:
      "Smallholder farmers cannot walk every plot daily, and by the time stress from drought, pests or nutrient shortage is visible from the ground, yield has already suffered. Commercial precision-agriculture platforms assume large farms and subscriptions.",
    solution:
      "Farmers or extension workers draw field boundaries on a map. A scheduled job queries Sentinel-2 imagery through a STAC catalog, masks clouds, computes NDVI per field with rasterio, and compares each field against its neighbors and its own past weeks. When a field drops beyond a threshold, an SMS tells the owner which field to inspect first.",
    insight:
      "Relative change against neighbors is more useful than absolute NDVI, because it cancels out weather and crop type differences without needing agronomy models.",
    category: "sustainability",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["Sentinel-2", "STAC API", "rasterio", "PostGIS", "MapLibre GL", "Twilio SMS"],
    tags: ["agriculture", "remote-sensing", "geospatial", "alerts"],
    audience: "Smallholder farmers and agricultural extension workers.",
    alternatives: [
      "Sentinel Hub EO Browser lets experts view NDVI but has no field-level alerts.",
      "Commercial platforms like Climate FieldView target large, equipment-rich farms.",
    ],
    mvp: [
      "Draw field polygons and store them in PostGIS.",
      "Fetch weekly Sentinel-2 scenes and compute NDVI.",
      "Compare each field against neighbors.",
      "Send an SMS when the relative drop crosses a threshold.",
    ],
    challenges: [
      "Persistent cloud cover in rainy seasons creates data gaps.",
      "The 10-meter resolution is too coarse for very small plots.",
      "Alerts need field-level validation to avoid crying wolf.",
    ],
  },

  // ───────────── finance ─────────────
  {
    slug: "subscription-hike-detector",
    title: "Subscription Price Hike Detector From Bank CSVs",
    summary:
      "Drop in a bank export and see which recurring charges quietly went up, by how much, and since when.",
    problem:
      "Streaming services, insurers and gyms raise prices by a few dollars with an easy-to-miss email. Across ten subscriptions it adds up, yet bank apps list transactions chronologically and never compare this month's charge to last year's.",
    solution:
      "A local-only web app parses bank CSVs in the browser, clusters transactions by normalized merchant name, detects recurring cadence (monthly, annual) and flags merchants where the latest amount is higher than the prior median. It shows a table of old versus new amount, annualized impact and a link template to the cancel page.",
    insight:
      "The data to catch price creep is already in your bank export; nobody looks at it because no tool compares a charge with its own history.",
    category: "finance",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["TypeScript", "Papa Parse", "Next.js", "Fuse.js", "Recharts"],
    tags: ["subscriptions", "personal-finance", "privacy", "csv"],
    audience: "Anyone with several streaming, software or utility subscriptions.",
    alternatives: [
      "Rocket Money finds subscriptions but requires linking bank accounts.",
      "Spreadsheets can do it with effort and no merchant normalization.",
    ],
    mvp: [
      "Parse a CSV in the browser.",
      "Normalize merchant names with simple rules.",
      "Detect repeat cadence and amount changes.",
      "Show a ranked table of increases.",
    ],
    challenges: [
      "Bank CSV formats vary widely, requiring a column mapping step.",
      "Merchant descriptors are messy and change over time.",
    ],
  },
  {
    slug: "proportional-household-ledger",
    title: "Fair-Share Household Ledger for Unequal Incomes",
    summary:
      "Split shared bills in proportion to income, track who owes whom, and settle with the fewest possible transfers.",
    problem:
      "Couples and flatmates with very different incomes either split everything 50/50 and cause resentment, or negotiate every bill ad hoc. Splitwise handles equal and fixed-percent splits but nothing helps with a household that wants a principled ratio that updates when salaries change.",
    solution:
      "Each member enters their monthly income privately and the app stores only the resulting share percentage. Expenses are logged with a category-specific rule (proportional, equal or personal), balances are tracked as a graph, and a min-cash-flow algorithm computes the smallest set of transfers to settle at month end. A history view shows how the ratio changed.",
    insight:
      "Hiding raw incomes behind a derived ratio removes the awkward disclosure that stops people from using fair splits in the first place.",
    category: "finance",
    difficulty: "intermediate",
    buildTime: "2 weeks",
    stack: ["Next.js", "SQLite", "Drizzle ORM", "min-cash-flow algorithm", "Tailwind CSS"],
    tags: ["household", "splitting", "budgeting", "fairness"],
    audience: "Couples and flatmates with unequal incomes.",
    alternatives: [
      "Splitwise supports percentage splits but not income-derived shares that update automatically.",
      "Honeydue and joint-account apps assume a pooled budget.",
    ],
    mvp: [
      "Create a household with members and private shares.",
      "Log expenses with split rules.",
      "Compute settlement transfers.",
      "Show a month-by-month history.",
    ],
    challenges: [
      "Defining fair is personal, so rules must be configurable per category.",
      "Share changes mid-month need clear cutover handling.",
    ],
  },
  {
    slug: "receipt-to-beancount",
    title: "Receipt-to-Beancount: OCR That Learns Your Chart of Accounts",
    summary:
      "Snap a receipt and get a ready-to-commit Beancount ledger entry that gets better at guessing your accounts as you correct it.",
    problem:
      "Plain-text accounting is transparent and version-controlled, but entering every purchase by hand is the reason people quit. Cloud bookkeeping apps categorize automatically but lock data away and suggest accounts that do not match your own scheme.",
    solution:
      "PaddleOCR extracts merchant, date, total and tax from a receipt photo. A rules layer proposes a Beancount transaction by matching the merchant to previous entries in your ledger, using a small k-nearest-neighbors model over merchant text to choose the expense account. Corrections are written back as new training examples, and the entry is committed to your git repository.",
    insight:
      "Your own ledger is the training set. The model only has to imitate your past decisions, which is far easier than learning universal categories.",
    category: "finance",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Python", "PaddleOCR", "Beancount", "scikit-learn", "FastAPI", "Git"],
    tags: ["accounting", "ocr", "plain-text", "automation"],
    audience: "Plain-text accounting users, freelancers and small business owners who prefer owning their data.",
    alternatives: [
      "Expensify and Dext parse receipts well but export into their own formats.",
      "beancount-import handles bank files, not photographed receipts.",
    ],
    mvp: [
      "Run OCR and extract merchant, date and total with regex heuristics.",
      "Match merchants to past ledger entries with fuzzy search.",
      "Generate a Beancount transaction and show it for approval.",
      "Append approved entries and commit them.",
    ],
    challenges: [
      "Receipt OCR quality varies a lot with crumpled thermal paper.",
      "Split receipts across several accounts need a UI beyond one-click approval.",
    ],
  },

  // ───────────── hardware ─────────────
  {
    slug: "freezer-power-cut-witness",
    title: "Freezer Power-Cut Witness With Temperature Logging",
    summary:
      "An ESP32 that lives on its own battery, logs freezer temperature, and sends a phone alert the moment mains power drops.",
    problem:
      "A tripped breaker or outage while you are away can thaw a freezer full of food or medicine, and you only find out when the smell arrives. Smart plugs go offline when power does, so they cannot tell you.",
    solution:
      "An ESP32 powered from a USB adapter plus a small LiPo cell watches a mains-sensing optocoupler input and a DS18B20 probe inside the freezer. On power loss it wakes, posts a push notification via ntfy over Wi-Fi if the router still works (or via a cellular module as an option), and keeps logging temperature so you know how long the food stayed cold.",
    insight:
      "The product is not a thermometer but a witness that keeps working when the thing it monitors loses power.",
    category: "hardware",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["ESP32", "DS18B20", "Optocoupler", "LiPo charger", "ntfy", "Arduino framework"],
    tags: ["esp32", "monitoring", "alerts", "home"],
    audience: "Households with chest freezers and anyone storing medicine or breast milk.",
    alternatives: [
      "Commercial Wi-Fi freezer alarms exist but are often cloud-only and need a subscription.",
      "Basic fridge thermometers show a max/min reading but cannot notify you remotely.",
    ],
    mvp: [
      "Read a DS18B20 and publish readings every minute.",
      "Detect mains loss through an isolated input.",
      "Send a ntfy push on power loss and restore.",
      "Log history to flash for later review.",
    ],
    challenges: [
      "Mains sensing must be done with proper isolation and certified components.",
      "If Wi-Fi also loses power the alert cannot be sent until it returns, unless using a cellular module.",
    ],
  },
  {
    slug: "lora-beehive-scale",
    title: "LoRa Beehive Scale for Remote Apiaries",
    summary:
      "Load cells under a hive report weight and temperature over LoRa, so beekeepers see nectar flows and swarm events without opening the lid.",
    problem:
      "Apiaries sit in fields and orchards with no Wi-Fi and spotty cellular coverage. Beekeepers inspect hives on a schedule, which disturbs the colony, and can miss a swarm or a starving colony between visits.",
    solution:
      "An ESP32 with an HX711 amplifier reads four load cells under the hive and a temperature sensor, wakes every 30 minutes with deep sleep, and sends a compact packet via an SX1276 LoRa radio to a gateway near the house running ChirpStack. A dashboard plots daily weight curves, where a sudden drop indicates a swarm and a steady rise indicates a nectar flow.",
    insight:
      "A single number tracked over time, hive weight, tells a beekeeper more about colony health than a quick visual inspection.",
    category: "hardware",
    difficulty: "intermediate",
    buildTime: "1–2 months",
    stack: ["ESP32", "HX711", "Load cells", "LoRa SX1276", "ChirpStack", "Grafana"],
    tags: ["lora", "beekeeping", "iot", "low-power"],
    audience: "Hobbyist and small-scale beekeepers with remote apiaries.",
    alternatives: [
      "Commercial hive scales cost hundreds of dollars and often use proprietary clouds.",
      "OpenBeehive and the Hiveeyes project share designs but need assembly and setup knowledge.",
    ],
    mvp: [
      "Calibrate four load cells with known weights.",
      "Deep-sleep loop sending weight and temperature over LoRa.",
      "Ingest packets in ChirpStack and chart them in Grafana.",
      "Add temperature compensation for load cell drift.",
    ],
    challenges: [
      "Load cell temperature drift can exceed the signals you care about.",
      "Weatherproofing and battery life through winter.",
      "LoRa duty cycle limits in some regions.",
    ],
  },
  {
    slug: "pio-retro-keyboard-adapter",
    title: "Raspberry Pi Pico Adapter for Dead-Protocol Keyboards",
    summary:
      "Use the RP2040's programmable I/O to turn vintage keyboards with obscure protocols into modern USB devices.",
    problem:
      "Classic keyboards such as IBM Model F, Apple Desktop Bus or old terminal boards have unmatched feel, but their protocols are not USB or even PS/2. Existing converters are hard to find, limited to one model or require reflashing legacy microcontrollers.",
    solution:
      "Write PIO state machines on a Raspberry Pi Pico that sample each protocol's timing in hardware, push decoded scancodes into a FIFO, and map them to HID keycodes through TinyUSB. A config file selects the protocol and keymap, with a small web serial tool to remap keys, so one board supports many vintage keyboards.",
    insight:
      "PIO lets one cheap chip impersonate hardware that is decades out of production, turning a different tiny state machine per protocol into a software download.",
    category: "hardware",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["RP2040", "PIO assembly", "TinyUSB", "C", "Web Serial API"],
    tags: ["rp2040", "keyboards", "retro", "usb"],
    audience: "Keyboard enthusiasts and retrocomputing hobbyists.",
    alternatives: [
      "TMK/QMK converters from hasu and Soarer support some protocols but on older, scarcer microcontrollers.",
      "Single-protocol commercial adapters cover only popular models.",
    ],
    mvp: [
      "Implement a PIO program for one protocol such as PS/2.",
      "Translate scancodes into USB HID reports.",
      "Add a second protocol using a different PIO program.",
      "Provide a Web Serial remapping page.",
    ],
    challenges: [
      "Documentation for old protocols is scattered and sometimes wrong, so a logic analyzer is essential.",
      "Voltage level differences require level shifters to avoid damaging boards.",
    ],
  },

  // ───────────── automation ─────────────
  {
    slug: "downloads-folder-rules-daemon",
    title: "Downloads Folder Daemon That Files by Content",
    summary:
      "Watch a folder and rename and file PDFs and images using what is inside them, with an undo log for every move.",
    problem:
      "Downloads folders fill with invoice(3).pdf and Scan_0042.jpg. Filename-based rules fail because the filename says nothing, and the one document you need next April is buried among thousands.",
    solution:
      "A Python daemon uses watchdog to detect new files, extracts text from PDFs with pdfplumber (OCR via Tesseract for scans), and runs a rule file mapping patterns, such as an invoice number plus a known vendor, to a destination folder and a name like 2025-03-vendor-invoice.pdf. Every action is recorded in SQLite so a command can undo the last N moves.",
    insight:
      "Automation people trust is reversible. An undo log lets rules be aggressive without the fear of losing a document.",
    category: "automation",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Python", "watchdog", "pdfplumber", "Tesseract", "SQLite"],
    tags: ["files", "ocr", "organization", "daemon"],
    audience: "Freelancers and household admins drowning in downloaded documents.",
    alternatives: [
      "Hazel on macOS does rule-based filing but cannot read document contents deeply.",
      "File renaming scripts break when filenames are uninformative.",
    ],
    mvp: [
      "Watch a folder and extract PDF text.",
      "Match rules from a YAML file.",
      "Rename and move files.",
      "Write an undo log and a CLI to revert.",
    ],
    challenges: [
      "Files still downloading or half-written must be ignored until stable.",
      "Rules need a safe dry-run mode.",
    ],
  },
  {
    slug: "paper-form-camera-pipeline",
    title: "Paper Form to Spreadsheet Camera Pipeline",
    summary:
      "Photograph a filled-in paper form with a phone and get checkbox and handwriting-region values as a clean spreadsheet row.",
    problem:
      "Field surveys, clinics and community events still collect data on paper, then someone spends days retyping it. Generic OCR struggles because forms have checkboxes, skewed photos and handwriting in boxes.",
    solution:
      "Design the form with four fiducial markers and a known template. OpenCV detects the markers, warps the photo into a flat template, then reads checkbox fill by counting dark pixels in known regions and crops handwritten fields into images for Tesseract or a handwriting model. Rows are appended to Google Sheets with the cropped images attached for human verification of uncertain fields.",
    insight:
      "Controlling the form layout makes the vision problem tractable. Design the paper for the camera, then even simple algorithms perform reliably.",
    category: "automation",
    difficulty: "intermediate",
    buildTime: "3–4 weeks",
    stack: ["OpenCV", "Python", "Tesseract", "Google Sheets API", "FastAPI", "ArUco markers"],
    tags: ["ocr", "forms", "computer-vision", "field-data"],
    audience: "NGOs, researchers and small clinics that still collect data on paper.",
    alternatives: [
      "Google Cloud Document AI handles forms but is generic, costly and cloud-bound.",
      "ODK and KoBoToolbox avoid paper entirely but need devices and connectivity in the field.",
    ],
    mvp: [
      "Generate a template with ArUco corner markers.",
      "Warp a photo to the template using OpenCV.",
      "Read checkbox regions by fill ratio.",
      "Append rows to a sheet and flag low-confidence fields.",
    ],
    challenges: [
      "Handwriting recognition accuracy is poor without human review.",
      "Shadows and creases on phone photos can break checkbox thresholds.",
    ],
  },
  {
    slug: "self-healing-scraper",
    title: "Self-Healing Scraper Selectors",
    summary:
      "When a site redesign breaks your CSS selector, find the same element again using its old context and propose the patch.",
    problem:
      "Scrapers and browser automations die silently whenever a website changes a class name. Maintainers spend hours rediscovering selectors, and monitoring only notices after data has been missing for days.",
    solution:
      "For every selector, store a fingerprint of the target element at the time it worked: its text, tag, attributes, neighboring text and a sentence-transformer embedding of its surrounding DOM. When the selector returns nothing, a Playwright job scores candidate elements on the new page against the fingerprint, picks the best, and opens a pull request with a new selector and a screenshot for human approval.",
    insight:
      "A selector is a brittle path, but an element has a stable identity in its content and context. Store the identity, regenerate the path.",
    category: "automation",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Playwright", "Python", "sentence-transformers", "PostgreSQL", "GitHub API"],
    tags: ["scraping", "maintenance", "playwright", "resilience"],
    audience: "Developers maintaining scrapers or end-to-end tests against sites they do not control.",
    alternatives: [
      "Healenium offers self-healing locators for Selenium tests but targets test suites, not data pipelines.",
      "Hand-maintained selectors with alerting still need a person to find the new one.",
    ],
    mvp: [
      "Capture element fingerprints on successful scrapes.",
      "Detect empty selector results as failures.",
      "Rank candidates on the changed page using text and embedding similarity.",
      "Open a PR with the proposed selector and screenshot.",
    ],
    challenges: [
      "Auto-accepting a wrong match silently corrupts data, so human approval or confidence thresholds are required.",
      "Single-page apps with dynamic content complicate fingerprinting.",
    ],
  },

  // ───────────── design ─────────────
  {
    slug: "oklch-contrast-scale",
    title: "Contrast-Guaranteed Palette Generator From One Brand Color",
    summary:
      "Generate a full color scale in OKLCH where every step pair meets a chosen WCAG contrast ratio by construction, not by checking afterwards.",
    problem:
      "Designers build palettes by eye and then discover that the brand blue fails contrast on its own tinted background. Fixing it means nudging colors and re-checking over and over, and dark mode doubles the work.",
    solution:
      "Given a base color, convert it to OKLCH and generate lightness steps by solving for the lightness at which each step hits a target contrast ratio against anchor colors, adjusting chroma to stay in the sRGB gamut using culori. Output CSS custom properties for light and dark themes plus a table showing which step pairs reach AA or AAA.",
    insight:
      "If contrast is a constraint in the generator, accessibility stops being a review step and becomes a property of the palette.",
    category: "design",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Next.js", "culori", "OKLCH", "Tailwind CSS", "TypeScript"],
    tags: ["color", "accessibility", "design-systems", "css"],
    audience: "Designers and front-end developers building design systems.",
    alternatives: [
      "Radix Colors and Adobe Leonardo offer related ideas but fixed scales or heavier setup.",
      "Tailwind default palettes were not designed around guaranteed pair contrast.",
    ],
    mvp: [
      "Convert a hex input to OKLCH.",
      "Solve lightness per step for target contrast.",
      "Clamp to the sRGB gamut.",
      "Export CSS variables for light and dark.",
    ],
    challenges: [
      "Gamut clipping can shift perceived hue at high chroma.",
      "WCAG 2 contrast ratio is known to be imperfect, and APCA is not yet a standard.",
    ],
  },
  {
    slug: "dark-mode-crawler",
    title: "Dark Mode Auditor That Crawls Your Whole Site",
    summary:
      "A Playwright crawler that loads every page in dark mode and flags unreadable text, glaring white images and invisible icons.",
    problem:
      "Teams add dark mode by flipping tokens, then ship pages where an old component hard-codes #fff, a transparent PNG logo vanishes, or an embedded widget blasts white. QA checks the homepage and nothing else.",
    solution:
      "Crawl the sitemap with Playwright using prefers-color-scheme: dark. On each page, run axe-core contrast checks, find elements whose computed background is near-white inside a dark page, and detect images with transparency whose average luminance matches the background. Produce an HTML report with annotated screenshots grouped by component.",
    insight:
      "Dark mode bugs cluster by component, so grouping findings by the offending selector lets one fix clear dozens of pages.",
    category: "design",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["Playwright", "axe-core", "TypeScript", "Sharp", "GitHub Actions"],
    tags: ["dark-mode", "qa", "accessibility", "crawler"],
    audience: "Front-end teams supporting light and dark themes on content-heavy sites.",
    alternatives: [
      "Lighthouse and axe run per page and do not specifically hunt dark-mode regressions.",
      "Visual regression tools like Percy require baselines for every page.",
    ],
    mvp: [
      "Crawl sitemap URLs in dark color scheme.",
      "Run axe contrast checks.",
      "Detect bright background elements.",
      "Group issues by selector in a report.",
    ],
    challenges: [
      "Images and canvases need pixel analysis, which is slow at scale.",
      "Pages with consent banners or logins require scripted setup.",
    ],
  },
  {
    slug: "layout-shift-replay",
    title: "Layout Shift Replay From Real User Sessions",
    summary:
      "Capture the layout-shift events users actually experience, tie each to a DOM element, and replay it visually to find what moved.",
    problem:
      "Cumulative Layout Shift scores in Search Console tell you a page is bad but not which element jumped, when, or why. Lab tests on a fast laptop never reproduce the shift caused by a late-loading ad or a font swap on a slow phone.",
    solution:
      "A small snippet uses PerformanceObserver for layout-shift entries and records the source nodes with their before and after rects, plus rrweb events around each shift. Data goes to ClickHouse, and a dashboard ranks selectors by total shift contributed across sessions, with a replay overlay highlighting the moving box in a recorded session.",
    insight:
      "CLS is a sum over specific elements. Attributing it to selectors turns a vague score into a short to-do list.",
    category: "design",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["PerformanceObserver", "rrweb", "ClickHouse", "TypeScript", "Next.js", "Web Vitals"],
    tags: ["performance", "cls", "ux", "observability"],
    audience: "Front-end engineers and designers responsible for page stability.",
    alternatives: [
      "web-vitals attribution shows the largest shift source but not aggregated across sessions with replay.",
      "Full session replay tools capture video but do not rank layout shifts.",
    ],
    mvp: [
      "Collect layout-shift entries with source selectors.",
      "Send batches with beacon requests.",
      "Aggregate by selector in ClickHouse.",
      "Show a top-offender list with example sessions.",
    ],
    challenges: [
      "Session replay raises privacy issues; mask all text by default.",
      "Layout-shift source data is only available in Chromium-based browsers.",
    ],
  },

  // ───────────── social-impact ─────────────
  {
    slug: "tenant-repair-log",
    title: "Tenant Repair Log With Timestamped Evidence",
    summary:
      "Record each repair request, photo and landlord reply in a tamper-evident log, and export it as a dated letter pack.",
    problem:
      "When a heater breaks in January, tenants phone, text and email, then cannot prove when they first reported it. Housing advice organizations repeatedly say that a dated paper trail is the most useful evidence, but tenants rarely keep one.",
    solution:
      "An offline-capable PWA lets a tenant log an issue with photos, dates and how it was reported. Each entry is hashed and chained to the previous one so later edits are visible, and the app generates a PDF letter and timeline using templates adapted to a chosen jurisdiction, reviewed by a local tenants' union before release.",
    insight:
      "Legal remedies depend on documentation tenants did not know they needed. The tool's job is making a good record the default.",
    category: "social-impact",
    difficulty: "beginner",
    buildTime: "1–2 weeks",
    stack: ["Next.js", "IndexedDB", "Web Crypto API", "jsPDF", "PWA"],
    tags: ["housing", "documentation", "tenants", "pwa"],
    audience: "Renters dealing with slow or ignored repair requests.",
    alternatives: [
      "Generic note apps lack structure and dated, exportable evidence.",
      "Tenant union templates exist as documents but are not connected to a log.",
    ],
    mvp: [
      "Add issue entries with photos and dates.",
      "Chain entries with SHA-256 hashes.",
      "Generate a timeline PDF.",
      "Provide a letter template for one region.",
    ],
    challenges: [
      "Legal requirements differ by place, so local legal review is needed before shipping.",
      "A hash chain proves order within the app but is not a legal notarization.",
    ],
  },
  {
    slug: "food-pantry-sms-board",
    title: "Food Pantry Stock Board Updated by SMS",
    summary:
      "Volunteers text what just arrived, and a public page tells neighbors what is on the shelves today, no app or login required.",
    problem:
      "People make long trips to a food pantry only to find the item they need, such as baby formula or halal meat, is out of stock. Pantry volunteers are busy and not going to maintain a website.",
    solution:
      "A volunteer texts something like formula 12 to a Twilio number. A small parser updates counts in SQLite, and a mobile-friendly public page lists categories as plentiful, low or out, with an updated timestamp. Admins can add item names and edit thresholds through a simple dashboard.",
    insight:
      "The best interface for tired volunteers is the one they already use. SMS has near-zero training cost and works on any phone.",
    category: "social-impact",
    difficulty: "intermediate",
    buildTime: "2 weeks",
    stack: ["Twilio SMS", "Next.js", "SQLite", "Drizzle ORM", "Cloudflare Pages"],
    tags: ["food-security", "sms", "community", "nonprofit"],
    audience: "Food pantries and community fridges, plus the neighbors who depend on them.",
    alternatives: [
      "Food bank locators list hours but not live inventory.",
      "Facebook posts reach followers but are not structured or searchable.",
    ],
    mvp: [
      "Receive and parse inbound SMS counts.",
      "Store item levels with timestamps.",
      "Render a public stock page.",
      "Add an admin page for managing item names.",
    ],
    challenges: [
      "SMS costs and number registration rules can be a barrier for small nonprofits.",
      "Out-of-date info is worse than none, so timestamps and stale warnings matter.",
    ],
  },
  {
    slug: "offline-mesh-notice-board",
    title: "Offline Mesh Notice Board for Disaster Response",
    summary:
      "A store-and-forward bulletin board that runs over Meshtastic LoRa radios, so neighbors can share needs and offers when cell towers are down.",
    problem:
      "After floods, storms or earthquakes, cellular networks are often congested or down for days. People need to post where water is, who is injured and which roads are blocked, but messaging apps depend on the internet.",
    solution:
      "Build an Android app that talks to Meshtastic nodes over Bluetooth. Instead of chat, it presents categorized posts such as need, offer and hazard, each with a location and expiry. Nodes rebroadcast posts they have not yet seen, and a gateway node with a satellite or restored uplink can sync a summary to a central site for responders.",
    insight:
      "In a disaster the useful unit is a durable, geotagged post that others can find later, not a message that scrolls away.",
    category: "social-impact",
    difficulty: "advanced",
    buildTime: "3–4 months",
    stack: ["Meshtastic", "LoRa", "ESP32", "Android", "Kotlin", "Protocol Buffers"],
    tags: ["disaster-response", "mesh", "lora", "offline"],
    audience: "Community emergency teams and neighborhoods in disaster-prone areas.",
    alternatives: [
      "Briar and Bridgefy provide offline messaging but are chat-oriented and have limited range without radios.",
      "Meshtastic's own app handles messages but not structured needs and offers.",
    ],
    mvp: [
      "Connect to a Meshtastic node over Bluetooth.",
      "Define a compact post schema with type, location and expiry.",
      "Display posts on an offline map.",
      "Deduplicate and rebroadcast posts across nodes.",
    ],
    challenges: [
      "LoRa bandwidth is tiny, so message formats must be extremely compact.",
      "Misinformation and spam are harder to moderate without servers.",
      "Needs real drills with emergency teams before anyone relies on it.",
    ],
  },

  // ───────────── experimental ─────────────
  {
    slug: "git-history-sonifier",
    title: "Sonify Your Git History",
    summary:
      "Turn a repository's commit log into generative music, where commit size, author and time of day pick pitch, instrument and rhythm.",
    problem:
      "Code history is a vast dataset nobody listens to or looks at after the fact. Visualizations like gource are fun but you have to watch them, and patterns such as crunch-time commits are invisible until you see them.",
    solution:
      "Parse commits with isomorphic-git in the browser and map each one to a note with Tone.js: lines changed set duration and pitch, author picks the instrument, and time of day sets the timbre. Playing a year of commits in two minutes lets you hear bursts, quiet weeks and late-night crunch. Export the result as a WAV.",
    insight:
      "Hearing exposes rhythm in data that charts hide, such as the exact tempo of a release cycle.",
    category: "experimental",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Web Audio API", "Tone.js", "isomorphic-git", "TypeScript", "Vite"],
    tags: ["sonification", "generative-music", "git", "creative-coding"],
    audience: "Creative coders and teams who like unusual views of their own work.",
    alternatives: [
      "Gource animates repository history visually but without sound.",
      "GitHub contribution graphs only show daily counts.",
    ],
    mvp: [
      "Load a public repo's commits through the GitHub API.",
      "Map commit attributes to notes.",
      "Play the sequence with Tone.js.",
      "Add controls for speed and key.",
    ],
    challenges: [
      "Making it sound pleasant requires constraining notes to a musical scale.",
      "Large histories need sampling to stay listenable.",
    ],
  },
  {
    slug: "webgpu-rule-table-automata",
    title: "WebGPU Cellular Automata Lab With an Editable Rule Table",
    summary:
      "A browser playground where you edit a neighborhood rule table and watch millions of cells evolve in real time on the GPU.",
    problem:
      "Cellular automata are a great way to build intuition for emergence, but most demos are fixed to Conway's Life and run on the CPU. Changing the rule means editing code, and large grids are slow.",
    solution:
      "Implement the simulation as a WebGPU compute shader in WGSL with ping-pong textures. A UI exposes a lookup table for birth/survival conditions, multiple states and neighborhood shapes; editing a cell in the table instantly updates a uniform buffer. Rule sets can be shared as a compact URL hash and randomly mutated to discover new behaviors.",
    insight:
      "Making the rule the editable object, rather than the code, turns emergence from a lecture into a toy people explore for hours.",
    category: "experimental",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["WebGPU", "WGSL", "TypeScript", "Vite"],
    tags: ["webgpu", "emergence", "creative-coding", "simulation"],
    audience: "Curious programmers, educators and artists interested in complexity.",
    alternatives: [
      "Golly and online Life simulators run known rule families but offer limited interactive rule editing.",
      "Shadertoy shows GPU effects but is not designed around editable automata.",
    ],
    mvp: [
      "Render a grid with a ping-pong compute shader.",
      "Support a binary-state rule table.",
      "Add a UI for editing rules and sharing via URL.",
      "Add a mutate button for rule discovery.",
    ],
    challenges: [
      "WebGPU is not available in every browser yet, so a WebGL fallback or clear messaging is needed.",
      "Most random rules are boring, so a way to score interesting rules helps.",
    ],
  },
  {
    slug: "ultrasonic-room-positioning",
    title: "Phone-to-Phone Positioning With Inaudible Chirps",
    summary:
      "Phones emit near-ultrasound chirps and measure arrival times to estimate each other's positions in a room, no extra hardware.",
    problem:
      "GPS fails indoors and Bluetooth signal strength is too noisy for meter-level positioning. Games, classroom activities and shared AR experiences in a single room need to know who is standing where without installing beacons.",
    solution:
      "Each phone plays a unique frequency-swept chirp around 18 to 20 kHz through its speaker at a time coordinated over WebRTC data channels. Others record with the microphone, use cross-correlation to find arrival times, and estimate pairwise distances. A multilateration solver combines distances into a 2D map shown in the browser.",
    insight:
      "Sound travels slowly enough that ordinary phone audio hardware can measure distances, a fact sonar has used for a century.",
    category: "experimental",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["Web Audio API", "WebRTC", "Cross-correlation", "TypeScript", "WASM FFT"],
    tags: ["acoustics", "positioning", "webrtc", "signal-processing"],
    audience: "Researchers, educators and game designers working with co-located devices.",
    alternatives: [
      "Bluetooth RSSI positioning is noisy and varies with phone orientation.",
      "UWB offers precise ranging but only on a limited set of phones.",
    ],
    mvp: [
      "Play and detect a chirp between two phones.",
      "Estimate time of arrival with cross-correlation and a shared clock offset.",
      "Compute a pairwise distance.",
      "Extend to three or more phones and draw a map.",
    ],
    challenges: [
      "Phone speakers and microphones attenuate near-ultrasound differently, and some filter it entirely.",
      "Clock synchronization and audio latency variance dominate the error budget.",
      "Echoes cause false correlation peaks.",
    ],
  },

  // ───────────── open-source ─────────────
  {
    slug: "real-difficulty-issue-finder",
    title: "Good First Issues Ranked by Real Difficulty",
    summary:
      "Estimate how hard an open issue really is from the files and lines touched by similar past fixes, instead of trusting a label.",
    problem:
      "Newcomers filter by good first issue, pick one that looks small, and discover it requires touching the build system and three subsystems. Labels are applied by maintainers with different standards, so the first contribution ends in frustration.",
    solution:
      "Use the GitHub GraphQL API to collect closed issues and the pull requests that fixed them. For each, record the files changed, lines changed and review rounds. Embed issue text, and for an open issue find the nearest past issues to predict a likely change size and files, then show a ranked list with expected diff size and the maintainers who reviewed similar changes.",
    insight:
      "Past pull requests are a record of how hard similar work turned out to be, which is more honest than any label.",
    category: "open-source",
    difficulty: "beginner",
    buildTime: "1–2 weeks",
    stack: ["Python", "GitHub GraphQL API", "SQLite", "sentence-transformers", "Streamlit"],
    tags: ["contributing", "github", "onboarding", "triage"],
    audience: "Developers making their first open-source contributions.",
    alternatives: [
      "goodfirstissue.dev and up-for-grabs list labeled issues without estimating effort.",
      "Maintainer-written CONTRIBUTING files describe process but not issue size.",
    ],
    mvp: [
      "Fetch closed issues linked to merged pull requests for one repository.",
      "Compute diff size and files touched per issue.",
      "Embed issues and find nearest neighbors for open ones.",
      "Rank open issues by predicted size.",
    ],
    challenges: [
      "Linking issues to fixing PRs reliably requires careful parsing.",
      "Small repos lack enough history for good predictions.",
    ],
  },
  {
    slug: "dependency-orphan-radar",
    title: "Dependency Orphan Radar",
    summary:
      "Scan your lockfile for packages maintained by one person who has gone quiet, so you can fund, fork or replace them before they break.",
    problem:
      "Critical dependencies often hang on a single maintainer. When that person burns out or disappears, security fixes stop, and projects find out only when a vulnerability lands with no one to patch it.",
    solution:
      "A GitHub Action reads package-lock.json or Cargo.lock, queries the deps.dev API and the GitHub API for each package, and scores risk by factors such as number of recent committers, days since last release, unresolved security issues and bus factor in the commit history. The report lists top at-risk dependencies with suggested alternatives and a link to sponsor the maintainer.",
    insight:
      "Supply-chain risk is also a human sustainability problem, and bus factor is computable from public commit history.",
    category: "open-source",
    difficulty: "intermediate",
    buildTime: "2–3 weeks",
    stack: ["TypeScript", "deps.dev API", "GitHub REST API", "GitHub Actions", "SQLite"],
    tags: ["supply-chain", "maintainers", "dependencies", "risk"],
    audience: "Engineering teams and open-source funders who rely on third-party packages.",
    alternatives: [
      "OpenSSF Scorecard measures practices but not maintainer concentration across your tree.",
      "Dependabot alerts on known vulnerabilities, not on abandonment risk.",
    ],
    mvp: [
      "Parse a lockfile and resolve each repository.",
      "Compute contributor concentration from recent commits.",
      "Calculate days since last release.",
      "Output a ranked Markdown report in CI.",
    ],
    challenges: [
      "Stable, finished libraries look inactive but are fine, so thresholds need context.",
      "Mapping packages to source repositories is not always possible.",
    ],
  },
  {
    slug: "docs-example-runner",
    title: "Docs Example Runner That Catches Code Rot",
    summary:
      "Extract every code block from your documentation, run it in a sandbox in CI, and fail the build when an example no longer works.",
    problem:
      "Documentation examples quietly rot. A function is renamed, a flag is removed, and the README snippet that every new user copies first now errors. Maintainers only learn from angry issues.",
    solution:
      "Parse Markdown with remark, find fenced blocks tagged with a runnable annotation, and execute them in per-language containers using gVisor or Docker with network disabled. Blocks can declare expected output, setup fixtures and hidden prelude code. The runner reports failures with file and line number as GitHub annotations.",
    insight:
      "Docs are code that nobody compiles. Compiling them in CI turns documentation drift from an invisible problem into a red build.",
    category: "open-source",
    difficulty: "advanced",
    buildTime: "1–2 months",
    stack: ["Go", "remark", "Docker", "gVisor", "GitHub Actions"],
    tags: ["documentation", "ci", "testing", "sandbox"],
    audience: "Maintainers of libraries, CLIs and APIs with extensive tutorials.",
    alternatives: [
      "Rust doctests and Python doctest do this within a single language only.",
      "Jupyter-based docs run cells but are tied to notebooks.",
    ],
    mvp: [
      "Extract annotated code blocks from Markdown.",
      "Run Python and shell blocks in Docker with a timeout.",
      "Compare stdout to expected output.",
      "Post failures as GitHub annotations.",
    ],
    challenges: [
      "Examples needing credentials, services or randomness are hard to make deterministic.",
      "Sandboxing untrusted code from pull requests is a real security concern.",
    ],
  },

  // ───────────── everyday ─────────────
  {
    slug: "leftover-clock-qr",
    title: "Leftover Clock: QR Stickers That Remember When You Cooked",
    summary:
      "Stick a QR label on each container, scan to start its timer, and scan again later to see how old the food is.",
    problem:
      "Is this chili from Sunday or last Wednesday? People throw out good food out of doubt or eat something past its time. Writing dates on masking tape works but is hardly ever done consistently.",
    solution:
      "Print sheets of QR stickers, each with a unique ID. Scanning one with the phone camera opens a PWA that asks what it is and starts a clock with a sensible default shelf life for the food type. Scanning again shows the item's age, a safe-until date and a one-tap throw-out or eaten mark, with data stored locally.",
    insight:
      "The hard part of food-waste tracking is the data entry. A sticker turns it into a single scan at the moment you put the lid on.",
    category: "everyday",
    difficulty: "beginner",
    buildTime: "1 weekend",
    stack: ["Next.js", "PWA", "qrcode", "IndexedDB", "BarcodeDetector API"],
    tags: ["food-waste", "kitchen", "qr-codes", "pwa"],
    audience: "Households that meal-prep or cook in batches.",
    alternatives: [
      "Fridge inventory apps need constant manual entry of groceries.",
      "Date-label stickers rely on handwriting and memory of the rule.",
    ],
    mvp: [
      "Generate printable QR sticker sheets.",
      "Start a timer on first scan with a food type.",
      "Show age and safe-until on later scans.",
      "List current items sorted by age.",
    ],
    challenges: [
      "Shelf-life defaults must be conservative and sourced from food safety guidance.",
      "Stickers need to survive dishwashers and cold.",
    ],
  },
  {
    slug: "parking-sign-decoder",
    title: "Parking Sign Decoder for One Confusing City",
    summary:
      "Photograph a stack of parking signs and get a plain answer: can I park here right now, and until when?",
    problem:
      "Stacked signs with hours, days, exceptions and permit zones are genuinely hard to read, and getting it wrong costs a ticket or a tow. Maps apps show where parking exists but rarely interpret the rules on the pole.",
    solution:
      "Pick one city and encode its sign grammar (time ranges, days, permit zones, street cleaning) as a rule engine. PaddleOCR reads each sign in a photo, a parser turns lines into structured rules, and the engine evaluates them against the current time and local holidays to display a green, amber or red answer with a countdown and the rule text for verification.",
    insight:
      "Narrowing to one jurisdiction makes an impossible general problem a tractable parsing task, and the proof is the rule shown next to the answer.",
    category: "everyday",
    difficulty: "intermediate",
    buildTime: "1–2 months",
    stack: ["PaddleOCR", "TypeScript", "React Native", "Rule engine", "Open data holidays"],
    tags: ["parking", "ocr", "city", "rules"],
    audience: "Drivers in dense cities with complicated street parking rules.",
    alternatives: [
      "ParkMobile and SpotHero handle paying and finding parking but not interpreting posted signs.",
      "Google Maps lists some restrictions but is often incomplete or outdated.",
    ],
    mvp: [
      "Collect 50 sign photos from one city.",
      "Parse time ranges and days into structured rules.",
      "Evaluate against the current time.",
      "Show the verdict with the original sign text.",
    ],
    challenges: [
      "Sign layouts and exceptions are inconsistent even within a city.",
      "A wrong answer costs the user money, so uncertainty must be shown clearly.",
    ],
  },
  {
    slug: "receipt-return-window-vault",
    title: "Return-Window Vault: Forward a Receipt, Get a Reminder",
    summary:
      "Forward any order confirmation to a private address and get a reminder before the return window or warranty closes.",
    problem:
      "People buy things online, put them in a closet, and discover the thirty-day return window ended last week. Warranty details live in email threads that are impossible to find when a product fails a year later.",
    solution:
      "Give each user an inbound address handled by Postmark. The service parses the email with a mix of schema.org order markup, templates for large retailers and an LLM fallback to extract merchant, items, price, order date and policy, then looks up the merchant's return policy from a curated table. It stores everything in Postgres and sends reminders and an ICS calendar feed with return deadlines.",
    insight:
      "Forwarding an email is the lowest-friction capture there is, and the value arrives weeks later as a reminder at exactly the right moment.",
    category: "everyday",
    difficulty: "advanced",
    buildTime: "2–3 months",
    stack: ["Postmark Inbound", "PostgreSQL", "Next.js", "schema.org Order markup", "ICS", "LLM extraction"],
    tags: ["receipts", "email", "reminders", "warranty"],
    audience: "Online shoppers who regularly miss return deadlines.",
    alternatives: [
      "Gmail Purchases and Shop app track orders but not return deadlines or warranties.",
      "Manual calendar reminders are rarely created.",
    ],
    mvp: [
      "Receive forwarded emails at a per-user address.",
      "Extract order data using schema.org markup, falling back to an LLM.",
      "Attach a return window from a table for ten big retailers.",
      "Send a reminder email and publish an ICS feed.",
    ],
    challenges: [
      "Retailer return policies change and vary by product, so the table needs maintenance.",
      "Order emails contain personal data, requiring careful storage and deletion policies.",
    ],
  },
];
