import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kampo Ibayo Resort - Paradise Awaits",
  description: "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
  keywords: "resort, vacation, booking, luxury, relaxation, paradise, getaway, hotel",
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
    description: "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
    images: ["/logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kampo Ibayo Resort - Paradise Awaits",
    description: "Experience luxury and relaxation at Kampo Ibayo Resort. Book your perfect getaway with stunning views, exceptional service, and unforgettable memories.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-ico.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="shortcut icon" href="/logo-ico.ico" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
