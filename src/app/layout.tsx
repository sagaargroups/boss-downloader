// ============================================
// Root Layout — Mantine Provider + Dark Theme
// ============================================

import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boss Downloader — Ultra-Fast OTT Video Downloader",
  description:
    "Premium video downloader with bulk processing, switchable engines (yt-dlp, aria2, N_m3u8DL-RE), and offline-first architecture.",
  keywords: ["video downloader", "yt-dlp", "aria2", "ott downloader", "bulk download"],
};

const theme = createTheme({
  primaryColor: "violet",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  defaultRadius: "md",
  colors: {
    dark: [
      "#f0f0f5",
      "#d4d4e0",
      "#8b8ba7",
      "#5b5b7a",
      "#3a3a55",
      "#1a1a2e",
      "#12121f",
      "#0a0a1a",
      "#070714",
      "#050510",
    ],
  },
  other: {
    bgGlass: "rgba(255, 255, 255, 0.03)",
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <NavigationProgress />
          <Notifications position="top-right" zIndex={9999} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
