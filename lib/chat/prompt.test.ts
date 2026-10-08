import {
  buildBoundedHistory,
  buildWorkflowContextHeader,
} from './prompt';

describe('chat prompt construction', () => {
  it('redacts sensitive workflow inputs before model context is built', () => {
    const secret = 'Bearer super-secret-token';
    const definition = JSON.stringify({
      nodes: [
        {
          id: 'node-1',
          data: {
            type: 'HTTP_REQUEST',
            inputs: {
              Headers: secret,
              URL: 'https://example.com',
            },
          },
        },
      ],
      edges: [],
    });

    const context = buildWorkflowContextHeader({
      name: 'Sensitive flow',
      description: 'test',
      definition,
    });

    expect(context).not.toContain(secret);
    expect(context).toContain('Headers: [configured]');
    expect(context).toContain('URL: https://example.com');
  });

  it('bounds rendered conversation history by characters', () => {
    const history = buildBoundedHistory(
      [
        { role: 'user', parts: [{ text: 'a'.repeat(100) }] },
        { role: 'model', parts: [{ text: 'b'.repeat(100) }] },
      ],
      64,
    );

    expect(history.length).toBeLessThanOrEqual(64);
    expect(history).toContain('b');
  });
});
