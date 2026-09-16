import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" />
      <path
        d="M8 8h6v2H10v14H8V8zm8 6h8v2h-6v8h-2V14z"
        fill="var(--color-primary-fg)"
      />
    </svg>
  );
}

export function StairsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21h5v-4h4v-4h4V9h5" />
      <path d="M3 21V8" />
    </svg>
  );
}

export function TriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20V5l16 15H4z" />
      <path d="M4 16h4v4" />
    </svg>
  );
}
