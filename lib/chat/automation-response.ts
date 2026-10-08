import type { AiAutomationSpec } from '@/lib/workflow/ai-automation';
import { safeJsonParse } from '@/lib/safe-json';

function extractFirstJsonBlock(text: string): string | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;

  return text.slice(firstBrace, lastBrace + 1);
}

export function extractAutomationSpec(text: string): AiAutomationSpec | null {
  const jsonBlock = extractFirstJsonBlock(text);
  if (!jsonBlock) return null;

  const parsed = safeJsonParse<AiAutomationSpec>(jsonBlock, {
    maxSize: 256 * 1024,
    maxDepth: 50,
  });

  if (!parsed.success || !parsed.data?.action || !parsed.data?.workflow) {
    return null;
  }

  return parsed.data;
}
