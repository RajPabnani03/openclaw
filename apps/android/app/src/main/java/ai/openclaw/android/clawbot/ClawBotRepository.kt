package ai.openclaw.android.clawbot

import ai.openclaw.android.chat.ChatController
import ai.openclaw.android.chat.OutgoingAttachment

/**
 * Repository that bridges the ClawBot feature with [ChatController].
 *
 * Each bot profile gets its own isolated gateway session key so conversation
 * history stays separate between personalities.
 */
class ClawBotRepository(private val chatController: ChatController) {

  /** Switch the active gateway session to the one owned by [profile]. */
  fun activateProfile(profile: BotProfile) {
    chatController.switchSession(ClawBotSessionKeys.forProfile(profile.id))
  }

  /**
   * Send [text] in the context of [profile].
   *
   * If this is the first message in the profile's session and the profile has a
   * system hint, the hint is prepended so the model has personality context.
   */
  fun sendMessage(
    text: String,
    profile: BotProfile,
    thinkingLevel: String,
    isFirstMessage: Boolean,
    attachments: List<OutgoingAttachment> = emptyList(),
  ) {
    val body = buildClawBotMessageBody(text = text, profile = profile, isFirstMessage = isFirstMessage)
    chatController.sendMessage(
      message = body,
      thinkingLevel = thinkingLevel,
      attachments = attachments,
    )
  }

  /** Abort any in-flight request for the current session. */
  fun abort() {
    chatController.abort()
  }

  /** Derive the session key for a profile without activating it. */
  fun sessionKeyFor(profileId: String): String = ClawBotSessionKeys.forProfile(profileId)
}

/**
 * Builds the outgoing message body for a ClawBot send.
 *
 * On the first message of a session, the bot profile's system hint is prepended
 * so the gateway model adopts the desired personality. Subsequent messages are
 * sent verbatim to avoid polluting the context window.
 */
internal fun buildClawBotMessageBody(
  text: String,
  profile: BotProfile,
  isFirstMessage: Boolean,
): String =
  if (isFirstMessage && profile.systemHint.isNotBlank()) {
    "[${profile.systemHint}]\n\n$text"
  } else {
    text
  }
