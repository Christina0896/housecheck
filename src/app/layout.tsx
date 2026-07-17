import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://housecheck.ie"),
  title: {
    default: "HouseCheck — understand the land around every home",
    template: "%s | HouseCheck",
  },
  description:
    "A private Irish property research dashboard that exposes acreage and measures distance to lakes, coastline and woodland.",
  applicationName: "HouseCheck",
  openGraph: {
    title: "HouseCheck",
    description:
      "Find homes by acreage, lakeside, seaside and forest setting.",
    type: "website",
    locale: "en_IE",
  },
};

export const viewport: Viewport = {
  themeColor: "#173f35",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#f8f7f2] text-stone-900">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
