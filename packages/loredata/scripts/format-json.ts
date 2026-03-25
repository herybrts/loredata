/**
 * JSON formatter that mirrors the style used in loredata data files:
 * - 2-space indentation
 * - Arrays/objects are inlined if their serialized length is ≤ INLINE_LIMIT chars
 * - Arrays/objects exceeding the limit are expanded to multiline
 */

const INLINE_LIMIT = 80;

function formatValue(value: unknown, depth: number): string {
	if (value === null) return 'null';
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') return JSON.stringify(value);

	if (Array.isArray(value)) return formatArray(value, depth);

	if (typeof value === 'object') return formatObject(value as Record<string, unknown>, depth);

	return JSON.stringify(value);
}

function formatArray(arr: unknown[], depth: number): string {
	if (arr.length === 0) return '[]';

	const inline = '[' + arr.map((v) => formatValue(v, 0)).join(', ') + ']';

	if (inline.length <= INLINE_LIMIT) return inline;

	const indent = '  '.repeat(depth + 1);
	const closingIndent = '  '.repeat(depth);
	const items = arr.map((v) => indent + formatValue(v, depth + 1)).join(',\n');

	return '[\n' + items + '\n' + closingIndent + ']';
}

function formatObject(obj: Record<string, unknown>, depth: number): string {
	const keys = Object.keys(obj);

	if (keys.length === 0) return '{}';

	const inline = '{ ' + keys.map((k) => JSON.stringify(k) + ': ' + formatValue(obj[k], 0)).join(', ') + ' }';

	if (inline.length <= INLINE_LIMIT) return inline;

	const indent = '  '.repeat(depth + 1);
	const closingIndent = '  '.repeat(depth);
	const entries = keys.map((k) => indent + JSON.stringify(k) + ': ' + formatValue(obj[k], depth + 1)).join(',\n');

	return '{\n' + entries + '\n' + closingIndent + '}';
}

export function formatJson(value: unknown): string {
	return formatValue(value, 0) + '\n';
}
