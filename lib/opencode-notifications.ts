/**
 * OpenCode UI Notifications
 *
 * Shared utilities for displaying notifications within OpenCode UI.
 * Uses OpenCode SDK's client.tui.showToast() and client.app.log() methods.
 *
 * @example
 * ```typescript
 * import { notify } from "../lib/opencode-notifications";
 *
 * export const MyPlugin: Plugin = async ({ client, directory }) => {
 *   const notifier = notify(client);
 *
 *   return {
 *     event: async (evt) => {
 *       notifier.success("Operation completed successfully!");
 *       notifier.error("Failed to process file");
 *       notifier.warning("Consider updating dependencies");
 *       notifier.info("3 files processed");
 *     }
 *   };
 * };
 * ```
 */

import type { PluginInput } from "@opencode-ai/plugin";

export type NotificationVariant = "success" | "error" | "warning" | "info";
export type LogLevel = "info" | "warn" | "error" | "debug";

// Extract the client type from PluginInput
type OpencodeClient = PluginInput["client"];

export interface NotificationOptions {
  /**
   * Whether to show toast notification (default: true)
   */
  toast?: boolean;

  /**
   * Whether to write to structured log (default: false)
   */
  log?: boolean;

  /**
   * Service name for structured logging
   */
  service?: string;

  /**
   * Log level for structured logging (default: matches variant)
   */
  logLevel?: LogLevel;
}

/**
 * Create a notification helper bound to an OpenCode client
 */
export function notify(client: OpencodeClient, serviceName: string = "opencode-plugin") {
  /**
   * Show a notification to the user
   */
  const show = async (
    message: string,
    variant: NotificationVariant = "info",
    options: NotificationOptions = {}
  ): Promise<void> => {
    const opts = {
      toast: true,
      log: false,
      service: serviceName,
      ...options,
    };

    // Show toast notification in UI
    if (opts.toast) {
      try {
        await client.tui.showToast({
          body: {
            message,
            variant,
          },
        });
      } catch (error) {
        // Fallback to console if toast fails
        console.error(`[${variant.toUpperCase()}] ${message}`);
      }
    }

    // Write to structured log
    if (opts.log) {
      const logLevel = opts.logLevel || variantToLogLevel(variant);

      try {
        await client.app.log({
          body: {
            service: opts.service,
            level: logLevel,
            message,
          },
        });
      } catch (error) {
        // Fallback to console if logging fails
        console.error(`[LOG] ${message}`, error);
      }
    }
  };

  return {
    /**
     * Show a success notification (green checkmark)
     */
    success: (message: string, options?: NotificationOptions) =>
      show(message, "success", options),

    /**
     * Show an error notification (red X)
     */
    error: (message: string, options?: NotificationOptions) =>
      show(message, "error", options),

    /**
     * Show a warning notification (yellow triangle)
     */
    warning: (message: string, options?: NotificationOptions) =>
      show(message, "warning", options),

    /**
     * Show an info notification (blue info icon)
     */
    info: (message: string, options?: NotificationOptions) =>
      show(message, "info", options),

    /**
     * Show a custom notification with full control
     */
    show,
  };
}

/**
 * Map notification variant to log level
 */
function variantToLogLevel(variant: NotificationVariant): LogLevel {
  switch (variant) {
    case "success":
      return "info";
    case "error":
      return "error";
    case "warning":
      return "warn";
    case "info":
    default:
      return "info";
  }
}

/**
 * Helper to create a scoped notifier with a specific service name
 */
export function createNotifier(client: OpencodeClient, serviceName: string) {
  return notify(client, serviceName);
}
