import type { ReactNode } from "react";

import "./markdown.css";

/** Renders the simple Markdown the AI writes (headings, bold, italics,
 * bullet and numbered lists, paragraphs) as safe React elements. */

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const token = match[0];
    out.push(
      token.startsWith("**") ? (
        <strong key={`${key}-${index++}`}>{token.slice(2, -2)}</strong>
      ) : (
        <em key={`${key}-${index++}`}>{token.slice(1, -1)}</em>
      ),
    );
    last = start + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  // A preview cut in the middle can leave a lone "**": hide it.
  return out.map((part) =>
    typeof part === "string" ? part.replace(/\*\*/g, "") : part,
  );
}

export default function Markdown({
  text,
  className = "",
}: {
  text: string | null | undefined;
  className?: string;
}) {
  if (!text) return null;
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length) {
      const key = `p${blocks.length}`;
      blocks.push(<p key={key}>{inline(paragraph.join(" "), key)}</p>);
      paragraph = [];
    }
  }
  function flushList() {
    if (list) {
      const key = `l${blocks.length}`;
      const items = list.items.map((item, i) => (
        <li key={`${key}-${i}`}>{inline(item, `${key}-${i}`)}</li>
      ));
      blocks.push(
        list.ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>,
      );
      list = null;
    }
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`hr${blocks.length}`} />);
    } else if (heading) {
      flushParagraph();
      flushList();
      const key = `h${blocks.length}`;
      const content = inline(heading[2], key);
      const level = heading[1].length;
      blocks.push(
        level === 1 ? (
          <h3 key={key}>{content}</h3>
        ) : level === 2 ? (
          <h4 key={key}>{content}</h4>
        ) : (
          <h5 key={key}>{content}</h5>
        ),
      );
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();

  return <div className={`md ${className}`.trim()}>{blocks}</div>;
}
