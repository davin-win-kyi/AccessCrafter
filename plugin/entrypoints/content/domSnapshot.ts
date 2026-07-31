// Walks the live DOM and produces a pruned, accessibility-tree-like snapshot
// for Stage 1 (semantic webpage modeling). This is NOT raw HTML -- it keeps
// only what matters for grouping the page into semantic components (tag,
// role, accessible name, truncated text, a stable selector, visibility, and
// children), collapsing non-semantic wrapper elements and skipping
// non-content nodes, so token usage on the backend stays bounded.
//
// See docs/architecture.md ("DOM snapshot format") for the full rationale.

import type { DomSnapshot, DomSnapshotNode } from '../../lib/types';

const MAX_NODES = 500;
const MAX_DEPTH = 12;
const MAX_TEXT_LENGTH = 200;

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'meta', 'link', 'svg']);

const IMPLICIT_ROLES: Record<string, string> = {
  a: 'link',
  button: 'button',
  nav: 'navigation',
  main: 'main',
  header: 'banner',
  footer: 'contentinfo',
  form: 'form',
  fieldset: 'group',
  section: 'region',
  ul: 'list',
  ol: 'list',
  li: 'listitem',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  select: 'combobox',
  textarea: 'textbox',
};

function isVisible(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function getRole(el: Element): string | undefined {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type;
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'file') return 'file-input';
    if (type === 'submit' || type === 'button') return 'button';
    return 'textbox';
  }
  return IMPLICIT_ROLES[tag];
}

function resolveLabelledBy(el: Element): string | undefined {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (!labelledBy) return undefined;
  const text = labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  return text || undefined;
}

function getAccessibleName(el: Element): string | undefined {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  const labelledBy = resolveLabelledBy(el);
  if (labelledBy) return labelledBy;

  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label?.textContent) return label.textContent.trim();
  }

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return placeholder.trim();

  const alt = el.getAttribute('alt');
  if (alt) return alt.trim();

  const title = el.getAttribute('title');
  if (title) return title.trim();

  return undefined;
}

function getOwnText(el: Element): string | undefined {
  let text = '';
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    }
  }
  text = text.trim().replace(/\s+/g, ' ');
  if (!text) return undefined;
  return text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) + '…' : text;
}

function buildSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body && parts.length < 8) {
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    const parentEl: Element | null = current.parentElement;
    if (!parentEl) {
      parts.unshift(current.tagName.toLowerCase());
      break;
    }
    const siblings: Element[] = Array.from(parentEl.children).filter(
      (c): c is Element => c.tagName === current!.tagName,
    );
    const index = siblings.indexOf(current) + 1;
    const tag = current.tagName.toLowerCase();
    parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
    current = parentEl;
  }
  return parts.join(' > ');
}

// A wrapper element carries no semantic value on its own: no role, no
// accessible name, no id, not interactive, and exactly one element child --
// so it's skipped and the walk recurses straight into its child instead.
function isBareWrapper(el: Element, role: string | undefined, name: string | undefined): boolean {
  if (role || name || el.id) return false;
  const elementChildren = Array.from(el.children);
  if (elementChildren.length !== 1) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'div' || tag === 'span';
}

let nodeCount = 0;

function walk(el: Element, depth: number): DomSnapshotNode | null {
  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return null;
  if (nodeCount >= MAX_NODES) return null;
  if (!isVisible(el)) return null;

  const role = getRole(el);
  const accessibleName = getAccessibleName(el);

  if (depth < MAX_DEPTH && isBareWrapper(el, role, accessibleName)) {
    return walk(el.children[0], depth);
  }

  nodeCount += 1;

  const children: DomSnapshotNode[] = [];
  if (depth < MAX_DEPTH) {
    for (const child of Array.from(el.children)) {
      if (nodeCount >= MAX_NODES) break;
      const childNode = walk(child, depth + 1);
      if (childNode) children.push(childNode);
    }
  }

  return {
    tag,
    role,
    accessibleName,
    text: getOwnText(el),
    selector: buildSelector(el),
    visible: true,
    children,
  };
}

export function captureDomSnapshot(): DomSnapshot {
  nodeCount = 0;
  const root = walk(document.body, 0) ?? {
    tag: 'body',
    selector: 'body',
    visible: true,
    children: [],
  };
  return { nodeCount, root };
}
