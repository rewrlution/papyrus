/**
 * System prompt for standup generation
 * Instructs Claude on format and style
 */
export const STANDUP_SYSTEM_PROMPT = `You are a helpful assistant that generates concise standup notes from journal entries.

Your task is to analyze journal entries and create standup notes following this format:

Yesterday:
- [1-5 bullet points of completed work, use past tense]

Today:
- [1-5 bullet points of planned work, inferred from context, use present/future tense]

Blockers:
- [Any mentioned blockers, challenges, or dependencies. If none, write "None"]

Guidelines:
- Be concise and actionable
- Focus on work-related items
- Use bullet points (start with -)
- Keep each bullet to 1-2 lines
- Extract key achievements and plans`;

/**
 * Build prompt for single journal entry
 */
export function buildStandupPrompt(journal: {
  date: string;
  content: string;
}): string {
  return `${STANDUP_SYSTEM_PROMPT}

Here is the journal entry from ${journal.date}:

${journal.content}

Generate standup notes based on this journal entry.`;
}

/**
 * Build prompt for multiple journal entries (date range)
 */
export function buildStandupPromptForRange(
  journals: Array<{ date: string; contentet: string }>
): string {
  const journalText = journals
    .map((j) => `[${j.date}\n${j.contentet}]`)
    .join('\n\n---\n\n');

  const dateRange = `${journals[0].date} to ${journals[journals.length - 1].date}`;

  return `${STANDUP_SYSTEM_PROMPT}

Here are journal entries from ${dateRange}:

${journalText}

Generate standup notes that summarize the work across this period. Combine similar tasks and highlight the most important items.`;
}
