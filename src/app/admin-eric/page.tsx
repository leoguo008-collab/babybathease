"use client";

import Image from "next/image";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    setLoading(false);
    if (!response.ok) {
      const message = (await response.json()).error || "Sign-in failed.";
      setError(message);
      window.alert(message);
      return;
    }
    router.push("/admin-eric/home");
    router.refresh();
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginBrand} aria-label="Baby Bath admin brand panel">
        <div className={styles.bubbleOne} /><div className={styles.bubbleTwo} /><div className={styles.bubbleThree} />
        <Image src="/images/baby-bath-logo.png" alt="Baby Bath" width={340} height={208} priority className={styles.loginLogo} />
        <div className={styles.brandImageWrap}>
          <Image src="/images/hero-baby-bath.png" alt="Happy baby in a bath" fill priority sizes="(max-width: 900px) 100vw, 52vw" className={styles.brandImage} />
        </div>
        <p className={styles.brandMessage}>Clean little moments<br />Brighter tomorrows</p>
      </section>

      <section className={styles.loginPanel}>
        <form className={styles.loginForm} onSubmit={signIn}>
          <p className={styles.adminKicker}>Baby Bath Admin</p>
          <h1>Welcome back</h1>
          <p className={styles.loginIntro}>Sign in to manage your products, inquiries and website content.</p>
          <label>
            <span>Login name</span>
            <div className={styles.inputShell}><Mail size={21} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your login name" required /></div>
          </label>
          <label>
            <span>Password</span>
            <div className={styles.inputShell}><LockKeyhole size={21} /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={21} /> : <Eye size={21} />}</button></div>
          </label>
          <div className={styles.loginOptions}>
            <label className={styles.checkbox}><input type="checkbox" /> <span>Remember me</span></label>
            <button type="button" className={styles.textButton}>Forgot password?</button>
          </div>
          {error && <p className={styles.loginError}>{error}</p>}
          <button type="submit" className={styles.signInButton} disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span>→</span></button>
          <p className={styles.securityNote}><ShieldCheck size={17} /> Your data is protected and encrypted.</p>
        </form>
      </section>
    </main>
  );
}
