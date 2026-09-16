const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function words0to99(n: number): string {
  const v = Math.round(n);
  if (v < 20) return ONES[v] ?? String(v);
  const t = Math.floor(v / 10);
  const o = v % 10;
  if (o === 0) return TENS[t] ?? String(v);
  return `${TENS[t]} ${ONES[o]}`;
}

function hundredsPart(n: number): string {
  return words0to99(n);
}

export function tradieNumber(n: number): string {
  const mm = Math.round(Math.abs(n));
  if (mm < 100) return words0to99(mm);
  if (mm < 1000) {
    const h = Math.floor(mm / 100);
    const rest = mm % 100;
    if (rest === 0) return `${ONES[h]} hundred`;
    if (rest === 50) return `${ONES[h]} fifty`;
    return `${ONES[h]} ${words0to99(rest)}`;
  }
  if (mm < 10000) {
    const h = Math.floor(mm / 100);
    const rest = mm % 100;
    if (rest === 0) return `${hundredsPart(h)} hundred`;
    if (rest === 50) return `${hundredsPart(h)} fifty`;
    return `${hundredsPart(h)} ${words0to99(rest)}`;
  }
  return String(mm)
    .split("")
    .map((d) => ONES[Number(d)] ?? d)
    .join(" ");
}

export function pickAuVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const au =
    voices.find((v) => v.lang === "en-AU") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en-au")) ??
    voices.find((v) => /australia/i.test(v.name)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return au ?? voices[0] ?? null;
}

function speakOne(text: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech is not available"));
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-AU";
    u.rate = rate;
    u.pitch = 1;
    const voice = pickAuVoice();
    if (voice) u.voice = voice;
    u.onend = () => resolve();
    u.onerror = (ev) => {
      if (ev.error === "canceled" || ev.error === "interrupted") {
        resolve();
        return;
      }
      reject(new Error(ev.error));
    };
    window.speechSynthesis.speak(u);
  });
}

export type SpeakHandle = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  done: Promise<void>;
};

export function speakLines(
  lines: string[],
  opts: { rate?: number; gapMs?: number; signal?: { cancelled: boolean } },
): SpeakHandle {
  const rate = opts.rate ?? 0.92;
  const gapMs = opts.gapMs ?? 2200;
  const signal = opts.signal ?? { cancelled: false };

  const stop = () => {
    signal.cancelled = true;
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
  };
  const pause = () => {
    if (typeof window !== "undefined") window.speechSynthesis.pause();
  };
  const resume = () => {
    if (typeof window !== "undefined") window.speechSynthesis.resume();
  };

  const done = (async () => {
    for (const line of lines) {
      if (signal.cancelled) return;
      await speakOne(line, rate);
      if (signal.cancelled) return;
      await new Promise((r) => setTimeout(r, gapMs));
    }
  })();

  return { stop, pause, resume, done };
}
