package ai.openclaw.android.ui.clawbot

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ai.openclaw.android.clawbot.BotProfile
import ai.openclaw.android.clawbot.ClawBotViewModel
import ai.openclaw.android.ui.chat.ChatMessageBubble
import ai.openclaw.android.ui.chat.ChatStreamingAssistantBubble
import ai.openclaw.android.ui.mobileAccent
import ai.openclaw.android.ui.mobileBackgroundGradient
import ai.openclaw.android.ui.mobileBorder
import ai.openclaw.android.ui.mobileBody
import ai.openclaw.android.ui.mobileCallout
import ai.openclaw.android.ui.mobileCaption1
import ai.openclaw.android.ui.mobileDanger
import ai.openclaw.android.ui.mobileDangerSoft
import ai.openclaw.android.ui.mobileSurface
import ai.openclaw.android.ui.mobileText
import ai.openclaw.android.ui.mobileTextSecondary
import ai.openclaw.android.ui.mobileTextTertiary
import ai.openclaw.android.ui.mobileTitle2

/**
 * Top-level composable for the ClawBot tab.
 *
 * Layout:
 *   ┌──────────────────────────────┐
 *   │  Header (profile chip + name)│
 *   ├──────────────────────────────┤
 *   │  Message list / empty state  │
 *   ├──────────────────────────────┤
 *   │  Suggestions bar (if empty)  │
 *   ├──────────────────────────────┤
 *   │  Composer                    │
 *   └──────────────────────────────┘
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClawBotScreen(viewModel: ClawBotViewModel, modifier: Modifier = Modifier) {
  val uiState by viewModel.uiState.collectAsState()
  val messages by viewModel.messages.collectAsState()
  val streamingText by viewModel.streamingAssistantText.collectAsState()
  val healthOk by viewModel.healthOk.collectAsState()
  val errorText by viewModel.errorText.collectAsState()
  val isBusy by viewModel.isBusy.collectAsState()
  val pendingRunCount by viewModel.pendingRunCount.collectAsState()

  // Scroll to bottom on new messages or streaming updates.
  val listState = rememberLazyListState()
  LaunchedEffect(messages.size, streamingText) {
    snapshotFlow { messages.size to streamingText }.collect {
      if (messages.isNotEmpty()) {
        listState.animateScrollToItem(messages.size - 1)
      }
    }
  }

  // Reload session when this tab first becomes visible.
  LaunchedEffect(Unit) {
    viewModel.onTabVisible()
  }

  val profilePickerSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

  Box(
    modifier =
      modifier
        .fillMaxSize()
        .background(mobileBackgroundGradient),
  ) {
    Column(
      modifier =
        Modifier
          .fillMaxSize()
          .imePadding(),
    ) {
      // ── Header ────────────────────────────────────────────────────────────
      ClawBotHeader(
        profile = uiState.activeProfile,
        isConnected = healthOk,
        onProfileChipClick = { viewModel.openProfilePicker() },
      )

      // ── Error banner ──────────────────────────────────────────────────────
      if (!errorText.isNullOrBlank()) {
        Surface(
          modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
          shape = RoundedCornerShape(10.dp),
          color = mobileDangerSoft,
          border = BorderStroke(1.dp, mobileDanger.copy(alpha = 0.3f)),
        ) {
          Text(
            text = errorText!!,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            style = mobileCallout,
            color = mobileDanger,
          )
        }
        Spacer(modifier = Modifier.height(6.dp))
      }

      // ── Message list ──────────────────────────────────────────────────────
      val showSuggestions = messages.isEmpty() && !isBusy

      if (showSuggestions) {
        // Empty state: hero + suggestions
        ClawBotEmptyState(
          profile = uiState.activeProfile,
          modifier = Modifier.weight(1f),
        )
      } else {
        LazyColumn(
          state = listState,
          modifier = Modifier.weight(1f).fillMaxWidth(),
          contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
          verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
          items(messages, key = { it.id }) { msg ->
            ChatMessageBubble(message = msg)
          }
          // Streaming assistant delta
          if (!streamingText.isNullOrBlank()) {
            item(key = "streaming") {
              ChatStreamingAssistantBubble(text = streamingText!!)
            }
          }
          // Busy indicator when no streaming text yet
          if (isBusy && streamingText.isNullOrBlank()) {
            item(key = "thinking") {
              ThinkingBubble()
            }
          }
        }
      }

      // ── Suggestions bar ───────────────────────────────────────────────────
      if (showSuggestions) {
        ClawBotSuggestionsBar(
          profile = uiState.activeProfile,
          onSuggestionClick = { viewModel.sendSuggestion(it) },
          modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        )
      }

      // ── Composer ──────────────────────────────────────────────────────────
      ClawBotComposer(
        text = uiState.composerText,
        healthOk = healthOk,
        isBusy = isBusy,
        onTextChange = { viewModel.updateComposerText(it) },
        onSend = { viewModel.sendMessage() },
        onAbort = { viewModel.abort() },
        modifier =
          Modifier
            .fillMaxWidth()
            .windowInsetsPadding(WindowInsets.navigationBars.only(WindowInsetsSides.Bottom)),
      )
    }
  }

  // ── Profile picker bottom sheet ───────────────────────────────────────────
  if (uiState.showProfilePicker) {
    ModalBottomSheet(
      onDismissRequest = { viewModel.dismissProfilePicker() },
      sheetState = profilePickerSheetState,
      containerColor = Color.White,
    ) {
      BotProfilePickerSheet(
        profiles = uiState.profiles,
        activeProfileId = uiState.activeProfileId,
        onSelect = { viewModel.selectProfile(it) },
        modifier = Modifier.verticalScroll(rememberScrollState()),
      )
    }
  }
}

// ── Sub-composables ───────────────────────────────────────────────────────────

@Composable
private fun ClawBotHeader(
  profile: BotProfile,
  isConnected: Boolean,
  onProfileChipClick: () -> Unit,
) {
  Row(
    modifier =
      Modifier
        .fillMaxWidth()
        .padding(horizontal = 18.dp, vertical = 12.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.SpaceBetween,
  ) {
    Text(
      text = "ClawBot",
      style = mobileTitle2,
      color = mobileText,
    )
    Row(
      horizontalArrangement = Arrangement.spacedBy(8.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      // Connection status dot
      Surface(
        shape = RoundedCornerShape(999.dp),
        color = if (isConnected) Color(0xFF2F8C5A).copy(alpha = 0.12f) else mobileSurface,
        border = BorderStroke(1.dp, if (isConnected) Color(0xFFCFEBD8) else mobileBorder),
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
          Surface(
            modifier = Modifier.size(6.dp),
            shape = RoundedCornerShape(999.dp),
            color = if (isConnected) Color(0xFF2F8C5A) else mobileTextTertiary,
          ) {}
          Text(
            text = if (isConnected) "Ready" else "Offline",
            style = mobileCaption1,
            color = if (isConnected) Color(0xFF2F8C5A) else mobileTextSecondary,
          )
        }
      }
      BotProfileChip(
        profile = profile,
        onClick = onProfileChipClick,
      )
    }
  }
}

@Composable
private fun ClawBotEmptyState(
  profile: BotProfile,
  modifier: Modifier = Modifier,
) {
  Box(modifier = modifier.fillMaxWidth()) {
    Column(
      modifier = Modifier.align(Alignment.Center).padding(32.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Text(text = profile.emoji, style = mobileTitle2.copy(fontSize = androidx.compose.ui.unit.TextUnit(48f, androidx.compose.ui.unit.TextUnitType.Sp)))
      Spacer(modifier = Modifier.height(4.dp))
      Text(
        text = profile.name,
        style = mobileBody.copy(fontWeight = FontWeight.Bold),
        color = mobileText,
      )
      Text(
        text = profile.description,
        style = mobileCallout,
        color = mobileTextSecondary,
      )
      Spacer(modifier = Modifier.height(4.dp))
      Text(
        text = "Try a suggestion below or type your message",
        style = mobileCaption1,
        color = mobileTextTertiary,
      )
    }
  }
}

@Composable
private fun ClawBotComposer(
  text: String,
  healthOk: Boolean,
  isBusy: Boolean,
  onTextChange: (String) -> Unit,
  onSend: () -> Unit,
  onAbort: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val canSend = !isBusy && text.trim().isNotEmpty() && healthOk

  Surface(
    modifier = modifier,
    color = Color.White.copy(alpha = 0.97f),
    border = BorderStroke(1.dp, mobileBorder),
    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
    shadowElevation = 4.dp,
  ) {
    Row(
      modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
      verticalAlignment = Alignment.Bottom,
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      OutlinedTextField(
        value = text,
        onValueChange = onTextChange,
        modifier = Modifier.weight(1f),
        placeholder = {
          Text(
            text = "Message ClawBot…",
            style = mobileCallout,
            color = mobileTextTertiary,
          )
        },
        textStyle = mobileCallout.copy(color = mobileText),
        shape = RoundedCornerShape(12.dp),
        colors =
          OutlinedTextFieldDefaults.colors(
            focusedBorderColor = mobileAccent.copy(alpha = 0.5f),
            unfocusedBorderColor = mobileBorder,
            focusedContainerColor = Color.White,
            unfocusedContainerColor = mobileSurface,
          ),
        maxLines = 5,
        enabled = !isBusy,
      )

      // Send / Abort button
      if (isBusy) {
        Surface(
          onClick = onAbort,
          shape = RoundedCornerShape(12.dp),
          color = mobileDangerSoft,
          border = BorderStroke(1.dp, mobileDanger.copy(alpha = 0.3f)),
          modifier = Modifier.size(48.dp),
        ) {
          Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Icon(
              imageVector = Icons.Default.Stop,
              contentDescription = "Stop",
              tint = mobileDanger,
              modifier = Modifier.size(20.dp),
            )
          }
        }
      } else {
        Surface(
          onClick = { if (canSend) onSend() },
          shape = RoundedCornerShape(12.dp),
          color = if (canSend) mobileAccent else mobileSurface,
          border = BorderStroke(1.dp, if (canSend) mobileAccent else mobileBorder),
          modifier = Modifier.size(48.dp),
        ) {
          Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
            Icon(
              imageVector = Icons.AutoMirrored.Filled.Send,
              contentDescription = "Send",
              tint = if (canSend) Color.White else mobileTextTertiary,
              modifier = Modifier.size(20.dp),
            )
          }
        }
      }
    }
  }
}

@Composable
private fun ThinkingBubble() {
  Row(
    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
    horizontalArrangement = Arrangement.Start,
  ) {
    Surface(
      shape = RoundedCornerShape(16.dp),
      color = mobileSurface,
      border = BorderStroke(1.dp, mobileBorder),
    ) {
      Text(
        text = "Thinking…",
        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
        style = mobileCallout,
        color = mobileTextTertiary,
      )
    }
  }
}
