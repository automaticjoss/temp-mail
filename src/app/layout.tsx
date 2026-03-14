import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TMailDash — Admin Dashboard",
  description: "Temp mail inbound email admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-[family-name:var(--font-poppins)] antialiased bg-slate-50 text-slate-800`}
      >
        {children}
      </body>
    </html>
  );
}
