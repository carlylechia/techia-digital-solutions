import { siteConfig } from "@/content/site";

export type NavigationItem = {
  label: string;
  href: string;
};

export type ServiceItem = {
  icon: string;
  title: string;
  description: string;
  detail: string;
  href: string;
};

export type SolutionItem = {
  icon: string;
  title: string;
  problem: string;
  solution: string;
  benefit: string;
  features: string[];
};

export type CaseStudyItem = {
  slug: string;
  title: string;
  industry: string;
  services: string[];
  projectType: string;
  outcome: string;
  summary: string;
  metrics: string[];
};

export type PricingPlan = {
  title: string;
  label: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  features: string[];
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export type ResourceItem = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

export type PortalProject = {
  name: string;
  phase: string;
  progress: string;
  nextMilestone: string;
};

export type PortalMessage = {
  sender: string;
  subject: string;
  time: string;
  status: string;
};

export type PortalFile = {
  name: string;
  type: string;
  updated: string;
  status: string;
};

export type PortalInvoice = {
  id: string;
  amount: string;
  status: string;
  due: string;
};

export const marketingNav: NavigationItem[] = [
  { label: "Founder", href: "/founder" },
  { label: "Demo Lab", href: "/demo-lab" },
  { label: "Client Portal", href: "/client-portal" },
  { label: "AI Consultant", href: "/ai-consultant" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const heroBadges = [
  "Social Media",
  "Digital Marketing",
  "Branding",
  "Automation",
  "AI Solutions",
];

export const trustStrip = [
  "Social media management that keeps brands visible",
  "Digital marketing that drives qualified demand",
  "Branding that builds trust faster",
  "Web and e-commerce experiences that convert",
  "Automation, AI, and software for cleaner operations",
];

export const homepageMetrics = [
  {
    value: "Global-ready",
    label: "Positioning for Africa, Europe, and international buyers",
  },
  {
    value: "System-first",
    label: "Every project is designed to reduce friction across teams",
  },
  {
    value: "Fast-moving",
    label: "Lean discovery, polished execution, and measurable rollout",
  },
];

export const services: ServiceItem[] = [
  {
    icon: "sparkles",
    title: "Social Media Management",
    description:
      "Consistent social content and community management that keep your business visible, relevant, and easier to trust.",
    detail:
      "Content planning, creative direction, publishing support, and performance review built around real business goals.",
    href: "/services#social-media-management",
  },
  {
    icon: "bar-chart-3",
    title: "Digital Marketing",
    description:
      "Campaigns and funnels that turn attention into qualified leads and measurable business momentum.",
    detail:
      "Paid growth support, landing strategy, email journeys, conversion tracking, and demand-generation planning.",
    href: "/services#digital-marketing",
  },
  {
    icon: "layout-template",
    title: "Branding & Graphic Design",
    description:
      "Sharper positioning and design that make the business look credible, memorable, and ready to scale.",
    detail:
      "Brand strategy, visual identity, sales assets, presentation systems, and messaging refinement.",
    href: "/services#branding-graphic-design",
  },
  {
    icon: "building-2",
    title: "Website Design & Development",
    description:
      "High-performance websites that explain the offer clearly, build trust, and convert visitors into customers.",
    detail:
      "Conversion-focused structure, premium UX, CMS-ready builds, and launch support designed for growth.",
    href: "/services#website-design-development",
  },
  {
    icon: "shopping-bag",
    title: "E-commerce Solutions",
    description:
      "Sales experiences that make it easier for customers to browse, trust, buy, and come back again.",
    detail:
      "Catalog structure, checkout journeys, payment integration, and order experiences built for smoother selling.",
    href: "/services#e-commerce-solutions",
  },
  {
    icon: "rocket",
    title: "SEO",
    description:
      "Search optimization that helps the right customers discover your business before competitors win the click.",
    detail:
      "Technical SEO, search structure, content mapping, and visibility improvements that support long-term inbound growth.",
    href: "/services#seo",
  },
  {
    icon: "workflow",
    title: "Business Automation",
    description:
      "Automation that removes repetitive admin, speeds up follow-up, and keeps operations cleaner.",
    detail:
      "Lead routing, reminders, notifications, approvals, status updates, and handoffs built around your workflow.",
    href: "/services#business-automation",
  },
  {
    icon: "brain-circuit",
    title: "AI Solutions",
    description:
      "Practical AI tools that support guidance, faster responses, and better decision-making inside the business.",
    detail:
      "AI assistants, knowledge tools, smart intake flows, summarization, and decision-support layers.",
    href: "/services#ai-solutions",
  },
  {
    icon: "panel-top-open",
    title: "Custom Business Software",
    description:
      "Tailored software for businesses whose operations do not fit generic tools.",
    detail:
      "Portals, dashboards, internal systems, workflow tools, and operational data layers designed around the business model.",
    href: "/services#custom-business-software",
  },
  {
    icon: "orbit",
    title: "Cloud & Digital Transformation Consulting",
    description:
      "Strategic guidance for companies connecting disconnected systems and planning the next digital growth layer.",
    detail:
      "Technology audits, cloud planning, solution architecture, prioritization, rollout plans, and transformation advisory.",
    href: "/services#cloud-digital-transformation-consulting",
  },
];

export const solutions: SolutionItem[] = [
  {
    icon: "store",
    title: "Local businesses",
    problem:
      "Most local businesses still rely on WhatsApp, referrals, and manual coordination to manage growth.",
    solution:
      "A premium website, structured lead flow, quote process, and lightweight operations dashboard.",
    benefit:
      "You look more trustworthy, respond faster, and stop losing opportunities because the process is unclear.",
    features: [
      "Inquiry forms",
      "WhatsApp CTA flows",
      "Quote requests",
      "Lead pipeline snapshots",
    ],
  },
  {
    icon: "briefcase-business",
    title: "Consultants and agencies",
    problem:
      "Authority is hard to communicate when your offer, case studies, and delivery process feel scattered.",
    solution:
      "A premium digital presence with service pages, authority content, proposals, and discovery systems.",
    benefit:
      "Prospects understand your value faster and serious leads arrive with better context.",
    features: [
      "Positioning pages",
      "Service packages",
      "Discovery booking",
      "Proposal-ready content",
    ],
  },
  {
    icon: "plane",
    title: "Travel and logistics companies",
    problem:
      "Operational detail is complex, but customers still need a smooth, reassuring, premium experience.",
    solution:
      "Service portals, inquiry systems, destination or route pages, and internal coordination tools.",
    benefit:
      "Teams work more consistently while clients experience a clear and credible brand.",
    features: [
      "Inquiry triage",
      "Document checklists",
      "Operations dashboard",
      "Service tracking",
    ],
  },
  {
    icon: "shopping-bag",
    title: "Ecommerce and product businesses",
    problem:
      "Growth creates pressure on inventory visibility, customer communication, and operational speed.",
    solution:
      "Conversion-led storefronts, product systems, sales dashboards, and fulfillment automation.",
    benefit:
      "The business becomes easier to scale without adding unnecessary manual work.",
    features: [
      "Product catalogs",
      "Sales dashboards",
      "Order workflows",
      "Customer follow-ups",
    ],
  },
  {
    icon: "rocket",
    title: "Startups and SaaS ideas",
    problem:
      "Early teams need speed, polish, and product clarity without wasting time on bloated builds.",
    solution:
      "Landing pages, MVP interfaces, investor-ready dashboards, and product architecture guidance.",
    benefit:
      "You launch with a sharper story, stronger trust, and a clearer path to iteration.",
    features: [
      "Launch pages",
      "Product dashboards",
      "MVP UX",
      "Founder analytics",
    ],
  },
  {
    icon: "settings-2",
    title: "Internal business operations",
    problem:
      "Spreadsheets, scattered messages, and inconsistent handoffs make simple work more expensive.",
    solution:
      "Custom internal systems that connect approvals, tasks, files, and business reporting.",
    benefit:
      "Operations become visible, repeatable, and easier for teams to manage at scale.",
    features: [
      "Role-based portals",
      "Approval flows",
      "Document storage",
      "Operational reporting",
    ],
  },
];

export const caseStudies: CaseStudyItem[] = [
  {
    slug: "teloh-global-business",
    title: "Teloh Global Business",
    industry: "Logistics and global trade",
    services: ["Website strategy", "Corporate UI/UX", "Lead structure"],
    projectType: "Corporate digital platform",
    outcome:
      "A clearer global-facing digital home for a multi-service business with room for scale.",
    summary:
      "We positioned the brand around trust, capability, and international readiness while simplifying how prospects understand the offer.",
    metrics: [
      "Multi-service architecture",
      "Trust-led messaging",
      "International credibility",
    ],
  },
  {
    slug: "teloh-global-travels",
    title: "Teloh Global Travels",
    industry: "Travel consultancy",
    services: ["Inquiry systems", "Conversion design", "Content structure"],
    projectType: "Travel inquiry experience",
    outcome:
      "A premium inquiry journey that supports both travel guidance and operational follow-up.",
    summary:
      "The project focused on clarity, destination storytelling, and fast intake for serious prospects.",
    metrics: [
      "Guided inquiries",
      "Premium destination pages",
      "Better follow-up context",
    ],
  },
  {
    slug: "job-seeker-os",
    title: "Job Seeker OS",
    industry: "Career technology",
    services: ["Product UX", "Dashboard design", "Application architecture"],
    projectType: "Career operating system",
    outcome:
      "A structured product experience for managing opportunities, applications, and progress.",
    summary:
      "The product was shaped like a command center so users could feel more in control of a stressful process.",
    metrics: [
      "Dashboard-first UX",
      "Task visibility",
      "Workflow-centered product design",
    ],
  },
  {
    slug: "mickey-car-sales",
    title: "Mickey Car Sales",
    industry: "Automotive retail",
    services: ["Visual design", "Inventory presentation", "Lead conversion"],
    projectType: "Automotive showcase platform",
    outcome:
      "A more premium online presence for vehicle discovery, inquiry, and trust-building.",
    summary:
      "We paired rich presentation with a cleaner customer journey so the business feels more established from the first screen.",
    metrics: [
      "Inventory showcase",
      "Luxury visual treatment",
      "High-trust inquiry flow",
    ],
  },
];

export const processRoadmap = [
  "Discover",
  "Design",
  "Build",
  "Launch",
  "Improve",
];

export const processDetails = [
  {
    title: "Discovery",
    description:
      "We clarify the business problem, current friction points, stakeholders, and what success should actually look like.",
  },
  {
    title: "Strategy",
    description:
      "We define the right growth path, whether that means stronger marketing, branding, web, automation, AI, or a combined rollout.",
  },
  {
    title: "UX/UI Design",
    description:
      "We design flows, interfaces, and content structure that feel premium while staying intuitive for real users.",
  },
  {
    title: "Development",
    description:
      "We build a robust, responsive, future-ready product with clean architecture and careful implementation.",
  },
  {
    title: "Testing",
    description:
      "We review performance, edge cases, content, responsiveness, and interaction quality before launch.",
  },
  {
    title: "Deployment",
    description:
      "We launch with confidence, connect the right domains and services, and ensure the experience feels polished on day one.",
  },
  {
    title: "Support",
    description:
      "We stay available for changes, fixes, feedback loops, and the next layer of operational improvement.",
  },
  {
    title: "Optimization",
    description:
      "We use real usage patterns and business goals to guide improvements after launch instead of guessing.",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    title: "Growth Launchpad",
    label: "Starting from",
    description:
      "For businesses that need stronger branding, clearer visibility, and a conversion-ready digital foundation.",
    cta: "Book a consultation",
    href: "/request-quote",
    features: [
      "Brand clarity",
      "Social and web foundation",
      "Lead capture setup",
      "Growth roadmap",
    ],
  },
  {
    title: "Visibility & Demand Engine",
    label: "Most requested",
    description:
      "For companies that need coordinated marketing, campaigns, landing pages, and SEO to generate better demand.",
    cta: "Book a consultation",
    href: "/contact",
    featured: true,
    features: [
      "Campaign support",
      "Landing experiences",
      "SEO foundations",
      "Analytics and conversion tracking",
    ],
  },
  {
    title: "Growth Operations System",
    label: "Custom quote",
    description:
      "For organizations solving deeper operational problems through automation, AI, dashboards, and custom software.",
    cta: "Request a custom roadmap",
    href: "/request-quote",
    features: [
      "Custom software architecture",
      "Automation and AI layers",
      "Portal and workflow design",
      "Ongoing optimization roadmap",
    ],
  },
];

export const testimonials: TestimonialItem[] = [
  {
    quote:
      "teChia thinks beyond the website. The work feels like a real business system, not just a design exercise.",
    name: "Global operations lead",
    role: "Operations",
    company: "Client partner",
  },
  {
    quote:
      "The interface quality immediately changed how seriously people took the business online.",
    name: "Founder",
    role: "Consultancy",
    company: "Growth-focused SME",
  },
  {
    quote:
      "They simplify complex digital ideas into something practical, premium, and easy to move forward with.",
    name: "Managing director",
    role: "Leadership",
    company: "Service business",
  },
];

export const companyValues = [
  {
    title: "Clarity",
    description: "Good technology should reduce noise, not add more of it.",
  },
  {
    title: "Engineering excellence",
    description:
      "Strong implementation is part of the brand experience, not a hidden layer.",
  },
  {
    title: "Trust",
    description:
      "We build systems that help businesses look credible and feel dependable.",
  },
  {
    title: "Business impact",
    description:
      "The goal is not digital decoration. The goal is better business outcomes.",
  },
  {
    title: "Innovation",
    description:
      "We use emerging technology where it creates real leverage, not where it creates noise.",
  },
  {
    title: "Human-centered technology",
    description:
      "The best systems support how people actually work, communicate, and make decisions.",
  },
];

export const resources: ResourceItem[] = [
  {
    icon: "book-open-text",
    title: "Digital Home Blueprint",
    description:
      "A practical guide to what modern businesses actually need from a serious digital presence.",
    href: "/request-quote",
  },
  {
    icon: "brain-circuit",
    title: "AI Readiness Notes",
    description:
      "Where AI tools create genuine value inside a business workflow and where they do not.",
    href: "/services",
  },
  {
    icon: "bar-chart-3",
    title: "System Audit Checklist",
    description:
      "Use this to identify where scattered tools, manual work, or slow approvals are costing time.",
    href: "/process",
  },
];

export const faqPreview = [
  {
    question: "Do you only help with websites?",
    answer:
      "No. Websites are only one part of the work. teChia also supports social media, digital marketing, branding, automation, AI, and custom software depending on the real growth need.",
  },
  {
    question: "Can teChia work with international clients?",
    answer:
      "Yes. The company is positioned to serve clients across Africa, Europe, and other global markets with a premium digital delivery approach.",
  },
  {
    question:
      "Do you help define the solution if we are not sure what we need?",
    answer:
      "Yes. Discovery is part of the process. We help shape the right growth path before recommending the right build or campaign mix.",
  },
];

export const businessInquiryCategories = [
  "Social media or digital marketing",
  "Branding or web presence",
  "E-commerce or SEO",
  "Automation, AI, or software",
  "Consulting or partnership",
];

export const quoteBudgetRanges = [
  "Under $2,000",
  "$2,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000 - $25,000",
  "$25,000+",
  "Need guidance",
];

export const quoteTimelines = [
  "ASAP",
  "2-4 weeks",
  "1-2 months",
  "Quarterly roadmap",
  "Exploration stage",
];

export const quoteServiceTypes = [
  "Premium website",
  "Business management system",
  "Automation solution",
  "AI-powered tool",
  "Dashboard and analytics",
  "Digital transformation consulting",
];

export const preferredContactMethods = [
  "Email",
  "WhatsApp",
  "Phone call",
  "Video call",
];

export const solutionPathPreview = [
  "Discovery call",
  "Solution blueprint",
  "Design prototype",
  "Development",
  "Launch and support",
];

export const socialLinks = [
  { label: "LinkedIn", href: siteConfig.socials.linkedin },
  { label: "X", href: siteConfig.socials.x },
  { label: "GitHub", href: siteConfig.socials.github },
];

export const portalSidebar = [
  { label: "Overview", href: "/client-portal" },
  { label: "Projects", href: "/client-portal/projects" },
  { label: "Messages", href: "/client-portal/messages" },
  { label: "Files", href: "/client-portal/files" },
  { label: "Invoices", href: "/client-portal/invoices" },
];

export const portalMetrics = [
  { label: "Active projects", value: "03" },
  { label: "Current phase", value: "Build" },
  { label: "Pending actions", value: "04" },
  { label: "Next milestone", value: "UI review" },
];

export const portalProjects: PortalProject[] = [
  {
    name: "Corporate website revamp",
    phase: "Design QA",
    progress: "82%",
    nextMilestone: "Final homepage sign-off",
  },
  {
    name: "Client portal setup",
    phase: "Development",
    progress: "61%",
    nextMilestone: "Files module handoff",
  },
  {
    name: "Automation workflow",
    phase: "Discovery",
    progress: "28%",
    nextMilestone: "Workflow blueprint approval",
  },
];

export const portalMessages: PortalMessage[] = [
  {
    sender: "teChia Delivery Team",
    subject: "Homepage revision ready for review",
    time: "2h ago",
    status: "Unread",
  },
  {
    sender: "Product Strategy",
    subject: "Updated dashboard priorities",
    time: "Yesterday",
    status: "Replied",
  },
  {
    sender: "Accounts",
    subject: "Invoice milestone shared",
    time: "2 days ago",
    status: "Pending",
  },
];

export const portalFiles: PortalFile[] = [
  {
    name: "Brand-guidelines-v3.pdf",
    type: "Brand",
    updated: "Today",
    status: "New",
  },
  {
    name: "portal-wireframes.fig",
    type: "Design",
    updated: "Yesterday",
    status: "Reviewed",
  },
  {
    name: "content-collection.zip",
    type: "Content",
    updated: "This week",
    status: "Waiting",
  },
];

export const portalInvoices: PortalInvoice[] = [
  {
    id: "INV-2026-014",
    amount: "$2,800",
    status: "Due in 4 days",
    due: "May 27",
  },
  { id: "INV-2026-011", amount: "$1,250", status: "Paid", due: "May 03" },
  { id: "INV-2026-008", amount: "$850", status: "Processing", due: "Apr 19" },
];

export const aboutCopy = {
  whoWeAre:
    "teChia Digital Solutions is a business growth partner that combines marketing, branding, web, automation, AI, and software to help companies grow with more clarity.",
  whyWeExist:
    "teChia exists because too many businesses still struggle with weak visibility, disconnected tools, manual work, and digital systems that do not match how they actually operate.",
  philosophy:
    "Our philosophy is simple: start with the business goal, choose the right digital mix, and deliver it with clarity, premium execution, and real commercial context.",
  founderStory:
    "teChia was shaped around the belief that many businesses do not need more noise or more software. They need better growth systems. That means stronger branding, clearer marketing, web experiences that convert, systems that organize work, dashboards that guide decisions, and automation that creates momentum instead of confusion.",
};

export const legalContent = {
  privacy: [
    "We only collect information required to respond to inquiries, deliver services, improve communication, and maintain platform security.",
    "Business inquiry details may be stored in secure internal systems for project follow-up, proposal preparation, or client communication.",
    "We do not sell personal data. Information is shared only with service providers that help us operate the business responsibly.",
  ],
  terms: [
    "Project scopes, timelines, and deliverables are confirmed through written agreements before implementation begins.",
    "Any client portal preview shown on this website is illustrative unless separately provisioned as part of a live service engagement.",
    "Use of this website does not create a client relationship until a formal agreement has been accepted by both parties.",
  ],
};
