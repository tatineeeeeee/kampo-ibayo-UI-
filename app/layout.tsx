import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
