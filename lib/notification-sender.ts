/**
 * Notification Sender
 *
 * Shared utilities for sending notifications to team communication channels.
 * Supports Slack, Microsoft Teams, and Discord webhooks.
 */

export async function notify(channel: string, message: string): Promise<void> {
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
      // Silent failure - webhook configuration issue
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
      // Silent failure - webhook configuration issue
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
      // Silent failure - webhook configuration issue
    }
  }
}
