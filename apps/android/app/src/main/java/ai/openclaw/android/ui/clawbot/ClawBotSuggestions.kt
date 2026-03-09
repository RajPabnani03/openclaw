package ai.openclaw.android.ui.clawbot

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import ai.openclaw.android.clawbot.BotProfile
import ai.openclaw.android.ui.mobileAccent
import ai.openclaw.android.ui.mobileAccentSoft
import ai.openclaw.android.ui.mobileCallout
import ai.openclaw.android.ui.mobileBorder

/**
 * A horizontally scrollable row of prompt suggestion chips.
 *
 * Shown when the active session has no messages yet so the user gets
 * quick-start ideas for the current bot profile.
 */
@Composable
fun ClawBotSuggestionsBar(
  profile: BotProfile,
  onSuggestionClick: (String) -> Unit,
  modifier: Modifier = Modifier,
) {
  val accentColor = parseHexColor(profile.accentHex)
  val accentSoft = accentColor.copy(alpha = 0.08f)
  val accentBorder = accentColor.copy(alpha = 0.20f)

  Row(
    modifier = modifier.horizontalScroll(rememberScrollState()),
    horizontalArrangement = Arrangement.spacedBy(8.dp),
  ) {
    profile.suggestedPrompts.forEach { prompt ->
      SuggestionChip(
        text = prompt,
        accentColor = accentColor,
        bgColor = accentSoft,
        borderColor = accentBorder,
        onClick = { onSuggestionClick(prompt) },
      )
    }
  }
}

@Composable
private fun SuggestionChip(
  text: String,
  accentColor: androidx.compose.ui.graphics.Color,
  bgColor: androidx.compose.ui.graphics.Color,
  borderColor: androidx.compose.ui.graphics.Color,
  onClick: () -> Unit,
) {
  Surface(
    onClick = onClick,
    shape = RoundedCornerShape(999.dp),
    color = bgColor,
    border = BorderStroke(1.dp, borderColor),
    shadowElevation = 0.dp,
  ) {
    Text(
      text = text,
      modifier = Modifier.padding(horizontal = 14.dp, vertical = 7.dp),
      style = mobileCallout,
      color = accentColor,
      maxLines = 1,
    )
  }
}
