import type { Plugin } from "@opencode-ai/plugin";
import { notify as createNotifier } from "../lib/opencode-notifications";

/**
 * Notification Hub Plugin
 *
 * Sends notifications to team communication channels:
 * - Slack
 * - Microsoft Teams
 * - Discord
 *
 * Triggers:
 * - Phase transitions
 * - Test failures
 * - Security vulnerabilities
 * - Deployments
 * - Incidents
 *
 * Configuration (via environment variables):
 * - ENABLE_NOTIFICATION_HUB - Enable/disable notifications (default: true)
 */
export const NotificationHub: Plugin = async ({ $, directory, client }) => {
  // Create UI notification helper (renamed to avoid conflict with external notify function)
  const notifier = createNotifier(client, "notification-hub");

  // Check if plugin is enabled
  const enabled = process.env.ENABLE_NOTIFICATION_HUB !== "false";

  if (!enabled) {
    // Plugin disabled - return minimal hooks
    return {};
  }

  // Configuration for custom notification icon
  // You can set these environment variables to customize the icon:
  // - NOTIFICATION_ICON_PATH: Path to custom icon file (Linux/Windows)
  // - NOTIFICATION_APP_NAME: App name to use icon from (macOS, e.g., "Visual Studio Code")
  const customIconPath = process.env.NOTIFICATION_ICON_PATH;
  const customAppName = process.env.NOTIFICATION_APP_NAME || "Terminal";

  // Cross-platform system notification with custom icon support
  const sendSystemNotification = async (title: string, message: string) => {
    const platform = process.platform;

    try {
      if (platform === "darwin") {
        // macOS - Use terminal-notifier if available, otherwise osascript
        if (customIconPath || customAppName !== "Terminal") {
          // Try to use terminal-notifier for custom icon support
          try {
            const hasTerminalNotifier = await $`which terminal-notifier 2>/dev/null`.text();

            if (hasTerminalNotifier && hasTerminalNotifier.trim()) {
              // terminal-notifier is installed
              if (customIconPath) {
                await $`terminal-notifier -title "${title}" -message "${message}" -appIcon "${customIconPath}"`;
              } else {
                await $`terminal-notifier -title "${title}" -message "${message}" -sender "${customAppName}"`;
              }
            } else {
              // terminal-notifier not installed, use osascript
              await $`osascript -e 'display notification "${message}" with title "${title}"'`;
            }
          } catch (err) {
            // Fallback to osascript if terminal-notifier fails
            await $`osascript -e 'display notification "${message}" with title "${title}"'`;
          }
        } else {
          // No custom icon needed, use osascript directly (faster)
          await $`osascript -e 'display notification "${message}" with title "${title}"'`;
        }
      } else if (platform === "linux") {
        // Linux - use notify-send with custom icon support
        if (customIconPath) {
          await $`notify-send -i "${customIconPath}" "${title}" "${message}"`;
        } else {
          await $`notify-send "${title}" "${message}"`;
        }
      } else if (platform === "win32") {
        // Windows - use PowerShell notification with optional custom icon
        const iconXml = customIconPath
          ? `<image placement='appLogoOverride' src='file:///${customIconPath.replace(/\\/g, "/")}'/>`
          : "";

        const script = `
          [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
          $Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
          $RawXml = [xml] $Template.GetXml()
          ($RawXml.toast.visual.binding.text|where {$_.id -eq "1"}).AppendChild($RawXml.CreateTextNode("${title}")) > $null
          ($RawXml.toast.visual.binding.text|where {$_.id -eq "2"}).AppendChild($RawXml.CreateTextNode("${message}")) > $null
          ${
            customIconPath
              ? `$binding = $RawXml.toast.visual.binding
          $image = $RawXml.CreateElement("image")
          $image.SetAttribute("placement", "appLogoOverride")
          $image.SetAttribute("src", "file:///${customIconPath.replace(/\\/g, "/")}")
          $binding.AppendChild($image) > $null`
              : ""
          }
          $SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
          $SerializedXml.LoadXml($RawXml.OuterXml)
          $Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
          $Toast.Tag = "OpenCode"
          $Toast.Group = "OpenCode"
          $Notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("OpenCode")
          $Notifier.Show($Toast);
        `;
        await $`powershell -Command ${script}`;
      }
    } catch (error) {
      // Show error in OpenCode UI for debugging if enabled
      if (process.env.DEBUG_NOTIFICATIONS === "true") {
        await notifier.error("System notification failed: " + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  // Cross-platform system sound
  const playSystemSound = async () => {
    const platform = process.platform;

    try {
      if (platform === "darwin") {
        // macOS - play system sound (Glass sound)
        await $`afplay /System/Library/Sounds/Glass.aiff`;
      } else if (platform === "linux") {
        // Linux - try paplay first (PulseAudio), fallback to beep
        try {
          await $`paplay /usr/share/sounds/freedesktop/stereo/complete.oga`;
        } catch {
          // Fallback to simple beep
          await $`printf '\\007'`;
        }
      } else if (platform === "win32") {
        // Windows - use PowerShell to play system sound
        await $`powershell -c [System.Console]::Beep(800,200)`;
      }
    } catch (error) {
      // Silently fail if sound system is not available
      // No notification needed - this is expected on some systems
    }
  };

  const notify = async (channel: string, message: string) => {
    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: message,
            channel: channel,
            username: "OpenCode Bot",
            icon_emoji: ":robot_face:",
          }),
        });
      } catch (error) {
        // Webhook failures are configuration issues - notify but don't block
      }
    }

    // Microsoft Teams webhook
    if (process.env.TEAMS_WEBHOOK_URL) {
      try {
        await fetch(process.env.TEAMS_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            summary: message,
            text: message,
          }),
        });
      } catch (error) {
        // Webhook failures are configuration issues - notify but don't block
      }
    }

    // Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message,
            username: "OpenCode Bot",
          }),
        });
      } catch (error) {
        // Webhook failures are configuration issues - notify but don't block
      }
    }
  };

  let testsFailed = false;

  return {
    // Track tool executions for notification triggers
    "tool.execute.before": async (input, output) => {
      // Deployment started
      if (
        input.tool === "bash" &&
        (output.args?.command?.includes("deploy") || output.args?.command?.includes("kubectl apply"))
      ) {
        await notify("deployments", "🚀 Deployment started");
      }

      // Test execution
      if (input.tool === "bash" && output.args?.command?.includes("test")) {
        testsFailed = false; // Reset flag
      }

      // Git operations (commits, pushes)
      if (input.tool === "bash" && output.args?.command?.includes("git push")) {
        const branch = await $`git branch --show-current`.text();
        await notify("dev", `📤 Code pushed to ${branch.trim()}`);
      }
    },

    // Listen for system events
    event: async (evt) => {
      // Task completed
      if (evt.event.type === "session.idle") {
        await sendSystemNotification("OpenCode", "Task completed!");
        await playSystemSound();
      }

      // Session completion
      if (evt.event.type === "session.deleted") {
        await notify("dev", "✅ Development session completed");
      }

      // Test failures (would need more sophisticated detection)
      if (testsFailed) {
        await notify("dev", "⚠️  Tests failed - please review");
      }
    },
  };
};
