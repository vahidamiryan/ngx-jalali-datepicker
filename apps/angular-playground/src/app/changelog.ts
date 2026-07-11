/**
 * Tiny parser for the library's Keep-a-Changelog `CHANGELOG.md`, bundled as raw
 * text via the esbuild `loader` option in angular.json. Parsed once at startup —
 * the demo always shows whatever the real file says, never a hand-kept copy.
 */

/** One `### Added/Changed/Fixed` block of a release. */
export interface ChangelogSection {
  tag: string;
  /** Modifier for styling: 'added' | 'changed' | 'fixed' | 'other'. */
  kind: string;
  /** List items as sanitized inline HTML (bold + code preserved). */
  items: string[];
}

/** One `## [version]` release entry. */
export interface ChangelogEntry {
  version: string;
  isUnreleased: boolean;
  sections: ChangelogSection[];
}

const KNOWN_KINDS = new Set(['added', 'changed', 'fixed', 'removed', 'deprecated', 'security']);

/** Escape HTML, then re-introduce the two inline marks the changelog uses. */
function mdInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1'); // links → plain text
}

export function parseChangelog(md: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let entry: ChangelogEntry | null = null;
  let section: ChangelogSection | null = null;

  for (const line of md.split(/\r?\n/)) {
    const h2 = /^## \[([^\]]+)\]/.exec(line);
    if (h2) {
      entry = { version: h2[1], isUnreleased: /unreleased/i.test(h2[1]), sections: [] };
      entries.push(entry);
      section = null;
      continue;
    }
    if (!entry) continue; // preamble before the first release

    const h3 = /^### (.+)/.exec(line);
    if (h3) {
      const tag = h3[1].trim();
      // The file occasionally repeats a heading (e.g. two "### Fixed") — merge.
      section = entry.sections.find((s) => s.tag === tag) ?? null;
      if (!section) {
        const kind = tag.toLowerCase();
        section = { tag, kind: KNOWN_KINDS.has(kind) ? kind : 'other', items: [] };
        entry.sections.push(section);
      }
      continue;
    }
    if (!section) continue;

    const item = /^- (.*)/.exec(line);
    if (item) {
      section.items.push(mdInline(item[1].trim()));
    } else if (/^\s+\S/.test(line) && section.items.length) {
      // Hard-wrapped continuation of the previous bullet.
      section.items[section.items.length - 1] += ' ' + mdInline(line.trim());
    }
  }
  return entries;
}
