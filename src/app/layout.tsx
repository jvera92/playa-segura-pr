import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Playa Segura PR · Beach Safety & Conditions",
  description: "Real-time beach conditions and safety information for Puerto Rico. Know before you go.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
