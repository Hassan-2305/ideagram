"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui";

export function ResetPersonalization() {
  const { toast } = useApp();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!confirm)
    return (
      <Button variant="secondary" onClick={() => setConfirm(true)}>
        <RotateCcw size={15} /> Reset personalization
      </Button>
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px] text-ink">This can&apos;t be undone.</span>
      <Button
        variant="danger"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/preferences/reset", { body: {} });
            toast("Personalization reset", "success");
            setConfirm(false);
            router.refresh();
          } catch (e) {
            toast(errorMessage(e), "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        Yes, reset
      </Button>
      <Button variant="ghost" onClick={() => setConfirm(false)}>
        Cancel
      </Button>
    </div>
  );
}
