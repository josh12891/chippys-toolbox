import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NumberField, Segmented } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RunningDiagram } from "@/components/diagrams";
import { formatMm, parseNum } from "@/lib/format";
import {
  computeRunning,
  type RunningCountMode,
  type RunningLayout,
} from "@/lib/running";
import { speakLines, tradieNumber, type SpeakHandle } from "@/lib/speak";

type Pace = "slow" | "site" | "quick";

const PACE: Record<Pace, { gapMs: number; rate: number; label: string }> = {
  slow: { gapMs: 3800, rate: 0.82, label: "Slow" },
  site: { gapMs: 2400, rate: 0.92, label: "Site" },
  quick: { gapMs: 1200, rate: 1.05, label: "Quick" },
};

type Face = "left" | "centre" | "right";

export function RunningTool() {
  const [overall, setOverall] = useState("");
  const [member, setMember] = useState("90");
  const [layout, setLayout] = useState<RunningLayout>("ends");
  const [countMode, setCountMode] = useState<RunningCountMode>("members");
  const [count, setCount] = useState("5");
  const [maxGap, setMaxGap] = useState("450");
  const [face, setFace] = useState<Face>("left");
  const [pace, setPace] = useState<Pace>("site");
  const [status, setStatus] = useState<"idle" | "speaking" | "paused">("idle");
  const handle = useRef<SpeakHandle | null>(null);
  const signal = useRef({ cancelled: false });

  const result = useMemo(() => {
    const L = parseNum(overall);
    const T = parseNum(member);
    const n = parseNum(count) ?? 0;
    const g = parseNum(maxGap) ?? 0;
    if (L == null || T == null) return null;
    return computeRunning({
      overall: L,
      member: T,
      layout,
      countMode,
      count: n,
      maxGap: g,
    });
  }, [count, countMode, layout, maxGap, member, overall]);

  const markValue = (m: { left: number; centre: number; right: number }) =>
    face === "left" ? m.left : face === "centre" ? m.centre : m.right;

  const lines = useMemo(() => {
    if (!result) return [];
    const intro = [
      "Running measurements.",
      `Overall ${tradieNumber(result.overall)}.`,
      `Member ${tradieNumber(result.member)}.`,
      `${result.members} ${layout === "ends" ? "studs" : "balusters"}.`,
      `Centres ${tradieNumber(result.centres)}.`,
      `Clear gap ${tradieNumber(result.gap)}.`,
      `Marks to the ${face} face, from the left.`,
    ];
    const marks = result.marks.map(
      (m) => `Mark ${m.index}. ${tradieNumber(markValue(m))}.`,
    );
    return [...intro, ...marks, "That's the lot."];
  }, [face, layout, result]);

  const stop = () => {
    signal.current.cancelled = true;
    handle.current?.stop();
    handle.current = null;
    setStatus("idle");
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const kick = () => {
      synth.getVoices();
    };
    kick();
    synth.addEventListener("voiceschanged", kick);
    return () => {
      signal.current.cancelled = true;
      synth.cancel();
      synth.removeEventListener("voiceschanged", kick);
    };
  }, []);

  const play = async () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (!lines.length) return;
    if (status === "paused") {
      handle.current?.resume();
      setStatus("speaking");
      return;
    }
    stop();
    const sig = { cancelled: false };
    signal.current = sig;
    setStatus("speaking");
    const h = speakLines(lines, {
      ...PACE[pace],
      signal: sig,
    });
    handle.current = h;
    try {
      await h.done;
    } catch {
      // Headless browsers and locked audio contexts fail quietly.
    } finally {
      if (handle.current === h && !sig.cancelled) setStatus("idle");
    }
  };

  const pause = () => {
    handle.current?.pause();
    setStatus("paused");
  };

  return (
    <AppShell
      title="Running measurements"
      subtitle="Equal centres for frames and balustrades. Play them while you mark."
      back
    >
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Set-out</CardTitle>
          <CardDescription>
            Studs sit on the ends. Balusters sit between posts, equal gaps each
            side.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-4">
          <Segmented
            ariaLabel="Layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: "ends", label: "Studs / frame" },
              { value: "between", label: "Balustrade" },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              id="overall"
              label="Overall length"
              value={overall}
              onChange={setOverall}
              unit="mm"
              step={50}
            />
            <NumberField
              id="member"
              label={layout === "ends" ? "Stud width" : "Baluster width"}
              value={member}
              onChange={setMember}
              unit="mm"
              step={5}
            />
          </div>
          <Segmented
            ariaLabel="How to count"
            value={countMode}
            onChange={setCountMode}
            options={[
              { value: "members", label: "Count" },
              { value: "spaces", label: "Spaces" },
              { value: "max", label: "Max gap" },
            ]}
          />
          {countMode === "max" ? (
            <NumberField
              id="max"
              label={layout === "ends" ? "Max centres" : "Max clear gap"}
              value={maxGap}
              onChange={setMaxGap}
              unit="mm"
              step={10}
              hint={
                layout === "between"
                  ? "NCC infill: 125 mm sphere must not pass"
                  : "Walls often 450 or 600 centres"
              }
            />
          ) : (
            <NumberField
              id="count"
              label={countMode === "members" ? "Number of members" : "Number of spaces"}
              value={count}
              onChange={setCount}
              step={1}
              min={1}
            />
          )}
        </div>
      </Card>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sheet">
        <RunningDiagram result={result} />
      </div>

      {result ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Card className="p-3">
              <p className="text-xs text-muted">Members</p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {result.members}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted">Centres</p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {formatMm(result.centres)}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted">Clear gap</p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {formatMm(result.gap)}
              </p>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Read-out</CardTitle>
              <CardDescription>
                Play the running marks and tick them on the tape as you hear them.
              </CardDescription>
            </CardHeader>
            <div className="flex flex-col gap-3">
              <Segmented
                ariaLabel="Mark face"
                value={face}
                onChange={setFace}
                options={[
                  { value: "left", label: "Left face" },
                  { value: "centre", label: "Centre" },
                  { value: "right", label: "Right face" },
                ]}
              />
              <Segmented
                ariaLabel="Read-out pace"
                value={pace}
                onChange={setPace}
                options={[
                  { value: "slow", label: "Slow" },
                  { value: "site", label: "Site" },
                  { value: "quick", label: "Quick" },
                ]}
              />
              <div className="flex gap-2">
                {status === "speaking" ? (
                  <Button className="flex-1" variant="secondary" onClick={pause}>
                    <Pause className="size-4" />
                    Pause
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={() => void play()}>
                    <Play className="size-4" />
                    {status === "paused" ? "Resume" : "Play marks"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={stop}
                  disabled={status === "idle"}
                >
                  <Square className="size-4" />
                  Stop
                </Button>
              </div>
              <p className="text-xs text-muted">
                Speaks millimetres in site talk, with a {PACE[pace].gapMs / 1000}s
                gap between marks.
              </p>
            </div>
          </Card>

          <Card className="mt-4">
            <CardTitle className="mb-3">Running list</CardTitle>
            <ol className="flex flex-col">
              {result.marks.map((m) => (
                <li
                  key={m.index}
                  className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 text-sm last:border-0"
                >
                  <span className="text-muted">{m.index}</span>
                  <span className="font-display text-xl font-semibold tabular-nums">
                    {formatMm(markValue(m))}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}
