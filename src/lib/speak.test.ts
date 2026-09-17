import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SPEAK_VOLUME,
  SPEECH_UNAVAILABLE,
  createWebSpeechEngine,
  getSpeakEngine,
  pickAuVoice,
  shouldUseNativeTts,
  speakLines,
  tradieNumber,
  type SpeakEngine,
} from "./speak.ts";

function mockEngine(): SpeakEngine & { spoken: string[]; cancelled: number } {
  const spoken: string[] = [];
  let cancelled = 0;
  let wait: (() => void) | null = null;
  return {
    spoken,
    get cancelled() {
      return cancelled;
    },
    speak: async (text) => {
      spoken.push(text);
      await new Promise<void>((resolve) => {
        wait = resolve;
        queueMicrotask(resolve);
      });
      wait = null;
    },
    cancel: () => {
      cancelled += 1;
      wait?.();
    },
  };
}

describe("tradieNumber", () => {
  it("reads millimetres in site talk", () => {
    expect(tradieNumber(90)).toBe("ninety");
    expect(tradieNumber(450)).toBe("four fifty");
    expect(tradieNumber(1200)).toBe("twelve hundred");
    expect(tradieNumber(1250)).toBe("twelve fifty");
    expect(tradieNumber(2310)).toBe("twenty three ten");
  });
});

describe("TTS routing", () => {
  it("uses native Android TTS in the Capacitor WebView", () => {
    expect(shouldUseNativeTts("android")).toBe(true);
    expect(shouldUseNativeTts("web")).toBe(false);
    expect(shouldUseNativeTts("ios")).toBe(false);
  });

  it("does not bind the native plugin on web", async () => {
    await expect(getSpeakEngine("web").speak("hello", { rate: 1 })).rejects.toThrow(
      SPEECH_UNAVAILABLE,
    );
  });
});

describe("pickAuVoice", () => {
  it("prefers en-AU then any English voice", () => {
    const voices = [
      { lang: "en-US", name: "Samantha" },
      { lang: "en-AU", name: "Karen" },
      { lang: "de-DE", name: "Anna" },
    ] as SpeechSynthesisVoice[];
    expect(pickAuVoice(voices)?.name).toBe("Karen");
    expect(pickAuVoice([{ lang: "en-GB", name: "Daniel" }] as SpeechSynthesisVoice[])?.name).toBe(
      "Daniel",
    );
  });
});

describe("speakLines", () => {
  it("speaks each line then stops", async () => {
    const engine = mockEngine();
    const handle = speakLines(["Mark one.", "Mark two."], {
      gapMs: 0,
      engine,
    });
    await handle.done;
    expect(engine.spoken).toEqual(["Mark one.", "Mark two."]);
  });

  it("stops without speaking remaining lines", async () => {
    let release!: () => void;
    const spoken: string[] = [];
    const engine: SpeakEngine = {
      speak: (text) => {
        spoken.push(text);
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      },
      cancel: () => release(),
    };
    const signal = { cancelled: false };
    const handle = speakLines(["A", "B"], { gapMs: 0, signal, engine });
    await vi.waitFor(() => expect(spoken).toEqual(["A"]));
    handle.stop();
    await handle.done;
    expect(spoken).toEqual(["A"]);
    expect(signal.cancelled).toBe(true);
  });

  it("pause interrupts and resume continues the list", async () => {
    const spoken: string[] = [];
    let blocked: (() => void) | null = null;
    const engine: SpeakEngine = {
      speak: (text) => {
        spoken.push(text);
        if (text === "A" && spoken.filter((line) => line === "A").length === 1) {
          return new Promise<void>((resolve) => {
            blocked = resolve;
          });
        }
        return Promise.resolve();
      },
      cancel: () => blocked?.(),
    };
    const handle = speakLines(["A", "B"], { gapMs: 0, engine });
    await vi.waitFor(() => expect(spoken).toEqual(["A"]));
    handle.pause();
    handle.resume();
    await handle.done;
    expect(spoken[0]).toBe("A");
    expect(spoken.at(-1)).toBe("B");
  });
});

describe("web speech engine", () => {
  it("rejects clearly when speechSynthesis is missing", async () => {
    const engine = createWebSpeechEngine(null);
    await expect(engine.speak("hello", { rate: 1 })).rejects.toThrow(SPEECH_UNAVAILABLE);
  });

  it("speaks at full volume with an Australian voice when possible", async () => {
    const spoken: SpeechSynthesisUtterance[] = [];
    const karen = {
      lang: "en-AU",
      name: "Karen",
      default: true,
      localService: true,
      voiceURI: "karen",
    } as SpeechSynthesisVoice;
    const synth = {
      paused: false,
      speaking: false,
      pending: false,
      getVoices: () => [karen],
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      speak(utterance: SpeechSynthesisUtterance) {
        spoken.push(utterance);
        utterance.onend?.(new Event("end") as SpeechSynthesisEvent);
      },
    } as unknown as SpeechSynthesis;

    const Original = globalThis.SpeechSynthesisUtterance;
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 0;
      voice: SpeechSynthesisVoice | null = null;
      onend: ((ev: SpeechSynthesisEvent) => void) | null = null;
      onerror: ((ev: SpeechSynthesisErrorEvent) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    globalThis.SpeechSynthesisUtterance =
      FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
    try {
      const engine = createWebSpeechEngine(synth);
      await engine.speak("Running measurements.", { rate: 0.92 });
      expect(spoken).toHaveLength(1);
      expect(spoken[0]?.volume).toBe(DEFAULT_SPEAK_VOLUME);
      expect(spoken[0]?.voice?.name).toBe("Karen");
      expect(spoken[0]?.lang).toBe("en-AU");
    } finally {
      globalThis.SpeechSynthesisUtterance = Original;
    }
  });

  it("retries in English and reports a clear error if the engine fails", async () => {
    const spoken: SpeechSynthesisUtterance[] = [];
    const synth = {
      paused: false,
      speaking: false,
      pending: false,
      getVoices: () => [],
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      speak(utterance: SpeechSynthesisUtterance) {
        spoken.push(utterance);
        utterance.onerror?.({
          error: "synthesis-failed",
        } as SpeechSynthesisErrorEvent);
      },
    } as unknown as SpeechSynthesis;

    const Original = globalThis.SpeechSynthesisUtterance;
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      volume = 0;
      voice: SpeechSynthesisVoice | null = null;
      onend: ((ev: SpeechSynthesisEvent) => void) | null = null;
      onerror: ((ev: SpeechSynthesisErrorEvent) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    globalThis.SpeechSynthesisUtterance =
      FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
    try {
      const engine = createWebSpeechEngine(synth);
      await expect(engine.speak("Running measurements.", { rate: 0.92 })).rejects.toThrow(
        SPEECH_UNAVAILABLE,
      );
      expect(spoken).toHaveLength(2);
      expect(spoken[0]?.volume).toBe(DEFAULT_SPEAK_VOLUME);
      expect(spoken[0]?.lang).toBe("en-AU");
      expect(spoken[1]?.lang).toBe("en");
      expect(spoken[1]?.volume).toBe(DEFAULT_SPEAK_VOLUME);
    } finally {
      globalThis.SpeechSynthesisUtterance = Original;
    }
  });
});
