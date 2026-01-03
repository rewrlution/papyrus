export const JOURNAL_TEMPATE = `
<!-- ================================================================ -->
<!-- Symbol Guide                                                     -->
<!-- ---------------------------------------------------------------- -->
<!-- @person     Tag people           @alice, @bob                    -->
<!-- #project    Tag projects         #papyrus, #feature-x            -->
<!-- +tech       Tag technologies     +typescript, +react             -->
<!-- ================================================================ -->
`;

export function stripTemplateComments(content: string): string {
  return content
    .split('\n')
    .filter((line) => !line.trim().match(/^<!--.*-->$/))
    .join('\n')
    .trim();
}
