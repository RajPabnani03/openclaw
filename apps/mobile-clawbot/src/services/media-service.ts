import type { OutgoingAttachment } from "../types/chat";

/**
 * Media capture and attachment service.
 * Handles camera capture, photo library access, and file encoding.
 */

export type MediaSource = "camera" | "library";

export interface MediaServiceCallbacks {
  onCaptureComplete: (attachment: OutgoingAttachment) => void;
  onError: (message: string) => void;
}

export class MediaService {
  private callbacks: MediaServiceCallbacks;

  constructor(callbacks: MediaServiceCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Capture a photo from the camera.
   * In production, uses react-native-vision-camera.
   */
  async capturePhoto(): Promise<OutgoingAttachment | null> {
    // In production:
    // 1. Request camera permission
    // 2. Open camera view
    // 3. Capture photo
    // 4. Encode to base64
    // 5. Return attachment
    return null;
  }

  /**
   * Pick an image from the photo library.
   * In production, uses @react-native-camera-roll/camera-roll.
   */
  async pickFromLibrary(): Promise<OutgoingAttachment | null> {
    // In production:
    // 1. Request photo library permission
    // 2. Open image picker
    // 3. Encode selected image to base64
    // 4. Return attachment
    return null;
  }

  /**
   * Encode a local file URI to a base64 OutgoingAttachment.
   */
  async encodeFileAsAttachment(
    uri: string,
    mimeType: string,
    fileName: string,
  ): Promise<OutgoingAttachment> {
    // In production:
    // const base64 = await RNFS.readFile(uri, 'base64');
    const base64 = ""; // placeholder

    const type = mimeType.startsWith("image/")
      ? "image"
      : mimeType.startsWith("video/")
        ? "video"
        : "file";

    return { type, mimeType, fileName, base64 };
  }

  /**
   * Resize an image to fit within maxDimension while preserving aspect ratio.
   * Returns the base64-encoded JPEG.
   */
  async resizeImage(
    _base64: string,
    _maxDimension: number,
    _quality: number,
  ): Promise<string> {
    // In production, use react-native-image-resizer
    return _base64;
  }
}
