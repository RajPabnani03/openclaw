/**
 * Voice interaction service for talk mode and voice wake.
 * Manages microphone access, speech recognition, and TTS.
 */

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface VoiceServiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
}

export class VoiceService {
  private state: VoiceState = "idle";
  private callbacks: VoiceServiceCallbacks;

  constructor(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
  }

  /** Get the current voice state. */
  getState(): VoiceState {
    return this.state;
  }

  /** Start listening for voice input (talk mode). */
  startListening(): void {
    if (this.state !== "idle") return;
    this.setState("listening");

    // In production:
    // - Request microphone permission
    // - Start speech recognition via platform APIs
    // - Stream audio to on-device or cloud STT
  }

  /** Stop listening and process the recorded audio. */
  stopListening(): void {
    if (this.state !== "listening") return;
    this.setState("processing");

    // In production:
    // - Stop speech recognition
    // - Send final transcript to chat
  }

  /** Cancel the current voice interaction. */
  cancel(): void {
    this.setState("idle");
  }

  /** Play TTS audio for a text response. */
  speak(text: string): void {
    if (!text.trim()) return;
    this.setState("speaking");

    // In production:
    // - Use platform TTS (AVSpeechSynthesizer / TextToSpeech)
    // - Or stream from gateway edge TTS

    // Simulate completion
    setTimeout(() => {
      if (this.state === "speaking") {
        this.setState("idle");
      }
    }, 1000);
  }

  /** Clean up resources. */
  dispose(): void {
    this.cancel();
  }

  private setState(state: VoiceState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }
}
