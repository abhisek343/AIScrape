import { extractAutomationSpec } from './automation-response';

describe('extractAutomationSpec', () => {
  it('parses a fenced automation spec', () => {
    const response = [
      'I can build that.',
      '```json',
      JSON.stringify({
        action: 'CREATE_ONLY',
        workflow: {
          name: 'Example',
          nodes: [{ key: 'A', type: 'LAUNCH_BROWSER', inputs: { 'Website Url': 'https://example.com' } }],
        },
      }),
      '```',
    ].join('\n');

    const spec = extractAutomationSpec(response);

    expect(spec?.action).toBe('CREATE_ONLY');
    expect(spec?.workflow.name).toBe('Example');
  });

  it('returns null for malformed or unrelated JSON', () => {
    expect(extractAutomationSpec('not json')).toBeNull();
    expect(extractAutomationSpec('{"hello":"world"}')).toBeNull();
  });
});
