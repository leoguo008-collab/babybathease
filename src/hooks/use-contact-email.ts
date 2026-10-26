"use client";

import { useEffect, useState } from "react";

export const defaultContactEmail = "official@babybathease.com";

export default function useContactEmail() {
  const [email, setEmail] = useState(defaultContactEmail);
  useEffect(() => {
    fetch("/api/public/settings", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((settings: { email?: string } | null) => { if (settings?.email?.trim()) setEmail(settings.email.trim()); })
      .catch(() => undefined);
  }, []);
  return email;
}
