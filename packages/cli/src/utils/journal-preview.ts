/**
 * Extract first non-empty line from journal content.
 * Skips YAML frontmatter and returns the first line of actual content.
 *
 * @param content - Full journal content (may include frontmatter)
 * @returns First non-empty content line, or "(empty)" if none found
 *
 * @example
 * extractPreview('---\ndate: 2025-01-01\n---\n\nHello World\n')
 * // Returns: "Hello World"
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

    // Return first non-empty line
    const trimmed = line.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return '(empty)';
}
