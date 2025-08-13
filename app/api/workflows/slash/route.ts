import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { createWorkflow } from '@/actions/workflows/create-workflow';
import { updateWorkflow } from '@/actions/workflows/update-workflow';
import { runWorkflow } from '@/actions/workflows/run-workflow';
import { WorkflowExecutionTrigger } from '@/types/workflow';
import { AiAutomationSpec, buildDefinitionFromAiSpec } from '@/lib/workflow/ai-automation';

const SlashSchema = z.object({
  command: z.string().min(1),
  workflowId: z.string().optional(),
});

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return u.toString();
  } catch {
    return null;
  }
}

function specLaunchAndHtml(url: string) {
  return [
    { key: 'A', type: 'LAUNCH_BROWSER', inputs: { 'Website Url': url } },
    { key: 'B', type: 'PAGE_TO_HTML' },
  ] as AiAutomationSpec['workflow']['nodes'];
}

function buildExtractImagesSpec(url: string): AiAutomationSpec {
  const nodes = [
    ...specLaunchAndHtml(url),
    { key: 'C', type: 'EXTRACT_ATTRIBUTES', inputs: { Html: '', Selector: 'img', Attribute: 'src' } },
  ];
  const edges = [
    { from: { node: 'A', output: 'Web page' }, to: { node: 'B', input: 'Web page' } },
    { from: { node: 'B', output: 'Html' }, to: { node: 'C', input: 'Html' } },
  ] as NonNullable<AiAutomationSpec['workflow']['edges']>;
  return {
    action: 'CREATE_AND_RUN',
    workflow: {
      name: `Extract images: ${url}`,
      description: `Extract all <img> src values from ${url}`,
      nodes,
      edges,
    },
  };
}

function buildExtractLinksSpec(url: string): AiAutomationSpec {
  const nodes = [
    ...specLaunchAndHtml(url),
    { key: 'C', type: 'EXTRACT_ATTRIBUTES', inputs: { Html: '', Selector: 'a', Attribute: 'href' } },
  ];
  const edges = [
    { from: { node: 'A', output: 'Web page' }, to: { node: 'B', input: 'Web page' } },
    { from: { node: 'B', output: 'Html' }, to: { node: 'C', input: 'Html' } },
  ] as NonNullable<AiAutomationSpec['workflow']['edges']>;
  return {
    action: 'CREATE_AND_RUN',
    workflow: {
      name: `Extract links: ${url}`,
      description: `Extract all <a href> values from ${url}`,
      nodes,
      edges,
    },
  };
}

function buildExtractAttributeSpec(url: string, selector: string, attribute: string): AiAutomationSpec {
  const nodes = [
    ...specLaunchAndHtml(url),
    { key: 'C', type: 'EXTRACT_ATTRIBUTES', inputs: { Html: '', Selector: selector, Attribute: attribute } },
  ];
  const edges = [
    { from: { node: 'A', output: 'Web page' }, to: { node: 'B', input: 'Web page' } },
    { from: { node: 'B', output: 'Html' }, to: { node: 'C', input: 'Html' } },
  ] as NonNullable<AiAutomationSpec['workflow']['edges']>;
  return {
    action: 'CREATE_AND_RUN',
    workflow: {
      name: `Extract ${attribute} for ${selector}: ${url}`,
      description: `Extract ${attribute} from elements matching ${selector} at ${url}`,
      nodes,
      edges,
    },
  };
}

function buildExtractTextSpec(url: string, selector: string): AiAutomationSpec {
  const nodes = [
    ...specLaunchAndHtml(url),
    { key: 'C', type: 'EXTRACT_TEXT_FROM_ELEMENT', inputs: { Html: '', Selector: selector } as any },
  ];
  const edges = [
    { from: { node: 'A', output: 'Web page' }, to: { node: 'B', input: 'Web page' } },
    { from: { node: 'B', output: 'Html' }, to: { node: 'C', input: 'Html' } },
  ] as NonNullable<AiAutomationSpec['workflow']['edges']>;
  return {
    action: 'CREATE_AND_RUN',
    workflow: {
      name: `Extract text ${selector}: ${url}`,
      description: `Extract text via selector ${selector} at ${url}`,
      nodes,
      edges,
    },
  };
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  const parsed = SlashSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const raw = parsed.data.command.trim();
  const imagesRe = /^\/?\s*extract\s+image[s]?\s+from\s+(?:page\s+)?(.+)$/i;
  const linksRe = /^\/?\s*extract\s+link[s]?\s+from\s+(?:page\s+)?(.+)$/i;
  const attrRe = /^\/?\s*extract\s+attribute\s+([^\s]+)\s+for\s+selector\s+(.+)\s+from\s+(?:page\s+)?(.+)$/i;
  const textRe = /^\/?\s*extract\s+text\s+by\s+selector\s+(.+)\s+from\s+(?:page\s+)?(.+)$/i;

  let spec: AiAutomationSpec | null = null;
  let targetUrl: string | null = null;

  let m: RegExpMatchArray | null;
  if ((m = raw.match(attrRe))) {
    const attribute = m[1].trim();
    const selector = m[2].trim();
    const page = m[3].trim();
    targetUrl = normalizeUrl(page);
    if (!targetUrl) {
      return NextResponse.json({ ok: false, message: 'Please provide a valid URL.' }, { status: 200 });
    }
    spec = buildExtractAttributeSpec(targetUrl, selector, attribute);
  } else if ((m = raw.match(textRe))) {
    const selector = m[1].trim();
    const page = m[2].trim();
    targetUrl = normalizeUrl(page);
    if (!targetUrl) {
      return NextResponse.json({ ok: false, message: 'Please provide a valid URL.' }, { status: 200 });
    }
    spec = buildExtractTextSpec(targetUrl, selector);
  } else if ((m = raw.match(imagesRe))) {
    const page = m[1].trim();
    targetUrl = normalizeUrl(page);
    if (!targetUrl) {
      return NextResponse.json({ ok: false, message: 'Please provide a valid URL.' }, { status: 200 });
    }
    spec = buildExtractImagesSpec(targetUrl);
  } else if ((m = raw.match(linksRe))) {
    const page = m[1].trim();
    targetUrl = normalizeUrl(page);
    if (!targetUrl) {
      return NextResponse.json({ ok: false, message: 'Please provide a valid URL.' }, { status: 200 });
    }
    spec = buildExtractLinksSpec(targetUrl);
  } else {
    return NextResponse.json({ ok: false, message: 'Unsupported slash command' }, { status: 200 });
  }

  const definition = buildDefinitionFromAiSpec(spec);

  if (parsed.data.workflowId) {
    const targetId = parsed.data.workflowId;
    await updateWorkflow({ id: targetId, definition });
    const exec = await runWorkflow({ workflowId: targetId, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false, currentFlowDefinition: definition });
    return NextResponse.json({ ok: true, workflowId: targetId, executionId: exec.id });
  } else {
    const wf = await createWorkflow(spec.workflow.name || `Auto Flow`, definition, spec.workflow.description, false);
    const exec = await runWorkflow({ workflowId: wf.id, trigger: WorkflowExecutionTrigger.MANUAL, shouldRedirect: false });
    return NextResponse.json({ ok: true, workflowId: wf.id, executionId: exec.id });
  }
}


