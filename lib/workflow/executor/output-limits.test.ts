import { ExtractAttributesExecutor } from './extract-attributes-executor';
import { ExtractListExecutor } from './extract-list-executor';
import { PageToHtmlExecutor } from './page-to-html-executor';
import { MAX_COLLECTION_ITEMS, MAX_TEXT_OUTPUT_BYTES } from '@/lib/workflow/output-limits';

function baseEnvironment(overrides: Record<string, unknown> = {}) {
  return {
    getInput: jest.fn(),
    setOutput: jest.fn(),
    getPage: jest.fn(),
    setPage: jest.fn(),
    getBrowser: jest.fn(),
    setBrowser: jest.fn(),
    getUserId: jest.fn(),
    getExecutionId: jest.fn(),
    getPhaseId: jest.fn(),
    log: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    ...overrides,
  } as any;
}

describe('workflow output limits', () => {
  it('rejects page HTML larger than the persisted text limit', async () => {
    const html = 'x'.repeat(MAX_TEXT_OUTPUT_BYTES + 1);
    const environment = baseEnvironment({
      getPage: jest.fn(() => ({ content: jest.fn(async () => html) })),
    });

    await expect(PageToHtmlExecutor(environment)).resolves.toBe(false);
    expect(environment.setOutput).not.toHaveBeenCalled();
    expect(environment.log.error).toHaveBeenCalledWith(
      'Page HTML exceeds the maximum persisted output size',
    );
  });

  it('rejects extracted lists above the maximum item count', async () => {
    const html = '<span>x</span>'.repeat(MAX_COLLECTION_ITEMS + 1);
    const environment = baseEnvironment({
      getInput: jest.fn((name: string) => name === 'Html' ? html : 'span'),
    });

    await expect(ExtractListExecutor(environment)).resolves.toBe(false);
    expect(environment.setOutput).not.toHaveBeenCalled();
    expect(environment.log.error).toHaveBeenCalledWith(
      'Extracted list exceeds the maximum item count',
    );
  });

  it('rejects extracted attributes above the maximum item count', async () => {
    const html = '<a href="/x"></a>'.repeat(MAX_COLLECTION_ITEMS + 1);
    const environment = baseEnvironment({
      getInput: jest.fn((name: string) => {
        if (name === 'Html') return html;
        if (name === 'Selector') return 'a';
        if (name === 'Attribute') return 'href';
        return '';
      }),
    });

    await expect(ExtractAttributesExecutor(environment)).resolves.toBe(false);
    expect(environment.setOutput).not.toHaveBeenCalled();
    expect(environment.log.error).toHaveBeenCalledWith(
      'Extracted attributes exceed the maximum item count',
    );
  });
});
