export interface SafeJsonOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxDepth?: number;
}

const DEFAULT_OPTIONS: Required<SafeJsonOptions> = {
  maxSize: 1024 * 1024,
  allowedTypes: ['object', 'array', 'string', 'number', 'boolean', 'null'],
  maxDepth: 32,
};

function valueType(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateParsedJson(
  parsed: unknown,
  allowedTypes: string[],
  maxDepth: number,
): string | null {
  const stack: Array<{ value: unknown; depth: number }> = [{ value: parsed, depth: 1 }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current.depth > maxDepth) {
      return `JSON exceeds maximum depth of ${maxDepth}`;
    }

    const type = valueType(current.value);
    if (!allowedTypes.includes(type)) {
      return `Disallowed type found: ${type}`;
    }

    if (Array.isArray(current.value)) {
      for (const child of current.value) {
        stack.push({ value: child, depth: current.depth + 1 });
      }
      continue;
    }

    if (current.value !== null && typeof current.value === 'object') {
      for (const [key, child] of Object.entries(current.value as Record<string, unknown>)) {
        if (key.startsWith('__') || key === 'constructor' || key === 'prototype') {
          return `Dangerous property name: ${key}`;
        }
        stack.push({ value: child, depth: current.depth + 1 });
      }
    }
  }

  return null;
}

export function safeJsonParse<T = any>(
  jsonString: string,
  options: SafeJsonOptions = {},
): { success: true; data: T } | { success: false; error: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    if (Buffer.byteLength(jsonString, 'utf8') > opts.maxSize) {
      return {
        success: false,
        error: `JSON string exceeds maximum size of ${opts.maxSize} bytes`,
      };
    }

    const parsed = JSON.parse(jsonString);
    const validationError = validateParsedJson(parsed, opts.allowedTypes, opts.maxDepth);
    if (validationError) {
      return { success: false, error: validationError };
    }

    return { success: true, data: parsed as T };
  } catch (error: unknown) {
    return {
      success: false,
      error: `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function safeJsonStringify(
  value: any,
  options: { maxSize?: number; space?: string | number } = {},
): { success: true; data: string } | { success: false; error: string } {
  const { maxSize = 1024 * 1024, space } = options;

  try {
    const seen = new WeakSet();
    const result = JSON.stringify(value, function(key, val) {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular Reference]';
        seen.add(val);
      }
      return val;
    }, space);

    if (Buffer.byteLength(result, 'utf8') > maxSize) {
      return {
        success: false,
        error: `Stringified JSON exceeds maximum size of ${maxSize} bytes`,
      };
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: `JSON stringification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function validateJsonSchema(
  data: any,
  schema: {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    required?: string[];
    properties?: Record<string, any>;
    items?: any;
  },
): { valid: true } | { valid: false; error: string } {
  try {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      return { valid: false, error: `Expected type ${schema.type}, got ${actualType}` };
    }

    if (schema.type === 'object' && schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          return { valid: false, error: `Missing required property: ${requiredProp}` };
        }
      }
    }

    if (schema.type === 'object' && schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in data) {
          const validation = validateJsonSchema(data[prop], propSchema);
          if (!validation.valid) {
            return { valid: false, error: `Property ${prop}: ${validation.error}` };
          }
        }
      }
    }

    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const validation = validateJsonSchema(data[i], schema.items);
        if (!validation.valid) {
          return { valid: false, error: `Array item ${i}: ${validation.error}` };
        }
      }
    }

    return { valid: true };
  } catch (error: unknown) {
    return {
      valid: false,
      error: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
