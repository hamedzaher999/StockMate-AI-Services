export interface ParsedFrontmatter {
  feature: string;
  module: string;
  actors: string[];
  requirement_ref?: string;
  related_features: string[];
  doc_type: string;
  tags: string[];
  last_updated?: string;
}

export interface ParsedSection {
  heading: string;
  sectionType: string;
  content: string;
  index: number;
}

export interface ParsedDocument {
  frontmatter: ParsedFrontmatter;
  sections: ParsedSection[];
  rawContent: string;
}

function parseFrontmatter(raw: string): {
  frontmatter: ParsedFrontmatter;
  body: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(
      'No YAML frontmatter block found (expected file to start with ---)',
    );
  }

  const [, yamlBlock, body] = match;
  const fm: Record<string, any> = {};

  for (const line of yamlBlock.split('\n')) {
    if (!line.trim()) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: any = line.slice(colonIdx + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    fm[key] = value;
  }

  const frontmatter: ParsedFrontmatter = {
    feature: fm.feature,
    module: fm.module,
    actors: fm.actors ?? [],
    requirement_ref: fm.requirement_ref,
    related_features: fm.related_features ?? [],
    doc_type: fm.doc_type ?? 'procedure',
    tags: fm.tags ?? [],
    last_updated: fm.last_updated,
  };

  if (!frontmatter.feature || !frontmatter.module) {
    throw new Error(
      `Frontmatter missing required fields (feature, module). Got: ${JSON.stringify(fm)}`,
    );
  }

  return { frontmatter, body };
}

const HEADING_TO_SECTION_TYPE: Record<string, string> = {
  'نظرة عامة': 'overview',
  'خطوات التنفيذ': 'workflow',
  'حقول النموذج المطلوبة': 'required_fields',
  'الصلاحيات المطلوبة': 'permissions',
  'سير الموافقة': 'approval_workflow',
  'قواعد التحقق': 'validation_rules',
  'إجراءات ذات صلة': 'related_actions',
  'رابط الصفحة': 'direct_link',
  'مرجع المتطلب': 'requirement_reference',
};

function headingToSectionType(heading: string): string {
  const normalized = heading.trim();
  const known = HEADING_TO_SECTION_TYPE[normalized];
  if (known) return known;

  throw new Error(
    `Unknown section heading "${heading}". Add it to HEADING_TO_SECTION_TYPE ` +
      `in markdown-parser.ts, or fix a typo in the source .md file. ` +
      `Refusing to guess — a wrong auto-generated slug is worse than a loud failure.`,
  );
}

function splitIntoSections(body: string): ParsedSection[] {
  const lines = body.split('\n');
  const sections: ParsedSection[] = [];

  let currentHeading: string | null = null;
  let currentContent: string[] = [];
  let index = 0;

  const flush = () => {
    if (currentHeading !== null) {
      const content = currentContent.join('\n').trim();
      if (content.length > 0) {
        sections.push({
          heading: currentHeading,
          sectionType: headingToSectionType(currentHeading),
          content,
          index: index++,
        });
      }
    }
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      flush();
      currentHeading = h2Match[1].trim();
      currentContent = [];
    } else if (line.match(/^#\s+/)) {
      continue;
    } else {
      currentContent.push(line);
    }
  }
  flush();

  return sections;
}

export function parseMarkdownDocument(rawFileContent: string): ParsedDocument {
  const { frontmatter, body } = parseFrontmatter(rawFileContent);
  const sections = splitIntoSections(body);

  if (sections.length === 0) {
    throw new Error(
      `Document "${frontmatter.feature}" produced zero sections — check heading format.`,
    );
  }

  return { frontmatter, sections, rawContent: rawFileContent };
}
