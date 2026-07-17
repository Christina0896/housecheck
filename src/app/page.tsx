import { PropertyExplorer } from "@/components/property-explorer";
import { getPropertyFeed } from "@/lib/property-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { properties, mode } = await getPropertyFeed();
  return <PropertyExplorer mode={mode} properties={properties} />;
}
