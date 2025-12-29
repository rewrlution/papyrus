/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

export const renderTemplate = (
  templateName: string,
  data: Record<string, any>
): string => {
  if (!templateCache.has(templateName)) {
    const templatePath = path.join(
      __dirname,
      './templates',
      `${templateName}.hbs`
    );
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    templateCache.set(templateName, template);
  }

  const template = templateCache.get(templateName)!;
  return template(data);
};

export const clearTemplateCache = () => templateCache.clear();
