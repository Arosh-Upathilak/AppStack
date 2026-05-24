import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import SessionTimeoutWrapper from "@/utils/SessionTimeoutWrapper";
import SessionProvider from "@/utils/SessionProvider";
import ToastProvider from "@/utils/ToastProvider";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AppStack — Subscription Manager",
  description:
    "Centralize licenses, billing and access control for your entire software stack.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SessionProvider session={session}>
          <SessionTimeoutWrapper />
          <ToastProvider>
          {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
