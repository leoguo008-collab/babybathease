import type {MetadataRoute} from 'next';
import {siteUrl,indexable} from '@/lib/seo';
export default function robots():MetadataRoute.Robots {
  return {rules:indexable?{userAgent:'*',allow:'/',disallow:['/admin-eric','/api/']}:{userAgent:'*',disallow:'/'},sitemap:`${siteUrl}/sitemap.xml`};
}
