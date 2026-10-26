"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import useContactEmail from "@/hooks/use-contact-email";

export default function SiteFooter() {
  const email = useContactEmail();
  return <footer><div className="shell footer-main"><Link href="/" className="brand footer-brand"><span className="brand-mark" /><span className="brand-word"><b>Baby</b><strong>Bath</strong></span></Link><p>Safe Babies. Brighter Tomorrows.</p><nav><Link href="/">Home</Link><Link href="/products">Products</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link></nav><a className="footer-email" href={`mailto:${email}`}><Mail size={16} /> {email}</a></div><div className="shell footer-bottom"><span>© 2026 Baby Bath Ease. All rights reserved.</span></div></footer>;
}
