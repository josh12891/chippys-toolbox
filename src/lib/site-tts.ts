import { registerPlugin } from "@capacitor/core";

export type SiteTtsPlugin = {
  speak: (options: {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
  }) => Promise<void>;
  stop: () => Promise<void>;
};

/** Native Android TTS. Unimplemented on web/iOS; those use speechSynthesis. */
export const SiteTts = registerPlugin<SiteTtsPlugin>("SiteTts");
