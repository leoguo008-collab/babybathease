import LocalizedSite, {metadataFor} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
export function generateMetadata() {return metadataFor('en','/products/adjustable-baby-shower-stand');}
export default function Page(){return <LocalizedSite locale="en" path="/products/adjustable-baby-shower-stand"/>;}
