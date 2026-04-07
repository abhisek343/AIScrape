export const GENERAL_CHAT_PLACEHOLDER = '___GENERAL_CHAT_SESSION___';

const AUTOMATION_INTENT_PATTERNS: RegExp[] = [
  /\bautomation\s+on\b/i,
  /\bautomate\b/i,
  /\bcreate\s+(?:a\s+)?workflow\b/i,
  /\bbuild\s+(?:a\s+)?workflow\b/i,
  /\bupdate\s+(?:the\s+|this\s+)?workflow\b/i,
  /\b(run|execute)\s+(?:the\s+|this\s+)?workflow\b/i,
];

export function hasExplicitAutomationIntent(message: string): boolean {
  const trimmed = message.trim();
  return AUTOMATION_INTENT_PATTERNS.some((pattern) => pattern.test(trimmed));
}
