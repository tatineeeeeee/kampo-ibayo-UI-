import type { Metadata } from "next";
// Temporarily comment out Google Fonts to resolve build connectivity issues
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// Temporarily disabled due to Google Fonts connectivity issues during build
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Kampo Ibayo Resort - Paradise Awaits",
  description:
    "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
  keywords:
    "resort, vacation, booking, luxury, relaxation, paradise, getaway, hotel",
  authors: [{ name: "Kampo Ibayo Resort" }],
  icons: {
    icon: [
      { url: "/logo-ico.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/logo-ico.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Kampo Ibayo Resort - Paradise Awaits",
    description:
      "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kampo Ibayo Resort - Paradise Awaits",
    description:
      "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" href="/logo-ico.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="shortcut icon" href="/logo-ico.ico" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Premium Google Fonts — Playfair Display for display headings, Lato for body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
