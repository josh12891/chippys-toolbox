package com.josh12891.tradiestoolbox;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Native Android TTS for Play marks.
 *
 * Android System WebView either omits speechSynthesis or exposes a silent stub.
 * Chrome on Android speaks; the Capacitor WebView does not, so running
 * measurements must use {@link TextToSpeech} on STREAM_MUSIC.
 */
@CapacitorPlugin(name = "SiteTts")
public class SiteTtsPlugin extends Plugin {

    private static final float DEFAULT_VOLUME = 1.0f;

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Map<String, PluginCall> pending = new ConcurrentHashMap<>();
    private final CountDownLatch ready = new CountDownLatch(1);

    private TextToSpeech tts;
    private int initStatus = TextToSpeech.ERROR;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        tts = new TextToSpeech(getContext().getApplicationContext(), status -> {
            initStatus = status;
            if (status == TextToSpeech.SUCCESS && tts != null) {
                tts.setAudioAttributes(mediaAttrs());
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {}

                    @Override
                    public void onDone(String utteranceId) {
                        finishOk(utteranceId);
                    }

                    @Override
                    public void onError(String utteranceId) {
                        finishErr(utteranceId, "Text-to-speech failed");
                    }

                    @Override
                    public void onError(String utteranceId, int errorCode) {
                        finishErr(utteranceId, "Text-to-speech failed");
                    }

                    @Override
                    public void onStop(String utteranceId, boolean interrupted) {
                        finishOk(utteranceId);
                    }
                });
            }
            ready.countDown();
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        io.execute(() -> {
            if (!waitUntilReady(call)) {
                return;
            }
            getBridge().executeOnMainThread(() -> startSpeak(call));
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        io.execute(() -> {
            waitUntilReady(null);
            getBridge().executeOnMainThread(() -> {
                if (tts != null) {
                    tts.stop();
                }
                resolveAllPending();
                abandonFocus();
                call.resolve();
            });
        });
    }

    @Override
    protected void handleOnDestroy() {
        io.shutdownNow();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        abandonFocus();
        super.handleOnDestroy();
    }

    private boolean waitUntilReady(PluginCall call) {
        try {
            if (!ready.await(8, TimeUnit.SECONDS)) {
                if (call != null) {
                    call.reject("Text-to-speech is still starting");
                }
                return false;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            if (call != null) {
                call.reject("Text-to-speech interrupted");
            }
            return false;
        }
        if (tts == null || initStatus != TextToSpeech.SUCCESS) {
            if (call != null) {
                call.reject(
                    "Text-to-speech is not available on this device. Install a speech engine in system settings."
                );
            }
            return false;
        }
        return true;
    }

    private void startSpeak(PluginCall call) {
        if (tts == null || initStatus != TextToSpeech.SUCCESS) {
            call.reject(
                "Text-to-speech is not available on this device. Install a speech engine in system settings."
            );
            return;
        }
        String text = call.getString("text", "");
        if (text == null || text.isEmpty()) {
            call.resolve();
            return;
        }
        applyLanguage(call.getString("lang", "en-AU"));
        float rate = clamp(call.getFloat("rate", 1.0f), 0.1f, 2.0f);
        float pitch = clamp(call.getFloat("pitch", 1.0f), 0.1f, 2.0f);
        float volume = clamp(call.getFloat("volume", DEFAULT_VOLUME), 0.0f, 1.0f);
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);

        String id = UUID.randomUUID().toString();
        pending.put(id, call);
        requestFocus();

        Bundle params = new Bundle();
        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
        if (result == TextToSpeech.ERROR) {
            pending.remove(id);
            abandonFocus();
            call.reject("Text-to-speech failed to start");
        }
    }

    private void applyLanguage(String lang) {
        Locale requested = Locale.forLanguageTag(lang != null ? lang : "en-AU");
        Locale[] candidates = new Locale[] {
            requested,
            new Locale("en", "AU"),
            Locale.UK,
            Locale.US,
            Locale.ENGLISH
        };
        for (Locale loc : candidates) {
            int avail = tts.isLanguageAvailable(loc);
            if (avail >= TextToSpeech.LANG_AVAILABLE) {
                tts.setLanguage(loc);
                return;
            }
        }
    }

    private void finishOk(String utteranceId) {
        PluginCall call = pending.remove(utteranceId);
        if (call != null) {
            call.resolve();
        }
        if (pending.isEmpty()) {
            abandonFocus();
        }
    }

    private void finishErr(String utteranceId, String message) {
        PluginCall call = pending.remove(utteranceId);
        if (call != null) {
            call.reject(message);
        }
        if (pending.isEmpty()) {
            abandonFocus();
        }
    }

    private void resolveAllPending() {
        for (PluginCall call : pending.values()) {
            call.resolve();
        }
        pending.clear();
    }

    private static AudioAttributes mediaAttrs() {
        return new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .setLegacyStreamType(AudioManager.STREAM_MUSIC)
            .build();
    }

    private void requestFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(mediaAttrs())
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(
                null,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            );
        }
    }

    private void abandonFocus() {
        if (audioManager == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) {
            audioManager.abandonAudioFocusRequest(focusRequest);
            focusRequest = null;
        } else {
            audioManager.abandonAudioFocus(null);
        }
    }

    private static float clamp(Float value, float min, float max) {
        float v = value == null ? min : value;
        return Math.max(min, Math.min(max, v));
    }
}
