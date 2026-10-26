'use client';
import {useState, type FormEvent} from 'react';
import type {UI} from '@/i18n/dictionaries';
import styles from '@/app/contact/contact.module.css';

export default function LocalizedContactForm({ui}: {ui: UI}) {
  const [state,setState] = useState<'idle'|'sending'|'success'|'error'>('idle');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setState('sending');
    const body = Object.fromEntries(new FormData(form));
    const query = new URLSearchParams(window.location.search);
    if (query.get('product')) body.message = `[${[query.get('product'),query.get('color'),query.get('size')].filter(Boolean).join(' / ')}] ${body.message}`;
    try {
      const response = await fetch('/api/public/inquiries', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if (!response.ok) throw new Error();
      form.reset();setState('success');
    } catch {setState('error');}
  }
  return <section id="quote" className={styles.formCard}><h2>{ui.quote}</h2><p>{ui.contactIntro} <span>* {ui.required}</span></p><form onSubmit={submit}>
    <div className={styles.twoFields}><Field name="contact_name" label={ui.name}/><Field name="email" label={ui.email} type="email"/></div>
    <Field name="company" label={ui.company}/><Field name="phone" label={ui.phone} type="tel" required={false}/>
    <div className={styles.twoFields}><label><span>{ui.inquiryType} *</span><select name="inquiry_type" required defaultValue=""><option value="" disabled>{ui.selectInquiry}</option><option value="OEM / ODM">OEM / ODM</option><option value="Wholesale">{ui.wholesale}</option><option value="Product sourcing">{ui.sourcing}</option></select></label>
    <label><span>{ui.quantity} *</span><select name="quantity" required defaultValue=""><option value="" disabled>{ui.selectQuantity}</option>{ui.quantityRanges.map((label,index)=><option key={label} value={['Under 500 units','500–2,000 units','2,000–10,000 units','Over 10,000 units'][index]}>{label}</option>)}</select></label></div>
    <Field name="market" label={ui.market}/><label><span>{ui.message} *</span><textarea name="message" required rows={5}/></label>
    <button type="submit" className={styles.submit} disabled={state==='sending'}>{state==='sending'?ui.sending:ui.send}</button>
    {state==='success'&&<p role="status" className={styles.success}>{ui.success}</p>}{state==='error'&&<p role="alert" className={styles.error}>{ui.error}</p>}
  </form></section>;
}
function Field({name,label,type='text',required=true}:{name:string;label:string;type?:string;required?:boolean}) {
  return <label><span>{label}{required?' *':''}</span><input name={name} type={type} required={required} autoComplete={name==='contact_name'?'name':name==='email'?'email':name==='company'?'organization':undefined}/></label>;
}
