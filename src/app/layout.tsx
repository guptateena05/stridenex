// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { EntitlementProvider } from "@/context/EntitlementContext";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StrideNex - Pathways to Your Future",
  description: "",
  icons: {
    icon: '/images/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <EntitlementProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </EntitlementProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}