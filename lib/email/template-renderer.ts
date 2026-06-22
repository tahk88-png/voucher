/**
 * Render DB-stored email templates.
 *
 * Uses the same EmailSection[] format as lib/email-builder.ts.
 * Supports variable interpolation: {{firstName}}, {{amount}}, etc.
 */

import { prisma } from '@/lib/prisma';
import { buildEmailHtml } from '@/lib/email-builder';

/**
 * Render a DB template by slug with variable interpolation.
 * Returns null if template not found or not active.
 */
export async function renderDbTemplate(
  slug: string,
  variables: Record<string, string> = {}
): Promise<{ subject: string; html: string } | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { slug },
  });

  if (!template || template.status !== 'active') {
    return null;
  }

  // Interpolate variables in subject
  let subject = template.subject;
  for (const [key, value] of Object.entries(variables)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  // Get sections and interpolate variables in text content
  const sections = template.sectionsJson as Array<Record<string, unknown>>;
  const interpolatedSections = sections.map((section) => {
    const result = { ...section };
    if (typeof result.content === 'string') {
      for (const [key, value] of Object.entries(variables)) {
        result.content = (result.content as string).replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          value
        );
      }
    }
    if (typeof result.text === 'string') {
      for (const [key, value] of Object.entries(variables)) {
        result.text = (result.text as string).replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          value
        );
      }
    }
    return result;
  });

  const html = buildEmailHtml(interpolatedSections as unknown as Parameters<typeof buildEmailHtml>[0]);

  return { subject, html };
}

/**
 * Preview a template with sample data (doesn't require template to be active).
 */
export async function previewTemplate(
  id: string,
  sampleData: Record<string, string> = {}
): Promise<{ subject: string; html: string } | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) return null;

  let subject = template.subject;
  for (const [key, value] of Object.entries(sampleData)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  const sections = template.sectionsJson as Array<Record<string, unknown>>;
  const interpolated = sections.map((section) => {
    const result = { ...section };
    for (const [key, value] of Object.entries(sampleData)) {
      if (typeof result.content === 'string') {
        result.content = (result.content as string).replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          value
        );
      }
    }
    return result;
  });

  const html = buildEmailHtml(interpolated as unknown as Parameters<typeof buildEmailHtml>[0]);
  return { subject, html };
}
