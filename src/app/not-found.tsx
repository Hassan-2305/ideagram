import { Compass } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg pt-10">
      <EmptyState
        icon={<Compass size={20} />}
        title="This page doesn't exist"
        description="The idea may be private to another account, or the link is wrong."
        action={<ButtonLink href="/discover">Back to Discover</ButtonLink>}
      />
    </div>
  );
}
