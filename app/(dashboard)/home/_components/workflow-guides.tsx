'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createWorkflow } from '@/actions/workflows/create-workflow';
import { buildDefinitionFromAiSpec, type AiAutomationSpec } from '@/lib/workflow/ai-automation';

import { Fragment } from 'react';
import { TaskRegistry } from '@/lib/workflow/task/registry';
import { TaskType } from '@/types/task';
import { ArrowRight, Globe, ShoppingCart, Newspaper, Webhook, Layers2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Guide = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  caption: string;
  steps: string[];
  example: string;
};

const guides: Guide[] = [
  {
    icon: Globe,
    title: 'Getting started: category → list → webhook',
    caption: 'From a listing page to structured JSON and delivery',
    steps: [
      'Launch Browser → Navigate URL',
      'Wait for product grid to load',
      'Page to HTML → Extract List',
      'Deliver via Webhook',
    ],
    example: `LAUNCH_BROWSER(Website Url: "https://example.com/category/shoes") → WAIT_FOR_ELEMENT(".product-card") → PAGE_TO_HTML() → EXTRACT_LIST(
  selector: ".product-card .title"
) → DELIVER_VIA_WEBHOOK("https://api.myapp.com/ingest")`,
  },
  {
    icon: ShoppingCart,
    title: 'Monitor price changes',
    caption: 'Track price deltas on a schedule',
    steps: [
      'Navigate URL with parameters',
      'Extract attributes for price',
      'Compare and store snapshot',
      'Send alert on threshold',
    ],
    example: `NAVIGATE_URL("/search?q=headphones") → PAGE_TO_HTML() → EXTRACT_ATTRIBUTES(
  selector: ".result",
  attribute: "textContent"
) → ADD_PROPERTY_TO_JSON(name: "delta", value: diff(previous,current)) → DELIVER_VIA_WEBHOOK()`,
  },
  {
    icon: Newspaper,
    title: 'Scrape articles with AI',
    caption: 'Turn messy HTML into clean structured data',
    steps: [
      'Go to article page',
      'Page to HTML snapshot',
      'Extract Data with AI (title, author, date, summary)',
      'Store Data or send downstream',
    ],
    example: `NAVIGATE_URL(articleUrl) → PAGE_TO_HTML() → EXTRACT_DATA_WITH_AI(
  prompt: "Return {title, author, date, summary}"
) → STORE_DATA(key: "articles/today")`,
  },
  {
    icon: Webhook,
    title: 'Seed API → crawl → webhook',
    caption: 'Fetch URLs via API, crawl each, deliver results',
    steps: [
      'HTTP Request for seed data',
      'Iterate: Navigate + Page to HTML',
      'Extract text or attributes',
      'Deliver via Webhook',
    ],
    example: `HTTP_REQUEST(GET, "https://api.example.com/urls") → FOR_EACH(urls)
  { NAVIGATE_URL(url) → PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1") } → DELIVER_VIA_WEBHOOK()`,
  },
  {
    icon: Layers2,
    title: 'Infinite scroll collection',
    caption: 'Scroll and gather items from dynamic feeds',
    steps: [
      'Launch Browser → Navigate URL',
      'Infinite Scroll → Wait for network idle',
      'Page to HTML → Extract List',
      'Store or Deliver',
    ],
    example: `LAUNCH_BROWSER(Website Url: feedUrl) → INFINITE_SCROLL(iterations: 5) → WAIT_FOR_NETWORK_IDLE() → PAGE_TO_HTML() → EXTRACT_LIST(
  selector: ".card .title"
) → STORE_DATA(key: "feed/items")`,
  },
  {
    icon: Globe,
    title: 'Element screenshot',
    caption: 'Capture full page or a single element',
    steps: [
      'Navigate URL',
      'Wait for element',
      'Screenshot (full/element)',
      'Store image (base64) or deliver',
    ],
    example: `NAVIGATE_URL(pageUrl) → WAIT_FOR_ELEMENT("#chart") → SCREENSHOT(
  mode: "element", selector: "#chart", format: "png"
) → STORE_DATA(key: "images/chart.png")`,
  },
  {
    icon: Layers2,
    title: 'Regex parsing',
    caption: 'Extract with custom regex patterns',
    steps: [
      'Fetch page HTML or text',
      'Run Regex Extract',
      'Use flags and groups',
      'Store or forward matches',
    ],
    example: `PAGE_TO_HTML() → REGEX_EXTRACT(
  input: html, pattern: "Price: \\$(\\d+\\.\\d{2})", flags: "g"
) → STORE_DATA(key: "matches/prices")`,
  },
  {
    icon: Globe,
    title: 'Login sequence',
    caption: 'Automate login forms safely',
    steps: [
      'Navigate → Wait for form',
      'Fill Input (email, password)',
      'Click submit → Wait for navigation',
      'Proceed to protected pages',
    ],
    example: `NAVIGATE_URL("/login") → WAIT_FOR_ELEMENT("#email") → FILL_INPUT(#email, user) → FILL_INPUT(#password, pass) → CLICK_ELEMENT("button[type=submit]") → WAIT_FOR_NAVIGATION()`,
  },
  {
    icon: Layers2,
    title: 'Set environment (viewport, UA, cookies)',
    caption: 'Control browser environment for realistic runs',
    steps: [
      'Set viewport and user agent',
      'Set cookies/localStorage',
      'Navigate and extract',
      'Deliver downstream',
    ],
    example: `SET_VIEWPORT(375x812) → SET_USER_AGENT("Mozilla/5.0 iPhone") → SET_COOKIES([...]) → NAVIGATE_URL(url) → PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1")`,
  },
  {
    icon: Globe,
    title: 'Scroll to element before extract',
    caption: 'Ensure elements are in view before scraping',
    steps: [
      'Navigate URL',
      'Scroll to element',
      'Wait for element visible',
      'Extract text/attrs',
    ],
    example: `NAVIGATE_URL(url) → SCROLL_TO_ELEMENT("#reviews") → WAIT_FOR_ELEMENT("#reviews .item") → PAGE_TO_HTML() → EXTRACT_LIST("#reviews .item .text")`,
  },
  {
    icon: Layers2,
    title: 'Evaluate custom JS',
    caption: 'Run small JS against the page context',
    steps: [
      'Navigate URL',
      'Evaluate JS snippet',
      'Return stringified result',
      'Store or deliver',
    ],
    example: `NAVIGATE_URL(url) → EVALUATE_JS(code: "return document.title;") → STORE_DATA(key: "meta/title")`,
  },
  {
    icon: Webhook,
    title: 'API only → deliver',
    caption: 'Fetch from API, transform JSON, send out',
    steps: [
      'HTTP Request (GET/POST)',
      'Add/Read JSON properties',
      'Deliver via Webhook',
      'Optional: store snapshot',
    ],
    example: `HTTP_REQUEST(GET, apiUrl) → ADD_PROPERTY_TO_JSON(name: "source", value: "api") → DELIVER_VIA_WEBHOOK(target)`,
  },
  {
    icon: Newspaper,
    title: 'List + detail pages',
    caption: 'Extract list of links then scrape each detail page',
    steps: [
      'Navigate to list → Page to HTML',
      'Extract Attributes (hrefs)',
      'FOR_EACH href: navigate and extract',
      'Store or deliver merged results',
    ],
    example: `NAVIGATE_URL(listUrl) → PAGE_TO_HTML() → EXTRACT_ATTRIBUTES(selector: ".item a", attribute: "href") → FOR_EACH(href)
  { NAVIGATE_URL(href) → PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1") } → STORE_DATA(key: "detail/results")`,
  },
  {
    icon: ShoppingCart,
    title: 'Keyboard and hover interactions',
    caption: 'Reveal menus and type into fields',
    steps: [
      'Hover to reveal content',
      'Keyboard type with delay',
      'Wait for results',
      'Extract & deliver',
    ],
    example: `NAVIGATE_URL(url) → HOVER_ELEMENT("#menu") → KEYBOARD_TYPE(text: "phones", delay: 50) → WAIT_FOR_NETWORK_IDLE() → PAGE_TO_HTML() → EXTRACT_LIST(".result .title")`,
  },
  {
    icon: Globe,
    title: 'Timing: wait for navigation/network',
    caption: 'Stabilize dynamic sites before scraping',
    steps: [
      'Click element that triggers navigation',
      'Wait for navigation',
      'Wait for network idle',
      'Extract reliably',
    ],
    example: `CLICK_ELEMENT(".next-page") → WAIT_FOR_NAVIGATION() → WAIT_FOR_NETWORK_IDLE() → PAGE_TO_HTML() → EXTRACT_LIST(".items .name")`,
  },
  {
    icon: Layers2,
    title: 'Store and retrieve data',
    caption: 'Persist intermediate results for reuse',
    steps: [
      'Extract data',
      'Store with a key',
      'Retrieve later in another run',
      'Deliver or merge',
    ],
    example: `PAGE_TO_HTML() → EXTRACT_LIST(".row .title") → STORE_DATA(key: "cache/titles") → RETRIEVE_DATA(key: "cache/titles") → DELIVER_VIA_WEBHOOK()`,
  },
  {
    icon: Newspaper,
    title: 'Single element text extraction',
    caption: 'Grab a specific element text fast',
    steps: [
      'Navigate URL',
      'Page to HTML',
      'Extract text from element',
      'Deliver value',
    ],
    example: `NAVIGATE_URL(url) → PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1") → DELIVER_VIA_WEBHOOK()`,
  },
  {
    icon: ShoppingCart,
    title: 'Attribute scraping (src, href, aria-*)',
    caption: 'Pull attribute values from matched elements',
    steps: [
      'Page to HTML',
      'Extract attributes with selector',
      'JSON array of values',
      'Store or deliver',
    ],
    example: `PAGE_TO_HTML() → EXTRACT_ATTRIBUTES(selector: "img", attribute: "src") → STORE_DATA(key: "images/srcs")`,
  },
  {
    icon: Layers2,
    title: 'JSON utilities: read and enrich',
    caption: 'Read a property from JSON and append additional fields',
    steps: [
      'Obtain JSON (API or previous node)',
      'Read property from JSON',
      'Add new property to JSON',
      'Deliver or store',
    ],
    example: `HTTP_REQUEST(GET, apiUrl) → READ_PROPERTY_FROM_JSON(JSON, "items") → ADD_PROPERTY_TO_JSON(name: "fetchedAt", value: now()) → DELIVER_VIA_WEBHOOK(target)`,
  },
  {
    icon: Globe,
    title: 'Rate limit with delay',
    caption: 'Respect site limits between actions',
    steps: [
      'Navigate URL',
      'Perform action',
      'Delay between steps',
      'Continue flow',
    ],
    example: `NAVIGATE_URL(url) → CLICK_ELEMENT(".load-more") → DELAY(1500) → WAIT_FOR_NETWORK_IDLE() → PAGE_TO_HTML() → EXTRACT_LIST(".items .name")`,
  },
  {
    icon: Layers2,
    title: 'Set localStorage before navigation',
    caption: 'Prime app state with tokens or flags',
    steps: [
      'Launch Browser',
      'Set localStorage',
      'Navigate and extract',
      'Deliver',
    ],
    example: `LAUNCH_BROWSER(Website Url: baseUrl) → SET_LOCAL_STORAGE(key: "auth", value: token) → NAVIGATE_URL(targetUrl) → PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1")`,
  },
  {
    icon: Newspaper,
    title: 'Display intermediate data',
    caption: 'Debug by rendering outputs inline',
    steps: [
      'Extract some content',
      'Display Data (for debugging)',
      'Continue processing or deliver',
      'Remove before production',
    ],
    example: `PAGE_TO_HTML() → EXTRACT_TEXT_FROM_ELEMENT("h1") → DISPLAY_DATA(title) → DELIVER_VIA_WEBHOOK()`,
  },
];

export default function WorkflowGuides() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function createFromGuide(title: string, example: string) {
    try {
      toast.loading('Creating workflow from guide...', { id: 'guide-create' });

      function parseToSpec(exampleStr: string): AiAutomationSpec {
        const tokens = exampleStr.split('→').map(t => t.trim());
        const nodes: AiAutomationSpec['workflow']['nodes'] = [];
        const edges: NonNullable<AiAutomationSpec['workflow']['edges']> = [];

        let lastKey: string | null = null;
        let lastOutput: string | undefined = undefined;
        let keyCode = 'A'.charCodeAt(0);

        const addNode = (type: string, inputs?: Record<string,string>) => {
          const key = String.fromCharCode(keyCode);
          keyCode++;
          nodes.push({ key, type, inputs });
          return key;
        };

        const connectFromLast = (toKey: string, targetInput: string, sourceOutput?: string) => {
          if (!lastKey) return;
          edges.push({ from: { node: lastKey, output: sourceOutput ?? lastOutput }, to: { node: toKey, input: targetInput } });
        };

        const upper = (s: string) => s.toUpperCase();

        for (const raw of tokens) {
          const t = upper(raw);
          let type: string | null = null;
          let connectInput = '';
          let newLastOutput: string | undefined = undefined;

          if (t.includes('LAUNCH_BROWSER')) { type = 'LAUNCH_BROWSER'; newLastOutput = 'Web page'; }
          else if (t.includes('NAVIGATE_URL')) { type = 'NAVIGATE_URL'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('PAGE_TO_HTML')) { type = 'PAGE_TO_HTML'; connectInput = 'Web page'; newLastOutput = 'Html'; }
          else if (t.includes('EXTRACT_LIST')) { type = 'EXTRACT_LIST'; connectInput = 'Html'; newLastOutput = 'Items (JSON)'; }
          else if (t.includes('EXTRACT_ATTRIBUTES')) { type = 'EXTRACT_ATTRIBUTES'; connectInput = 'Html'; newLastOutput = 'Values (JSON)'; }
          else if (t.includes('EXTRACT_TEXT_FROM_ELEMENT')) { type = 'EXTRACT_TEXT_FROM_ELEMENT'; connectInput = 'Html'; newLastOutput = 'Extracted text'; }
          else if (t.includes('HTTP_REQUEST')) { type = 'HTTP_REQUEST'; /* no default connection */ newLastOutput = 'Response body'; }
          else if (t.includes('DELIVER_VIA_WEBHOOK')) { type = 'DELIVER_VIA_WEBHOOK'; connectInput = 'Body'; newLastOutput = undefined; }
          else if (t.includes('STORE_DATA')) { type = 'STORE_DATA'; connectInput = 'Data to Store'; newLastOutput = 'Stored Data'; }
          else if (t.includes('DISPLAY_DATA')) { type = 'DISPLAY_DATA'; connectInput = 'Data to Display'; newLastOutput = 'Displayed Data'; }
          else if (t.includes('READ_PROPERTY_FROM_JSON')) { type = 'READ_PROPERTY_FROM_JSON'; connectInput = 'JSON'; newLastOutput = 'Property value'; }
          else if (t.includes('ADD_PROPERTY_TO_JSON')) { type = 'ADD_PROPERTY_TO_JSON'; connectInput = 'JSON'; newLastOutput = 'Updated JSON'; }
          else if (t.includes('RETRIEVE_DATA')) { type = 'RETRIEVE_DATA'; /* expects manual key */ newLastOutput = 'Retrieved Data'; }
          else if (t.includes('WAIT_FOR_ELEMENT')) { type = 'WAIT_FOR_ELEMENT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('WAIT_FOR_NAVIGATION')) { type = 'WAIT_FOR_NAVIGATION'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('WAIT_FOR_NETWORK_IDLE')) { type = 'WAIT_FOR_NETWORK_IDLE'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('INFINITE_SCROLL')) { type = 'INFINITE_SCROLL'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('SCROLL_TO_ELEMENT')) { type = 'SCROLL_TO_ELEMENT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('SCREENSHOT')) { type = 'SCREENSHOT'; connectInput = 'Web page'; newLastOutput = 'Image (base64)'; }
          else if (t.includes('CLICK_ELEMENT')) { type = 'CLICK_ELEMENT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('HOVER_ELEMENT')) { type = 'HOVER_ELEMENT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('FILL_INPUT')) { type = 'FILL_INPUT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('KEYBOARD_TYPE')) { type = 'KEYBOARD_TYPE'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('EVALUATE_JS')) { type = 'EVALUATE_JS'; connectInput = 'Web page'; newLastOutput = 'Result (stringified)'; }
          else if (t.includes('SET_VIEWPORT')) { type = 'SET_VIEWPORT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('SET_USER_AGENT')) { type = 'SET_USER_AGENT'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('SET_COOKIES')) { type = 'SET_COOKIES'; connectInput = 'Web page'; newLastOutput = 'Web page'; }
          else if (t.includes('SET_LOCAL_STORAGE')) { type = 'SET_LOCAL_STORAGE'; connectInput = 'Web page'; newLastOutput = 'Web page'; }

          if (!type) { 
            continue; 
          }

          // Add some default inputs for common nodes to make them executable
          const defaultInputs: Record<string, string> = {};
          if (type === 'LAUNCH_BROWSER') {
            defaultInputs['Website Url'] = 'https://example.com';
          } else if (type === 'WAIT_FOR_ELEMENT') {
            defaultInputs['Selector'] = '.content';
            defaultInputs['Visibility'] = 'visible';
          } else if (type === 'EXTRACT_LIST') {
            defaultInputs['Selector'] = '.item';
          } else if (type === 'EXTRACT_ATTRIBUTES') {
            defaultInputs['Selector'] = 'a';
            defaultInputs['Attribute'] = 'href';
          } else if (type === 'EXTRACT_TEXT_FROM_ELEMENT') {
            defaultInputs['Selector'] = 'h1';
          } else if (type === 'DELIVER_VIA_WEBHOOK') {
            defaultInputs['Target URL'] = 'https://webhook.site/your-webhook-url';
          }

          const k = addNode(type, defaultInputs);
          if (connectInput && lastKey) {
            connectFromLast(k, connectInput);
          }
          lastKey = k;
          lastOutput = newLastOutput;
        }

        // Ensure a starting node exists.
        // If there's no LAUNCH_BROWSER node but there are nodes that require a browser,
        // prepend a LAUNCH_BROWSER and connect it to the first browser-dependent node.
        const hasLaunch = nodes.some(n => n.type === 'LAUNCH_BROWSER');
        if (!hasLaunch) {
          // Determine if any node expects a 'Web page' input as entry
          const browserNeedingNodeIndex = nodes.findIndex(n => {
            const def = TaskRegistry[n.type as keyof typeof TaskRegistry];
            return !!def?.inputs?.some(i => i.name === 'Web page');
          });

          if (browserNeedingNodeIndex >= 0) {
            // Create a unique key for the new Launch Browser node
            const launchKey = String.fromCharCode(keyCode);
            keyCode++;
            nodes.push({ key: launchKey, type: 'LAUNCH_BROWSER', inputs: { 'Website Url': 'https://example.com' } });

            const targetKey = nodes[browserNeedingNodeIndex].key;
            // Connect launch to the first browser-dependent node
            edges.unshift({ from: { node: launchKey, output: 'Web page' }, to: { node: targetKey, input: 'Web page' } });
          }
        }

        return { workflow: { name: title, description: 'Starter created from guide', nodes, edges } };
      }

      const spec = parseToSpec(example);
      const def = buildDefinitionFromAiSpec(spec);
      startTransition(async () => {
        const wf = await createWorkflow(title, def, 'Created from guide', false);
        toast.success('Workflow created. Opening editor...', { id: 'guide-create' });
        router.push(`/workflow/editor/${wf.id}`);
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to create workflow from guide', { id: 'guide-create' });
    }
  }
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Workflow guides</h2>
          <p className="text-sm text-muted-foreground">Learn common patterns with clear steps and a small example.</p>
        </div>
        <Badge variant="outline" className="gap-1 text-muted-foreground"><Layers2 className="h-3.5 w-3.5" /> Templates</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((g) => (
          <Card key={g.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <g.icon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{g.title}</CardTitle>
                  <CardDescription>{g.caption}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="grid gap-2">
                {g.steps.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold">
                      {idx + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <div className="rounded-md border bg-muted/40">
                <div className="px-3 py-2 text-xs text-muted-foreground border-b">example</div>
                <pre className="p-3 text-xs whitespace-pre-wrap leading-relaxed">{g.example}</pre>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  disabled={isPending}
                  onClick={() => createFromGuide(g.title, g.example)}
                >
                  Open in editor
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}








