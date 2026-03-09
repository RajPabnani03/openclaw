package ai.openclaw.android.clawbot

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ClawBotModelsTest {

  // ── DefaultBotProfiles ────────────────────────────────────────────────────

  @Test
  fun defaultProfiles_hasExpectedCount() {
    assertEquals(4, DefaultBotProfiles.all.size)
  }

  @Test
  fun defaultProfiles_allHaveUniqueIds() {
    val ids = DefaultBotProfiles.all.map { it.id }
    assertEquals(ids.distinct().size, ids.size)
  }

  @Test
  fun defaultProfiles_allHaveSuggestedPrompts() {
    DefaultBotProfiles.all.forEach { profile ->
      assertTrue(
        "Profile '${profile.id}' must have at least one suggested prompt",
        profile.suggestedPrompts.isNotEmpty(),
      )
    }
  }

  @Test
  fun findById_returnsCorrectProfile() {
    val coder = DefaultBotProfiles.findById("coder")
    assertEquals("coder", coder.id)
    assertEquals("Coder", coder.name)
  }

  @Test
  fun findById_fallsBackToGeneralForUnknownId() {
    val profile = DefaultBotProfiles.findById("unknown-xyz")
    assertEquals(DefaultBotProfiles.General.id, profile.id)
  }

  @Test
  fun defaultProfiles_generalHasEmptySystemHint() {
    assertTrue(DefaultBotProfiles.General.systemHint.isEmpty())
  }

  @Test
  fun defaultProfiles_nonGeneralProfilesHaveSystemHints() {
    DefaultBotProfiles.all.filter { it.id != "general" }.forEach { profile ->
      assertTrue(
        "Profile '${profile.id}' should have a non-empty system hint",
        profile.systemHint.isNotBlank(),
      )
    }
  }

  // ── ClawBotSessionKeys ────────────────────────────────────────────────────

  @Test
  fun sessionKey_forProfileUsesPrefix() {
    val key = ClawBotSessionKeys.forProfile("coder")
    assertTrue(key.startsWith("clawbot-"))
    assertTrue(key.endsWith("coder"))
  }

  @Test
  fun sessionKey_isClawBotKey_returnsTrueForClawBotKey() {
    assertTrue(ClawBotSessionKeys.isClawBotKey("clawbot-general"))
    assertTrue(ClawBotSessionKeys.isClawBotKey("clawbot-coder"))
  }

  @Test
  fun sessionKey_isClawBotKey_returnsFalseForOtherKeys() {
    assertFalse(ClawBotSessionKeys.isClawBotKey("main"))
    assertFalse(ClawBotSessionKeys.isClawBotKey("custom-session"))
    assertFalse(ClawBotSessionKeys.isClawBotKey(""))
  }

  @Test
  fun sessionKey_profileIdFrom_extractsIdFromClawBotKey() {
    val profileId = ClawBotSessionKeys.profileIdFrom("clawbot-writer")
    assertEquals("writer", profileId)
  }

  @Test
  fun sessionKey_profileIdFrom_returnsNullForNonClawBotKey() {
    assertNull(ClawBotSessionKeys.profileIdFrom("main"))
    assertNull(ClawBotSessionKeys.profileIdFrom(""))
  }

  @Test
  fun sessionKey_roundTrip() {
    for (profile in DefaultBotProfiles.all) {
      val key = ClawBotSessionKeys.forProfile(profile.id)
      val recovered = ClawBotSessionKeys.profileIdFrom(key)
      assertEquals(profile.id, recovered)
    }
  }

  // ── ClawBotUiState ────────────────────────────────────────────────────────

  @Test
  fun uiState_defaultActiveProfileIsGeneral() {
    val state = ClawBotUiState()
    assertEquals(DefaultBotProfiles.General.id, state.activeProfileId)
  }

  @Test
  fun uiState_activeProfile_resolvesByActiveProfileId() {
    val state = ClawBotUiState(activeProfileId = "coder")
    assertEquals("coder", state.activeProfile.id)
  }

  @Test
  fun uiState_sessionKey_matchesActiveProfile() {
    val state = ClawBotUiState(activeProfileId = "analyst")
    val expected = ClawBotSessionKeys.forProfile("analyst")
    assertEquals(expected, state.sessionKey)
  }

  @Test
  fun uiState_activeProfile_fallsBackToGeneralWhenProfileIdUnknown() {
    val state = ClawBotUiState(activeProfileId = "does-not-exist")
    assertEquals(DefaultBotProfiles.General.id, state.activeProfile.id)
  }
}
