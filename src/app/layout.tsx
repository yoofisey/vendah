import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthTransitionProvider } from "@/components/auth-transition-splash";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://vendah-blue.vercel.app"
  ),
  title: "venfii — sell smarter",
  description:
    "Launch a branded storefront and sell on WhatsApp, Instagram and your business card.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=jewelry,health_and_beauty"
        />
      </head>
      <body>
        <AuthTransitionProvider>{children}</AuthTransitionProvider>
      </body>
    </html>
  );
}
