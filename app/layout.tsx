import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import Script from "next/script";
import Plausible from "plausible-tracker";
import { useMemo } from "react";
import GlobalShortcut from "@/components/GlobalShortcut";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fandom Sucks",
  description:
    "So I made this site that allows you to explore Fandom wikis with a clean, simplified interface and without all the browser debilitating ads and bloat and bologna.",
};

export function usePlausible() {
  // Only initialize once per app
  const plausible = useMemo(() => {
    return Plausible({
      domain: "fandom-sucks.indexlabs.dev",
      apiHost: "https://plausible.indexlabs.dev",
    });
  }, []);

  return plausible;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://plausible.io/js/script.js"
          data-domain="fandom.sucks"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>
        <GlobalShortcut />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed bottom-4 right-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
