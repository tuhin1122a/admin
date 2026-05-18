import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/auth";
import AppLayout from "@/components/apy-layout";
import { SessionProvider } from "next-auth/react";
import { findCurrentUser } from "@/lib/admin";
import Login from "@/components/login";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Panle",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await findCurrentUser();
  const session = await auth();
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          integrity="sha512-..."
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${geistSans.variable} font-no ${geistMono.variable} antialiased dark bg-background text-foreground`}
      >
        <SessionProvider session={session}>
          <StoreProvider>
            {admin && <AppLayout>{children}</AppLayout>}
            {!admin && <Login />}
          </StoreProvider>
        </SessionProvider>

        <Toaster />
      </body>
    </html>
  );
}
