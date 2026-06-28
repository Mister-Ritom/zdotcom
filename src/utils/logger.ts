/**
 * Structured logger utility.
 * Port of flutter/lib/utils/logger.dart
 */

type LogData = Record<string, unknown>;

const formatMessage = (tag: string, message: string, extra?: unknown): string => {
  const base = `[${tag}] ${message}`;
  if (extra == null) return base;
  if (extra instanceof Error) return `${base} ${extra.message}\n${extra.stack || ""}`;
  try { return `${base} ${JSON.stringify(extra)}`; } catch { return `${base} [unstringifiable]`; }
};

export const AppLogger = {
  info: (tag: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      console.info(formatMessage(tag, message, data));
    }
  },

  warn: (tag: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      console.warn(formatMessage(tag, message, data));
    }
  },

  error: (tag: string, message: string, err?: unknown): void => {
    console.error(formatMessage(tag, message, err));
  },

  debug: (tag: string, message: string, data?: LogData): void => {
    if (__DEV__) {
      console.debug(formatMessage(tag, message, data));
    }
  },
};
