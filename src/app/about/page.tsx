import LocalizedSite, {metadataFor, type Search} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
export function generateMetadata() {return metadataFor('en','/about');}
export default async function Page({searchParams}:{searchParams:Promise<Search>}) {return <LocalizedSite locale="en" path="/about" search={await searchParams}/>;}
