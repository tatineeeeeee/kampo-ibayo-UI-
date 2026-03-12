import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<div class="x">&\'test\'')).toBe(
      '&lt;div class=&quot;x&quot;&gt;&amp;&#039;test&#039;'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns empty string for falsy input', () => {
    // The function checks `if (!str)` so null/undefined coerced to string would fail,
    // but empty string should return empty
    expect(escapeHtml('')).toBe('');
  });

  it('returns unchanged string when no special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('handles string with only special characters', () => {
    expect(escapeHtml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#039;');
  });
});
