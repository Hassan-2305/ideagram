import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { listCollections, listVault, vaultStats } from "@/lib/repo/vault";
import { PageHeader } from "@/components/ui";
import { VaultBoard } from "./board";

export const metadata: Metadata = { title: "Idea Vault" };

export default async function VaultPage() {
  const user = await requireUser("/vault");
  return (
    <>
      <PageHeader
        eyebrow="Idea Vault"
        title="Your library of sparks"
        description="Everything you've saved, with notes, tags, collections and where each idea stands — from “interesting” to “completed”."
      />
      <VaultBoard initialItems={listVault(user.id)} initialCollections={listCollections(user.id)} stats={vaultStats(user.id)} />
    </>
  );
}
