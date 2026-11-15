import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getPreferences } from "@/lib/repo/prefs";
import { Eyebrow } from "@/components/ui";
import { WelcomeForm } from "./form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await requireUser("/welcome");
  const prefs = getPreferences(user.id);
  return (
    <div className="mx-auto max-w-2xl pt-2">
      <Eyebrow className="text-accent-text">Welcome, {user.name.split(" ")[0]}</Eyebrow>
      <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.04] text-ink md:text-[3.2rem]">Let&apos;s tune your gym.</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
        Thirty seconds now makes your feed useful from the first scroll. Recommendations learn from what you save, remix and build — never from how long you stay.
      </p>
      <div className="mt-10">
        <WelcomeForm initial={prefs} />
      </div>
    </div>
  );
}
