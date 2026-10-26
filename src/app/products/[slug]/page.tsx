import LocalizedSite, {metadataFor} from '@/components/localized-site';
export const dynamic = 'force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props) {return metadataFor('en', '/products/'+(await params).slug);}
export default async function Page({params}:Props) {return <LocalizedSite locale="en" path={'/products/'+(await params).slug}/>;}
