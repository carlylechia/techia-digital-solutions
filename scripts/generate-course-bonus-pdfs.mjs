import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const TOP_MARGIN = 54;
const BOTTOM_MARGIN = 54;
const LEFT_MARGIN = 54;
const RIGHT_MARGIN = 54;

const BONUS_FILES = [
  {
    source: "src/content/courses/bonuses/digital-skills-learning-roadmap.md",
    output: "src/content/courses/bonuses/pdf/digital-skills-learning-roadmap.pdf",
  },
  {
    source: "src/content/courses/bonuses/skill-monetization-starter-guide.md",
    output: "src/content/courses/bonuses/pdf/skill-monetization-starter-guide.pdf",
  },
  {
    source: "src/content/courses/bonuses/course-learning-tracker.md",
    output: "src/content/courses/bonuses/pdf/course-learning-tracker.pdf",
  },
  {
    source: "src/content/courses/bonuses/business-digital-checkup-template.md",
    output: "src/content/courses/bonuses/pdf/business-digital-checkup-template.pdf",
  },
  {
    source: "src/content/courses/bonuses/thirty-day-digital-skills-action-plan.md",
    output: "src/content/courses/bonuses/pdf/thirty-day-digital-skills-action-plan.pdf",
  },
];

function escapePdfText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, width) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];

  const lines = [];
  let current = words[0];

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  lines.push(current);
  return lines;
}

function wrapWithPrefix(text, width, prefix, hangingIndent = "  ") {
  const wrapped = wrapText(text, Math.max(width - prefix.length, 12));
  return wrapped.map((line, index) =>
    index === 0 ? `${prefix}${line}` : `${hangingIndent}${line}`,
  );
}

function normalizeTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .join(" | ");
}

function buildLineEntries(markdown) {
  const rawLines = markdown.replace(/\r\n/g, "\n").split("\n");
  const entries = [];

  const pushBlank = (height = 8) => {
    const previous = entries.at(-1);
    if (previous?.kind === "blank") {
      previous.height = Math.max(previous.height, height);
      return;
    }

    entries.push({ kind: "blank", height });
  };

  const pushWrappedText = ({
    text,
    width,
    prefix = "",
    hangingIndent = "  ",
    font = "F1",
    size = 10.5,
    lineHeight = 14,
  }) => {
    const lines = prefix
      ? wrapWithPrefix(text, width, prefix, hangingIndent)
      : wrapText(text, width);

    for (const line of lines) {
      entries.push({
        kind: "text",
        text: line,
        font,
        size,
        lineHeight,
      });
    }
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      pushBlank(8);
      continue;
    }

    if (/^\|[\s:-]+\|$/.test(trimmed)) {
      continue;
    }

    if (/^#\s+/.test(trimmed)) {
      pushBlank(4);
      pushWrappedText({
        text: trimmed.replace(/^#\s+/, ""),
        width: 36,
        font: "F2",
        size: 18,
        lineHeight: 22,
      });
      pushBlank(6);
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      pushBlank(4);
      pushWrappedText({
        text: trimmed.replace(/^##\s+/, ""),
        width: 46,
        font: "F2",
        size: 13.5,
        lineHeight: 18,
      });
      pushBlank(4);
      continue;
    }

    if (/^###\s+/.test(trimmed)) {
      pushWrappedText({
        text: trimmed.replace(/^###\s+/, ""),
        width: 56,
        font: "F2",
        size: 11.5,
        lineHeight: 15,
      });
      continue;
    }

    if (/^\*\s+/.test(trimmed)) {
      pushWrappedText({
        text: trimmed.replace(/^\*\s+/, ""),
        width: 74,
        prefix: "* ",
        hangingIndent: "  ",
      });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.\s+)(.*)$/);
      if (match) {
        pushWrappedText({
          text: match[2],
          width: 74,
          prefix: match[1],
          hangingIndent: " ".repeat(match[1].length),
        });
        continue;
      }
    }

    if (/^\|/.test(trimmed)) {
      pushWrappedText({
        text: normalizeTableRow(trimmed),
        width: 82,
        font: "F1",
        size: 9.5,
        lineHeight: 12,
      });
      continue;
    }

    pushWrappedText({
      text: trimmed,
      width: 78,
    });
  }

  return entries;
}

function paginate(entries) {
  const pages = [];
  let currentPage = [];
  let cursorY = PAGE_HEIGHT - TOP_MARGIN;

  const startNewPage = () => {
    if (currentPage.length) pages.push(currentPage);
    currentPage = [];
    cursorY = PAGE_HEIGHT - TOP_MARGIN;
  };

  for (const entry of entries) {
    const neededHeight =
      entry.kind === "blank" ? entry.height : entry.lineHeight;

    if (cursorY - neededHeight < BOTTOM_MARGIN) {
      startNewPage();
    }

    if (entry.kind === "blank") {
      cursorY -= entry.height;
      continue;
    }

    currentPage.push({
      ...entry,
      x: LEFT_MARGIN,
      y: cursorY,
    });
    cursorY -= entry.lineHeight;
  }

  if (currentPage.length) pages.push(currentPage);
  return pages;
}

function buildPageStream(pageEntries, pageNumber, totalPages) {
  const commands = [];

  for (const entry of pageEntries) {
    commands.push(
      `BT /${entry.font} ${entry.size} Tf ${entry.x} ${entry.y} Td (${escapePdfText(entry.text)}) Tj ET`,
    );
  }

  const footerText = `Page ${pageNumber} of ${totalPages}`;
  commands.push(
    `BT /F1 9 Tf ${PAGE_WIDTH - RIGHT_MARGIN - 72} 30 Td (${escapePdfText(footerText)}) Tj ET`,
  );

  return commands.join("\n");
}

function createPdfBuffer(pages) {
  const objects = [];

  const reserveObject = () => {
    objects.push("");
    return objects.length;
  };

  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const setObject = (id, content) => {
    objects[id - 1] = content;
  };

  const regularFontId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
  );
  const boldFontId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>",
  );
  const pagesId = reserveObject();
  const pageIds = [];

  pages.forEach((page, index) => {
    const stream = buildPageStream(page, index + 1, pages.length);
    const contentId = addObject(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`,
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  });

  setObject(
    pagesId,
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}

async function main() {
  for (const file of BONUS_FILES) {
    const sourcePath = path.join(process.cwd(), file.source);
    const outputPath = path.join(process.cwd(), file.output);
    const markdown = await readFile(sourcePath, "utf8");
    const entries = buildLineEntries(markdown);
    const pages = paginate(entries);
    const pdf = createPdfBuffer(pages);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, pdf);

    console.log(`${file.output} (${pages.length} page${pages.length === 1 ? "" : "s"})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
