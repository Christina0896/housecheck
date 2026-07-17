import { PropertyExplorer } from "@/components/property-explorer";
import { getProperties } from "@/lib/property-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await getProperties();
  return <PropertyExplorer properties={properties} />;
}
