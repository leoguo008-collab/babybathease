"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Analytics must never prevent the product page from becoming interactive.
let memorySession = "";
function sessionId() {
  const key = "baby_bath_analytics_session";
  try { const existing = window.sessionStorage.getItem(key); if (existing) return existing; } catch { /* Storage can be disabled by browser privacy settings. */ }
  if (!memorySession) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    memorySession = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }
  try { window.sessionStorage.setItem(key, memorySession); } catch { /* Use the in-memory session. */ }
  return memorySession;
}

function searchTerm() {
  const params = new URLSearchParams(window.location.search);
  const directTerm = ["utm_term", "q", "query", "keyword", "search"].map((key) => params.get(key)).find(Boolean);
  if (directTerm) return directTerm.slice(0, 200);
  if (!document.referrer) return "";
  try {
    const referrer = new URL(document.referrer);
    if (!/(google|bing|yahoo|duckduckgo|baidu|yandex)/i.test(referrer.hostname)) return "";
    return ["q", "query", "p", "wd", "text"].map((key) => referrer.searchParams.get(key)).find(Boolean)?.slice(0, 200) || "";
  } catch { return ""; }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin-eric")) return;
    const startedAt = Date.now();
    const visitorSession = sessionId();
    const referrer = document.referrer ? new URL(document.referrer).origin : "";
    const term = searchTerm();
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      const body = JSON.stringify({ session_id: visitorSession, path: pathname, referrer, search_term: term, duration_seconds: Math.round((Date.now() - startedAt) / 1000) });
      if (navigator.sendBeacon) navigator.sendBeacon("/api/public/analytics", new Blob([body], { type: "application/json" }));
      else void fetch("/api/public/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };
    window.addEventListener("pagehide", send);
    return () => { window.removeEventListener("pagehide", send); send(); };
  }, [pathname]);
  return null;
}
