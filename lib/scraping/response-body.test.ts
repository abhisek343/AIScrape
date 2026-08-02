import { readBoundedResponseText, ResponseBodyTooLargeError } from './response-body';

describe('bounded fetch response bodies', () => {
  it('rejects a chunked response before reading the full body', async () => {
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) controller.enqueue(new TextEncoder().encode('abc'));
        else if (pulls === 2) controller.enqueue(new TextEncoder().encode('def'));
        else controller.enqueue(new TextEncoder().encode('never-read'));
      },
    }, { highWaterMark: 0 });

    await expect(readBoundedResponseText(new Response(body), 5)).rejects.toBeInstanceOf(ResponseBodyTooLargeError);
    expect(pulls).toBe(2);
  });

  it('rejects a declared body larger than the budget before reading it', async () => {
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new TextEncoder().encode('should not be read'));
      },
    }, { highWaterMark: 0 });

    await expect(readBoundedResponseText({
      headers: new Headers({ 'content-length': '6' }),
      body,
      text: async () => 'should not be read',
    }, 5))
      .rejects.toBeInstanceOf(ResponseBodyTooLargeError);
    expect(pulls).toBe(0);
  });

  it('decodes multibyte UTF-8 chunks while enforcing bytes', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoded = new TextEncoder().encode('€');
        controller.enqueue(encoded.slice(0, 1));
        controller.enqueue(encoded.slice(1));
        controller.close();
      },
    });

    await expect(readBoundedResponseText(new Response(body), 3)).resolves.toBe('€');
  });
});
