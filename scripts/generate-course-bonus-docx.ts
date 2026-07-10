import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
} from "docx";

const OUTPUT_DIRECTORY = "src/content/courses/bonuses/docx";
const BRAND_ICON_PATH =
  "public/brand/techia_logo_pack/Favicons_App_Icons/techia-app-icon-256x256.png";
const CONTENT_WIDTH = 9026;
const BODY_FONT = "Aptos";
const HEADING_FONT = "Georgia";

const COLORS = {
  ink: "11273F",
  cyan: "0EA5E9",
  cyanDark: "0B6AA0",
  gold: "C9963B",
  softBlue: "EAF6FB",
  mist: "F7FAFC",
  line: "D7E3EC",
  slate: "52687D",
  white: "FFFFFF",
};

type CellValue = string | readonly string[];

type BrandedDocument = {
  output: string;
  title: string;
  description: string;
  subject: string;
  buildChildren: (brandIcon: Buffer) => FileChild[];
};

type TextRunOverrides = {
  bold?: boolean;
  color?: string;
  italics?: boolean;
  size?: number;
  allCaps?: boolean;
  characterSpacing?: number;
  font?: string;
};

function run(text: string, options: TextRunOverrides = {}) {
  return new TextRun({
    text,
    font: BODY_FONT,
    color: COLORS.ink,
    size: 22,
    ...options,
  });
}

function bodyParagraph(
  text: string,
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    bold?: boolean;
    color?: string;
    italics?: boolean;
    size?: number;
    spacingAfter?: number;
    spacingBefore?: number;
    keepNext?: boolean;
  } = {},
) {
  return new Paragraph({
    alignment: options.alignment,
    keepNext: options.keepNext,
    spacing: {
      before: options.spacingBefore,
      after: options.spacingAfter ?? 120,
      line: 320,
    },
    children: [
      run(text, {
        bold: options.bold,
        color: options.color,
        italics: options.italics,
        size: options.size,
      }),
    ],
  });
}

function accentLabel(text: string) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [
      run(text.toUpperCase(), {
        bold: true,
        color: COLORS.cyanDark,
        allCaps: true,
        characterSpacing: 12,
        size: 18,
      }),
    ],
  });
}

function titleParagraph(text: string, centered = false) {
  return new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: centered ? AlignmentType.CENTER : undefined,
    spacing: { after: 220 },
    children: [
      new TextRun({
        text,
        font: HEADING_FONT,
        color: COLORS.ink,
        bold: true,
        size: 34,
      }),
    ],
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text,
        font: HEADING_FONT,
        color: COLORS.ink,
        bold: true,
        size: 28,
      }),
    ],
  });
}

function subHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        font: BODY_FONT,
        color: COLORS.cyanDark,
        bold: true,
        size: 24,
      }),
    ],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    indent: { left: 220, hanging: 120 },
    spacing: { after: 90, line: 300 },
    children: [
      run("• ", { color: COLORS.cyanDark, bold: true }),
      run(text),
    ],
  });
}

function pageBreak() {
  return new Paragraph({ text: "", pageBreakBefore: true });
}

function border(color = COLORS.line, size = 6) {
  return { style: BorderStyle.SINGLE, color, size };
}

const TABLE_BORDERS = {
  top: border(),
  bottom: border(),
  left: border(),
  right: border(),
  insideHorizontal: border(COLORS.line, 4),
  insideVertical: border(COLORS.line, 4),
};

const NO_BORDERS = {
  top: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
  bottom: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
  left: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
  right: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
  insideHorizontal: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
  insideVertical: { style: BorderStyle.NIL, color: COLORS.white, size: 0 },
};

function blankParagraph(lines = 1) {
  return Array.from({ length: lines }, () =>
    new Paragraph({
      spacing: { after: 120, line: 320 },
      children: [run(" ")],
    }),
  );
}

function tableCellChildren(value: CellValue, bold = false) {
  if (typeof value !== "string") {
    return value.map((item) => bulletParagraph(item));
  }

  if (!value.trim()) {
    return blankParagraph(1);
  }

  const blocks = value.split("\n\n");
  return blocks.map((item, index) =>
    bodyParagraph(item, {
      bold: bold && index === 0,
      spacingAfter: index === blocks.length - 1 ? 0 : 80,
    }),
  );
}

function headerCell(text: string, width: number) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: COLORS.ink, color: COLORS.white },
    borders: TABLE_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [
          new TextRun({
            text,
            font: BODY_FONT,
            color: COLORS.white,
            bold: true,
            size: 20,
          }),
        ],
      }),
    ],
  });
}

function bodyCell(
  value: CellValue,
  width: number,
  rowIndex: number,
  options: { bold?: boolean; fill?: string } = {},
) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: {
      type: ShadingType.CLEAR,
      fill: options.fill ?? (rowIndex % 2 === 0 ? COLORS.mist : COLORS.white),
    },
    borders: TABLE_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 110, bottom: 110, left: 120, right: 120 },
    children: tableCellChildren(value, options.bold),
  });
}

function buildTable(
  headers: readonly string[],
  rows: ReadonlyArray<readonly CellValue[]>,
  columnWidths: readonly number[],
  options: { firstColumnBold?: boolean } = {},
) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((text, index) => headerCell(text, columnWidths[index])),
      }),
      ...rows.map(
        (row, rowIndex) =>
          new TableRow({
            children: row.map((value, index) =>
              bodyCell(value, columnWidths[index], rowIndex, {
                bold: options.firstColumnBold && index === 0,
              }),
            ),
          }),
      ),
    ],
  });
}

function buildPromptTable(rows: ReadonlyArray<{ label: string; lines?: number; hint?: string }>) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [2500, 6526],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: [
            bodyCell(row.label, 2500, rowIndex, {
              bold: true,
              fill: COLORS.softBlue,
            }),
            new TableCell({
              width: { size: 6526, type: WidthType.DXA },
              borders: TABLE_BORDERS,
              shading: {
                type: ShadingType.CLEAR,
                fill: rowIndex % 2 === 0 ? COLORS.mist : COLORS.white,
              },
              margins: { top: 110, bottom: 110, left: 120, right: 120 },
              children: row.hint
                ? [
                    bodyParagraph(row.hint, {
                      italics: true,
                      color: COLORS.slate,
                      spacingAfter: 90,
                    }),
                    ...blankParagraph(row.lines ?? 2),
                  ]
                : blankParagraph(row.lines ?? 2),
            }),
          ],
        }),
    ),
  });
}

function buildNoteBox(title: string, prompt: string, lines = 4) {
  return [
    subHeading(title),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: TABLE_BORDERS,
              shading: { type: ShadingType.CLEAR, fill: COLORS.softBlue },
              margins: { top: 120, bottom: 120, left: 140, right: 140 },
              children: [
                bodyParagraph(prompt, {
                  italics: true,
                  color: COLORS.slate,
                  spacingAfter: 100,
                }),
                ...blankParagraph(lines),
              ],
            }),
          ],
        }),
      ],
    }),
  ];
}

function buildCover(
  brandIcon: Buffer,
  options: {
    title: string;
    subtitle: string;
    intro: string;
    cards: ReadonlyArray<{ label: string; text: string }>;
  },
) {
  return [
    accentLabel("Official teChia Buyer Bonus"),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new ImageRun({
          type: "png",
          data: brandIcon,
          transformation: { width: 74, height: 74 },
        }),
      ],
    }),
    titleParagraph(options.title, true),
    bodyParagraph(options.subtitle, {
      alignment: AlignmentType.CENTER,
      bold: true,
      color: COLORS.cyanDark,
      size: 24,
      spacingAfter: 120,
    }),
    bodyParagraph(options.intro, {
      alignment: AlignmentType.CENTER,
      color: COLORS.slate,
      spacingAfter: 220,
    }),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [3008, 3009, 3009],
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: options.cards.map((card, index) => {
            const width = index === 0 ? 3008 : 3009;
            return new TableCell({
              width: { size: width, type: WidthType.DXA },
              shading: {
                type: ShadingType.CLEAR,
                fill: index === 1 ? COLORS.softBlue : COLORS.mist,
              },
              borders: {
                top: border(COLORS.line, 6),
                bottom: border(COLORS.line, 6),
                left: border(COLORS.line, 6),
                right: border(COLORS.line, 6),
              },
              margins: { top: 180, bottom: 180, left: 180, right: 180 },
              children: [
                new Paragraph({
                  spacing: { after: 80 },
                  children: [
                    new TextRun({
                      text: card.label.toUpperCase(),
                      font: BODY_FONT,
                      color: COLORS.cyanDark,
                      bold: true,
                      allCaps: true,
                      size: 18,
                    }),
                  ],
                }),
                bodyParagraph(card.text, { spacingAfter: 0 }),
              ],
            });
          }),
        }),
      ],
    }),
    pageBreak(),
  ];
}

function buildHeader(title: string) {
  return new Header({
    children: [
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [5600, 3426],
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5600, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: { bottom: 70 },
                children: [
                  new Paragraph({
                    border: { bottom: border(COLORS.line, 6) },
                    spacing: { after: 0 },
                    children: [
                      new TextRun({
                        text: "teChia Digital Academy",
                        font: BODY_FONT,
                        color: COLORS.cyanDark,
                        allCaps: true,
                        bold: true,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3426, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: { bottom: 70 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.END,
                    border: { bottom: border(COLORS.line, 6) },
                    spacing: { after: 0 },
                    children: [
                      new TextRun({
                        text: title,
                        font: BODY_FONT,
                        color: COLORS.slate,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [5600, 3426],
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 5600, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [
                  new Paragraph({
                    spacing: { before: 80, after: 0 },
                    children: [
                      new TextRun({
                        text: "Official teChia Buyer Bonus Resource",
                        font: BODY_FONT,
                        color: COLORS.slate,
                        size: 18,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 3426, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.END,
                    spacing: { before: 80, after: 0 },
                    children: [
                      new TextRun({
                        text: "Page ",
                        font: BODY_FONT,
                        color: COLORS.slate,
                        size: 18,
                      }),
                      new TextRun({ children: [PageNumber.CURRENT] }),
                      new TextRun({
                        text: " of ",
                        font: BODY_FONT,
                        color: COLORS.slate,
                        size: 18,
                      }),
                      new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

const ROADMAP_PATHS = [
  {
    path: "Student",
    outcome:
      "Build useful skills early so you become more employable, confident, and digitally aware.",
    start: [
      "Office and productivity skills",
      "Digital marketing basics",
      "Content creation fundamentals",
      "AI tools for learning and productivity",
    ],
    focus: [
      "Create small proof projects",
      "Build a visible learning portfolio",
      "Improve communication and digital confidence",
    ],
    proof: "Create a simple online profile or portfolio that shows what you can do.",
  },
  {
    path: "Job seeker",
    outcome:
      "Increase your professional value and stand out with practical digital proof.",
    start: [
      "Office, business, and professional skills",
      "AI productivity tools",
      "Digital communication",
      "Workplace finance awareness",
    ],
    focus: [
      "Upgrade your CV and LinkedIn",
      "Learn the tools used at work",
      "Document real examples of your skills",
    ],
    proof: "Refresh your CV and LinkedIn profile with new practical examples.",
  },
  {
    path: "Freelancer",
    outcome:
      "Build service-ready skills that can become clear, sellable offers.",
    start: [
      "Digital marketing and online business",
      "Creative design and content creation",
      "AI productivity tools",
      "Business communication and pricing basics",
    ],
    focus: [
      "Choose one service to offer first",
      "Create samples before chasing clients",
      "Practice clean delivery and follow-up",
    ],
    proof: "Create one small offer page or one-page service sheet with sample work.",
  },
  {
    path: "Business owner",
    outcome:
      "Understand the digital tools that improve visibility, trust, operations, and growth.",
    start: [
      "Digital marketing and online business",
      "Branding and content creation",
      "Business productivity tools",
      "AI and automation basics",
    ],
    focus: [
      "Clarify what customers see first",
      "Improve how people contact and trust you",
      "Identify what should be systemized next",
    ],
    proof: "Complete a digital business checkup and commit to three improvements this month.",
  },
  {
    path: "Content creator",
    outcome:
      "Improve your content quality, consistency, and ability to turn visibility into opportunity.",
    start: [
      "Creative design and content creation",
      "Digital marketing",
      "AI tools for ideas and planning",
      "Online business basics",
    ],
    focus: [
      "Understand your audience deeply",
      "Publish with more consistency",
      "Build a recognizable content direction",
    ],
    proof: "Create a 7-day content plan around one topic you want to be known for.",
  },
  {
    path: "Working professional",
    outcome:
      "Work faster, communicate more clearly, and stay relevant in a digital workplace.",
    start: [
      "Office and professional skills",
      "AI productivity tools",
      "Business communication",
      "Digital marketing basics",
    ],
    focus: [
      "Improve reports, decks, and messages",
      "Reduce repetitive work",
      "Build visible proof of better productivity",
    ],
    proof: "Redesign one recurring task or workflow using a smarter digital process.",
  },
] as const;

const ROADMAP_SEQUENCE = [
  [
    "Stage 1",
    "Office, Business & Professional Skills",
    "Build a strong operating foundation for work, learning, and communication.",
    "A cleaner CV, spreadsheet, proposal, or presentation.",
  ],
  [
    "Stage 2",
    "Digital Marketing & Online Business",
    "Learn visibility, messaging, and how digital offers create trust.",
    "A content plan, campaign idea, or business audit.",
  ],
  [
    "Stage 3",
    "Creative Design & Content Creation",
    "Turn ideas into assets people can see, read, and share.",
    "A flyer, social post, video plan, or branded template.",
  ],
  [
    "Stage 4",
    "AI, Tech & Programming",
    "Use modern tools to move faster and automate more intelligently.",
    "A prompt system, automation idea, or digital workflow.",
  ],
  [
    "Stage 5",
    "Finance & Market Education",
    "Strengthen your business thinking, pricing awareness, and decision-making.",
    "A simple pricing sheet, market summary, or plan.",
  ],
] as const;

const MONETIZATION_FOUNDATIONS = [
  [
    "Solve a real problem",
    "People pay faster when they clearly understand the result you help them get.",
    "Write down one problem your skill can solve for one specific person or business.",
  ],
  [
    "Start simple",
    "A small, clear offer is easier to explain, test, and improve.",
    "Choose a starter offer that can be delivered quickly and professionally.",
  ],
  [
    "Build proof early",
    "Proof reduces doubt and makes your offer easier to trust.",
    "Create examples, templates, before/after samples, or a simple case study.",
  ],
  [
    "Communicate clearly",
    "Clarity beats hype. Buyers need to understand what you do and what they receive.",
    "Describe your offer in one sentence using plain language.",
  ],
  [
    "Deliver cleanly",
    "Professional delivery creates referrals, testimonials, and repeat work.",
    "Set scope, deadline, handoff format, and follow-up steps before starting.",
  ],
] as const;

const MONETIZATION_DIRECTIONS = [
  [
    "Online visibility support",
    "Small businesses, shops, creators, and local service providers",
    "Profile cleanup, content planning, basic promotional support",
    "A before/after profile refresh or 7-day content plan",
  ],
  [
    "Content creation support",
    "Creators, brands, schools, event organizers, and online sellers",
    "Graphics, captions, content ideas, short-form planning",
    "A mini content pack with 3 to 5 sample assets",
  ],
  [
    "Digital admin support",
    "Busy professionals, entrepreneurs, and small teams",
    "Document cleanup, simple trackers, spreadsheet setup",
    "A polished spreadsheet or template pack",
  ],
  [
    "Professional profile support",
    "Students, job seekers, and early-career professionals",
    "CV cleanup, LinkedIn improvement, portfolio presentation",
    "A refined CV and profile improvement sample",
  ],
  [
    "Business digital support",
    "Founders who know they need help but do not know where to start",
    "Basic audit, customer journey review, digital recommendations",
    "A one-page audit or checkup summary",
  ],
  [
    "AI productivity support",
    "Entrepreneurs, creators, and professionals who want to move faster",
    "Prompt packs, workflow ideas, draft helpers, FAQ assistants",
    "A small prompt kit or one documented workflow",
  ],
] as const;

const SERVICE_LIBRARY = [
  {
    title: "Digital Marketing Services",
    rows: [
      ["Social media page setup", "Small businesses and creators", "Optimized profile and first content direction"],
      ["Basic content calendar", "Local businesses and personal brands", "One-week or one-month content map"],
      ["Promotional captions", "Brands with visuals but weak messaging", "Caption pack for one campaign or launch"],
    ],
  },
  {
    title: "Content Creation Services",
    rows: [
      ["Social media graphics", "Small brands and sellers", "Branded visual post set"],
      ["Short video planning", "Creators and visibility-focused businesses", "Shot ideas, hooks, and sequence plan"],
      ["Flyer design support", "Events, promotions, and services", "Editable promo flyer or offer sheet"],
    ],
  },
  {
    title: "Office & Productivity Services",
    rows: [
      ["CV formatting", "Students and job seekers", "Polished CV in clean structure"],
      ["Spreadsheet setup", "Teams, admins, and entrepreneurs", "Tracker or dashboard starter file"],
      ["Proposal cleanup", "Freelancers and service businesses", "Better structure, readability, and delivery"],
    ],
  },
  {
    title: "AI Productivity Services",
    rows: [
      ["Prompt kit", "Busy founders and creators", "Reusable prompts for content or planning"],
      ["Workflow documentation", "Teams repeating the same tasks", "Simple SOP or repeatable process guide"],
      ["FAQ draft support", "Businesses with repeated customer questions", "Starter FAQ content and structure"],
    ],
  },
  {
    title: "Business Digital Support",
    rows: [
      ["Basic digital checkup", "Businesses with weak online trust", "Assessment with clear priorities"],
      ["Customer journey review", "Businesses losing inquiries", "Friction points plus improvement ideas"],
      ["Digital tool recommendations", "Businesses overwhelmed by choices", "Simple, right-sized tool shortlist"],
    ],
  },
] as const;

const MONETIZATION_PRICING = [
  [
    "Single task",
    "One profile cleanup, one flyer, one tracker, or one audit",
    "When you are testing demand and improving speed",
  ],
  [
    "Starter package",
    "A small grouped outcome, like a mini content pack or setup bundle",
    "When buyers need a clearer transformation than one task alone",
  ],
  [
    "Weekly sprint",
    "Focused help for a short period with a clear outcome",
    "When the buyer needs speed, structure, and active support",
  ],
  [
    "Monthly support",
    "Ongoing execution with regular outputs and communication",
    "When you already know the workflow and can deliver consistently",
  ],
] as const;

const LAUNCH_SPRINT = [
  ["Day 1", "Choose one direction", "Decide who you want to help first and what result matters most."],
  ["Day 2", "Define the problem", "Write the problem your offer solves in one sentence."],
  ["Day 3", "Create your offer line", "Use the 'I help...' structure and refine it until it is clear."],
  ["Day 4", "Build one proof item", "Create one example, sample, or before/after improvement."],
  ["Day 5", "Build a second proof item", "Make the second example different enough to show range."],
  ["Day 6", "Package your proof", "Put your work in a simple shareable format."],
  ["Day 7", "Ask for feedback", "Show your work to someone trustworthy and collect honest reactions."],
  ["Day 8", "Improve clarity", "Tighten your wording, scope, and delivery promise."],
  ["Day 9", "Create a simple pricing frame", "Decide how you will price the starter version."],
  ["Day 10", "Make a message template", "Prepare a clean introduction message or WhatsApp pitch."],
  ["Day 11", "Choose your first audience", "List the people or businesses you can approach first."],
  ["Day 12", "Share one useful proof", "Post or send a useful example without spamming people."],
  ["Day 13", "Follow up respectfully", "Ask if the example is useful and what support they need."],
  ["Day 14", "Review and improve", "Document what resonated and what needs refining next."],
] as const;

const TRACKER_REFLECTION_PROMPTS = [
  "What did I learn this week?",
  "What did I practice?",
  "What felt difficult or unclear?",
  "What will I improve next week?",
] as const;

const CHECKUP_SECTIONS = [
  {
    title: "Brand Clarity",
    questions: [
      "Is your business name consistent everywhere?",
      "Do you have a clear logo or recognizable visual identity?",
      "Can someone quickly understand what you offer?",
      "Do your visuals look professional and trustworthy?",
      "Do you have a clear positioning line or promise?",
    ],
  },
  {
    title: "Online Visibility",
    questions: [
      "Can people find your business online when they search?",
      "Do your pages clearly show what you sell or provide?",
      "Do you publish useful content often enough to stay visible?",
      "Do you have customer reviews, proof, or testimonials online?",
      "Do you have a website or landing page that supports your offer?",
    ],
  },
  {
    title: "Website or Landing Page",
    questions: [
      "Does your page explain what you do clearly?",
      "Does it work well on mobile phones?",
      "Are the calls to action obvious and easy to follow?",
      "Can customers contact or buy from you without friction?",
      "Does the page include proof, trust elements, or FAQs?",
    ],
  },
  {
    title: "Customer Journey",
    questions: [
      "Do customers know the next step after they discover your business?",
      "Is it easy for people to ask questions or request help?",
      "Do you respond quickly and consistently to inquiries?",
      "Do you follow up with interested customers?",
      "Do you keep customer information organized?",
    ],
  },
  {
    title: "Content & Trust",
    questions: [
      "Do your posts and pages explain your value clearly?",
      "Do you show examples of your work, process, or results?",
      "Do you answer common customer questions before people ask them?",
      "Does your content make your business look trustworthy and current?",
      "Can a new visitor understand why they should choose you?",
    ],
  },
  {
    title: "Systems & Automation",
    questions: [
      "Do you track leads, bookings, or requests consistently?",
      "Do you use forms, dashboards, or spreadsheets where they are needed?",
      "Do you repeat manual tasks that could be simplified?",
      "Do you have simple reporting or analytics for what matters most?",
      "Do you know the next system improvement your business needs?",
    ],
  },
] as const;

const THIRTY_DAY_PLAN = [
  ["Day 1", "Foundation", "Define your main digital learning goal.", "Write a clear one-sentence goal."],
  ["Day 2", "Foundation", "Choose the path that best matches your current reality.", "Select your learner path and note why."],
  ["Day 3", "Foundation", "Set your weekly study schedule.", "Block study time in a realistic routine."],
  ["Day 4", "Foundation", "Choose the first course or topic to start with.", "Name the first topic and expected output."],
  ["Day 5", "Foundation", "Capture three practical lessons from what you studied.", "Create a short action note."],
  ["Day 6", "Foundation", "Practice one small task immediately.", "Produce one small proof item."],
  ["Day 7", "Foundation", "Review your first week honestly.", "Write one win and one improvement."],
  ["Day 8", "Visibility & Content", "Study digital marketing or online business fundamentals.", "Capture key notes that matter to your goal."],
  ["Day 9", "Visibility & Content", "Analyze one business, creator, or professional profile.", "List what works and what needs work."],
  ["Day 10", "Visibility & Content", "Create ten content or communication ideas.", "Build an idea bank you can reuse."],
  ["Day 11", "Visibility & Content", "Create one sample post, caption, or concept.", "Produce one visible draft."],
  ["Day 12", "Visibility & Content", "Improve one public profile or page.", "Update one profile with stronger clarity."],
  ["Day 13", "Visibility & Content", "Ask for feedback from someone trustworthy.", "Capture comments and improvement ideas."],
  ["Day 14", "Visibility & Content", "Review your second week.", "Document what you created and improved."],
  ["Day 15", "Productivity & Tools", "Study one productivity or office skill deeply.", "Write a practical skill summary."],
  ["Day 16", "Productivity & Tools", "Create or improve one spreadsheet, document, or tracker.", "Produce one organized asset."],
  ["Day 17", "Productivity & Tools", "Use AI responsibly for one practical workflow.", "Document what AI helped you do faster."],
  ["Day 18", "Productivity & Tools", "Improve a message, proposal, bio, or service description.", "Create a cleaner communication draft."],
  ["Day 19", "Productivity & Tools", "Identify one repetitive task worth simplifying.", "Write the task and what causes friction."],
  ["Day 20", "Productivity & Tools", "Design a simple system or checklist for that task.", "Build a repeatable mini-process."],
  ["Day 21", "Productivity & Tools", "Review the third week.", "Note what now feels easier or faster."],
  ["Day 22", "Application & Proof", "Choose one small project that combines what you learned.", "Define a practical mini-project."],
  ["Day 23", "Application & Proof", "Produce a first draft of that project.", "Create the first usable version."],
  ["Day 24", "Application & Proof", "Improve the quality, clarity, and usefulness.", "Refine the project into something shareable."],
  ["Day 25", "Application & Proof", "Share your draft and ask for feedback.", "Collect one or two focused comments."],
  ["Day 26", "Application & Proof", "Apply the feedback.", "Make the improved version."],
  ["Day 27", "Application & Proof", "Package your proof professionally.", "Save it in a clean portfolio-ready format."],
  ["Day 28", "Application & Proof", "Describe the skill or service behind the proof.", "Write a short explanation of what you can now do."],
  ["Day 29", "Application & Proof", "Plan the next 30 days based on what you learned.", "Choose the next skill or project focus."],
  ["Day 30", "Application & Proof", "Review the full month and commit to the next step.", "Write your final reflection and next move."],
] as const;

function createRoadmapDocument(brandIcon: Buffer) {
  const pathRows = ROADMAP_PATHS.map((pathInfo) => [
    pathInfo.path,
    pathInfo.outcome,
    pathInfo.start,
    pathInfo.focus,
    pathInfo.proof,
  ]);

  return [
    ...buildCover(brandIcon, {
      title: "Digital Skills Learning Roadmap",
      subtitle: "Premium editable workbook",
      intro:
        "Use this document to choose the right learning path, structure your focus, and turn lessons into visible proof of skill.",
      cards: [
        {
          label: "Best for",
          text: "Students, job seekers, freelancers, creators, professionals, and business owners.",
        },
        {
          label: "Designed to help you",
          text: "Choose where to start, what to prioritize, and what proof to create next.",
        },
        {
          label: "Format",
          text: "Editable Word workbook with tables, planning prompts, and action sections.",
        },
      ],
    }),
    sectionHeading("Quick Start"),
    bodyParagraph(
      "Use this roadmap to make smarter choices about what to learn next instead of jumping between courses without a clear outcome.",
    ),
    buildTable(
      ["Step", "What to do", "Why it matters"],
      [
        [
          "1",
          "Pick the path that best reflects your current goal and season of work.",
          "It helps you focus on the skills that will create the most value first.",
        ],
        [
          "2",
          "Choose one or two skill areas to prioritize over the next 30 days.",
          "Narrow focus creates visible progress faster than trying everything at once.",
        ],
        [
          "3",
          "Decide what proof you will create as evidence of growth.",
          "Proof of skill is what turns learning into opportunity.",
        ],
      ],
      [760, 3920, 4346],
      { firstColumnBold: true },
    ),
    sectionHeading("Path Decision Matrix"),
    bodyParagraph(
      "Choose the row that feels most like your current need. If two rows fit, start with the one that creates the most immediate value.",
    ),
    buildTable(
      ["Path", "Primary outcome", "Start with", "Focus on", "First proof of skill"],
      pathRows,
      [1150, 1776, 2050, 2050, 2000],
      { firstColumnBold: true },
    ),
    sectionHeading("Suggested Learning Order"),
    bodyParagraph(
      "If you bought the full pack and want a practical sequence, this order builds range without sacrificing clarity.",
    ),
    buildTable(
      ["Stage", "Skill area", "Why start here", "First proof idea"],
      ROADMAP_SEQUENCE,
      [900, 2220, 3300, 2606],
      { firstColumnBold: true },
    ),
    sectionHeading("Weekly Learning Rhythm"),
    buildTable(
      ["Day", "Learning move", "Expected output"],
      [
        ["Day 1", "Watch or study one focused lesson", "Key notes or a short lesson summary"],
        ["Day 2", "Rewrite what you learned in plain language", "A clearer explanation in your own words"],
        ["Day 3", "Practice on a small real example", "A draft, sample, or improvement"],
        ["Day 4", "Review weak areas", "Corrections and stronger understanding"],
        ["Day 5", "Apply the skill to something practical", "A visible proof item"],
        ["Day 6", "Organize your work", "Saved files, notes, and documented progress"],
        ["Day 7", "Reflect and plan", "One lesson, one obstacle, one next step"],
      ],
      [980, 4300, 3746],
      { firstColumnBold: true },
    ),
    sectionHeading("My Roadmap Builder"),
    buildPromptTable([
      { label: "My main goal", lines: 2, hint: "What do I want these skills to help me do?" },
      { label: "Chosen path", lines: 1, hint: "Student, job seeker, freelancer, business owner, creator, or working professional" },
      { label: "Top 3 priority skills this month", lines: 3 },
      { label: "Proof I want to create", lines: 2, hint: "A project, document, audit, content sample, deck, or workflow" },
      { label: "Support I need", lines: 2, hint: "What will help me stay consistent and finish well?" },
    ]),
    sectionHeading("30-Day Focus Planner"),
    buildTable(
      ["Week", "Primary skill", "Practice output", "Confidence score (1-5)", "Notes"],
      [
        ["Week 1", "", "", "", ""],
        ["Week 2", "", "", "", ""],
        ["Week 3", "", "", "", ""],
        ["Week 4", "", "", "", ""],
      ],
      [1000, 2200, 2400, 1600, 1826],
      { firstColumnBold: true },
    ),
  ];
}

function createMonetizationDocument(brandIcon: Buffer) {
  return [
    ...buildCover(brandIcon, {
      title: "Skill Monetization Starter Guide",
      subtitle: "Editable service design workbook",
      intro:
        "This premium workbook helps you turn digital skills into clear starter offers, useful proof, and a more professional path to monetization.",
      cards: [
        {
          label: "Best for",
          text: "Students, freelancers, job seekers, creators, and small-business support professionals.",
        },
        {
          label: "Designed to help you",
          text: "Choose a direction, package simple services, and launch with more clarity and proof.",
        },
        {
          label: "Format",
          text: "Editable Word guide with decision tables, service frameworks, and launch worksheets.",
        },
      ],
    }),
    sectionHeading("Important Reality Check"),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      borders: TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: COLORS.softBlue },
              borders: TABLE_BORDERS,
              margins: { top: 140, bottom: 140, left: 160, right: 160 },
              children: [
                bodyParagraph(
                  "A course alone does not create income. Income usually comes from solving a real problem, communicating clearly, building proof, and delivering value professionally.",
                  { bold: true, spacingAfter: 90 },
                ),
                bodyParagraph(
                  "Use this guide to move from learning to practical application without overpromising or presenting unrealistic guarantees.",
                  { spacingAfter: 0 },
                ),
              ],
            }),
          ],
        }),
      ],
    }),
    sectionHeading("Monetization Foundations"),
    buildTable(
      ["Principle", "What it means", "What to do next"],
      MONETIZATION_FOUNDATIONS,
      [1600, 3100, 4326],
      { firstColumnBold: true },
    ),
    sectionHeading("Choose Your Direction"),
    bodyParagraph(
      "Pick one direction first. You can expand later, but your starter offer should be easy to explain and easy to deliver.",
    ),
    buildTable(
      ["Direction", "Ideal buyer", "Starter offer", "First proof item"],
      MONETIZATION_DIRECTIONS,
      [1600, 2300, 2550, 2576],
      { firstColumnBold: true },
    ),
    sectionHeading("Service Library"),
    ...SERVICE_LIBRARY.flatMap((section) => [
      subHeading(section.title),
      buildTable(
        ["Offer", "Good for", "Simple deliverable"],
        section.rows,
        [2100, 2800, 4126],
        { firstColumnBold: true },
      ),
    ]),
    sectionHeading("Offer Builder Workspace"),
    buildPromptTable([
      { label: "Who do I help?", lines: 2 },
      { label: "What result do they want?", lines: 2 },
      { label: "What service will I provide?", lines: 2 },
      { label: "What proof can I show?", lines: 2 },
      { label: "How will I deliver it cleanly?", lines: 2 },
      { label: "My one-sentence offer", lines: 3, hint: "I help [person/business] achieve [result] by providing [service]." },
    ]),
    sectionHeading("Proof Plan"),
    buildTable(
      ["Proof asset", "Why it builds trust", "Deadline", "Notes"],
      [
        ["Proof item 1", "", "", ""],
        ["Proof item 2", "", "", ""],
        ["Proof item 3", "", "", ""],
        ["Proof item 4", "", "", ""],
      ],
      [1800, 3400, 1200, 2626],
      { firstColumnBold: true },
    ),
    sectionHeading("Simple Pricing Frame"),
    buildTable(
      ["Pricing format", "Example scope", "Best used when"],
      MONETIZATION_PRICING,
      [1500, 3400, 4126],
      { firstColumnBold: true },
    ),
    sectionHeading("14-Day Launch Sprint"),
    buildTable(
      ["Day", "Focus", "Suggested action", "Done", "Notes"],
      LAUNCH_SPRINT.map((item) => [item[0], item[1], item[2], "", ""]),
      [760, 1800, 4160, 730, 1576],
      { firstColumnBold: true },
    ),
  ];
}

function createTrackerDocument(brandIcon: Buffer) {
  return [
    ...buildCover(brandIcon, {
      title: "Course Learning Tracker",
      subtitle: "Premium editable learning system",
      intro:
        "Use this tracker to organize your study flow, monitor proof of skill, and stay consistent from week to week.",
      cards: [
        {
          label: "Best for",
          text: "Anyone who wants a cleaner, more disciplined way to move through teChia course packs.",
        },
        {
          label: "Designed to help you",
          text: "Track progress, capture practice, and turn lessons into visible outcomes.",
        },
        {
          label: "Format",
          text: "Editable workbook with real planning tables, reflection space, and proof logs.",
        },
      ],
    }),
    sectionHeading("Learner Profile"),
    buildPromptTable([
      { label: "Name", lines: 1 },
      { label: "Course pack purchased", lines: 1 },
      { label: "Main learning goal", lines: 2 },
      { label: "Start date", lines: 1 },
      { label: "Target completion date", lines: 1 },
      { label: "Success will look like...", lines: 2 },
    ]),
    sectionHeading("8-Week Study Plan"),
    buildTable(
      ["Week", "Focus area", "Lessons / topics", "Practice task", "Completed?"],
      Array.from({ length: 8 }, (_, index) => [
        `Week ${index + 1}`,
        "",
        "",
        "",
        "",
      ]),
      [920, 1800, 2500, 2500, 1306],
      { firstColumnBold: true },
    ),
    sectionHeading("Course Progress Dashboard"),
    buildTable(
      ["Course / topic", "Started", "Completed", "Key notes", "Practice done?"],
      Array.from({ length: 8 }, () => ["", "", "", "", ""]),
      [2200, 1000, 1100, 2900, 1826],
    ),
    sectionHeading("Lesson Debrief"),
    buildPromptTable([
      { label: "Topic or lesson", lines: 1 },
      { label: "Three things I learned", lines: 3 },
      { label: "One thing I need to practice", lines: 2 },
      { label: "One question I still have", lines: 2 },
      { label: "One real use case for this skill", lines: 2 },
    ]),
    sectionHeading("Practice Log"),
    buildTable(
      ["Date", "Skill practiced", "What I created or improved", "Notes"],
      Array.from({ length: 8 }, () => ["", "", "", ""]),
      [1100, 2200, 3200, 2526],
    ),
    sectionHeading("Proof of Skill Vault"),
    buildTable(
      ["Proof item", "Link or location", "Date created", "Why it matters"],
      Array.from({ length: 6 }, () => ["", "", "", ""]),
      [2200, 2700, 1200, 2926],
    ),
    sectionHeading("Weekly Reflection"),
    buildTable(
      ["Week", ...TRACKER_REFLECTION_PROMPTS],
      Array.from({ length: 4 }, (_, index) => [
        `Week ${index + 1}`,
        "",
        "",
        "",
        "",
      ]),
      [850, 1900, 1900, 1900, 2476],
      { firstColumnBold: true },
    ),
    sectionHeading("Completion Review"),
    buildPromptTable([
      { label: "What skill improved the most?", lines: 2 },
      { label: "What can I now do that I could not do before?", lines: 2 },
      { label: "What proof have I created?", lines: 2 },
      { label: "How can I apply this skill next?", lines: 2 },
      { label: "What should I learn next?", lines: 2 },
    ]),
  ];
}

function createCheckupSection(section: (typeof CHECKUP_SECTIONS)[number]) {
  return [
    sectionHeading(section.title),
    buildTable(
      ["Question", "Yes", "No", "Needs work", "Priority"],
      section.questions.map((question) => [question, "", "", "", ""]),
      [4700, 900, 900, 1200, 1326],
    ),
    ...buildNoteBox(`${section.title} notes`, "Capture patterns, quick wins, and the biggest friction you noticed.", 3),
  ];
}

function createCheckupDocument(brandIcon: Buffer) {
  return [
    ...buildCover(brandIcon, {
      title: "Business Digital Checkup Template",
      subtitle: "Executive diagnostic workbook",
      intro:
        "Use this editable assessment to review how your business shows up online, how trust is built, and which digital systems should improve next.",
      cards: [
        {
          label: "Best for",
          text: "Business owners, operators, and teams improving visibility, trust, and operational clarity.",
        },
        {
          label: "Designed to help you",
          text: "Identify weak points, score priorities, and turn insight into a 30-day improvement plan.",
        },
        {
          label: "Format",
          text: "Editable Word diagnostic with scorecards, channel inventory, and action tables.",
        },
      ],
    }),
    sectionHeading("Business Snapshot"),
    buildPromptTable([
      { label: "Business name", lines: 1 },
      { label: "Industry", lines: 1 },
      { label: "Location", lines: 1 },
      { label: "Main products or services", lines: 2 },
      { label: "Target customers", lines: 2 },
      { label: "Core growth goal this quarter", lines: 2 },
    ]),
    sectionHeading("Digital Channel Inventory"),
    buildTable(
      ["Channel", "Active?", "Primary objective", "Current notes"],
      [
        ["Website / landing page", "", "", ""],
        ["Google Business Profile", "", "", ""],
        ["WhatsApp Business", "", "", ""],
        ["Facebook", "", "", ""],
        ["Instagram", "", "", ""],
        ["LinkedIn", "", "", ""],
        ["TikTok", "", "", ""],
        ["Email / CRM", "", "", ""],
      ],
      [2200, 1000, 2100, 3726],
      { firstColumnBold: true },
    ),
    ...CHECKUP_SECTIONS.flatMap(createCheckupSection),
    sectionHeading("Priority Score Dashboard"),
    bodyParagraph("Score each area from 1 to 5, where 1 is weak and 5 is strong."),
    buildTable(
      ["Area", "Score (1-5)", "Why it matters", "Immediate next move"],
      CHECKUP_SECTIONS.map((section) => [section.title, "", "", ""]),
      [2100, 1200, 2800, 2926],
      { firstColumnBold: true },
    ),
    sectionHeading("Top 3 Improvements"),
    buildTable(
      ["Priority", "Improvement needed", "Why this matters now", "Owner / timing"],
      [
        ["1", "", "", ""],
        ["2", "", "", ""],
        ["3", "", "", ""],
      ],
      [700, 2900, 2800, 2626],
      { firstColumnBold: true },
    ),
    sectionHeading("30-Day Implementation Plan"),
    buildTable(
      ["Workstream", "First step", "Success measure", "Deadline", "Notes"],
      Array.from({ length: 4 }, () => ["", "", "", "", ""]),
      [1800, 2400, 2100, 1000, 1726],
    ),
  ];
}

function createActionPlanDocument(brandIcon: Buffer) {
  return [
    ...buildCover(brandIcon, {
      title: "30-Day Digital Skills Action Plan",
      subtitle: "Execution workbook for full-pack buyers",
      intro:
        "Use this premium action planner to move from passive course consumption into practical outputs, momentum, and visible proof of skill.",
      cards: [
        {
          label: "Best for",
          text: "Full-pack buyers who want a concrete 30-day structure instead of guessing what to do next.",
        },
        {
          label: "Designed to help you",
          text: "Stay consistent, apply what you learn, and finish the month with real proof of progress.",
        },
        {
          label: "Format",
          text: "Editable Word action planner with a full 30-day schedule, review tables, and accountability prompts.",
        },
      ],
    }),
    sectionHeading("How to Use This Plan"),
    buildTable(
      ["Week", "Theme", "Outcome to aim for"],
      [
        ["Week 1", "Foundation", "Clarity about your goal, path, schedule, and first proof of action"],
        ["Week 2", "Visibility & Content", "Better understanding of digital visibility, profile quality, and content execution"],
        ["Week 3", "Productivity & Tools", "Smarter systems, cleaner workflows, and better communication assets"],
        ["Week 4", "Application & Proof", "A visible project, stronger confidence, and a clear next step"],
      ],
      [1100, 2200, 5726],
      { firstColumnBold: true },
    ),
    sectionHeading("30-Day Execution Table"),
    buildTable(
      ["Day", "Theme", "Suggested action", "Output / proof", "Done", "Reflection"],
      THIRTY_DAY_PLAN.map((item) => [item[0], item[1], item[2], item[3], "", ""]),
      [650, 1500, 2750, 2200, 650, 1276],
      { firstColumnBold: true },
    ),
    sectionHeading("Weekly Review Checkpoints"),
    buildTable(
      ["Checkpoint", "Biggest win", "What felt difficult", "What I will improve next"],
      [
        ["End of Week 1", "", "", ""],
        ["End of Week 2", "", "", ""],
        ["End of Week 3", "", "", ""],
        ["End of Week 4", "", "", ""],
      ],
      [1500, 2400, 2400, 2726],
      { firstColumnBold: true },
    ),
    sectionHeading("My Continuity Plan"),
    buildPromptTable([
      { label: "The habit I must keep after this 30-day plan", lines: 2 },
      { label: "The strongest proof I created", lines: 2 },
      { label: "The next skill or project I should focus on", lines: 2 },
      { label: "How I will stay accountable", lines: 2 },
      { label: "Who can support my next phase", lines: 2 },
    ]),
  ];
}

const DOCUMENTS: readonly BrandedDocument[] = [
  {
    output: `${OUTPUT_DIRECTORY}/digital-skills-learning-roadmap.docx`,
    title: "Digital Skills Learning Roadmap",
    subject: "Official teChia buyer bonus resource",
    description:
      "Premium editable roadmap workbook for choosing digital-skill priorities and planning proof of learning.",
    buildChildren: createRoadmapDocument,
  },
  {
    output: `${OUTPUT_DIRECTORY}/skill-monetization-starter-guide.docx`,
    title: "Skill Monetization Starter Guide",
    subject: "Official teChia buyer bonus resource",
    description:
      "Premium editable monetization workbook for turning digital skills into simple service offers.",
    buildChildren: createMonetizationDocument,
  },
  {
    output: `${OUTPUT_DIRECTORY}/course-learning-tracker.docx`,
    title: "Course Learning Tracker",
    subject: "Official teChia buyer bonus resource",
    description:
      "Premium editable tracker for planning, documenting, and reviewing teChia course progress.",
    buildChildren: createTrackerDocument,
  },
  {
    output: `${OUTPUT_DIRECTORY}/business-digital-checkup-template.docx`,
    title: "Business Digital Checkup Template",
    subject: "Official teChia buyer bonus resource",
    description:
      "Premium editable diagnostic workbook for auditing business visibility, trust, and systems.",
    buildChildren: createCheckupDocument,
  },
  {
    output: `${OUTPUT_DIRECTORY}/thirty-day-digital-skills-action-plan.docx`,
    title: "30-Day Digital Skills Action Plan",
    subject: "Official teChia buyer bonus resource",
    description:
      "Premium editable 30-day action workbook for full-pack buyers applying their learning.",
    buildChildren: createActionPlanDocument,
  },
] as const;

async function buildDocumentFile(brandIcon: Buffer, config: BrandedDocument) {
  const document = new Document({
    creator: "teChia Digital Academy",
    title: config.title,
    subject: config.subject,
    description: config.description,
    sections: [
      {
        headers: { default: buildHeader(config.title) },
        footers: { default: buildFooter() },
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
              header: 360,
              footer: 360,
            },
          },
        },
        children: config.buildChildren(brandIcon),
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: BODY_FONT,
            color: COLORS.ink,
            size: 22,
          },
          paragraph: {
            spacing: { line: 320 },
          },
        },
      },
    },
  });

  const outputPath = path.join(process.cwd(), config.output);
  const buffer = await Packer.toBuffer(document);
  await writeFile(outputPath, buffer);
  console.log(config.output);
}

async function main() {
  const brandIcon = await readFile(path.join(process.cwd(), BRAND_ICON_PATH));
  await mkdir(path.join(process.cwd(), OUTPUT_DIRECTORY), { recursive: true });

  for (const document of DOCUMENTS) {
    await buildDocumentFile(brandIcon, document);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
