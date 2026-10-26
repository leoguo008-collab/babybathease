import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ProjectCta() {
  return <section className="contact-section"><div className="shell contact-card"><div><span className="eyebrow">START YOUR PROJECT</span><h2>Let&apos;s build safer bath time together.</h2><p>Tell us about your product, quantity, and target market. Our team will prepare a tailored solution.</p></div><Link className="primary-button" href="/contact#quote">Get a Quote <ArrowRight size={18} /></Link></div></section>;
}
