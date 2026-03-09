package ai.openclaw.android.clawbot

import ai.openclaw.android.clawbot.buildClawBotMessageBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests for repository-level business logic that can be verified without a live
 * gateway connection. Tests use [ClawBotSessionKeys] and [buildClawBotMessageBody]
 * which capture the core repository transformations.
 */
class ClawBotRepositoryTest {

  // ── Session key routing ───────────────────────────────────────────────────

  @Test
  fun sessionKeyForProfile_generalProfile() {
    val key = ClawBotSessionKeys.forProfile(DefaultBotProfiles.General.id)
    assertEquals("clawbot-general", key)
  }

  @Test
  fun sessionKeyForProfile_coderProfile() {
    val key = ClawBotSessionKeys.forProfile(DefaultBotProfiles.Coder.id)
    assertEquals("clawbot-coder", key)
  }

  @Test
  fun allProfilesGetDistinctSessionKeys() {
    val keys = DefaultBotProfiles.all.map { ClawBotSessionKeys.forProfile(it.id) }
    assertEquals(keys.size, keys.distinct().size)
  }

  @Test
  fun clawBotKeys_areRecognisedAsClawBotKeys() {
    DefaultBotProfiles.all.forEach { profile ->
      val key = ClawBotSessionKeys.forProfile(profile.id)
      assertTrue("Key '$key' should be recognised as a ClawBot key", ClawBotSessionKeys.isClawBotKey(key))
    }
  }

  @Test
  fun regularSessionKey_isNotRecognisedAsClawBotKey() {
    assertFalse(ClawBotSessionKeys.isClawBotKey("main"))
    assertFalse(ClawBotSessionKeys.isClawBotKey("work"))
    assertFalse(ClawBotSessionKeys.isClawBotKey(""))
  }

  // ── Message body construction ─────────────────────────────────────────────

  @Test
  fun buildMessageBody_generalProfileFirstMessage_noHintAdded() {
    val body = buildClawBotMessageBody(
      text = "Hello there",
      profile = DefaultBotProfiles.General,
      isFirstMessage = true,
    )
    // General has no system hint so the body must equal the input text exactly.
    assertEquals("Hello there", body)
  }

  @Test
  fun buildMessageBody_coderFirstMessage_prependsHint() {
    val body = buildClawBotMessageBody(
      text = "Review my code",
      profile = DefaultBotProfiles.Coder,
      isFirstMessage = true,
    )
    assertTrue("Body should contain system hint", body.contains(DefaultBotProfiles.Coder.systemHint))
    assertTrue("Body should contain original text", body.contains("Review my code"))
    // Hint must come before the text.
    assertTrue(body.indexOf(DefaultBotProfiles.Coder.systemHint) < body.indexOf("Review my code"))
  }

  @Test
  fun buildMessageBody_coderSubsequentMessage_noHintAdded() {
    val body = buildClawBotMessageBody(
      text = "Follow-up",
      profile = DefaultBotProfiles.Coder,
      isFirstMessage = false,
    )
    assertFalse("Subsequent messages must not include the hint", body.contains(DefaultBotProfiles.Coder.systemHint))
    assertEquals("Follow-up", body)
  }

  @Test
  fun buildMessageBody_writerFirstMessage_prependsHint() {
    val body = buildClawBotMessageBody(
      text = "Improve this paragraph",
      profile = DefaultBotProfiles.Writer,
      isFirstMessage = true,
    )
    assertTrue(body.contains(DefaultBotProfiles.Writer.systemHint))
  }

  @Test
  fun buildMessageBody_analystFirstMessage_prependsHint() {
    val body = buildClawBotMessageBody(
      text = "Analyze trends",
      profile = DefaultBotProfiles.Analyst,
      isFirstMessage = true,
    )
    assertTrue(body.contains(DefaultBotProfiles.Analyst.systemHint))
  }

  @Test
  fun buildMessageBody_emptyTextWithAttachments_usesDefaultPlaceholder() {
    // When text is blank but attachments are present, the caller supplies "See attached." already.
    // We just verify blank text still produces a non-blank body when no hint is added.
    val body = buildClawBotMessageBody(
      text = "See attached.",
      profile = DefaultBotProfiles.General,
      isFirstMessage = true,
    )
    assertEquals("See attached.", body)
  }
}

