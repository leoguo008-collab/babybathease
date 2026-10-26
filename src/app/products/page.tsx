import LocalizedSite, {metadataFor, type Search} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
export function generateMetadata() {return metadataFor('en','/products');}
export default async function Page({searchParams}:{searchParams:Promise<Search>}) {return <LocalizedSite locale="en" path="/products" search={await searchParams}/>;}
