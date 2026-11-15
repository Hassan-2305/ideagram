import { IdeaCardSkeleton } from "@/components/idea-card";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-4 h-10 w-2/3 max-w-lg" />
      <div className="skeleton mt-3 h-4 w-1/2 max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <IdeaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
