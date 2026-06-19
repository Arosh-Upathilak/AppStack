"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { SUBSCRIPTIONS, PRODUCTS, INVOICES } from "@/data/mock";

interface Result {
  key: string;
  label: string;
  meta: string;
  group: "Products" | "Subscriptions" | "Invoices";
  href: string;
}

/** Map a free-text product name (e.g. an invoice line) to a marketplace product page. */
function productHref(name: string): string {
  const lower = name.toLowerCase();
  const match = PRODUCTS.find(p => lower.includes(p.name.toLowerCase()));
  return match ? `/marketplace/${match.id}` : "/marketplace";
}

function buildResults(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const has = (s: string) => s.toLowerCase().includes(q);

  const products: Result[] = PRODUCTS.filter(p => has(p.name) || has(p.vendor) || has(p.category))
    .slice(0, 5)
    .map(p => ({ key: `p-${p.id}`, label: p.name, meta: `${p.vendor} · ${p.category}`, group: "Products", href: `/marketplace/${p.id}` }));

  const subs: Result[] = SUBSCRIPTIONS.filter(s => has(s.name) || has(s.vendor) || has(s.category))
    .slice(0, 4)
    .map(s => ({ key: `s-${s.id}`, label: s.name, meta: `${s.plan} · ${s.vendor}`, group: "Subscriptions", href: productHref(s.name) }));

  const invoices: Result[] = INVOICES.filter(i => has(i.id) || has(i.product))
    .slice(0, 4)
    .map(i => ({ key: `i-${i.id}`, label: i.id, meta: i.product, group: "Invoices", href: productHref(i.product) }));

  return [...products, ...subs, ...invoices];
}

export default function TopbarSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const blurTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = React.useMemo(() => buildResults(query), [query]);

  // ⌘K / Ctrl+K focuses the search.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      go(results[0].href);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="tb-search" style={{ position: "relative" }}>
      <Icon name="search" size={14} className="tb-search-icon" />
      <input
        ref={inputRef}
        value={query}
        placeholder="Search subscriptions, products, invoices…"
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
        onKeyDown={onKeyDown}
      />
      <span className="tb-kbd">⌘ K</span>

      {showDropdown && (
        <div
          role="listbox"
          onMouseDown={() => { if (blurTimer.current) clearTimeout(blurTimer.current); }}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            background: "var(--surface-1, #fff)", border: "1px solid var(--line, #e5e7eb)",
            borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", overflow: "hidden",
            maxHeight: 360, overflowY: "auto",
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--ink-4, #9ca3af)" }}>
              No matches for “{query.trim()}”.
            </div>
          ) : (
            results.map((r, i) => {
              const firstOfGroup = i === 0 || results[i - 1].group !== r.group;
              return (
                <React.Fragment key={r.key}>
                  {firstOfGroup && (
                    <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 600, letterSpacing: 0.06, textTransform: "uppercase", color: "var(--ink-4, #9ca3af)" }}>
                      {r.group}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => go(r.href)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                      width: "100%", textAlign: "left", padding: "8px 14px", border: "none",
                      background: "transparent", cursor: "pointer",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2, #f3f4f6)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-1, #111827)" }}>{r.label}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-4, #9ca3af)" }}>{r.meta}</span>
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
