import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, Ruler } from "lucide-react";
import { BrandMark, StairsIcon, TriangleIcon } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TOOLS = [
  {
    to: "/concrete" as const,
    num: "01",
    title: "Concrete volume",
    copy: "Slabs, strip footings and piers. Height, width, depth — answer in m³ with a drawing.",
    icon: Layers,
  },
  {
    to: "/stairs" as const,
    num: "02",
    title: "Stair set-out",
    copy: "Rise, going and landings to NCC Housing and AS 1657. Max 18 risers before a landing.",
    icon: StairsIcon,
  },
  {
    to: "/running" as const,
    num: "03",
    title: "Running measurements",
    copy: "Equal centres for frames and balustrades. Play the marks while you tick the tape.",
    icon: Ruler,
  },
  {
    to: "/triangle" as const,
    num: "04",
    title: "Triangle Calculator",
    copy: "Right-angle calculator. Enter sides or angles, tap Calculate, and the drawing fills in.",
    icon: TriangleIcon,
  },
];

function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <BrandMark className="size-12" />
          <p className="font-display text-xs font-semibold uppercase tracking-display text-muted">
            On-site set-out
          </p>
        </div>
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          The Chippy's Toolbox
        </h1>
        <p className="mt-3 max-w-md text-base leading-normal text-muted">
          Concrete, stairs, running measurements and a 90° triangle — built for the tape, not the office.
        </p>
      </header>

      <nav aria-label="Tools" className="flex flex-col gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className={cn(
              "group flex items-stretch gap-4 rounded-xl border border-border bg-surface p-4 shadow-sheet",
              "transition-[transform,box-shadow] duration-150 ease-out active:scale-[0.98]",
            )}
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <tool.icon className="size-6" />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xs font-semibold tracking-display text-muted">
                  {tool.num}
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {tool.title}
                </h2>
              </div>
              <p className="mt-1 text-sm leading-snug text-muted">{tool.copy}</p>
            </div>
            <ArrowRight className="mt-4 size-5 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </nav>

      <p className="mt-auto pt-10 text-xs leading-normal text-subtle">
        Stair limits follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018.
        Confirm with the certifier on the job.
      </p>
    </div>
  );
}
