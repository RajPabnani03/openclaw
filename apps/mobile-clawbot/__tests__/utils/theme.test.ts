import { describe, it, expect } from "vitest";
import { lightColors, darkColors } from "../../src/theme/colors";
import { typography } from "../../src/theme/typography";
import { spacing, radii } from "../../src/theme/spacing";

describe("lightColors", () => {
  it("has all required color keys", () => {
    const requiredKeys = [
      "background",
      "surface",
      "primary",
      "error",
      "textPrimary",
      "textSecondary",
      "userBubble",
      "assistantBubble",
      "statusConnected",
      "statusDisconnected",
    ];
    for (const key of requiredKeys) {
      expect(lightColors).toHaveProperty(key);
      expect(typeof (lightColors as Record<string, string>)[key]).toBe("string");
    }
  });

  it("has light background", () => {
    expect(lightColors.background).toBe("#FFFFFF");
  });
});

describe("darkColors", () => {
  it("has the same keys as lightColors", () => {
    const lightKeys = Object.keys(lightColors).sort();
    const darkKeys = Object.keys(darkColors).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it("has dark background", () => {
    expect(darkColors.background).toBe("#1F1F1F");
  });
});

describe("typography", () => {
  it("defines expected text styles", () => {
    expect(typography.h1.fontSize).toBe(28);
    expect(typography.body.fontSize).toBe(16);
    expect(typography.caption.fontSize).toBe(12);
    expect(typography.code.fontFamily).toBeDefined();
  });

  it("all styles have fontSize and lineHeight", () => {
    for (const [, style] of Object.entries(typography)) {
      expect(typeof style.fontSize).toBe("number");
      expect(typeof style.lineHeight).toBe("number");
    }
  });
});

describe("spacing", () => {
  it("has expected values", () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(24);
  });

  it("values increase monotonically", () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe("radii", () => {
  it("has expected values", () => {
    expect(radii.sm).toBe(4);
    expect(radii.full).toBe(9999);
  });
});
