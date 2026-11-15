export type ChallengeKind =
  | "problem-first"
  | "what-would-you-build"
  | "connect-the-dots"
  | "constraint"
  | "reverse-engineer";

export interface Challenge {
  slug: string;
  kind: ChallengeKind;
  title: string;
  prompt: string;
  hints: string[];
  perspectives: { title: string; body: string }[];
  conceptA?: string;
  conceptB?: string;
  constraints?: string[];
  product?: string;
  questions?: string[];
  category: string;
}

const RE_QUESTIONS = [
  "What problem did it originally solve?",
  "What was the original insight?",
  "How does the user experience reinforce it?",
  "What is the business model?",
  "What would you improve?",
];

export const CHALLENGES: Challenge[] = [
  // ───────────── problem-first (10) ─────────────
  {
    slug: "pf-lost-in-the-hospital-corridor",
    kind: "problem-first",
    title: "The Waiting Room Blackout",
    prompt:
      "A family sits in a surgical waiting room for six hours. A nurse comes out every so often and calls a name, but the family cannot tell if a delay means trouble or routine. Meanwhile their phones are dying and no one dares to leave for food. Design something that would change what those six hours feel like.",
    hints: [
      "Who holds the information that would calm them, and why is it not shared?",
      "Think about what the family can do, not only what they can know.",
      "Consider the hospital's constraints: privacy law, staff time, no one wanting to promise outcomes.",
    ],
    perspectives: [
      {
        title: "A coarse status board",
        body: "Surgical teams tap one of five stages (prepped, in progress, closing, recovery, family consult) on a tablet, and families see a code-based status on a lobby screen. It reveals no medical detail but removes the dread of silence.",
      },
      {
        title: "Free the family from the room",
        body: "A pager-style device or SMS link lets the family go eat or walk outside and be summoned within minutes. The problem becomes logistics rather than information.",
      },
      {
        title: "Give them a job",
        body: "Provide the room with charging, a quiet map of nearby food, and a way to leave a note for the patient. The insight is that waiting feels shorter when people can act.",
      },
    ],
    category: "healthcare",
  },
  {
    slug: "pf-the-ten-year-old-photo-library",
    kind: "problem-first",
    title: "The 40,000-Photo Attic",
    prompt:
      "A grandmother has 40,000 photos across four phones, two dead laptops and a shoebox of prints. She wants her grandchildren to see the story of the family, but nobody, including her, can remember who is in most pictures or where they were taken. The people who could tell the stories are getting older. What would you build around this?",
    hints: [
      "Where does the identifying knowledge live right now, and when is it easiest to extract?",
      "Maybe the photos are the wrong starting point.",
      "Think about who else in the family is willing to help and under what conditions.",
    ],
    perspectives: [
      {
        title: "Narrate-to-tag sessions",
        body: "A tablet shows one photo at a time while she talks; speech-to-text captures names, places and stories as metadata. Low effort per photo makes the knowledge capture feasible.",
      },
      {
        title: "Crowdsource the family",
        body: "Send relatives a small batch of unidentified photos and ask only who is this. A simple game-like interface turns a monolithic chore into five-minute contributions.",
      },
      {
        title: "Curate, do not archive",
        body: "Instead of organizing everything, pick the best 200 photos and build a story around them. The real need is meaning, not completeness.",
      },
    ],
    category: "everyday",
  },
  {
    slug: "pf-the-substitute-teacher-day",
    kind: "problem-first",
    title: "The Substitute Teacher Scramble",
    prompt:
      "A teacher wakes with a fever at 6 a.m. She has to write a lesson plan for a class she cannot see, find where the handouts are, explain the seating chart and warn about the one student who needs a quiet corner. The substitute arrives knowing nothing and the day is mostly lost. What breaks in this situation, and what would you make?",
    hints: [
      "What knowledge does the teacher hold that is never written down?",
      "How much of this could be prepared on a healthy Tuesday in March?",
      "Who else in the building knows part of the answer?",
    ],
    perspectives: [
      {
        title: "A permanent sub binder, digitized",
        body: "Teachers fill a structured template once a term: routines, seating, medical alerts, emergency plans. A single link plus a short custom note on sick days gets a substitute oriented in minutes.",
      },
      {
        title: "Reusable lesson skeletons",
        body: "A library of low-prep activities keyed to subject and age lets a teacher choose one in 30 seconds and attach the class list.",
      },
      {
        title: "Neighbor-teacher handoff",
        body: "Match each teacher with a nearby colleague who receives the plan and acts as a point of contact. The tool formalizes the informal help that already exists.",
      },
    ],
    category: "education",
  },
  {
    slug: "pf-the-invisible-night-shift",
    kind: "problem-first",
    title: "The 3 a.m. Cafeteria",
    prompt:
      "Night-shift nurses, warehouse pickers and bus drivers need a real meal at 3 a.m., but the only open options are a vending machine and a gas station. They eat badly, sleep badly and say they hate it. Every food business is closed exactly when they need one. What do you do about it?",
    hints: [
      "Is the problem food, timing, or discovery?",
      "Who already has a kitchen that is empty at this hour?",
      "Consider economics: why has no one served this market?",
    ],
    perspectives: [
      {
        title: "Pre-order a shift meal",
        body: "Let workers order mid-evening for pickup or locker delivery at break time. Demand aggregated per workplace lets a kitchen cook once in volume.",
      },
      {
        title: "Use the idle kitchens",
        body: "Restaurants and community kitchens sit empty overnight; renting them for batch cooking converts a fixed cost into revenue and avoids building anything new.",
      },
      {
        title: "Make it a workplace benefit",
        body: "Sell to the employer rather than the worker. A hospital or warehouse that funds fresh food at 3 a.m. gets less turnover and fewer errors, which changes who pays.",
      },
    ],
    category: "everyday",
  },
  {
    slug: "pf-the-landlord-who-never-calls-back",
    kind: "problem-first",
    title: "Nobody Told the Plumber the Door Code",
    prompt:
      "A small landlord with eleven units juggles contractors who need access, tenants who work odd hours and a spare key that lives in a kitchen drawer. Last month a plumber waited forty minutes outside a locked unit, a tenant got annoyed, and the landlord paid for a wasted visit. What is actually going wrong, and how would you fix it?",
    hints: [
      "Name every person who has to be in the same place at the same time.",
      "What would need to be true for a visit to happen without coordination?",
      "Think about trust: who is comfortable giving access to whom?",
    ],
    perspectives: [
      {
        title: "Time-boxed digital access",
        body: "A smart lock issues a temporary code valid for the plumber's two-hour window, logged and revoked automatically. It removes the key handoff and the wait.",
      },
      {
        title: "A scheduling link for tenants",
        body: "Tenants choose from landlord-approved windows, and the contractor sees only confirmed ones. Coordination becomes self-serve rather than a chain of calls.",
      },
      {
        title: "Reduce the number of visits",
        body: "A better intake form with photos and descriptions means the plumber arrives with the right parts, so the problem shrinks before scheduling even begins.",
      },
    ],
    category: "everyday",
  },
  {
    slug: "pf-the-open-source-maintainer-inbox",
    kind: "problem-first",
    title: "Four Hundred Notifications and One Real Bug",
    prompt:
      "A volunteer maintains a popular library at night after a full-time job. Each morning there are 400 notifications: duplicate issues, questions answered in the docs, a few thank-yous and perhaps one real bug report. Missing that one costs users and reputation, but reading everything costs the maintainer's evenings. What would you give this person?",
    hints: [
      "What makes a bug report real, and can that be checked cheaply?",
      "Does the maintainer need fewer notifications, or better ones?",
      "What does the reporter know that never makes it into the issue?",
    ],
    perspectives: [
      {
        title: "Reproduce before it arrives",
        body: "A guided issue form requires a minimal reproduction, and a bot tries to run it. Issues that reproduce rise to the top and the rest get a helpful automatic reply.",
      },
      {
        title: "Duplicate detection with kindness",
        body: "Match new issues against old ones and docs and reply with the likely answer, while keeping a one-click path to reopen if it is wrong.",
      },
      {
        title: "Protect the maintainer's attention",
        body: "A daily digest that shows only high-signal items, with the rest batched weekly, treats attention as the scarce resource rather than the inbox.",
      },
    ],
    category: "open-source",
  },
  {
    slug: "pf-the-lonely-first-month",
    kind: "problem-first",
    title: "The First Month in a New Country",
    prompt:
      "A nurse moves to a new country for work. She has a visa, a job and a flat but no friends, no idea how to open a bank account without a credit history, no way to read most letters from the government and a growing list of tiny tasks that each take a day. Everyone says it gets easier. What would you make for her first thirty days?",
    hints: [
      "Which tasks are blocked behind other tasks?",
      "Who has solved this exact problem a year ago?",
      "Think about the emotional experience as much as the checklist.",
    ],
    perspectives: [
      {
        title: "A dependency-aware checklist",
        body: "Show the order: you need an address before a bank account, a bank account before a phone contract. The map of dependencies saves her days of dead ends.",
      },
      {
        title: "Match with a recent arrival",
        body: "Pair her with someone who arrived 6 to 12 months ago from the same sector. Fresh memory beats expert advice.",
      },
      {
        title: "Translate the letters",
        body: "A camera-based tool that explains what an official letter is asking, the deadline and the likely next action targets the most anxiety-inducing moments.",
      },
    ],
    category: "social-impact",
  },
  {
    slug: "pf-the-wasted-greenhouse-heat",
    kind: "problem-first",
    title: "The Greenhouse That Cooks at Noon and Freezes at 4 a.m.",
    prompt:
      "A small market gardener has a greenhouse where midday temperatures reach levels that stress the plants, while nights drop near freezing. She opens vents by hand when she remembers and relies on a cheap thermometer. Last spring a cold night killed a tray of seedlings worth a month of income. What would you build to help her?",
    hints: [
      "What are the two failure modes, and are they equally costly?",
      "Is the answer more sensing, more actuation, or better heat storage?",
      "She cannot afford an industrial climate controller.",
    ],
    perspectives: [
      {
        title: "Cheap automation of vents",
        body: "A temperature-driven wax-cylinder opener or an ESP32 with a linear actuator opens vents without electricity-hungry control, removing human memory from the loop.",
      },
      {
        title: "Frost alert first",
        body: "Because a cold night is the expensive failure, a sensor that texts at 2 degrees above freezing gives her time to cover plants or light a heater.",
      },
      {
        title: "Thermal mass",
        body: "Water barrels or stone absorb heat by day and release it at night, flattening the swing with no electronics. Sometimes the best product is a design pattern.",
      },
    ],
    category: "sustainability",
  },
  {
    slug: "pf-the-contract-nobody-reads",
    kind: "problem-first",
    title: "Signing 14 Pages You Cannot Parse",
    prompt:
      "A freelance illustrator is sent a 14-page contract by a client and has an afternoon to sign it or lose the job. She cannot afford a lawyer for every gig, and she does not know which clauses matter: who owns the artwork, what happens if the client cancels, whether payment is net-30 or net-90. She signs, and regrets it later. What would you build for her?",
    hints: [
      "What are the five questions she actually needs answered?",
      "What is the cost of a wrong answer versus the cost of delay?",
      "Think about what you should not do, since liability matters.",
    ],
    perspectives: [
      {
        title: "A clause highlighter with plain-language questions",
        body: "Extract the handful of terms that matter to freelancers (payment timing, IP ownership, kill fee, revision limits) and show them next to a plain explanation, without giving legal advice.",
      },
      {
        title: "Counter-offer templates",
        body: "Once a risky clause is found, supply tested wording she can paste into an email to negotiate. The action matters more than the analysis.",
      },
      {
        title: "Start from her contract",
        body: "A better option is a short, fair contract she sends first, flipping the dynamic so she is no longer reviewing the other side's document.",
      },
    ],
    category: "startups",
  },
  {
    slug: "pf-the-student-who-studies-wrong",
    kind: "problem-first",
    title: "Highlighting Is Not Studying",
    prompt:
      "A first-year student spends hours rereading and highlighting before exams and still blanks on questions. She is not lazy; she believes she is studying effectively because everything feels familiar. Nobody has ever shown her another way, and the lecture on study skills in week one was forgotten by week two. What do you make?",
    hints: [
      "Why does familiarity feel like knowledge?",
      "At what moment would she be receptive to changing her habits?",
      "Behavior change usually needs feedback, not information.",
    ],
    perspectives: [
      {
        title: "Turn her notes into questions",
        body: "Convert highlighted passages into quiz prompts so the same effort becomes retrieval practice. She keeps her workflow and the method changes underneath.",
      },
      {
        title: "Show her the gap",
        body: "A short pre-test before and after rereading reveals how much she actually knows, and the contrast between confidence and score is the persuasion.",
      },
      {
        title: "Schedule the forgetting",
        body: "A tool that spaces reviews across days automatically means the better method requires no discipline to start.",
      },
    ],
    category: "education",
  },

  // ───────────── what-would-you-build (10) ─────────────
  {
    slug: "wwyb-bus-gps-open-data",
    kind: "what-would-you-build",
    title: "A City Opens Its Live Bus Positions",
    prompt:
      "Your city publishes the real-time GPS position of every bus as open data, updated every ten seconds, along with the schedule. The official app is mediocre. You have a weekend and one friend who can do design. What would you build with this feed?",
    hints: [
      "What decision does a rider make that the official app does not support?",
      "Think beyond the rider: drivers, planners, shop owners, journalists.",
      "Which of these only works because the data is live rather than scheduled?",
    ],
    perspectives: [
      {
        title: "A reliability scoreboard",
        body: "Compare scheduled to actual arrivals per route and publish which lines are actually dependable. It gives riders and advocates evidence.",
      },
      {
        title: "Last-minute leave-now alerts",
        body: "A push alert saying your bus is 6 minutes away, so leave now, is a narrower and more useful product than a map.",
      },
      {
        title: "Planner's tool for bunching",
        body: "Detect buses bunched together and quantify wasted capacity. The customer is the transit agency, which can act on it.",
      },
    ],
    category: "social-impact",
  },
  {
    slug: "wwyb-four-dollar-wifi-chip",
    kind: "what-would-you-build",
    title: "A Four-Dollar Wi-Fi Microcontroller",
    prompt:
      "You can buy an ESP32 board for about four dollars: Wi-Fi, Bluetooth, a few sensors worth of pins and months of battery life in deep sleep. Imagine you buy fifty of them. What do you build that would have been absurd to attempt ten years ago?",
    hints: [
      "Cheap enough to be disposable changes which problems are worth solving.",
      "Fifty devices is a different design space than one device.",
      "Consider things you would rather leave outside than check yourself.",
    ],
    perspectives: [
      {
        title: "Dense sensing",
        body: "Instead of one thermometer in the house, put a node in every cupboard, drawer and crawl space, and learn where damp or drafts start.",
      },
      {
        title: "Tags for things, not people",
        body: "Attach a node to a ladder, a bike or a suitcase. The product is knowing where tools are, not collecting data.",
      },
      {
        title: "Mesh of tiny community instruments",
        body: "Fifty nodes spread across a neighborhood measuring air quality or noise create public data that no agency has.",
      },
    ],
    category: "hardware",
  },
  {
    slug: "wwyb-whisper-on-a-phone",
    kind: "what-would-you-build",
    title: "Speech Recognition Now Runs Fully On a Phone",
    prompt:
      "Models like Whisper can transcribe speech accurately on a mid-range phone with no internet connection and no data leaving the device. For the first time, a product can hear everything and send nothing. What would you build that was previously too private, too expensive or too offline to exist?",
    hints: [
      "Where do people refuse to be recorded because of where the data goes?",
      "Which places have no signal?",
      "Think about high-volume, low-value audio that is too costly to send to a server.",
    ],
    perspectives: [
      {
        title: "Private professional dictation",
        body: "Doctors, lawyers and social workers need notes about conversations they cannot upload anywhere. On-device transcription makes the first version legal.",
      },
      {
        title: "Field interviews in the middle of nowhere",
        body: "Researchers and journalists record in remote areas and get searchable transcripts at once, with no wait for a connection.",
      },
      {
        title: "Always-on personal memory",
        body: "A diary of everything you said and heard, searchable and entirely local. The design challenge is consent for the other people recorded.",
      },
    ],
    category: "ai-ml",
  },
  {
    slug: "wwyb-ten-thousand-scanned-menus",
    kind: "what-would-you-build",
    title: "A Library of 10,000 Digitized Historic Menus",
    prompt:
      "A public library has digitized 10,000 restaurant menus from the 1850s to the 1990s, with dates, prices and dish names, all in the public domain. You can search the text. What would you build with this corpus that a historian, a chef or a curious teenager would love?",
    hints: [
      "Prices over time carry information about wages and inflation.",
      "A dish is a trace of migration, technology and taste.",
      "What would make someone share what they found?",
    ],
    perspectives: [
      {
        title: "How much dinner cost",
        body: "Normalize prices to hours of minimum-wage work and let people compare a 1905 steak to a 2025 one. It is an economic story hidden in plain sight.",
      },
      {
        title: "The life of a dish",
        body: "Plot when a dish appears, peaks and vanishes, such as when avocado or sushi arrive, to show cultural change as a timeline.",
      },
      {
        title: "Cook it again",
        body: "Link a historic menu to modern recipes for each dish and let people host a themed dinner. It converts archive into experience.",
      },
    ],
    category: "experimental",
  },
  {
    slug: "wwyb-every-fridge-has-a-camera",
    kind: "what-would-you-build",
    title: "Cheap Cameras Are Everywhere and Nobody Wants Surveillance",
    prompt:
      "A tiny camera module with an on-board neural chip costs a few dollars and can recognize objects without sending a single pixel off the device. It outputs only labels such as person count, open door or empty shelf. What would you build that uses seeing without recording?",
    hints: [
      "What do people want to know that is a number, not an image?",
      "Privacy by design means the hardware literally cannot leak video.",
      "Think of public spaces, shops, homes and nature.",
    ],
    perspectives: [
      {
        title: "Occupancy without footage",
        body: "Report how crowded a gym, library study room or laundry room is, in real time, as a number. Users get the information and nobody is watched.",
      },
      {
        title: "Shelf and stock sensing",
        body: "A small shop knows when a shelf is empty without paying for a full inventory system.",
      },
      {
        title: "Wildlife and garden counts",
        body: "A camera that counts visiting species and uploads only tallies lets citizen scientists monitor biodiversity at low cost.",
      },
    ],
    category: "hardware",
  },
  {
    slug: "wwyb-webgpu-everywhere",
    kind: "what-would-you-build",
    title: "The Browser Now Has a GPU",
    prompt:
      "WebGPU gives web pages access to serious parallel compute: physics, image processing, small machine-learning models, all without installing anything. A link can now be a full application. What would you build that benefits most from being a link rather than an install?",
    hints: [
      "The advantage of a link is zero friction and easy sharing.",
      "What heavy tasks do people avoid because they must install software first?",
      "Collaboration and demos are naturally link-shaped.",
    ],
    perspectives: [
      {
        title: "Instant heavy tools",
        body: "Background removal, video denoising or audio separation that runs on your device and never uploads your file. The link is the product.",
      },
      {
        title: "Shareable simulations",
        body: "A fluid or traffic simulation that someone can tweak and send as a URL makes science and policy arguments interactive.",
      },
      {
        title: "Teaching playgrounds",
        body: "Let students write shaders or train a tiny network in the browser with live visuals, with no environment setup to scare them away.",
      },
    ],
    category: "experimental",
  },
  {
    slug: "wwyb-a-million-open-licenses",
    kind: "what-would-you-build",
    title: "Millions of Open-Source Repositories With Public Metadata",
    prompt:
      "Public APIs expose commit history, issues, release dates, dependency graphs and licenses for millions of open-source projects. Nobody has combined them into something that helps people choose what to depend on or contribute to. What would you build?",
    hints: [
      "What question do you ask yourself before adding a library?",
      "History reveals patterns that a README never mentions.",
      "Think of different people: users, contributors, funders.",
    ],
    perspectives: [
      {
        title: "A health check for dependencies",
        body: "Surface bus factor, release cadence and how fast issues get answered, so choosing a library is based on behavior rather than stars.",
      },
      {
        title: "Where to contribute",
        body: "Match a person's skills and time to projects with responsive maintainers and clear small tasks.",
      },
      {
        title: "Funding map",
        body: "Show which small, heavily depended-upon projects have no funding, guiding sponsors to where money matters most.",
      },
    ],
    category: "open-source",
  },
  {
    slug: "wwyb-grid-carbon-forecast",
    kind: "what-would-you-build",
    title: "A Free API Predicts How Clean Tomorrow's Electricity Will Be",
    prompt:
      "An open API forecasts the carbon intensity of the electricity grid half-hour by half-hour for the next two days. Some devices, like heat pumps, EV chargers and batteries, can shift their use. Yet almost nobody changes behavior based on it. What would you build to turn this forecast into action?",
    hints: [
      "Information alone rarely changes behavior; automation does.",
      "Which loads are flexible without anyone noticing?",
      "Consider which businesses profit from shifting, not only households.",
    ],
    perspectives: [
      {
        title: "Silent automation",
        body: "A small controller that shifts flexible loads within user-set deadlines needs no attention and no change of habit.",
      },
      {
        title: "Carbon-aware computing",
        body: "Schedule batch jobs, such as backups and model training, to run when the grid is cleanest. Developers can adopt this with a single scheduler flag.",
      },
      {
        title: "A visible signal",
        body: "A lamp that glows green when power is clean makes the grid feel tangible and nudges household decisions without an app.",
      },
    ],
    category: "sustainability",
  },
  {
    slug: "wwyb-phone-barometers",
    kind: "what-would-you-build",
    title: "Every Phone Has a Barometer",
    prompt:
      "Most modern phones contain a barometric pressure sensor sensitive enough to detect a change of one floor in a building. Hundreds of millions of them exist, mostly unused. Imagine you could safely and optionally read pressure data from consenting users. What would you build?",
    hints: [
      "Pressure reveals both weather and altitude.",
      "Aggregation of many weak sensors can beat one good one.",
      "Think about places where GPS is blind.",
    ],
    perspectives: [
      {
        title: "Hyperlocal weather",
        body: "Dense crowd-sourced pressure readings could improve short-term forecasts and spot approaching fronts and storms at neighborhood scale.",
      },
      {
        title: "Floor-level indoor location",
        body: "Emergency services often cannot tell which floor a caller is on; relative pressure to a reference sensor could help in tall buildings.",
      },
      {
        title: "Personal activity journals",
        body: "Count stairs climbed or elevator rides automatically for people tracking rehab or mobility without wearing anything.",
      },
    ],
    category: "experimental",
  },
  {
    slug: "wwyb-a-city-of-empty-parking-lots",
    kind: "what-would-you-build",
    title: "A Parking Lot That Is Empty 80 Percent of the Time",
    prompt:
      "Every church, office and supermarket has a large parking lot that sits mostly empty outside peak hours. Land in the city is expensive and almost every neighborhood lacks something: a market, a playground, a charging hub, a place to practice driving. What would you build to unlock these dead hours?",
    hints: [
      "Time-sharing is the main trick, not construction.",
      "Who would be willing to rent for short, regular time slots?",
      "Think about what the owners fear: liability, mess, hassle.",
    ],
    perspectives: [
      {
        title: "A booking layer for empty land",
        body: "A marketplace where owners list free time windows and local groups book them for markets, driving lessons or kids' sports, with insurance bundled in.",
      },
      {
        title: "Pop-up infrastructure",
        body: "Portable chargers, food stalls or vaccination clinics that move between lots by schedule convert unused space into services.",
      },
      {
        title: "Measure first",
        body: "Cheap occupancy sensors build the dataset proving when lots are actually empty, which is the evidence owners need to say yes.",
      },
    ],
    category: "social-impact",
  },

  // ───────────── connect-the-dots (10) ─────────────
  {
    slug: "ctd-beekeeping-version-control",
    kind: "connect-the-dots",
    title: "Beekeeping x Version Control",
    prompt:
      "Combine the practices of beekeeping with the practices of version control. Find something genuinely useful that emerges from putting these two together. It could be a product, a method, a metaphor that improves a workflow, or a tool for one field inspired by the other.",
    hints: [
      "Beekeepers split colonies, requeen and inspect on cycles. What are the equivalents of branch, merge and review?",
      "What does each field do when something goes wrong silently?",
      "Think about records: what does a beekeeper write down, and what does a commit log do?",
    ],
    perspectives: [
      {
        title: "A hive journal that works like git",
        body: "Treat every inspection as a commit with a message, a diff of observed changes such as brood pattern and stores, and a blame view for when the queen was replaced. History makes patterns visible.",
      },
      {
        title: "Splits as branches",
        body: "Dividing a strong hive to make a new colony resembles a branch from a trunk. A tool could track lineage of queens the way git tracks ancestry, helping breeders select for traits.",
      },
      {
        title: "Release discipline for code",
        body: "Beekeepers avoid opening hives unnecessarily because every inspection disturbs the colony. A team could apply this to frequent deploys: set a rhythm of inspections instead of constant tinkering.",
      },
    ],
    conceptA: "beekeeping",
    conceptB: "version control",
    category: "experimental",
  },
  {
    slug: "ctd-tide-tables-email",
    kind: "connect-the-dots",
    title: "Tide Tables x Email Inboxes",
    prompt:
      "Tide tables predict when water will rise and fall hours or years in advance. Email inboxes fill and overflow unpredictably. Connect the two ideas into something that helps people deal with the flow of messages, or something that helps the tide watchers.",
    hints: [
      "Are there rhythms in when email arrives that could be predicted?",
      "A tide is predictable because it has a cause; what causes email floods?",
      "Fishermen and sailors act by windows, not by constant checking.",
    ],
    perspectives: [
      {
        title: "Inbox tide chart",
        body: "Analyze your past mail to forecast busy periods and quiet windows, and show a chart that tells you when it is best to do deep work or catch up.",
      },
      {
        title: "Batch at high water",
        body: "Deliver mail only at set tide times, such as twice a day, with exceptions for urgent senders. The tide becomes a delivery schedule.",
      },
      {
        title: "Notifications for the sea",
        body: "In the other direction, apply email-style filtering to tidal information: alerts only when a tide, wind and time-of-day combination matches a launch ramp being usable for your boat.",
      },
    ],
    conceptA: "tide tables",
    conceptB: "email inboxes",
    category: "productivity",
  },
  {
    slug: "ctd-origami-database-migrations",
    kind: "connect-the-dots",
    title: "Origami x Database Migrations",
    prompt:
      "Origami turns a flat sheet into a complex form through a strict sequence of reversible folds, each with a diagram. Database migrations change a live schema in a sequence of steps. What useful thing can you build or learn by combining the two?",
    hints: [
      "Which folds are reversible, and which are not?",
      "Crease patterns are a notation for a whole sequence at once.",
      "What does it mean for a migration to be foldable and unfoldable?",
    ],
    perspectives: [
      {
        title: "Fold diagrams for migrations",
        body: "A visual notation that shows each migration step as a diagram of the schema before and after, with marks for steps that cannot be undone, would make reviews easier.",
      },
      {
        title: "Reversibility as a first-class rule",
        body: "Enforce that every migration declares its inverse, as every origami fold has an unfold, and flag those which destroy information like dropping a column.",
      },
      {
        title: "Computational origami for engineering",
        body: "Rigid origami algorithms are used for folding solar panels and medical stents. A tool could let engineers design a flat-packed structure and simulate its deployment sequence.",
      },
    ],
    conceptA: "origami",
    conceptB: "database migrations",
    category: "devtools",
  },
  {
    slug: "ctd-bird-migration-meeting-scheduling",
    kind: "connect-the-dots",
    title: "Bird Migration x Meeting Scheduling",
    prompt:
      "Migratory birds time long journeys by daylight, weather and the whole flock's readiness. Teams spread across time zones struggle to find a time for a single meeting. Find a surprising link between them and turn it into an idea.",
    hints: [
      "Flocks decide together without a central scheduler.",
      "Some birds leave early to scout and others follow later.",
      "What signals trigger movement, and could a team use similar triggers?",
    ],
    perspectives: [
      {
        title: "Follow-the-leader scheduling",
        body: "Instead of finding a perfect slot for everyone, rotate the inconvenient time among time zones so the burden is shared and visible, like birds taking turns at the front of a V.",
      },
      {
        title: "Meetings triggered by conditions",
        body: "Schedule a sync only when enough open decisions accumulate, rather than every Tuesday, in the way migration starts when conditions are right.",
      },
      {
        title: "Tools for ornithologists",
        body: "Flip the direction: use scheduling algorithms to plan volunteer survey shifts timed to predicted migration peaks from radar and weather data.",
      },
    ],
    conceptA: "bird migration",
    conceptB: "meeting scheduling",
    category: "productivity",
  },
  {
    slug: "ctd-sourdough-starter-open-source",
    kind: "connect-the-dots",
    title: "Sourdough Starter x Open-Source Maintenance",
    prompt:
      "A sourdough starter is a living culture that needs regular feeding, can be shared by giving a piece away, and dies if neglected. Open-source projects need continuous maintenance and can be forked. Combine the two to build or propose something useful.",
    hints: [
      "What does feeding mean for a software project?",
      "A starter spreads by someone giving away a portion. What is the portion of a project?",
      "What are the signs of a starter that is declining?",
    ],
    perspectives: [
      {
        title: "A feeding schedule for projects",
        body: "A dashboard showing the last time a project received maintenance, with a visible hunger level, and a prompt for sponsors or volunteers to feed it before it goes dormant.",
      },
      {
        title: "Gift forks",
        body: "A maintainer retiring could pass on a living fork to a named successor with a ritual handoff package of docs, keys and context, in the way a starter is handed to a friend.",
      },
      {
        title: "A starter-sharing network",
        body: "In the other direction, build a map where bakers share and track the lineage of starters, like a package registry with provenance.",
      },
    ],
    conceptA: "sourdough starter",
    conceptB: "open-source maintenance",
    category: "open-source",
  },
  {
    slug: "ctd-lighthouse-password-manager",
    kind: "connect-the-dots",
    title: "Lighthouses x Password Management",
    prompt:
      "Lighthouses use unique flash patterns so a sailor can identify exactly which one they are looking at, even from far away, in poor visibility. Password managers must make a vast number of secrets distinguishable and safe. What happens when you combine them?",
    hints: [
      "Identification at a glance without revealing anything is the lighthouse trick.",
      "What makes two lighthouses hard to confuse?",
      "Where in security do people confuse the wrong thing for the right one?",
    ],
    perspectives: [
      {
        title: "Flash patterns as visual fingerprints",
        body: "Show every site or key with a unique rhythmic or visual pattern so users can recognize that they are on the genuine login page, countering phishing by familiarity.",
      },
      {
        title: "Beacons for devices",
        body: "A device that flashes a code visible to a camera could authenticate a login across an air gap, with the light pattern carrying a one-time challenge.",
      },
      {
        title: "A beacon for emergency access",
        body: "A trusted contact could recover your vault if it receives a pattern from you, like a signal only a particular lighthouse keeper recognizes.",
      },
    ],
    conceptA: "lighthouses",
    conceptB: "password management",
    category: "experimental",
  },
  {
    slug: "ctd-library-catalog-playlists",
    kind: "connect-the-dots",
    title: "Library Card Catalogs x Music Playlists",
    prompt:
      "Librarians built elaborate systems for finding things by subject, author and cross-reference. Playlists are mostly sorted by time added or algorithmic guess. Mash the two together to create a new way to organize, find or discover music, or a new way to browse libraries.",
    hints: [
      "Card catalogs had see also references; what is the playlist equivalent?",
      "Subject headings are chosen by humans, not clicks.",
      "A library lets you walk along a shelf and meet neighbors.",
    ],
    perspectives: [
      {
        title: "A subject-heading system for music",
        body: "Hand-assigned controlled vocabularies like for studying in rain or songs about leaving would give search a meaning that listening data cannot capture.",
      },
      {
        title: "Call numbers for shelves of songs",
        body: "Place every track at a point in a classification so a listener can browse adjacent songs like walking down a shelf, finding neighbors outside the usual recommendations.",
      },
      {
        title: "Playlist-based library displays",
        body: "Flip it: let librarians curate books as playlists, with mood and sequence, so a reader can follow a reading order rather than a Dewey number.",
      },
    ],
    conceptA: "library card catalogs",
    conceptB: "music playlists",
    category: "design",
  },
  {
    slug: "ctd-composting-code-review",
    kind: "connect-the-dots",
    title: "Composting x Code Review",
    prompt:
      "Composting turns waste into something valuable, but needs the right balance of ingredients, time and turning. Code review turns rough contributions into maintainable code. What useful idea comes from comparing the two processes?",
    hints: [
      "Compost needs browns and greens in balance; review needs what?",
      "What happens when a pile is never turned?",
      "Where in code does waste accumulate that could be recycled?",
    ],
    perspectives: [
      {
        title: "Balance review inputs",
        body: "A review dashboard that shows the ratio of nitpicks (browns) to design feedback (greens) could reveal when reviews are heavy on style and low on substance.",
      },
      {
        title: "Compost your dead code",
        body: "Instead of deleting abandoned branches, a tool breaks them down into reusable snippets, tests and lessons stored where future developers will find them.",
      },
      {
        title: "Turning the pile",
        body: "Schedule periodic revisiting of old merged code, as a pile is turned for oxygen, so that decayed areas are noticed before they smell.",
      },
    ],
    conceptA: "composting",
    conceptB: "code review",
    category: "devtools",
  },
  {
    slug: "ctd-chess-endgames-budgeting",
    kind: "connect-the-dots",
    title: "Chess Endgames x Personal Budgeting",
    prompt:
      "Chess endgames are solved by recognizing a small number of known patterns and following precise technique with few pieces on the board. Personal budgets are messy, with many variables and decisions. Bring the two together into a useful idea.",
    hints: [
      "Endgames reduce complexity to a few key factors. What are the key factors of a budget?",
      "Tablebases give a perfect move in any small position.",
      "A beginner learns endgames by studying famous positions.",
    ],
    perspectives: [
      {
        title: "Money endgame positions",
        body: "Name a handful of common financial positions, such as paying off one debt, and give the standard technique for each, so people learn patterns rather than spreadsheets.",
      },
      {
        title: "A tablebase for small decisions",
        body: "For a bounded decision like which debt to pay first, precompute the optimal move for any combination of balances and rates, then show it as a simple lookup.",
      },
      {
        title: "Budget puzzles for training",
        body: "Teach financial reasoning through daily puzzles with a unique best move, like chess puzzles, making skill-building a habit.",
      },
    ],
    conceptA: "chess endgames",
    conceptB: "personal budgeting",
    category: "finance",
  },
  {
    slug: "ctd-roundabouts-team-communication",
    kind: "connect-the-dots",
    title: "Roundabouts x Team Communication",
    prompt:
      "Roundabouts replaced many signalized intersections because simple local rules, such as yield to traffic already inside, produce smooth flow without a central controller. Teams drown in coordination overhead. What happens when you apply roundabout thinking to how teams communicate, or traffic thinking to messaging tools?",
    hints: [
      "What is the yield rule of a team's communication?",
      "Roundabouts slow everyone slightly so that no one stops completely.",
      "Which parts of a team's work resemble gridlock?",
    ],
    perspectives: [
      {
        title: "Local rules instead of meetings",
        body: "Define a few simple handoff rules, such as whoever is mid-task has the right of way and others queue, to replace sync meetings with norms.",
      },
      {
        title: "Throughput over speed",
        body: "Slightly limit work in progress per person so work never fully blocks, mirroring how roundabouts cap speed to keep flow.",
      },
      {
        title: "Traffic analytics for chat",
        body: "Visualize message flow like traffic, showing where threads queue up around one person who acts as an intersection, and propose bypasses.",
      },
    ],
    conceptA: "roundabouts",
    conceptB: "team communication",
    category: "startups",
  },

  // ───────────── constraint (10) ─────────────
  {
    slug: "con-no-screens-language-learning",
    kind: "constraint",
    title: "Learn a Language With No Screens",
    prompt:
      "Design a way for adults to learn conversational Spanish that works entirely without screens. You have these constraints. Your goal is a product or method that someone could start using tomorrow.",
    constraints: [
      "No screens or apps during the learning itself",
      "Total daily effort cannot exceed 15 minutes",
      "Must work for someone who commutes by car",
      "Needs a built-in way to track progress",
    ],
    hints: [
      "Audio, paper, and other people are all available.",
      "Short daily sessions need strong habit hooks.",
      "How can you check progress without testing on a screen?",
    ],
    perspectives: [
      {
        title: "Audio-only spaced practice",
        body: "A podcast-style course recorded as cue and pause exercises that you answer aloud while driving, with phrases repeating on a spaced schedule. Progress is tracked by phrase counts on a paper card.",
      },
      {
        title: "Paired speaking partners",
        body: "Match learners to speak for fifteen minutes by phone, with a prompt card mailed monthly. The tracking is a signed log with your partner.",
      },
      {
        title: "Environmental labeling",
        body: "Physical labels, a daily sentence card on the fridge and a jar to deposit mastered words. The physical environment does the teaching and the jar shows progress.",
      },
    ],
    category: "education",
  },
  {
    slug: "con-offline-first-health-tool",
    kind: "constraint",
    title: "A Health Tool for a Village With No Internet",
    prompt:
      "A community health worker visits forty households a month in a rural area with no reliable internet or electricity. She needs to record visits, flag pregnant women who are overdue for a checkup and report numbers to a district office. Design the tool within these limits.",
    constraints: [
      "No internet during visits; connectivity only once a month in town",
      "Phone battery must last a full week",
      "Must work for someone with limited reading literacy",
      "Data must be safe if the phone is lost",
    ],
    hints: [
      "What can be done with paper, icons and voice instead of text?",
      "Sync once a month changes what the data model must look like.",
      "Consider encryption as a requirement, not an add-on.",
    ],
    perspectives: [
      {
        title: "Icon-driven offline app",
        body: "A phone app with large pictograms and audio prompts that stores encrypted records locally and syncs by conflict-free merge when connected, with a low-power mode that disables everything else.",
      },
      {
        title: "Paper plus a smart summary",
        body: "Keep paper forms as the primary record and photograph them in town, where a server extracts the data. The field tool is a printed card with color-coded due dates.",
      },
      {
        title: "SMS and feature phones",
        body: "A short code-based SMS system on a cheap feature phone with week-long battery. It sacrifices richness for reliability.",
      },
    ],
    category: "healthcare",
  },
  {
    slug: "con-ten-dollar-budget-hardware",
    kind: "constraint",
    title: "Build a Useful Device for Ten Dollars",
    prompt:
      "Design a hardware device that solves a real problem for someone and costs no more than ten dollars in parts, produced in a batch of one hundred. It should feel like a real product rather than a prototype. Describe what it does and how you hit the target.",
    constraints: [
      "Bill of materials at most 10 dollars at 100 units",
      "Runs at least 6 months on common batteries",
      "No custom PCB, only off-the-shelf modules",
      "Must be usable without reading a manual",
    ],
    hints: [
      "Which single sensor and single output would be enough?",
      "Deep sleep and rare wake-ups are how batteries last months.",
      "A strong enclosure and a clear indicator make a prototype feel finished.",
    ],
    perspectives: [
      {
        title: "A freezer or fridge door reminder",
        body: "A reed switch, an ESP32-C3 in deep sleep and a buzzer that sounds only if the door stays open too long. One purpose, one beep, zero setup.",
      },
      {
        title: "A mailbox opened notifier",
        body: "A tilt switch and low-power radio send a signal to a plug-in receiver light inside the house. Elderly users get independence with no phone needed.",
      },
      {
        title: "A pill reminder lid",
        body: "A cap with a timer and an LED that blinks when a dose is due, until the cap is opened. Cheap, tactile and understandable.",
      },
    ],
    category: "hardware",
  },
  {
    slug: "con-one-button-interface",
    kind: "constraint",
    title: "Everything With One Button",
    prompt:
      "Design a useful software tool for people who can operate only one switch, such as a button pressed with a chin or a foot. Pick a real task, like writing a message or controlling a room's lights, and design the whole interaction. You have the following limits.",
    constraints: [
      "Only one binary input: press or no press",
      "The user may press at most once every second",
      "Errors must be easy to undo",
      "A first-time user should succeed in under five minutes",
    ],
    hints: [
      "Scanning interfaces highlight options in sequence; how do you speed them up?",
      "Predictive text and frequency matter a lot with only one input.",
      "Think about timing: short press, long press, and pause are different signals.",
    ],
    perspectives: [
      {
        title: "Row-column scanning with prediction",
        body: "A grid cycles through rows then columns, with a language model reordering letters and words so the likely ones come up first. Typing speed rises with prediction.",
      },
      {
        title: "Binary tree of choices",
        body: "Every selection is a yes or no between two halves, so any of 256 options takes eight presses. Optimizing the tree by usage frequency shortens common actions.",
      },
      {
        title: "Context-reduced menus",
        body: "In a room-control scenario, offer only the three most likely actions based on time and history, so most tasks take a single press.",
      },
    ],
    category: "social-impact",
  },
  {
    slug: "con-zero-backend-app",
    kind: "constraint",
    title: "A Collaborative App With No Server",
    prompt:
      "Design a collaborative tool, such as a shared shopping list or a planning board, that works for a group of friends without any server that you run or pay for. Describe how data syncs and what the user experiences. These are your constraints.",
    constraints: [
      "No backend that the developer hosts",
      "Must work when two people edit offline and reconnect later",
      "Setup is a single shared link",
      "Cannot lose anyone's edits",
    ],
    hints: [
      "Which structures merge without conflicts?",
      "Peers can find each other directly if something introduces them.",
      "Data can live in the link, in the browser, or in a user's own cloud storage.",
    ],
    perspectives: [
      {
        title: "CRDTs over WebRTC",
        body: "Use a conflict-free replicated data type like Yjs, with peers syncing over WebRTC and a public signaling relay for the introduction. Edits made offline merge when peers meet again.",
      },
      {
        title: "Files in a user's own storage",
        body: "Store the data as a file in a folder shared on Dropbox or Google Drive and let each client merge on read. The infrastructure is already paid for by the users.",
      },
      {
        title: "State in the URL",
        body: "Encode the entire list in the link fragment and let people send updated links. It is clunky but has no moving parts, and it suits small data.",
      },
    ],
    category: "devtools",
  },
  {
    slug: "con-one-sentence-business",
    kind: "constraint",
    title: "A Business You Can Explain to a Grandparent",
    prompt:
      "Design a software business that can be explained in one plain sentence to someone who does not use apps. It must make money from the first customer and must not require raising venture capital. Describe what it does, who pays and how you find your first ten customers.",
    constraints: [
      "Explained in one sentence with no jargon",
      "First revenue within 30 days of starting",
      "No outside funding",
      "One person can operate it part-time",
    ],
    hints: [
      "Pick a boring industry with expensive manual work.",
      "Charge per outcome or per month, not for seats.",
      "Your first customers are people you can phone or visit.",
    ],
    perspectives: [
      {
        title: "We send your customers a text when their appointment is tomorrow",
        body: "Sell no-show reduction to local clinics, salons and garages. The pitch is simple, the benefit is measurable, and clients can be found by walking in.",
      },
      {
        title: "We digitize your paperwork every Friday",
        body: "A service-first business scanning and organizing for small contractors, with software built behind it over time. Revenue comes from the service immediately.",
      },
      {
        title: "We keep your website's information correct",
        body: "Monthly updating of hours, menus and listings for small businesses. It is unglamorous, recurring and easy to understand.",
      },
    ],
    category: "startups",
  },
  {
    slug: "con-teach-with-a-single-sheet",
    kind: "constraint",
    title: "Teach a Skill on One Sheet of Paper",
    prompt:
      "Design a learning experience that teaches a real skill, such as basic personal finance or first aid, using a single printed sheet of paper that can be distributed in places with no technology. The learner must be able to do something new afterward. Work within these limits.",
    constraints: [
      "One A4 sheet, both sides",
      "No assumed technology or teacher",
      "Must include a way to practice, not just read",
      "Understandable at roughly a 12-year-old reading level",
    ],
    hints: [
      "A sheet can be folded, cut or turned into a game.",
      "Practice can be a role play or a question the learner answers aloud.",
      "Show, do not explain: what is the one picture that does most of the work?",
    ],
    perspectives: [
      {
        title: "A foldable flowchart",
        body: "A decision diagram that turns first aid into follow-the-arrows, with a cut-out card to quiz a friend. The structure does the thinking for a stressed person.",
      },
      {
        title: "A worksheet that is a game board",
        body: "Turn budgeting into a paper board game with scenarios and tokens from coins. Playing is the practice.",
      },
      {
        title: "A one-week challenge",
        body: "Seven small tasks, one per day, to tick off. The sheet becomes a schedule that builds a habit rather than delivering information.",
      },
    ],
    category: "education",
  },
  {
    slug: "con-shared-by-ten-thousand",
    kind: "constraint",
    title: "Design for a Million Users on a Free Tier",
    prompt:
      "Design a social or utility product that might gain a million users yet must run on essentially free infrastructure, because you have no money and it will earn nothing for the first year. Describe the architecture and the product decisions that keep costs near zero.",
    constraints: [
      "Hosting costs must stay under 20 dollars per month",
      "No expensive per-user computation",
      "Media uploads cannot be stored on your servers",
      "Must degrade gracefully when overloaded",
    ],
    hints: [
      "What can be computed on the user's device instead?",
      "Static files and CDNs scale for free almost anywhere.",
      "Which features create cost per user and which create cost per request?",
    ],
    perspectives: [
      {
        title: "Static-first with edge caching",
        body: "Pre-render pages, serve them via a CDN and keep dynamic parts to a tiny API. Most traffic never touches a server.",
      },
      {
        title: "Client does the work",
        body: "Run processing in the browser with WebAssembly and store data in IndexedDB. The server only synchronizes small summaries.",
      },
      {
        title: "Let users bring their own storage",
        body: "Media lives in the user's own cloud account or is linked from elsewhere, eliminating your largest cost.",
      },
    ],
    category: "startups",
  },
  {
    slug: "con-no-notifications",
    kind: "constraint",
    title: "A Social App Without Notifications",
    prompt:
      "Design a social product for close friends that never sends a push notification, shows no unread counts and has no infinite feed. People should still want to come back to it. Describe what the product is and why it works.",
    constraints: [
      "No push notifications or unread badges",
      "No infinite scroll or algorithmic ranking",
      "Must work for groups of 3 to 12 people",
      "Needs a reason to return that is not fear of missing out",
    ],
    hints: [
      "What rituals bring people back without being summoned?",
      "A thing that finishes is easier to return to than one that never ends.",
      "Think about letters, newspapers and weekly dinners.",
    ],
    perspectives: [
      {
        title: "A weekly digest",
        body: "Friends add moments through the week and the product assembles one beautiful issue on Sunday morning. The anticipation is built into the rhythm.",
      },
      {
        title: "A shared object that grows",
        body: "A collaborative map, scrapbook or playlist that everyone contributes to. The pull is curiosity about what was added.",
      },
      {
        title: "A turn-based exchange",
        body: "Each week one person's turn is to send something, and others reply when they feel like it. Obligations are light and predictable.",
      },
    ],
    category: "design",
  },
  {
    slug: "con-explain-without-words",
    kind: "constraint",
    title: "Onboarding With Zero Words",
    prompt:
      "Design the first-run experience of a tool for people who speak many different languages, with no text at all: no labels, tooltips or tutorials. A user must understand what the product does and complete a first meaningful action. Choose the tool and design the flow.",
    constraints: [
      "No written words anywhere in the first-run flow",
      "Voice and sound allowed, but no spoken language",
      "A first action should be completed in under a minute",
      "Must work on a small phone screen",
    ],
    hints: [
      "Which universal conventions do people already know: faces, arrows, checkmarks?",
      "Let the user do the action before explaining it.",
      "Animation can demonstrate what text would explain.",
    ],
    perspectives: [
      {
        title: "Demonstrate with an animated hand",
        body: "A ghost hand shows the swipe or tap, and the user mirrors it, so the first interaction teaches itself.",
      },
      {
        title: "Start with a finished example",
        body: "Open with a pre-made result that the user can modify, revealing what the product produces before asking them to create anything.",
      },
      {
        title: "Sound and haptics as feedback",
        body: "Distinct tones and vibrations confirm success and errors, so users learn the product's grammar through their senses.",
      },
    ],
    category: "design",
  },

  // ───────────── reverse-engineer (10) ─────────────
  {
    slug: "re-duolingo",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Duolingo",
    prompt:
      "Duolingo is one of the most downloaded education apps in the world. Work backwards from what you see in it: figure out the problem it was built to solve, the idea that made it different, and how the design keeps people coming back.",
    product: "Duolingo",
    questions: RE_QUESTIONS,
    hints: [
      "Think about who could not afford language courses.",
      "Look at what the app asks you to do in a single lesson and how long it takes.",
      "How does it make daily return feel like a streak you would lose?",
    ],
    perspectives: [
      {
        title: "Free education at scale",
        body: "Founder Luis von Ahn has said he wanted to make language education free and accessible. The product offers a free tier funded by ads and a paid subscription, so access does not depend on income.",
      },
      {
        title: "Short, game-like lessons",
        body: "Lessons are a few minutes long, with points, levels and streaks borrowed from games. This lowers the effort needed to practice every day.",
      },
      {
        title: "Habit loops as the real product",
        body: "Streaks, reminders and leagues push daily use. What you improve on is not the content, but how much easier it is to keep showing up, which is what language learning needs.",
      },
    ],
    category: "education",
  },
  {
    slug: "re-dropbox",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Dropbox",
    prompt:
      "Dropbox made file syncing feel like magic when it launched. Work backwards: what did people do before it, what insight did the founders have, and why did the product spread so well?",
    product: "Dropbox",
    questions: RE_QUESTIONS,
    hints: [
      "Remember the era of USB sticks and emailing files to yourself.",
      "What does it mean for a folder to simply work?",
      "How did existing users help acquire new ones?",
    ],
    perspectives: [
      {
        title: "The USB stick problem",
        body: "Drew Houston has described forgetting a USB drive on a bus trip and being frustrated at having no way to access his files. Dropbox started as a way to keep files available across computers.",
      },
      {
        title: "A folder, not a new app",
        body: "The core experience is a normal folder that quietly syncs. By hiding complexity behind something people already understood, adoption needed almost no learning.",
      },
      {
        title: "Referrals built into storage",
        body: "Users earned extra storage by inviting friends, which turned existing customers into a growth channel, together with a freemium model where heavy users pay for more space.",
      },
    ],
    category: "productivity",
  },
  {
    slug: "re-airbnb",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Airbnb",
    prompt:
      "Airbnb lets strangers stay in each other's homes. Why does that work at all, and why was it not obvious? Work backwards from the product to its origins and its mechanisms for trust.",
    product: "Airbnb",
    questions: RE_QUESTIONS,
    hints: [
      "Think about what is scarce at a big conference and what is unused in a city.",
      "Strangers sleeping in your home is a trust problem. What would you need to see?",
      "How does the company make money from each transaction?",
    ],
    perspectives: [
      {
        title: "Beginnings with air mattresses",
        body: "The founders have told the story of renting out air mattresses in their San Francisco apartment during a conference when hotels were full. It revealed unmet demand and idle space in the same city.",
      },
      {
        title: "Trust through profiles and reviews",
        body: "Photos, verified profiles and two-way reviews make strangers legible to each other. Without these, the idea would fail on safety fears.",
      },
      {
        title: "A marketplace that takes a fee",
        body: "Airbnb earns service fees from hosts and guests on each booking, so it makes money when trips happen and aligns itself with supply growth.",
      },
    ],
    category: "startups",
  },
  {
    slug: "re-slack",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Slack",
    prompt:
      "Slack replaced a lot of email inside companies. Work backwards: where did it come from, what was the central insight and how did the product make adoption inside a team feel easy?",
    product: "Slack",
    questions: RE_QUESTIONS,
    hints: [
      "It began as an internal tool at a company that was making something else.",
      "What is different about a channel compared to an email thread?",
      "Why did integrations matter so much?",
    ],
    perspectives: [
      {
        title: "A by-product of a game",
        body: "Slack was built as an internal communication tool at Tiny Speck, the company developing the game Glitch. When the game closed, the team turned the tool into the main product.",
      },
      {
        title: "Channels and searchable history",
        body: "Open channels make conversations visible to the whole team and searchable later, which reduced duplicated questions and brought people into context without extra meetings.",
      },
      {
        title: "Freemium that spreads inside a company",
        body: "A free tier lets a small team start without approval, and paid plans unlock history and administrative features once the tool is embedded in daily work.",
      },
    ],
    category: "productivity",
  },
  {
    slug: "re-instagram",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Instagram",
    prompt:
      "Instagram became a giant by doing one thing, photos, very simply. Work backwards from the product to the product that preceded it, the constraint it embraced and why that constraint helped.",
    product: "Instagram",
    questions: RE_QUESTIONS,
    hints: [
      "It began as something else with more features.",
      "Phone cameras in the early 2010s took mediocre photos. How did the app address that?",
      "What does a square frame do to the creative decisions people make?",
    ],
    perspectives: [
      {
        title: "A pivot from a check-in app",
        body: "The founders began with Burbn, a location check-in app with many features, and noticed that people used the photo feature most. They stripped the product down to photos.",
      },
      {
        title: "Filters and the square frame",
        body: "One-tap filters made average phone photos look good, and the fixed square format simplified decisions. Constraints lowered the barrier to posting and gave the feed a consistent look.",
      },
      {
        title: "Attention as the business",
        body: "The app grew by building a large audience and was acquired by Facebook in 2012. Its later model relies on advertising within the feed and stories.",
      },
    ],
    category: "design",
  },
  {
    slug: "re-stripe",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Stripe",
    prompt:
      "Stripe made accepting online payments dramatically easier for developers. Work backwards: what was painful before, what exactly did Stripe simplify and how does it earn money from that simplicity?",
    product: "Stripe",
    questions: RE_QUESTIONS,
    hints: [
      "Look at the first thing a developer sees: the documentation.",
      "What steps did a business traditionally need before taking a card payment?",
      "Think about the pricing structure and how it scales with customers.",
    ],
    perspectives: [
      {
        title: "Payments were bureaucratic",
        body: "Before Stripe, a small business typically needed a merchant account, a payment gateway and lengthy paperwork. Developers found it opaque and slow.",
      },
      {
        title: "Developer experience as product",
        body: "Stripe offered a clean API, clear documentation and a quick way to start. The product was aimed at the developer who decides what to integrate.",
      },
      {
        title: "A percentage of volume",
        body: "Stripe charges a fee per transaction, so it earns more as its customers grow. It then expanded into adjacent products such as billing and fraud tools on the same relationship.",
      },
    ],
    category: "finance",
  },
  {
    slug: "re-wikipedia",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Wikipedia",
    prompt:
      "Wikipedia is an encyclopedia that anyone can edit, and it works. Work backwards from what you see: what failed before it, what mechanisms prevent chaos and who pays for it?",
    product: "Wikipedia",
    questions: RE_QUESTIONS,
    hints: [
      "There was an earlier project with a more formal process.",
      "Every page keeps its full history. Why does that matter?",
      "Look at how the site is funded and what that means for the content.",
    ],
    perspectives: [
      {
        title: "A faster alternative to Nupedia",
        body: "Wikipedia began in 2001 alongside Nupedia, an encyclopedia with a slow expert review process. Using wiki software let anyone contribute immediately and made articles grow quickly.",
      },
      {
        title: "History, talk pages and norms",
        body: "Every edit is recorded and reversible, discussions happen on talk pages, and policies such as neutral point of view and citing sources guide contributors. Transparency makes vandalism cheap to undo.",
      },
      {
        title: "A nonprofit with no ads",
        body: "The Wikimedia Foundation runs Wikipedia as a nonprofit supported largely by donations, which keeps the content free of advertising and independent from commercial pressure.",
      },
    ],
    category: "social-impact",
  },
  {
    slug: "re-spotify",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Spotify",
    prompt:
      "Spotify turned music from something you own into something you stream. Work backwards: what was the dominant behavior it competed with, what did it offer instead and how does it make money while paying artists?",
    product: "Spotify",
    questions: RE_QUESTIONS,
    hints: [
      "Think about what music piracy gave people that the industry did not.",
      "Why is a free tier important for conversion?",
      "Who gets paid when you press play?",
    ],
    perspectives: [
      {
        title: "Beating piracy on convenience",
        body: "Spotify launched in Sweden in 2008 and aimed to make legal listening as fast and easy as piracy. Instant playback of a huge catalog was the core promise.",
      },
      {
        title: "Free tier funnels to premium",
        body: "An ad-supported free version lets anyone try it, and paid subscribers get no ads, offline listening and better control. The free tier acts as the marketing.",
      },
      {
        title: "Streams pay rights holders",
        body: "Revenue from ads and subscriptions is shared with labels, publishers and artists according to listening. The business is a middleman bargaining with powerful rights holders.",
      },
    ],
    category: "everyday",
  },
  {
    slug: "re-strava",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Strava",
    prompt:
      "Strava turned exercise into something that is logged, compared and shared. Work backwards: what do people actually get from it that a plain GPS watch does not give them, and how does it create loyalty?",
    product: "Strava",
    questions: RE_QUESTIONS,
    hints: [
      "Look at what happens after the run, not during it.",
      "Think about segments and why they matter.",
      "Which features are free and which are paid?",
    ],
    perspectives: [
      {
        title: "Social proof for effort",
        body: "Activities posted to a feed with kudos and comments turn solitary exercise into something witnessed by friends, which supports motivation.",
      },
      {
        title: "Segments and leaderboards",
        body: "Strava lets users compare times on defined stretches of road or trail, so any ordinary route becomes a shared competition and a reason to return.",
      },
      {
        title: "Freemium with deeper analysis",
        body: "Core logging and social features are free, and a subscription unlocks richer analysis, route tools and training features. Free users supply the network that makes the product valuable.",
      },
    ],
    category: "social-impact",
  },
  {
    slug: "re-kickstarter",
    kind: "reverse-engineer",
    title: "Reverse-Engineer Kickstarter",
    prompt:
      "Kickstarter lets strangers fund projects before they exist. Work backwards: what rule makes the model feel safe for backers, what does it do for creators and how does the platform earn money?",
    product: "Kickstarter",
    questions: RE_QUESTIONS,
    hints: [
      "Notice what happens to your money if a project falls short of its goal.",
      "A page with a video and rewards is essentially a pitch. What does it test?",
      "Think about who is the customer: the backer, the creator, or both?",
    ],
    perspectives: [
      {
        title: "All-or-nothing funding",
        body: "A project is funded only if it reaches its goal by the deadline, otherwise backers are not charged. This reduces the risk for backers and tests demand for creators before they commit.",
      },
      {
        title: "Rewards instead of equity",
        body: "Backers receive products or experiences rather than ownership, which keeps the transaction simple and turns early supporters into customers and promoters.",
      },
      {
        title: "A fee on successful projects",
        body: "Kickstarter takes a percentage of funds raised by projects that succeed, plus payment processing fees, so its incentives lean toward helping projects reach their goals.",
      },
    ],
    category: "startups",
  },
];
