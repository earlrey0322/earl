import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PSPCS - Powered Solar Piso Charging Station | KLEOXM 111",
  description:
    "KLEOXM 111's Powered Solar Piso Charging Station (PSPCS) - Solar-powered charging for all devices. Find active stations, calculate charging costs, and subscribe for premium features.",
  keywords: "solar charging, piso charging, KLEOXM 111, PSPCS, solar panel, charging station",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
