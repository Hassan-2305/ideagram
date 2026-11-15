"use client";

import { useRouter } from "next/navigation";
import { PreferencesForm, type Prefs } from "@/components/preferences-form";

export function WelcomeForm({ initial }: { initial: Prefs }) {
  const router = useRouter();
  return <PreferencesForm initial={initial} mode="onboarding" onDone={() => router.push("/")} />;
}
