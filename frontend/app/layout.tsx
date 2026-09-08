import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Personalized Medicine AI | Clinician workspace",
  description:
    "Synthetic clinical decision-support prototype. Not validated for patient care.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
