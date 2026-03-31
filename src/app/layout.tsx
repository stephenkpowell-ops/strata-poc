import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StrataProvider } from "@/lib/store";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strata",
  description: "Mental performance platform for high-achieving professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StrataProvider>
          {/* pb-16 ensures page content is never hidden behind the NavBar */}
          <div className="flex flex-col flex-1 pb-16">
            {children}
          </div>
          <NavBar />
        </StrataProvider>
      </body>
    </html>
  );
}
