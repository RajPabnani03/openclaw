import { describe, it, expect, vi, beforeEach } from "vitest";
import { VoiceService } from "../../src/services/voice-service";
import type { VoiceServiceCallbacks } from "../../src/services/voice-service";

describe("VoiceService", () => {
  let callbacks: VoiceServiceCallbacks;
  let service: VoiceService;

  beforeEach(() => {
    callbacks = {
      onStateChange: vi.fn(),
      onTranscript: vi.fn(),
      onError: vi.fn(),
    };
    service = new VoiceService(callbacks);
  });

  describe("initial state", () => {
    it("starts idle", () => {
      expect(service.getState()).toBe("idle");
    });
  });

  describe("startListening", () => {
    it("transitions to listening", () => {
      service.startListening();
      expect(service.getState()).toBe("listening");
      expect(callbacks.onStateChange).toHaveBeenCalledWith("listening");
    });

    it("does nothing if already listening", () => {
      service.startListening();
      vi.mocked(callbacks.onStateChange).mockClear();
      service.startListening();
      expect(callbacks.onStateChange).not.toHaveBeenCalled();
    });
  });

  describe("stopListening", () => {
    it("transitions to processing from listening", () => {
      service.startListening();
      service.stopListening();
      expect(service.getState()).toBe("processing");
      expect(callbacks.onStateChange).toHaveBeenCalledWith("processing");
    });

    it("does nothing if not listening", () => {
      vi.mocked(callbacks.onStateChange).mockClear();
      service.stopListening();
      expect(callbacks.onStateChange).not.toHaveBeenCalled();
    });
  });

  describe("cancel", () => {
    it("transitions to idle from any state", () => {
      service.startListening();
      service.cancel();
      expect(service.getState()).toBe("idle");
    });
  });

  describe("speak", () => {
    it("transitions to speaking", () => {
      service.speak("Hello world");
      expect(service.getState()).toBe("speaking");
      expect(callbacks.onStateChange).toHaveBeenCalledWith("speaking");
    });

    it("does nothing for empty text", () => {
      service.speak("");
      expect(service.getState()).toBe("idle");
    });

    it("does nothing for whitespace-only text", () => {
      service.speak("   ");
      expect(service.getState()).toBe("idle");
    });
  });

  describe("dispose", () => {
    it("returns to idle state", () => {
      service.startListening();
      service.dispose();
      expect(service.getState()).toBe("idle");
    });
  });
});
