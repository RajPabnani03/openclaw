package ai.openclaw.android.ui.clawbot

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.openclaw.android.clawbot.BotProfile
import ai.openclaw.android.ui.mobileBorder
import ai.openclaw.android.ui.mobileBody
import ai.openclaw.android.ui.mobileCallout
import ai.openclaw.android.ui.mobileCaption1
import ai.openclaw.android.ui.mobileHeadline
import ai.openclaw.android.ui.mobileSurface
import ai.openclaw.android.ui.mobileText
import ai.openclaw.android.ui.mobileTextSecondary

/**
 * A selectable card representing a single [BotProfile] in the profile picker.
 */
@Composable
fun BotProfileCard(
  profile: BotProfile,
  isActive: Boolean,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val accentColor = parseHexColor(profile.accentHex)
  val accentSoft = accentColor.copy(alpha = 0.10f)
  val borderColor = if (isActive) accentColor.copy(alpha = 0.40f) else mobileBorder
  val bgColor = if (isActive) accentSoft else mobileSurface

  Surface(
    onClick = onClick,
    modifier = modifier.fillMaxWidth(),
    shape = RoundedCornerShape(14.dp),
    color = bgColor,
    border = BorderStroke(1.dp, borderColor),
    shadowElevation = if (isActive) 2.dp else 0.dp,
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      // Emoji avatar
      Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isActive) accentColor.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.6f),
      ) {
        Text(
          text = profile.emoji,
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
          fontSize = 20.sp,
        )
      }

      Spacer(modifier = Modifier.width(12.dp))

      Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
          text = profile.name,
          style = mobileHeadline,
          color = mobileText,
        )
        Text(
          text = profile.description,
          style = mobileCallout,
          color = mobileTextSecondary,
          maxLines = 2,
        )
      }

      if (isActive) {
        Spacer(modifier = Modifier.width(10.dp))
        Icon(
          imageVector = Icons.Default.CheckCircle,
          contentDescription = "Active",
          tint = accentColor,
          modifier = Modifier.size(20.dp),
        )
      }
    }
  }
}

/**
 * Compact chip version of a [BotProfile] for use in the top header bar.
 */
@Composable
fun BotProfileChip(
  profile: BotProfile,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
) {
  val accentColor = parseHexColor(profile.accentHex)

  Surface(
    onClick = onClick,
    modifier = modifier,
    shape = RoundedCornerShape(999.dp),
    color = accentColor.copy(alpha = 0.10f),
    border = BorderStroke(1.dp, accentColor.copy(alpha = 0.25f)),
    shadowElevation = 0.dp,
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
      Text(text = profile.emoji, fontSize = 13.sp)
      Text(
        text = profile.name,
        style = mobileCaption1.copy(fontWeight = FontWeight.SemiBold),
        color = accentColor,
      )
    }
  }
}

/**
 * Bottom sheet listing all available profiles for selection.
 */
@Composable
fun BotProfilePickerSheet(
  profiles: List<BotProfile>,
  activeProfileId: String,
  onSelect: (BotProfile) -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(
    modifier = modifier.padding(horizontal = 18.dp, vertical = 20.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    Text(
      text = "Choose a Bot Profile",
      style = mobileBody.copy(fontWeight = FontWeight.Bold),
      color = mobileText,
    )
    Spacer(modifier = Modifier.height(2.dp))
    profiles.forEach { profile ->
      BotProfileCard(
        profile = profile,
        isActive = profile.id == activeProfileId,
        onClick = { onSelect(profile) },
      )
    }
    Spacer(modifier = Modifier.height(4.dp))
  }
}

/** Parse a 6-digit hex color string like "#1D5DD8" into [Color]. */
internal fun parseHexColor(hex: String): Color {
  return try {
    val clean = hex.trimStart('#')
    val rgb = clean.toLong(16)
    Color(
      red = ((rgb shr 16) and 0xFF) / 255f,
      green = ((rgb shr 8) and 0xFF) / 255f,
      blue = (rgb and 0xFF) / 255f,
    )
  } catch (_: Throwable) {
    Color(0xFF1D5DD8)
  }
}
