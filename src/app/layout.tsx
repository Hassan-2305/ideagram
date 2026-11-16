import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/shell";
import { getUser } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai/client";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Idea Gym — train your creative thinking", template: "%s · Idea Gym" },
  description: "Discover real problems, remix ideas, train creative thinking and turn inspiration into buildable projects.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#07061a" },
    { media: "(prefers-color-scheme: dark)", color: "#07061a" },
  ],
};

// Applies the saved theme before paint to avoid a flash.
// Dark (the glass look) unless the viewer picked light.
const themeScript = `try{var t=localStorage.getItem("ig.theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProviders user={user} aiEnabled={aiConfigured()}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
