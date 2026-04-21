/**
 * Extract a readable preview from journal content.
 * Skips YAML frontmatter, blank lines, and markdown headings.
 * Returns the first line of actual prose content.
 *
 * @param content - Full journal content (may include frontmatter)
 * @returns First non-empty, non-heading content line, or "(empty)" if none found
 *
 * @example
 * extractPreview('---\ndate: 2025-01-01\n---\n\n## What I worked on\n\nFixed the auth bug.\n')
 * // Returns: "Fixed the auth bug."
 *
 * extractPreview('---\ndate: 2025-01-01\n---\n\n')
 * // Returns: "(empty)"
 */
export function extractPreview(content: string): string {
  const lines = content.split('\n');

  // Skip frontmatter (between --- markers)
  let inFrontmatter = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) continue;

    const trimmed = line.trim();

    // Skip blank lines and markdown headings
    if (!trimmed || trimmed.startsWith('#')) continue;

    return trimmed;
  }

  return '(empty)';
}
