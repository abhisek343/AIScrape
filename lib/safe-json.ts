import 'server-only';

export interface SafeJsonOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxDepth?: number;
}

const DEFAULT_OPTIONS: Required<SafeJsonOptions> = {
  maxSize: 1024 * 1024, // 1MB
  allowedTypes: ['object', 'array', 'string', 'number', 'boolean', 'null'],
  maxDepth: 32
};

/**
 * Safely parse JSON with validation and size limits
 */
export function safeJsonParse<T = any>(
  jsonString: string, 
  options: SafeJsonOptions = {}
): { success: true; data: T } | { success: false; error: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check size limit
    if (jsonString.length > opts.maxSize) {
      return {
        success: false,
        error: `JSON string exceeds maximum size of ${opts.maxSize} bytes`
      };
    }

    // Basic validation - check for potential prototype pollution
    if (jsonString.includes('__proto__') || jsonString.includes('constructor') || jsonString.includes('prototype')) {
      return {
        success: false,
        error: 'JSON contains potentially dangerous prototype pollution patterns'
      };
    }

    // Parse with reviver to validate structure and depth
    let currentDepth = 0;
    const maxDepth = opts.maxDepth;

    const parsed = JSON.parse(jsonString, function(key, value) {
      // Track depth
      if (typeof value === 'object' && value !== null) {
        currentDepth++;
        if (currentDepth > maxDepth) {
          throw new Error(`JSON exceeds maximum depth of ${maxDepth}`);
        }
      }

      // Validate value types
      const valueType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
      if (!opts.allowedTypes.includes(valueType)) {
        throw new Error(`Disallowed type found: ${valueType}`);
      }

      // Additional validation for objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check for dangerous property names
        for (const prop in value) {
          if (prop.startsWith('__') || prop === 'constructor' || prop === 'prototype') {
            throw new Error(`Dangerous property name: ${prop}`);
          }
        }
      }

      return value;
    });

    return { success: true, data: parsed };
  } catch (error: any) {
    return {
      success: false,
      error: `JSON parsing failed: ${error.message}`
    };
  }
}

/**
 * Safely stringify JSON with circular reference handling
 */
export function safeJsonStringify(
  value: any,
  options: { maxSize?: number; space?: string | number } = {}
): { success: true; data: string } | { success: false; error: string } {
  const { maxSize = 1024 * 1024, space } = options;

  try {
    // Handle circular references
    const seen = new WeakSet();
    const result = JSON.stringify(value, function(key, val) {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular Reference]';
        }
        seen.add(val);
      }
      return val;
    }, space);

    // Check size limit
    if (result.length > maxSize) {
      return {
        success: false,
        error: `Stringified JSON exceeds maximum size of ${maxSize} bytes`
      };
    }

    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: `JSON stringification failed: ${error.message}`
    };
  }
}

/**
 * Validate JSON schema against expected structure
 */
export function validateJsonSchema(
  data: any,
  schema: {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    required?: string[];
    properties?: Record<string, any>;
    items?: any;
  }
): { valid: true } | { valid: false; error: string } {
  try {
    // Type validation
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      return {
        valid: false,
        error: `Expected type ${schema.type}, got ${actualType}`
      };
    }

    // Object validation
    if (schema.type === 'object' && schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          return {
            valid: false,
            error: `Missing required property: ${requiredProp}`
          };
        }
      }
    }

    // Property validation
    if (schema.type === 'object' && schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in data) {
          const validation = validateJsonSchema(data[prop], propSchema);
          if (!validation.valid) {
            return {
              valid: false,
              error: `Property ${prop}: ${validation.error}`
            };
          }
        }
      }
    }

    // Array validation
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const validation = validateJsonSchema(data[i], schema.items);
        if (!validation.valid) {
          return {
            valid: false,
            error: `Array item ${i}: ${validation.error}`
          };
        }
      }
    }

    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: `Schema validation failed: ${error.message}`
    };
  }
}
