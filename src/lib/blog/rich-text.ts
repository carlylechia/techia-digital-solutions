const HTML_TAG_PATTERN = /<\s*\/?\s*(?:a|article|blockquote|br|code|del|div|em|figcaption|figure|h[1-6]|hr|i|img|li|ol|p|pre|s|section|span|strong|table|tbody|td|th|thead|tr|ul|b)\b[^>]*>/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(value: string) {
  const clean = value.trim();
  if (clean.startsWith("/") && !clean.startsWith("//") && !clean.includes("\\")) return clean;
  try {
    const url = new URL(clean);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol.toLowerCase()) ? clean : null;
  } catch {
    return null;
  }
}

function renderInline(value: string) {
  const protectedTokens: string[] = [];
  const protect = (html: string) => {
    const token = `\u0000${protectedTokens.length}\u0000`;
    protectedTokens.push(html);
    return token;
  };

  let html = escapeHtml(value.replace(/\u0000/g, ""));
  html = html.replace(/`([^`\n]+)`/g, (_, code: string) => protect(`<code>${code}</code>`));
  html = html.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g, (_, alt: string, href: string) => {
    const safe = safeHref(href);
    return safe ? protect(`<img src="${safe}" alt="${alt}" loading="lazy">`) : alt;
  });
  html = html.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g, (_, label: string, href: string) => {
    const safe = safeHref(href);
    return safe ? protect(`<a href="${safe}">${label}</a>`) : label;
  });
  html = html
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>");

  return html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => protectedTokens[Number(index)] || "");
}

function renderTextBlock(lines: string[]) {
  return lines.map(renderInline).join("<br>");
}

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  const cells = tableCells(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function flushParagraph(output: string[], paragraph: string[]) {
  if (!paragraph.length) return;
  output.push(`<p>${renderTextBlock(paragraph)}</p>`);
  paragraph.length = 0;
}

function flushList(output: string[], listType: "ul" | "ol" | null, listItems: string[]) {
  if (!listType || !listItems.length) {
    listType = null;
    listItems.length = 0;
    return;
  }
  output.push(`<${listType}>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${listType}>`);
  listType = null;
  listItems.length = 0;
}

function flushQuote(output: string[], quote: string[]) {
  if (!quote.length) return;
  output.push(`<blockquote>${renderTextBlock(quote)}</blockquote>`);
  quote.length = 0;
}

export function looksLikeHtml(value: string) {
  return HTML_TAG_PATTERN.test(value);
}

function normalizeHtmlHeadingLevels(value: string) {
  return value
    .replace(/<h1(\s[^>]*)?>/gi, "<h2$1>")
    .replace(/<\/h1\s*>/gi, "</h2>")
    .replace(/<h5(\s[^>]*)?>/gi, "<h4$1>")
    .replace(/<\/h5\s*>/gi, "</h4>")
    .replace(/<h6(\s[^>]*)?>/gi, "<h4$1>")
    .replace(/<\/h6\s*>/gi, "</h4>");
}

export function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  const paragraph: string[] = [];
  const quote: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const listItems: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      flushList(output, listType, listItems);
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index].trim())) {
        codeLines.push(lines[index]);
        index += 1;
      }
      output.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    if (!trimmed) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      flushList(output, listType, listItems);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      flushList(output, listType, listItems);
      // The article page owns the H1, so Markdown headings start at H2.
      const level = Math.min(4, heading[1].length + 1);
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      flushList(output, listType, listItems);
      const headerCells = tableCells(line);
      const bodyRows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        bodyRows.push(tableCells(lines[index]));
        index += 1;
      }
      index -= 1;
      output.push(`<table><thead><tr>${headerCells.map((cell) => `<th scope="col">${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    if (/^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed)) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      flushList(output, listType, listItems);
      output.push("<hr>");
      continue;
    }

    const quoteLine = line.match(/^\s*>\s?(.*)$/);
    if (quoteLine) {
      flushParagraph(output, paragraph);
      flushList(output, listType, listItems);
      quote.push(quoteLine[1]);
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const item = unordered?.[1] || ordered?.[1];
    if (item) {
      flushParagraph(output, paragraph);
      flushQuote(output, quote);
      const nextType: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType !== nextType) flushList(output, listType, listItems);
      listType = nextType;
      listItems.push(item);
      continue;
    }

    if (quote.length || listType) {
      flushQuote(output, quote);
      flushList(output, listType, listItems);
    }
    paragraph.push(line);
  }

  flushParagraph(output, paragraph);
  flushQuote(output, quote);
  flushList(output, listType, listItems);
  return output.join("");
}

export function normalizeRichTextSource(value: string) {
  const source = value.trim();
  if (!source) return "";
  return looksLikeHtml(source) ? normalizeHtmlHeadingLevels(source) : markdownToHtml(source);
}
