export interface ParsedFrontmatter {
  feature: string;
  module: string;
  actors: string[];
  requirement_ref?: string;
  related_features: string[];
  doc_type: string;
  tags: string[];
  last_updated?: string;

  platform?: string;
  routes: string[];
  requires_permission?: string | null;
  related_capability?: string;
  related_ui_flows: string[];
  related_glossary: string[];
  permission_codes: string[];
  role_name?: string;
  generated_from: string[];
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
    } else if (value === 'null' || value === '') {
      value = null;
    }

    fm[key] = value;
  }

  const frontmatter: ParsedFrontmatter = {
    feature: fm.feature,
    module: fm.module,
    actors: fm.actors ?? [],
    requirement_ref: fm.requirement_ref ?? undefined,
    related_features: fm.related_features ?? [],
    doc_type: fm.doc_type ?? 'capability',
    tags: fm.tags ?? [],
    last_updated: fm.last_updated ?? undefined,

    platform: fm.platform ?? undefined,
    routes: fm.routes ?? [],
    requires_permission: fm.requires_permission ?? null,
    related_capability: fm.related_capability ?? undefined,
    related_ui_flows: fm.related_ui_flows ?? [],
    related_glossary: fm.related_glossary ?? [],
    permission_codes: fm.permission_codes ?? [],
    role_name: fm.role_name ?? undefined,
    generated_from: fm.generated_from ?? [],
  };

  if (!frontmatter.feature || !frontmatter.module) {
    throw new Error(
      `Frontmatter missing required fields (feature, module). Got: ${JSON.stringify(fm)}`,
    );
  }
  if (!frontmatter.doc_type) {
    throw new Error(
      `Frontmatter missing required field "doc_type" for feature "${frontmatter.feature}".`,
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

  'What this is': 'overview',
  'What this is NOT': 'overview',
  'How to get here': 'navigation',
  'How this works': 'overview',
  'Creation rules': 'validation_rules',
  Deactivation: 'business_rules',
  'Deactivation effects': 'business_rules',
  'Who can do what': 'permissions',
  'Who can create one': 'permissions',
  'Who sees what in the list view': 'permissions',
  'Common questions this answers': 'faq',
  'Common questions': 'faq',
  "Common 'why can't I...' answers for this specific page": 'faq',
};

function headingToSectionType(heading: string): string {
  const normalized = heading.trim();
  const known = HEADING_TO_SECTION_TYPE[normalized];
  if (known) return known;

  return 'general';
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
