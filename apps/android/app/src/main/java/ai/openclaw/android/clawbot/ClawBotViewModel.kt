package ai.openclaw.android.clawbot

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ai.openclaw.android.chat.ChatController
import ai.openclaw.android.chat.ChatMessage
import ai.openclaw.android.chat.ChatPendingToolCall
import ai.openclaw.android.chat.OutgoingAttachment
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * ViewModel for the ClawBot tab.
 *
 * Owns [ClawBotUiState] and delegates all gateway communication to
 * [ClawBotRepository] / [ChatController].
 */
class ClawBotViewModel(
  private val repository: ClawBotRepository,
  private val chatController: ChatController,
) : ViewModel() {

  private val _uiState = MutableStateFlow(ClawBotUiState())
  val uiState: StateFlow<ClawBotUiState> = _uiState.asStateFlow()

  /** Live chat messages from the gateway for the active session. */
  val messages: StateFlow<List<ChatMessage>> = chatController.messages

  /** Streaming text delta for the assistant response in progress. */
  val streamingAssistantText: StateFlow<String?> = chatController.streamingAssistantText

  /** Tool calls currently in progress. */
  val pendingToolCalls: StateFlow<List<ChatPendingToolCall>> = chatController.pendingToolCalls

  /** Whether the gateway is healthy and ready to accept messages. */
  val healthOk: StateFlow<Boolean> = chatController.healthOk

  /** Any error to surface to the user. */
  val errorText: StateFlow<String?> = chatController.errorText

  /** Number of in-flight agent runs. */
  val pendingRunCount: StateFlow<Int> = chatController.pendingRunCount

  /**
   * True while the bot is processing a request (run in-flight or streaming).
   */
  val isBusy: StateFlow<Boolean> =
    combine(chatController.pendingRunCount, chatController.streamingAssistantText) { count, streaming ->
      count > 0 || streaming != null
    }.stateIn(viewModelScope, SharingStarted.Eagerly, false)

  // ── Profile management ────────────────────────────────────────────────────

  fun selectProfile(profile: BotProfile) {
    val current = _uiState.value
    if (current.activeProfileId == profile.id) {
      _uiState.value = current.copy(showProfilePicker = false)
      return
    }
    _uiState.value =
      current.copy(
        activeProfileId = profile.id,
        showProfilePicker = false,
      )
    repository.activateProfile(profile)
  }

  fun openProfilePicker() {
    _uiState.value = _uiState.value.copy(showProfilePicker = true)
  }

  fun dismissProfilePicker() {
    _uiState.value = _uiState.value.copy(showProfilePicker = false)
  }

  // ── Composer ──────────────────────────────────────────────────────────────

  fun updateComposerText(text: String) {
    _uiState.value = _uiState.value.copy(composerText = text)
  }

  /**
   * Send the current composer text as a message.
   *
   * [thinkingLevel] maps to the agent thinking budget ("off" | "low" | "medium" | "high").
   */
  fun sendMessage(
    thinkingLevel: String = "off",
    attachments: List<OutgoingAttachment> = emptyList(),
  ) {
    val state = _uiState.value
    val text = state.composerText.trim()
    if (text.isEmpty() && attachments.isEmpty()) return

    val isFirstMessage = messages.value.isEmpty()
    repository.sendMessage(
      text = text,
      profile = state.activeProfile,
      thinkingLevel = thinkingLevel,
      isFirstMessage = isFirstMessage,
      attachments = attachments,
    )
    _uiState.value = state.copy(composerText = "")
  }

  /** Send one of the suggested prompts directly. */
  fun sendSuggestion(text: String, thinkingLevel: String = "off") {
    val state = _uiState.value
    val isFirstMessage = messages.value.isEmpty()
    repository.sendMessage(
      text = text,
      profile = state.activeProfile,
      thinkingLevel = thinkingLevel,
      isFirstMessage = isFirstMessage,
    )
  }

  fun abort() {
    repository.abort()
  }

  // ── Session ───────────────────────────────────────────────────────────────

  /** Reload message history for the active profile's session. */
  fun refresh() {
    chatController.refresh()
  }

  /** Load (or reload) the session for the given profile id. */
  fun loadProfile(profileId: String) {
    val profile = DefaultBotProfiles.findById(profileId)
    _uiState.value = _uiState.value.copy(activeProfileId = profile.id)
    viewModelScope.launch {
      chatController.load(ClawBotSessionKeys.forProfile(profile.id))
    }
  }

  /** Called when the tab becomes visible so messages are up-to-date. */
  fun onTabVisible() {
    val sessionKey = _uiState.value.sessionKey
    chatController.load(sessionKey)
  }
}
