import LocalizedSite, {metadataFor, type Search} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
export function generateMetadata() {return metadataFor('en','/contact');}
export default async function Page({searchParams}:{searchParams:Promise<Search>}) {return <LocalizedSite locale="en" path="/contact" search={await searchParams}/>;}
