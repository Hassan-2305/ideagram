"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Check, Download, FolderPlus, Hammer, Library, MoreHorizontal, Pencil, Plus, Search, Shuffle, Tag, Trash2, X } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { CATEGORIES, categoryLabel, VAULT_STATUSES, type Idea, type VaultStatus } from "@/lib/types";
import { useApp } from "@/components/providers";
import { Button, buttonClass, cx, EmptyState, Input, Label, Select, Textarea } from "@/components/ui";

interface VaultItem {
  idea: Idea;
  status: VaultStatus;
  notes: string;
  tags: string[];
  savedAt: string;
  updatedAt: string;
  collectionIds: string[];
}
interface Collection {
  id: string;
  name: string;
  description: string;
  count: number;
}

const STATUS_STYLE: Record<VaultStatus, string> = {
  interesting: "bg-surface-2 text-ink-2",
  exploring: "bg-warn-soft text-warn",
  planned: "bg-accent-soft text-accent-text",
  building: "bg-accent text-accent-ink",
  completed: "bg-success-soft text-success",
  archived: "bg-surface-3 text-ink-3",
};

function ItemRow({
  item,
  collections,
  selected,
  onSelect,
  onChange,
  onRemove,
  onMembership,
}: {
  item: VaultItem;
  collections: Collection[];
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<VaultItem>) => void;
  onRemove: () => void;
  onMembership: (cid: string, member: boolean) => void;
}) {
  const { toast } = useApp();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes);
  const [tagDraft, setTagDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = async (p: { status?: VaultStatus; notes?: string; tags?: string[] }) => {
    try {
      await api(`/api/vault/${item.idea.id}`, { method: "PATCH", body: p });
      return true;
    } catch (e) {
      toast(errorMessage(e), "error");
      return false;
    }
  };

  const onNotes = (v: string) => {
    setNotes(v);
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (await patch({ notes: v })) {
        onChange({ notes: v });
        setSaveState("saved");
      }
    }, 700);
  };

  const addTag = async () => {
    const t = tagDraft.trim().toLowerCase().slice(0, 30);
    if (!t || item.tags.includes(t)) return setTagDraft("");
    const tags = [...item.tags, t].slice(0, 12);
    setTagDraft("");
    onChange({ tags });
    if (!(await patch({ tags }))) onChange({ tags: item.tags });
  };
  const removeTag = async (t: string) => {
    const tags = item.tags.filter((x) => x !== t);
    onChange({ tags });
    if (!(await patch({ tags }))) onChange({ tags: item.tags });
  };

  return (
    <li className={cx("rounded-2xl border bg-surface transition-colors", selected ? "border-accent" : "border-line")}>
      <div className="flex items-start gap-3 p-4 md:p-5">
        <input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select ${item.idea.title}`} className="mt-1.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{categoryLabel(item.idea.category)}</span>
            {item.idea.sourceKind !== "editorial" ? <span className="text-[11px] text-ink-3">· {item.idea.sourceName}</span> : null}
          </div>
          <Link href={`/idea/${item.idea.id}`} className="mt-1 block text-[16px] font-semibold leading-snug text-ink hover:text-accent-text">
            {item.idea.title}
          </Link>
          <p className={cx("mt-1 text-[13.5px] leading-relaxed text-ink-2", !open && "line-clamp-2")}>{item.idea.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {item.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-2.5 pr-1 text-[12px] text-ink-2">
                #{t}
                <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`} className="rounded-full p-0.5 text-ink-3 hover:text-ink">
                  <X size={11} />
                </button>
              </span>
            ))}
            {item.collectionIds.map((cid) => {
              const c = collections.find((x) => x.id === cid);
              return c ? (
                <span key={cid} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[12px] text-ink-3">
                  <Library size={11} /> {c.name}
                </span>
              ) : null;
            })}
            {item.notes && !open ? <span className="text-[12px] text-ink-3">· has notes</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Select
            aria-label="Status"
            value={item.status}
            onChange={async (e) => {
              const status = e.target.value as VaultStatus;
              const prev = item.status;
              onChange({ status });
              if (!(await patch({ status }))) onChange({ status: prev });
            }}
            className={cx("h-8 w-auto rounded-lg border-0 py-0 pl-2.5 pr-3 text-[12.5px] font-medium capitalize", STATUS_STYLE[item.status])}
          >
            {VAULT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <div className="relative flex gap-0.5">
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Notes and tags" className={buttonClass("ghost", "icon", "h-8 w-8")}>
              <Pencil size={15} />
            </button>
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="More" className={buttonClass("ghost", "icon", "h-8 w-8")}>
              <MoreHorizontal size={15} />
            </button>
            {menu ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-float animate-pop">
                  <Link role="menuitem" href={`/build/new?idea=${item.idea.id}`} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
                    <Hammer size={14} /> Convert into a project
                  </Link>
                  {collections.length ? <p className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-wider text-ink-3">Collections</p> : null}
                  {collections.map((c) => {
                    const member = item.collectionIds.includes(c.id);
                    return (
                      <button key={c.id} role="menuitemcheckbox" aria-checked={member} onClick={() => onMembership(c.id, !member)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-2 hover:bg-surface-2 hover:text-ink">
                        <span className={cx("grid h-4 w-4 place-items-center rounded border", member ? "border-accent bg-accent text-accent-ink" : "border-line-strong")}>{member ? <Check size={11} /> : null}</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
                  <div className="my-1 h-px bg-line" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onRemove();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
                  >
                    <Trash2 size={14} /> Remove from vault
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <div className="grid gap-4 border-t border-line p-4 animate-fade-in md:grid-cols-[1fr_240px] md:p-5">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor={`notes-${item.idea.id}`} className="text-[12.5px] font-medium text-ink-2">
                Notes
              </label>
              <span className="text-[11.5px] text-ink-3" aria-live="polite">
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
              </span>
            </div>
            <Textarea id={`notes-${item.idea.id}`} value={notes} onChange={(e) => onNotes(e.target.value)} maxLength={10000} className="min-h-32 text-[14px]" placeholder="What excites you about it? What would you change? Who could you build it with?" />
          </div>
          <div>
            <label htmlFor={`tag-${item.idea.id}`} className="mb-1.5 block text-[12.5px] font-medium text-ink-2">
              Add tag
            </label>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addTag();
              }}
            >
              <Input id={`tag-${item.idea.id}`} value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} maxLength={30} className="h-9 text-sm" placeholder="e.g. weekend" />
              <Button type="submit" size="sm" variant="secondary" className="h-9" aria-label="Add tag">
                <Tag size={14} />
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function CaptureDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (item: VaultItem) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/40 p-4 animate-fade-in sm:place-items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-float animate-pop"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError(null);
          try {
            const r = await api<{ idea: Idea }>("/api/ideas", {
              body: {
                title: f.get("title"),
                summary: f.get("summary"),
                problem: f.get("problem") || "",
                solution: f.get("solution") || "",
                category: f.get("category"),
                difficulty: f.get("difficulty"),
                stack: String(f.get("stack") || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            });
            const now = new Date().toISOString();
            onCreated({ idea: r.idea, status: "interesting", notes: "", tags: [], savedAt: now, updatedAt: now, collectionIds: [] });
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id="capture-title" className="font-serif text-2xl text-ink">
            Capture your own idea
          </h2>
          <button type="button" onClick={onClose} className={buttonClass("ghost", "icon")} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" name="title" required minLength={3} maxLength={120} autoFocus />
          </div>
          <div>
            <Label htmlFor="c-summary">One-line summary</Label>
            <Input id="c-summary" name="summary" required maxLength={400} />
          </div>
          <div>
            <Label htmlFor="c-problem">Problem (optional)</Label>
            <Textarea id="c-problem" name="problem" maxLength={2000} className="min-h-20" />
          </div>
          <div>
            <Label htmlFor="c-solution">Solution (optional)</Label>
            <Textarea id="c-solution" name="solution" maxLength={2000} className="min-h-20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="c-cat">Category</Label>
              <Select id="c-cat" name="category" defaultValue="everyday">
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="c-diff">Difficulty</Label>
              <Select id="c-diff" name="difficulty" defaultValue="intermediate">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="c-stack">Stack (comma separated)</Label>
            <Input id="c-stack" name="stack" maxLength={300} placeholder="e.g. React Native, SQLite" />
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save to vault
          </Button>
        </div>
      </form>
    </div>
  );
}

export function VaultBoard({ initialItems, initialCollections, stats }: { initialItems: VaultItem[]; initialCollections: Collection[]; stats: Record<string, number> }) {
  const { toast } = useApp();
  const [items, setItems] = useState(initialItems);
  const [collections, setCollections] = useState(initialCollections);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [collection, setCollection] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [newCollection, setNewCollection] = useState<string | null>(null);
  const [capture, setCapture] = useState(false);
  void stats;
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [items]);

  const allTags = useMemo(() => [...new Set(items.flatMap((i) => i.tags))].sort(), [items]);
  const visible = items.filter((i) => {
    if (status && i.status !== status) return false;
    if (!status && i.status === "archived") return false;
    if (collection && !i.collectionIds.includes(collection)) return false;
    if (tag && !i.tags.includes(tag)) return false;
    if (q) {
      const s = q.toLowerCase();
      return [i.idea.title, i.idea.summary, i.notes, i.tags.join(" "), i.idea.stack.join(" ")].some((x) => x.toLowerCase().includes(s));
    }
    return true;
  });

  const update = (id: string, patch: Partial<VaultItem>) => setItems((cur) => cur.map((i) => (i.idea.id === id ? { ...i, ...patch } : i)));

  const remove = async (id: string) => {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.idea.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    try {
      await api(`/api/vault/${id}`, { method: "DELETE" });
      toast("Removed from vault", "info");
    } catch (e) {
      setItems(prev);
      toast(errorMessage(e), "error");
    }
  };

  const membership = async (ideaId: string, cid: string, member: boolean) => {
    const item = items.find((i) => i.idea.id === ideaId)!;
    update(ideaId, { collectionIds: member ? [...item.collectionIds, cid] : item.collectionIds.filter((x) => x !== cid) });
    setCollections((cs) => cs.map((c) => (c.id === cid ? { ...c, count: c.count + (member ? 1 : -1) } : c)));
    try {
      await api(`/api/collections/${cid}/items`, { body: { ideaId, member } });
    } catch (e) {
      update(ideaId, { collectionIds: item.collectionIds });
      toast(errorMessage(e), "error");
    }
  };

  const createCollection = async (name: string) => {
    try {
      const r = await api<{ collection: Collection }>("/api/collections", { body: { name } });
      setCollections((c) => [...c, r.collection]);
      if (selected.length) {
        for (const id of selected) await membership(id, r.collection.id, true);
        toast(`Created “${name}” with ${selected.length} idea${selected.length === 1 ? "" : "s"}`, "success");
      } else toast(`Created “${name}”`, "success");
      setNewCollection(null);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const deleteCollection = async (c: Collection) => {
    if (!window.confirm(`Delete the collection “${c.name}”? The ideas stay in your vault.`)) return;
    try {
      await api(`/api/collections/${c.id}`, { method: "DELETE" });
      setCollections((cs) => cs.filter((x) => x.id !== c.id));
      setItems((cur) => cur.map((i) => ({ ...i, collectionIds: i.collectionIds.filter((x) => x !== c.id) })));
      if (collection === c.id) setCollection("");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  if (items.length === 0)
    return (
      <>
        <EmptyState
          icon={<Library size={20} />}
          title="Nothing saved yet"
          description="Tap the bookmark on any idea to keep it here. Add notes, organize into collections, and track it all the way to “completed”."
          action={
            <div className="flex gap-2">
              <Link href="/discover" className={buttonClass("primary")}>
                Discover ideas
              </Link>
              <Button variant="secondary" onClick={() => setCapture(true)}>
                <Plus size={15} /> Capture your own
              </Button>
            </div>
          }
        />
        {capture ? (
          <CaptureDialog
            onClose={() => setCapture(false)}
            onCreated={(it) => {
              setItems([it]);
              setCapture(false);
            }}
          />
        ) : null}
      </>
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Status</p>
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
            {[["", "Active", items.filter((i) => i.status !== "archived").length] as const, ...VAULT_STATUSES.map((s) => [s, s, counts[s] ?? 0] as const)].map(([value, label, n]) => (
              <button
                key={value || "all"}
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                className={cx("flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-[13.5px] capitalize", status === value ? "bg-surface-3/70 font-medium text-ink" : "text-ink-2 hover:bg-surface-2")}
              >
                {label} <span className="font-mono text-[11.5px] text-ink-3">{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Collections</p>
            <button onClick={() => setNewCollection("")} aria-label="New collection" className="rounded p-1 text-ink-3 hover:text-ink">
              <FolderPlus size={14} />
            </button>
          </div>
          {newCollection !== null ? (
            <form
              className="mb-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (newCollection.trim()) createCollection(newCollection.trim());
              }}
            >
              <Input autoFocus value={newCollection} onChange={(e) => setNewCollection(e.target.value)} maxLength={60} className="h-9 text-sm" placeholder={selected.length ? `Name (adds ${selected.length} selected)` : "Collection name"} onBlur={() => !newCollection.trim() && setNewCollection(null)} />
            </form>
          ) : null}
          <div className="space-y-0.5">
            {collections.map((c) => (
              <div key={c.id} className="group flex items-center">
                <button
                  onClick={() => setCollection(collection === c.id ? "" : c.id)}
                  aria-pressed={collection === c.id}
                  className={cx("flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13.5px]", collection === c.id ? "bg-surface-3/70 font-medium text-ink" : "text-ink-2 hover:bg-surface-2")}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="font-mono text-[11.5px] text-ink-3">{c.count}</span>
                </button>
                <button onClick={() => deleteCollection(c)} aria-label={`Delete collection ${c.name}`} className="rounded p-1 text-ink-3 opacity-0 hover:text-danger focus:opacity-100 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {collections.length === 0 && newCollection === null ? <p className="px-3 text-[12.5px] text-ink-3">Group ideas for a hackathon, a client or a theme.</p> : null}
          </div>
        </div>
        {allTags.length ? (
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button key={t} onClick={() => setTag(tag === t ? "" : t)} aria-pressed={tag === t} className={cx("rounded-full px-2.5 py-0.5 text-[12px]", tag === t ? "bg-ink text-bg" : "bg-surface-2 text-ink-2 hover:text-ink")}>
                  #{t}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">Export</p>
          <a href={`/api/vault/export${collection ? `?collection=${collection}` : ""}`} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
            <Download size={13} /> Markdown{collection ? " (this collection)" : ""}
          </a>
          <a href={`/api/vault/export?format=json${collection ? `&collection=${collection}` : ""}`} className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink">
            <Download size={13} /> JSON
          </a>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, notes, tags, stack…" className="pl-10" aria-label="Search your vault" />
          </div>
          <Button variant="secondary" onClick={() => setCapture(true)}>
            <Plus size={15} /> Capture idea
          </Button>
        </div>

        {selected.length ? (
          <div className="sticky top-16 z-10 mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2 pl-4 shadow-card animate-fade-in">
            <span className="text-[13px] text-ink">{selected.length} selected</span>
            <span className="flex-1" />
            {selected.length >= 2 && selected.length <= 4 ? (
              <Link href={`/remix?ids=${selected.join(",")}`} className={buttonClass("primary", "sm")}>
                <Shuffle size={14} /> Combine in Remix
              </Link>
            ) : selected.length > 4 ? (
              <span className="text-[12px] text-ink-3">Select up to 4 to combine</span>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => setNewCollection("")}>
              <FolderPlus size={14} /> New collection
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        ) : null}

        <p className="mb-3 mt-5 text-[13px] text-ink-3">
          {visible.length} idea{visible.length === 1 ? "" : "s"}
          {collection ? ` in ${collections.find((c) => c.id === collection)?.name}` : ""}
        </p>
        {visible.length === 0 ? (
          <EmptyState icon={<Search size={20} />} title="No matches" description="Try another search, status or collection." />
        ) : (
          <ul className="space-y-3">
            {visible.map((it) => (
              <ItemRow
                key={it.idea.id}
                item={it}
                collections={collections}
                selected={selected.includes(it.idea.id)}
                onSelect={() => setSelected((s) => (s.includes(it.idea.id) ? s.filter((x) => x !== it.idea.id) : [...s, it.idea.id]))}
                onChange={(p) => update(it.idea.id, p)}
                onRemove={() => remove(it.idea.id)}
                onMembership={(cid, m) => membership(it.idea.id, cid, m)}
              />
            ))}
          </ul>
        )}
      </div>
      {capture ? (
        <CaptureDialog
          onClose={() => setCapture(false)}
          onCreated={(it) => {
            setItems((cur) => [it, ...cur]);
            setCapture(false);
            toast("Captured to your vault", "success");
          }}
        />
      ) : null}
    </div>
  );
}
