export type CourseLessonSeed = {
  slug: string;
  title: string;
  description: string;
  durationLabel: string;
  isPreview?: boolean;
};

export type CourseCatalogEntry = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: string;
  includedInFullPack: boolean;
  financialDisclaimerRequired?: boolean;
  skillsLearned: string[];
  lessons: CourseLessonSeed[];
};

function lesson(
  slug: string,
  title: string,
  description: string,
  durationLabel: string,
  isPreview = false,
): CourseLessonSeed {
  return { slug, title, description, durationLabel, isPreview };
}

export const COURSE_CATALOG: CourseCatalogEntry[] = [
  {
    slug: "digital-marketing-community-management",
    title: "Complete Training in Digital Marketing and Community Management",
    shortDescription:
      "Build practical marketing and community growth skills for brands, businesses, and personal projects.",
    description:
      "Learn how to structure digital campaigns, build audience trust, manage community engagement, and create a marketing routine that supports growth without chaos.",
    category: "Digital Marketing & Online Business",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Content planning",
      "Campaign basics",
      "Community engagement",
      "Digital positioning",
    ],
    lessons: [
      lesson(
        "marketing-foundations",
        "Marketing foundations and digital channels",
        "Understand the customer journey, core channels, and the role community management plays in digital growth.",
        "18 min",
        true,
      ),
      lesson(
        "content-and-campaign-structure",
        "Content planning and campaign structure",
        "Organize offers, messages, and publishing plans into a repeatable system that is easier to maintain.",
        "24 min",
      ),
      lesson(
        "community-management-workflow",
        "Community management workflow",
        "Set up practical response habits, engagement routines, and growth actions for business-facing social pages.",
        "27 min",
      ),
    ],
  },
  {
    slug: "infographics-graphic-design",
    title: "Complete Training in Infographics and Graphic Design",
    shortDescription:
      "Design cleaner visuals, branded layouts, and communication pieces that look more professional.",
    description:
      "This course introduces the design principles, layout thinking, and visual communication habits needed to produce stronger business graphics and clear infographics.",
    category: "Creative & Content Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Visual hierarchy",
      "Design layout",
      "Brand consistency",
      "Infographic structure",
    ],
    lessons: [
      lesson(
        "visual-design-basics",
        "Visual design basics",
        "Cover spacing, contrast, typography, and composition so each design feels intentional and easy to read.",
        "17 min",
        true,
      ),
      lesson(
        "infographic-planning",
        "Planning infographics that communicate clearly",
        "Learn how to simplify complex information into structured sections that guide the viewer smoothly.",
        "22 min",
      ),
      lesson(
        "practical-brand-graphics",
        "Practical brand graphics workflow",
        "Create social and business visuals that match a brand voice and stay usable across multiple formats.",
        "26 min",
      ),
    ],
  },
  {
    slug: "video-editing",
    title: "Complete Training in Video Editing",
    shortDescription:
      "Edit videos more confidently for education, social content, promotions, and personal projects.",
    description:
      "Move from raw footage to polished output with a practical editing workflow covering pacing, cuts, structure, and visual clarity.",
    category: "Creative & Content Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Editing workflow",
      "Story pacing",
      "Transitions and cuts",
      "Export preparation",
    ],
    lessons: [
      lesson(
        "editing-workflow-setup",
        "Editing workflow setup",
        "Understand the phases of an editing session from importing media to organizing a clear project timeline.",
        "16 min",
        true,
      ),
      lesson(
        "cuts-pacing-and-structure",
        "Cuts, pacing, and visual structure",
        "Build better rhythm, remove noise, and keep viewers focused on the main message of the video.",
        "25 min",
      ),
      lesson(
        "finishing-and-exporting",
        "Finishing, polishing, and exporting",
        "Prepare a final edit with stronger audio-visual consistency and export settings that fit the destination platform.",
        "23 min",
      ),
    ],
  },
  {
    slug: "artificial-intelligence",
    title: "Complete Training in Artificial Intelligence",
    shortDescription:
      "Understand practical AI use cases and how to work with the tools more effectively and responsibly.",
    description:
      "Explore the AI fundamentals, prompt habits, workflow opportunities, and productivity use cases that matter most for students, professionals, creators, and small teams.",
    category: "Tech & Future Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "AI fundamentals",
      "Prompting basics",
      "Workflow automation ideas",
      "Responsible use",
    ],
    lessons: [
      lesson(
        "ai-landscape-and-opportunities",
        "AI landscape and practical opportunities",
        "Understand what AI tools do well, where they fit in real work, and how to avoid unrealistic expectations.",
        "20 min",
        true,
      ),
      lesson(
        "prompting-and-output-control",
        "Prompting and output control",
        "Write stronger prompts, structure better requests, and refine outputs into something more useful and reliable.",
        "24 min",
      ),
      lesson(
        "ai-in-daily-workflows",
        "Using AI inside daily workflows",
        "Apply AI to writing, research, planning, and business tasks without losing accuracy or judgment.",
        "28 min",
      ),
    ],
  },
  {
    slug: "office-secretarial-tools",
    title:
      "Complete Training in Office Secretarial Tools: Word, Excel, and productivity tools",
    shortDescription:
      "Work more professionally with essential office tools for documents, spreadsheets, and task organization.",
    description:
      "Build confidence with Microsoft Word, Excel, and practical productivity habits used in office administration and support roles.",
    category: "Professional Office & Business Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Document formatting",
      "Spreadsheet basics",
      "Office productivity",
      "Administrative workflow",
    ],
    lessons: [
      lesson(
        "documents-and-office-routines",
        "Documents and office routines",
        "Learn how to prepare cleaner documents, manage formatting, and support professional communication standards.",
        "19 min",
        true,
      ),
      lesson(
        "excel-for-practical-productivity",
        "Excel for practical productivity",
        "Use spreadsheets for tracking, organization, calculations, and simple analysis in a business setting.",
        "27 min",
      ),
      lesson(
        "staying-organized-at-work",
        "Staying organized with productivity tools",
        "Combine files, tasks, and communication habits into a calmer day-to-day office system.",
        "21 min",
      ),
    ],
  },
  {
    slug: "trading",
    title: "Complete Training in Trading",
    shortDescription:
      "Learn the vocabulary, market basics, and disciplined thinking behind trading education.",
    description:
      "This educational course introduces the concepts, market behavior, and risk awareness needed to understand trading without treating it as a promise of profit.",
    category: "Finance & Market Education",
    level: "Beginner",
    includedInFullPack: true,
    financialDisclaimerRequired: true,
    skillsLearned: [
      "Trading vocabulary",
      "Market awareness",
      "Risk thinking",
      "Trade planning basics",
    ],
    lessons: [
      lesson(
        "market-language-and-structure",
        "Market language and structure",
        "Learn the terms, structures, and core concepts that help beginners understand what traders are looking at.",
        "18 min",
        true,
      ),
      lesson(
        "risk-discipline-and-mindset",
        "Risk discipline and trading mindset",
        "Focus on decision quality, patience, and risk management instead of hype or emotional trading behavior.",
        "24 min",
      ),
      lesson(
        "reading-basic-setups",
        "Reading basic setups",
        "See how traders think about entries, exits, and scenarios while keeping the content educational and non-advisory.",
        "23 min",
      ),
    ],
  },
  {
    slug: "cryptocurrency",
    title: "Complete Training in Cryptocurrency",
    shortDescription:
      "Understand cryptocurrency concepts, terminology, and safer learning foundations before taking action.",
    description:
      "Gain an educational overview of digital assets, blockchain ideas, wallet concepts, and the caution required when dealing with crypto markets.",
    category: "Finance & Market Education",
    level: "Beginner",
    includedInFullPack: true,
    financialDisclaimerRequired: true,
    skillsLearned: [
      "Crypto basics",
      "Wallet awareness",
      "Blockchain vocabulary",
      "Risk understanding",
    ],
    lessons: [
      lesson(
        "crypto-fundamentals",
        "Cryptocurrency fundamentals",
        "Understand the basic ideas behind digital assets, blockchain records, and how the ecosystem is structured.",
        "17 min",
        true,
      ),
      lesson(
        "wallets-platforms-and-safety",
        "Wallets, platforms, and safety habits",
        "Learn the practical safety concepts around storage, platform choices, and avoiding preventable mistakes.",
        "25 min",
      ),
      lesson(
        "making-sense-of-the-market",
        "Making sense of the crypto market",
        "Interpret market conversations more clearly while keeping expectations grounded and educational.",
        "22 min",
      ),
    ],
  },
  {
    slug: "ecommerce-dropshipping",
    title: "Complete Training in E-commerce and Dropshipping",
    shortDescription:
      "Explore practical online selling workflows, store setup thinking, and customer journey basics.",
    description:
      "Learn how e-commerce systems work, how offers are presented online, and how to think through product, store, and fulfillment flows with more structure.",
    category: "Digital Marketing & Online Business",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Store setup logic",
      "Offer positioning",
      "Customer journey basics",
      "Fulfillment awareness",
    ],
    lessons: [
      lesson(
        "ecommerce-models-and-opportunities",
        "E-commerce models and opportunities",
        "Understand how online stores, digital offers, and dropshipping-style models are positioned in the market.",
        "19 min",
        true,
      ),
      lesson(
        "product-and-store-structure",
        "Product and store structure",
        "Organize product pages, checkout thinking, and a cleaner customer experience from discovery to purchase.",
        "24 min",
      ),
      lesson(
        "marketing-and-operations-routine",
        "Marketing and operations routine",
        "Connect product research, promotion, customer follow-up, and order handling into a practical operating rhythm.",
        "26 min",
      ),
    ],
  },
  {
    slug: "canva-graphic-design-video-editing",
    title: "Complete Training in Graphic Design and Video Editing with Canva",
    shortDescription:
      "Create branded graphics and quick content assets with Canva using a more polished workflow.",
    description:
      "Use Canva more strategically for social visuals, short videos, marketing pieces, and fast-turnaround design tasks.",
    category: "Creative & Content Skills",
    level: "Beginner",
    includedInFullPack: true,
    skillsLearned: [
      "Canva workflows",
      "Template design",
      "Quick social content",
      "Visual consistency",
    ],
    lessons: [
      lesson(
        "canva-workspace-and-templates",
        "Canva workspace and template foundations",
        "Get comfortable with layouts, reusable templates, and faster design habits for repeat content creation.",
        "15 min",
        true,
      ),
      lesson(
        "social-design-and-video-assets",
        "Social design and short video assets",
        "Build graphics, short edits, and brand-friendly visuals that are ready for publishing.",
        "23 min",
      ),
      lesson(
        "building-a-simple-content-system",
        "Building a simple content system in Canva",
        "Turn Canva into a lightweight content engine for regular communication, promotions, and updates.",
        "21 min",
      ),
    ],
  },
  {
    slug: "youtube-creation-monetization",
    title: "Complete Training in YouTube Channel Creation and Monetization",
    shortDescription:
      "Plan, launch, and grow a YouTube presence with clearer structure and creator discipline.",
    description:
      "Learn the foundations of channel positioning, content planning, audience building, and the monetization path without relying on guesswork alone.",
    category: "Creative & Content Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Channel positioning",
      "Content planning",
      "Audience growth basics",
      "Monetization awareness",
    ],
    lessons: [
      lesson(
        "channel-positioning",
        "Channel positioning and content direction",
        "Define a clearer niche, value proposition, and content rhythm so the channel has a stronger identity.",
        "18 min",
        true,
      ),
      lesson(
        "video-planning-and-publishing",
        "Video planning and publishing workflow",
        "Build a more reliable routine for scripting, packaging, and publishing consistent YouTube content.",
        "24 min",
      ),
      lesson(
        "audience-growth-and-monetization",
        "Audience growth and monetization basics",
        "Understand the long game behind reach, retention, and revenue opportunities on the platform.",
        "26 min",
      ),
    ],
  },
  {
    slug: "accounting-management",
    title: "Complete Training in Accounting and Management",
    shortDescription:
      "Strengthen your understanding of business organization, records, and management discipline.",
    description:
      "Build the accounting and management awareness needed to follow business numbers, organize operations, and support better decision-making.",
    category: "Professional Office & Business Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Record awareness",
      "Business organization",
      "Management basics",
      "Reporting discipline",
    ],
    lessons: [
      lesson(
        "business-records-and-controls",
        "Business records and basic controls",
        "Understand the role of clean records, documentation, and internal order in business management.",
        "19 min",
        true,
      ),
      lesson(
        "interpreting-simple-business-numbers",
        "Interpreting simple business numbers",
        "Follow revenue, expenses, and operational indicators with more clarity and practical understanding.",
        "22 min",
      ),
      lesson(
        "management-routines-that-scale",
        "Management routines that scale",
        "Build the habits and reporting rhythm that help a business stay more organized as activity increases.",
        "25 min",
      ),
    ],
  },
  {
    slug: "computer-science-programming",
    title: "Complete Training in Computer Science and Programming",
    shortDescription:
      "Start understanding programming logic, problem solving, and the foundations behind software creation.",
    description:
      "This course introduces computational thinking, core programming ideas, and the mindset needed to keep progressing in technology.",
    category: "Tech & Future Skills",
    level: "Beginner",
    includedInFullPack: true,
    skillsLearned: [
      "Programming logic",
      "Problem solving",
      "Technical vocabulary",
      "Learning roadmap clarity",
    ],
    lessons: [
      lesson(
        "computational-thinking-basics",
        "Computational thinking basics",
        "Learn how programmers break problems down and turn instructions into structured logic.",
        "18 min",
        true,
      ),
      lesson(
        "core-programming-concepts",
        "Core programming concepts",
        "Understand variables, conditions, loops, and the building blocks that appear across languages and tools.",
        "24 min",
      ),
      lesson(
        "from-learning-to-building",
        "From learning to building",
        "See how beginner knowledge turns into small projects, stronger confidence, and a longer-term tech path.",
        "23 min",
      ),
    ],
  },
  {
    slug: "professional-personal-development",
    title: "Complete Training in Professional and Personal Development",
    shortDescription:
      "Build stronger work habits, confidence, communication, and personal discipline for long-term growth.",
    description:
      "Develop the mindset, behavior, and daily structure that help learners show up more professionally and progress with more consistency.",
    category: "Professional Office & Business Skills",
    level: "Beginner",
    includedInFullPack: true,
    skillsLearned: [
      "Professional mindset",
      "Communication habits",
      "Self-management",
      "Growth discipline",
    ],
    lessons: [
      lesson(
        "professional-identity-and-mindset",
        "Professional identity and mindset",
        "Clarify the habits and standards that make a learner look more reliable and prepared in real environments.",
        "17 min",
        true,
      ),
      lesson(
        "communication-and-work-habits",
        "Communication and work habits",
        "Improve responsiveness, organization, and personal consistency in everyday academic or professional settings.",
        "22 min",
      ),
      lesson(
        "planning-for-long-term-growth",
        "Planning for long-term growth",
        "Turn ambition into routines, goals, and self-development practices that actually compound over time.",
        "21 min",
      ),
    ],
  },
  {
    slug: "human-resources",
    title: "Complete Training in Human Resources",
    shortDescription:
      "Understand HR fundamentals, people processes, and workplace organization more clearly.",
    description:
      "Explore how HR supports recruitment, onboarding, communication, and team structure inside a growing organization.",
    category: "Professional Office & Business Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "HR basics",
      "Recruitment awareness",
      "Onboarding principles",
      "Workplace communication",
    ],
    lessons: [
      lesson(
        "hr-role-in-the-business",
        "The role of HR in the business",
        "Learn how human resources supports structure, culture, communication, and team coordination.",
        "18 min",
        true,
      ),
      lesson(
        "recruitment-and-onboarding-basics",
        "Recruitment and onboarding basics",
        "Understand the flow from candidate attraction to integration into the team.",
        "23 min",
      ),
      lesson(
        "people-processes-and-documentation",
        "People processes and documentation",
        "See how policies, follow-up, and employee records support cleaner internal operations.",
        "22 min",
      ),
    ],
  },
  {
    slug: "project-management",
    title: "Complete Training in Project Management",
    shortDescription:
      "Learn how projects are scoped, organized, tracked, and delivered with more structure.",
    description:
      "Understand the foundations of project planning, execution, communication, and delivery so work moves with less confusion.",
    category: "Professional Office & Business Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "Project planning",
      "Task coordination",
      "Scope awareness",
      "Delivery structure",
    ],
    lessons: [
      lesson(
        "project-lifecycle-foundations",
        "Project lifecycle foundations",
        "Understand how ideas move from scope to planning, execution, review, and delivery.",
        "18 min",
        true,
      ),
      lesson(
        "organizing-tasks-and-priorities",
        "Organizing tasks and priorities",
        "Break larger goals into coordinated actions, responsibilities, and realistic checkpoints.",
        "24 min",
      ),
      lesson(
        "communication-risk-and-delivery",
        "Communication, risk, and delivery rhythm",
        "Keep stakeholders aligned while reducing surprises and improving project follow-through.",
        "25 min",
      ),
    ],
  },
  {
    slug: "wordpress-website-design",
    title: "Complete Training in Designing Internet Sites with WordPress",
    shortDescription:
      "Learn how WordPress websites are structured, customized, and launched for real-world use.",
    description:
      "Understand the foundations of building and managing websites with WordPress, from content structure to design choices and launch readiness.",
    category: "Tech & Future Skills",
    level: "Beginner to Intermediate",
    includedInFullPack: true,
    skillsLearned: [
      "WordPress structure",
      "Page building basics",
      "Content organization",
      "Launch readiness",
    ],
    lessons: [
      lesson(
        "wordpress-foundations",
        "WordPress foundations",
        "See how themes, pages, plugins, and settings work together inside a WordPress website setup.",
        "17 min",
        true,
      ),
      lesson(
        "building-pages-and-structure",
        "Building pages and site structure",
        "Organize navigation, sections, and page layouts so the site feels clearer and more usable.",
        "24 min",
      ),
      lesson(
        "preparing-for-launch",
        "Preparing a WordPress site for launch",
        "Review the finishing steps around content, trust, responsiveness, and maintenance awareness.",
        "23 min",
      ),
    ],
  },
];

export const COURSE_CATALOG_BY_SLUG = Object.fromEntries(
  COURSE_CATALOG.map((course) => [course.slug, course]),
) as Record<string, CourseCatalogEntry>;
