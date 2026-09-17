import { Capacitor } from "@capacitor/core";
import { SiteTts } from "./site-tts";

export const SPEECH_UNAVAILABLE =
  "Speech is not available. Check the device volume and that text-to-speech is installed.";

export const DEFAULT_SPEAK_VOLUME = 1;

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

export function shouldUseNativeTts(
  platform: string = typeof Capacitor !== "undefined" ? Capacitor.getPlatform() : "web",
): boolean {
  return platform === "android";
}

export function pickAuVoice(
  voices: SpeechSynthesisVoice[] | null = null,
): SpeechSynthesisVoice | null {
  const list =
    voices ??
    (typeof window !== "undefined" && window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : []);
  const au =
    list.find((v) => v.lang === "en-AU") ??
    list.find((v) => v.lang.toLowerCase().startsWith("en-au")) ??
    list.find((v) => /australia/i.test(v.name)) ??
    list.find((v) => v.lang.toLowerCase().startsWith("en"));
  return au ?? list[0] ?? null;
}

export type SpeakEngine = {
  speak: (text: string, opts: { rate: number }) => Promise<void>;
  cancel: () => void;
};

export type SpeakHandle = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  done: Promise<void>;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createNativeEngine(): SpeakEngine {
  return {
    speak: (text, opts) =>
      SiteTts.speak({
        text,
        lang: "en-AU",
        rate: opts.rate,
        pitch: 1,
        volume: DEFAULT_SPEAK_VOLUME,
      }),
    cancel: () => {
      void SiteTts.stop();
    },
  };
}

function friendlySpeechError(code: string | undefined): string {
  switch (code) {
    case "canceled":
    case "interrupted":
      return "";
    case "synthesis-failed":
    case "synthesis-unavailable":
    case "audio-hardware":
    case "language-unavailable":
    case "voice-unavailable":
    case "not-allowed":
    case "audio-busy":
      return SPEECH_UNAVAILABLE;
    default:
      return SPEECH_UNAVAILABLE;
  }
}

export function createWebSpeechEngine(
  synth: SpeechSynthesis | null = typeof window !== "undefined"
    ? window.speechSynthesis
    : null,
): SpeakEngine {
  if (!synth) {
    return {
      speak: async () => {
        throw new Error(SPEECH_UNAVAILABLE);
      },
      cancel: () => {},
    };
  }

  let settleAfterCancel = false;
  let voicesReady: Promise<void> | null = null;

  const waitForVoices = () => {
    if (synth.getVoices().length > 0) return Promise.resolve();
    if (voicesReady) return voicesReady;
    voicesReady = new Promise((resolve) => {
      const done = () => {
        synth.removeEventListener("voiceschanged", done);
        resolve();
      };
      synth.addEventListener("voiceschanged", done);
      synth.getVoices();
      setTimeout(done, 1500);
    });
    return voicesReady;
  };

  const speakUtterance = (
    text: string,
    rate: number,
    lang: string,
    voice: SpeechSynthesisVoice | null,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      u.volume = DEFAULT_SPEAK_VOLUME;
      u.rate = rate;
      u.pitch = 1;
      u.lang = lang;
      if (voice) u.voice = voice;
      u.onend = () => resolve();
      u.onerror = (ev) => {
        if (ev.error === "canceled" || ev.error === "interrupted") {
          resolve();
          return;
        }
        reject(new Error(friendlySpeechError(ev.error)));
      };
      if (synth.paused) synth.resume();
      synth.speak(u);
    });

  return {
    speak: async (text, opts) => {
      await waitForVoices();
      if (settleAfterCancel) {
        await delay(80);
        settleAfterCancel = false;
      }
      const keepAlive = setInterval(() => {
        if (!synth.speaking) return;
        synth.pause();
        synth.resume();
      }, 9000);
      const voice = pickAuVoice(synth.getVoices());
      try {
        await speakUtterance(text, opts.rate, voice?.lang || "en-AU", voice);
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message === SPEECH_UNAVAILABLE) {
          try {
            await speakUtterance(text, opts.rate, "en", null);
            return;
          } catch {
            throw new Error(SPEECH_UNAVAILABLE);
          }
        }
        throw err;
      } finally {
        clearInterval(keepAlive);
      }
    },
    cancel: () => {
      settleAfterCancel = true;
      synth.cancel();
    },
  };
}

export function getSpeakEngine(
  platform: string = typeof Capacitor !== "undefined" ? Capacitor.getPlatform() : "web",
): SpeakEngine {
  if (shouldUseNativeTts(platform)) return createNativeEngine();
  return createWebSpeechEngine();
}

export function speakLines(
  lines: string[],
  opts: {
    rate?: number;
    gapMs?: number;
    signal?: { cancelled: boolean };
    engine?: SpeakEngine;
  },
): SpeakHandle {
  const rate = opts.rate ?? 0.92;
  const gapMs = opts.gapMs ?? 2200;
  const signal = opts.signal ?? { cancelled: false };
  const engine = opts.engine ?? getSpeakEngine();

  let paused = false;
  let resumeWait: (() => void) | null = null;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;
  let gapResolve: (() => void) | null = null;

  const skipGap = () => {
    if (gapTimer != null) {
      clearTimeout(gapTimer);
      gapTimer = null;
    }
    gapResolve?.();
    gapResolve = null;
  };

  const waitWhilePaused = async () => {
    while (paused && !signal.cancelled) {
      await new Promise<void>((resolve) => {
        resumeWait = resolve;
      });
      resumeWait = null;
    }
  };

  const gap = (ms: number) =>
    new Promise<void>((resolve) => {
      gapResolve = resolve;
      gapTimer = setTimeout(() => {
        gapTimer = null;
        gapResolve = null;
        resolve();
      }, ms);
    });

  const stop = () => {
    signal.cancelled = true;
    paused = false;
    skipGap();
    engine.cancel();
    resumeWait?.();
  };
  const pause = () => {
    if (signal.cancelled || paused) return;
    paused = true;
    skipGap();
    engine.cancel();
  };
  const resume = () => {
    if (!paused) return;
    paused = false;
    resumeWait?.();
  };

  const done = (async () => {
    for (let i = 0; i < lines.length; ) {
      if (signal.cancelled) return;
      await waitWhilePaused();
      if (signal.cancelled) return;
      try {
        await engine.speak(lines[i], { rate });
      } catch (err) {
        if (signal.cancelled || paused) {
          await waitWhilePaused();
          continue;
        }
        throw err;
      }
      if (signal.cancelled) return;
      if (paused) {
        await waitWhilePaused();
        continue;
      }
      i += 1;
      if (i >= lines.length || signal.cancelled) return;
      await gap(gapMs);
    }
  })();

  return { stop, pause, resume, done };
}
