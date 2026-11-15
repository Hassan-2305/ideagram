// End-to-end API journey against a running server. Exercises the non-AI paths
// fully and checks AI endpoints fail honestly when no key is configured.
// Usage: node scripts/e2e.mjs [baseUrl]
const BASE = process.argv[2] ?? "http://localhost:3100";
let cookie = "";
let failures = 0;

async function call(method, path, body, extraHeaders = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function check(name, cond, info) {
  if (cond) console.log("  ✓", name);
  else {
    failures++;
    console.log("  ✗", name, info === undefined ? "" : JSON.stringify(info).slice(0, 300));
  }
}

{
  console.log("Pages (signed out)");
  for (const p of ["/", "/discover", "/gym", "/login", "/signup"]) {
    const r = await call("GET", p);
    check(`${p} → 200`, r.status === 200, r.status);
  }
  const lab = await call("GET", "/lab");
  check("/lab redirects when signed out", [307, 308].includes(lab.status), lab.status);
  check("protected API returns 401", (await call("GET", "/api/vault")).status === 401);

  console.log("Auth");
  const email = `e2e-${Date.now()}@example.com`;
  check("signup validates email", (await call("POST", "/api/auth/signup", { name: "E", email: "nope", password: "password123" })).status === 400);
  const su = await call("POST", "/api/auth/signup", { name: "E2E", email, password: "password123" });
  check("signup → 201", su.status === 201, su.data);
  check("duplicate email → 409", (await call("POST", "/api/auth/signup", { name: "E2E", email, password: "password123" })).status === 409);
  const saved = cookie;
  cookie = "";
  check("wrong password → 401", (await call("POST", "/api/auth/login", { email, password: "wrongpass1" })).status === 401);
  check("login → 200", (await call("POST", "/api/auth/login", { email, password: "password123" })).status === 200);
  void saved;

  console.log("Discover & search");
  const feed = await call("GET", "/api/feed?limit=6");
  check("feed returns items", feed.data.items?.length === 6, feed.data);
  const cat = await call("GET", "/api/feed?category=healthcare&sort=newest");
  check("category filter", cat.data.items.every((i) => i.idea.category === "healthcare"));
  const page2 = await call("GET", `/api/feed?limit=6&cursor=${feed.data.nextCursor}`);
  check("pagination has no duplicates", !page2.data.items.some((i) => feed.data.items.some((j) => j.idea.id === i.idea.id)));
  const search = await call("GET", "/api/search?q=offline");
  check("search finds results", search.data.results.length > 0);
  check("search survives FTS syntax", (await call("GET", `/api/search?q=${encodeURIComponent('"(NEAR OR*')}`)).status === 200);

  console.log("Idea actions & vault");
  const id = feed.data.items[0].idea.id;
  const id2 = feed.data.items[1].idea.id;
  check("save", (await call("POST", `/api/ideas/${id}/action`, { action: "save" })).status === 200);
  check("save second", (await call("POST", `/api/ideas/${id2}/action`, { action: "save" })).status === 200);
  check("like → count", (await call("POST", `/api/ideas/${id}/action`, { action: "like" })).data.likeCount >= 1);
  check("report needs reason", (await call("POST", `/api/ideas/${id}/action`, { action: "report" })).status === 400);
  check("report", (await call("POST", `/api/ideas/${id}/action`, { action: "report", reason: "inaccurate" })).status === 200);
  check("cross-origin mutation blocked", (await call("POST", `/api/ideas/${id}/action`, { action: "save" }, { Origin: "https://evil.example" })).status === 403);
  check("unknown idea → 404", (await call("POST", `/api/ideas/nope/action`, { action: "save" })).status === 404);
  check("vault status update", (await call("PATCH", `/api/vault/${id}`, { status: "exploring", notes: "<img src=x onerror=alert(1)>", tags: ["weekend"] })).status === 200);
  const col = await call("POST", "/api/collections", { name: "Hackathon shortlist" });
  check("create collection", col.status === 201);
  check("add to collection", (await call("POST", `/api/collections/${col.data.collection.id}/items`, { ideaId: id, member: true })).status === 200);
  const vault = await call("GET", "/api/vault");
  check("vault lists 2 items", vault.data.items.length === 2, vault.data.items?.length);
  check("notes stored verbatim (rendered as text, not HTML)", vault.data.items.some((i) => i.notes.includes("<img")));
  const md = await call("GET", "/api/vault/export");
  check("markdown export", typeof md.data === "string" && md.data.includes("# Idea Vault"));
  const own = await call("POST", "/api/ideas", { title: "Library seat finder", summary: "See free seats live", category: "education" });
  check("capture own idea", own.status === 201);
  const hide = await call("POST", `/api/ideas/${feed.data.items[2].idea.id}/action`, { action: "hide" });
  check("hide", hide.status === 200);
  const after = await call("GET", "/api/feed?limit=40");
  check("hidden idea excluded", !after.data.items.some((i) => i.idea.id === feed.data.items[2].idea.id));

  console.log("Thinking Gym");
  const gymPage = await call("GET", "/gym");
  const slug = String(gymPage.data).match(/href="\/gym\/([a-z0-9-]+)"/)?.[1];
  check("gym page links an exercise", !!slug);
  check("short answer rejected", (await call("POST", "/api/gym/submit", { challengeSlug: slug, response: "too short" })).status === 400);
  const sub = await call("POST", "/api/gym/submit", { challengeSlug: slug, response: "I would start by interviewing five people who face this weekly, then prototype the cheapest version." });
  check("submit reveals perspectives", sub.status === 201 && sub.data.perspectives.length >= 3, sub.data);
  check("streak starts at 1", sub.data.stats?.current === 1, sub.data.stats);

  console.log("Preferences");
  check("update preferences", (await call("PATCH", "/api/preferences", { categories: ["hardware", "education"], exploration: 0.3 })).status === 200);
  check("invalid category rejected", (await call("PATCH", "/api/preferences", { categories: ["nope"] })).status === 400);
  check("reset personalization", (await call("POST", "/api/preferences/reset", {})).status === 200);

  console.log("AI endpoints without a key fail honestly");
  const gen = await call("POST", "/api/lab/generate", { style: "practical", count: 2 });
  if (gen.status === 503) check("generate → 503 ai_not_configured", gen.data.code === "ai_not_configured", gen.data);
  else check("generate succeeded with AI configured", gen.status === 200 && gen.data.ideas.length === 2, gen.data);
  const rmx = await call("POST", "/api/remix", { concepts: ["Spotify"] });
  check("remix needs two inputs", rmx.status === 400);

  console.log("Pages (signed in)");
  for (const p of ["/", "/lab", "/remix", "/hackathon", "/vault", "/build", "/profile", "/settings", `/idea/${id}`, `/gym/${slug}`]) {
    const r = await call("GET", p);
    check(`${p} → 200`, r.status === 200, r.status);
  }
  check("other user's/unknown idea → 404", (await call("GET", "/idea/does-not-exist")).status === 404);

  console.log("Logout");
  check("logout", (await call("POST", "/api/auth/logout", {})).status === 200);
  cookie = "";
  check("session gone", (await call("GET", "/api/vault")).status === 401);
}

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
