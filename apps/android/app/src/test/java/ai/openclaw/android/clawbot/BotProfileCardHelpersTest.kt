package ai.openclaw.android.clawbot

import ai.openclaw.android.ui.clawbot.parseHexColor
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Tests for UI helper functions in the ClawBot feature.
 */
class BotProfileCardHelpersTest {

  @Test
  fun parseHexColor_parsesStandardSixDigitHex() {
    val color = parseHexColor("#1D5DD8")
    // Red component: 0x1D = 29 → 29/255 ≈ 0.1137
    assertEquals(29f / 255f, color.red, 0.001f)
    // Green component: 0x5D = 93 → 93/255 ≈ 0.3647
    assertEquals(93f / 255f, color.green, 0.001f)
    // Blue component: 0xD8 = 216 → 216/255 ≈ 0.8471
    assertEquals(216f / 255f, color.blue, 0.001f)
    // Alpha must be 1.0 (fully opaque)
    assertEquals(1.0f, color.alpha, 0.001f)
  }

  @Test
  fun parseHexColor_parsesWithoutLeadingHash() {
    val withHash = parseHexColor("#2D8A5F")
    val withoutHash = parseHexColor("2D8A5F")
    assertEquals(withHash.red, withoutHash.red, 0.001f)
    assertEquals(withHash.green, withoutHash.green, 0.001f)
    assertEquals(withHash.blue, withoutHash.blue, 0.001f)
  }

  @Test
  fun parseHexColor_fallsBackToDefaultOnInvalidInput() {
    val fallback = parseHexColor("not-a-color")
    val expected = parseHexColor("#1D5DD8")
    assertEquals(expected.red, fallback.red, 0.001f)
    assertEquals(expected.green, fallback.green, 0.001f)
    assertEquals(expected.blue, fallback.blue, 0.001f)
  }

  @Test
  fun parseHexColor_fallsBackToDefaultOnEmptyString() {
    val fallback = parseHexColor("")
    val expected = parseHexColor("#1D5DD8")
    assertEquals(expected.red, fallback.red, 0.001f)
  }

  @Test
  fun parseHexColor_allBuiltInProfileAccentColorsAreValid() {
    DefaultBotProfiles.all.forEach { profile ->
      val color = parseHexColor(profile.accentHex)
      // Valid colors must have alpha = 1.0 (not the default fallback path gone wrong).
      assertEquals(
        "Profile '${profile.id}' accent color '${profile.accentHex}' must parse correctly",
        1.0f,
        color.alpha,
        0.001f,
      )
    }
  }
}
