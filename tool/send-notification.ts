import { tool } from "@opencode-ai/plugin";
import { notify } from "../lib/notification-sender";

/**
 * Send Notification Tool
 *
 * Send notifications to team communication channels (Slack, Teams, Discord).
 * Requires webhook URLs in environment variables.
 */
export default tool({
  description: "Send a notification to team communication channels (Slack/Teams/Discord)",
  args: {
    channel: tool.schema
      .string()
      .describe("Channel name (e.g., dev, deployments, incidents, alerts)"),
    message: tool.schema
      .string()
      .describe("Notification message to send"),
    severity: tool.schema
      .enum(["info", "warning", "error", "critical"])
      .optional()
      .describe("Severity level: info, warning, error, or critical"),
  },
  async execute(args) {
    const { channel, message, severity = "info" } = args;

    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      error: "❌",
      critical: "🚨",
    };

    const icon = icons[severity as keyof typeof icons] || "📢";
    const formattedMessage = `${icon} ${message}`;

    await notify(channel, formattedMessage);

    return `✅ Notification sent to ${channel}`;
  },
});
