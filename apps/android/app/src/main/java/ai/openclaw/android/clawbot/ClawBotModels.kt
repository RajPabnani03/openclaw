package ai.openclaw.android.clawbot

/**
 * A bot personality/profile that users can switch between. Each profile maps to
 * a distinct gateway session key so conversation history stays isolated.
 */
data class BotProfile(
  val id: String,
  val name: String,
  val description: String,
  val emoji: String,
  /** Short hint prepended as context to the first message in this profile's session. */
  val systemHint: String,
  val suggestedPrompts: List<String>,
  val accentHex: String = "#1D5DD8",
)

/** All built-in profiles shipped with the ClawBot feature. */
object DefaultBotProfiles {
  val General =
    BotProfile(
      id = "general",
      name = "General",
      description = "Versatile assistant for everyday tasks",
      emoji = "🤖",
      systemHint = "",
      suggestedPrompts =
        listOf(
          "Summarize my last conversation",
          "Draft a quick email",
          "What can you help me with?",
        ),
      accentHex = "#1D5DD8",
    )

  val Coder =
    BotProfile(
      id = "coder",
      name = "Coder",
      description = "Code reviews, debugging and architecture help",
      emoji = "💻",
      systemHint = "You are a senior software engineer. Prefer concise, idiomatic code with clear explanations.",
      suggestedPrompts =
        listOf(
          "Review this function for bugs",
          "Explain this algorithm",
          "Best practices for REST APIs",
        ),
      accentHex = "#2D8A5F",
    )

  val Writer =
    BotProfile(
      id = "writer",
      name = "Writer",
      description = "Editing, brainstorming and creative writing",
      emoji = "✍️",
      systemHint = "You are a professional editor and creative writer. Be concise, vivid and engaging.",
      suggestedPrompts =
        listOf(
          "Improve this paragraph",
          "Write a short story opener",
          "Give me 5 headline ideas",
        ),
      accentHex = "#8A3D9C",
    )

  val Analyst =
    BotProfile(
      id = "analyst",
      name = "Analyst",
      description = "Data analysis, research and structured thinking",
      emoji = "📊",
      systemHint = "You are a rigorous data analyst. Structure your answers with clear reasoning, bullet points and tables where helpful.",
      suggestedPrompts =
        listOf(
          "Analyze these numbers",
          "What are the key trends?",
          "Pros and cons comparison",
        ),
      accentHex = "#C87A1A",
    )

  val all: List<BotProfile> = listOf(General, Coder, Writer, Analyst)

  fun findById(id: String): BotProfile = all.firstOrNull { it.id == id } ?: General
}

/** Snapshot of the ClawBot UI state consumed by [ClawBotViewModel]. */
data class ClawBotUiState(
  val profiles: List<BotProfile> = DefaultBotProfiles.all,
  val activeProfileId: String = DefaultBotProfiles.General.id,
  val isConnected: Boolean = false,
  val composerText: String = "",
  /** Whether the profile picker sheet is open. */
  val showProfilePicker: Boolean = false,
) {
  val activeProfile: BotProfile
    get() = profiles.firstOrNull { it.id == activeProfileId } ?: DefaultBotProfiles.General

  val sessionKey: String
    get() = ClawBotSessionKeys.forProfile(activeProfileId)
}

/** Helpers for deriving consistent session keys from profile IDs. */
object ClawBotSessionKeys {
  private const val PREFIX = "clawbot"

  fun forProfile(profileId: String): String = "$PREFIX-$profileId"

  fun isClawBotKey(sessionKey: String): Boolean = sessionKey.startsWith("$PREFIX-")

  /** Extract the profile id from a clawbot session key, or null if not a ClawBot key. */
  fun profileIdFrom(sessionKey: String): String? =
    if (isClawBotKey(sessionKey)) sessionKey.removePrefix("$PREFIX-") else null
}
