import {
  getLocalizedHref,
  getLocalizedSectionHref,
  mergedPageAnchors,
  siteConfig,
  type Locale,
} from "@/content/site";

export const FOUNDER_NAME = "Chia Carlyle";

export const founderLinks = {
  linkedin: "https://www.linkedin.com/in/chia-carlyle/",
  github: "https://github.com/carlylechia",
  resumeDownload:
    "https://drive.google.com/file/d/1jrIl1RMYnLdme0AWgDJBsf28MryFwXXw/view",
} as const;

export const GITHUB_URL = founderLinks.github;

export type FounderSkillCategory = {
  id: string;
  title: string;
  description: string;
  value: string;
  icon: "frontend" | "backend" | "systems" | "growth" | "ai" | "tools";
  items: string[];
};

export type FounderProject = {
  slug: string;
  name: string;
  category: string;
  description: string;
  problem: string;
  solution: string;
  role: string;
  businessValue: string;
  techStack: string[];
  caseStudyPath: string;
};

export type FounderExperience = {
  stage: string;
  title: string;
  organization: string;
  summary: string;
  highlights: string[];
};

export type FounderPrinciple = {
  title: string;
  description: string;
  icon:
    | "briefcase"
    | "layers"
    | "search"
    | "shield"
    | "smartphone"
    | "workflow"
    | "sparkles"
    | "message"
    | "wrench";
};

export type FounderContent = {
  pageTitle: string;
  metadata: {
    title: string;
    description: string;
  };
  title: string;
  hero: {
    badge: string;
    headline: string;
    subtext: string;
    positioning: string;
    primaryCta: string;
    secondaryCta: string;
    downloadCta: string;
    linkedinCta: string;
    githubCta: string;
    trustHighlights: string[];
  };
  snapshot: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      title: string;
      detail: string;
      icon: "code" | "layout" | "briefcase" | "globe" | "sparkles";
    }>;
  };
  summary: {
    eyebrow: string;
    title: string;
    body: string[];
    highlights: string[];
  };
  story: {
    title: string;
    body: string;
    painPoints: string[];
  };
  skills: {
    eyebrow: string;
    title: string;
    description: string;
    categories: FounderSkillCategory[];
  };
  projects: {
    eyebrow: string;
    title: string;
    description: string;
    caseStudyCta: string;
    buildSimilarCta: string;
    items: FounderProject[];
  };
  experience: {
    eyebrow: string;
    title: string;
    description: string;
    items: FounderExperience[];
  };
  principles: {
    eyebrow: string;
    title: string;
    description: string;
    items: FounderPrinciple[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    placeholder: string;
  };
  download: {
    title: string;
    body: string;
    cta: string;
    placeholderNote: string;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    tertiaryCta: string;
  };
};

const founderContent = {
  en: {
    pageTitle: "Meet the Founder",
    metadata: {
      title: "Meet the Founder | Chia Carlyle | teChia Digital Solutions",
      description:
        "Meet Chia Carlyle, full-stack developer, digital systems builder, and founder of teChia Digital Solutions. Explore his portfolio, skills, founder story, LinkedIn recommendations, and business-focused approach to building websites, dashboards, automation tools, and digital systems.",
    },
    title:
      "Full-Stack Developer, Digital Systems Builder, and Founder of teChia Digital Solutions",
    hero: {
      badge: "Founder profile",
      headline:
        "Hi, I’m Chia Carlyle. I build digital systems that help businesses work smarter.",
      subtext:
        "I am a full-stack software developer and founder of teChia Digital Solutions, focused on building premium websites, business management systems, dashboards, automation tools, and AI-powered solutions for local and international businesses.",
      positioning:
        "Technical execution, product thinking, and business clarity in one delivery partner.",
      primaryCta: "View My Work",
      secondaryCta: "Work With teChia",
      downloadCta: "Preview & Download Founder CV",
      linkedinCta: "Connect on LinkedIn",
      githubCta: "View GitHub",
      trustHighlights: [
        "Premium websites",
        "Dashboards and portals",
        "Automation-ready systems",
        "AI-assisted tools",
        "SEO-first implementation",
        "Local insight, global delivery mindset",
      ],
    },
    snapshot: {
      eyebrow: "Founder snapshot",
      title: "Technical credibility built around practical business outcomes",
      description:
        "This page is designed to show the builder behind teChia: the engineering mindset, product instincts, and business focus that shape every delivery.",
      items: [
        {
          title: "Full-stack development experience",
          detail:
            "Modern frontend, backend logic, data models, authentication, and production-ready delivery.",
          icon: "code",
        },
        {
          title: "Business systems and dashboards",
          detail:
            "Admin workflows, customer records, portals, quote flows, booking logic, and operational visibility.",
          icon: "layout",
        },
        {
          title: "Business-focused engineering",
          detail:
            "Technology choices anchored to speed, clarity, maintainability, and measurable business use.",
          icon: "briefcase",
        },
        {
          title: "Local + international vision",
          detail:
            "Built for African business realities while meeting the expectations of global clients and partners.",
          icon: "globe",
        },
        {
          title: "Websites, systems, automation, AI",
          detail:
            "A connected approach that treats digital presence, operations, and growth as one system.",
          icon: "sparkles",
        },
      ],
    },
    summary: {
      eyebrow: "About Chia",
      title:
        "A builder focused on turning scattered business processes into structured digital systems",
      body: [
        "Chia Carlyle is a full-stack software developer and digital systems builder based in Cameroon. Through teChia Digital Solutions, he helps businesses move from scattered manual processes to structured digital platforms that improve visibility, operations, customer service, and growth.",
        "His work focuses on building practical, beautiful, and business-focused technology: premium websites, dashboards, management systems, automation workflows, AI-powered tools, and digital experiences that solve real problems.",
      ],
      highlights: [
        "Based in Cameroon, building for local businesses and international clients",
        "Combines engineering implementation with product and operations thinking",
        "Prefers clean systems over unnecessary complexity",
        "Builds for trust, speed, maintainability, and measurable value",
      ],
    },
    story: {
      title: "Why I Started teChia Digital Solutions",
      body: "I started teChia Digital Solutions because many businesses around me still depend on scattered WhatsApp messages, paper records, spreadsheets, weak online visibility, and manual processes. I believe simple, well-designed technology can help these businesses look more professional, serve customers better, save time, and grow beyond their local limits.",
      painPoints: [
        "Scattered WhatsApp communication with no central workflow",
        "Paper records and spreadsheets that slow decisions and follow-up",
        "Weak online visibility that makes strong businesses look smaller than they are",
      ],
    },
    skills: {
      eyebrow: "Technical skillset",
      title:
        "A product-minded stack shaped around credibility, speed, and scalable delivery",
      description:
        "These capabilities reflect the kinds of systems Chia builds most often: polished public websites, structured internal tools, operational dashboards, growth-ready landing pages, and automation layers that remove busywork.",
      categories: [
        {
          id: "frontend",
          title: "Frontend",
          description:
            "Responsive interfaces that feel premium, usable, and conversion-ready across mobile, tablet, and desktop.",
          value:
            "Presentation quality matters because trust is often won before the first conversation.",
          icon: "frontend",
          items: [
            "Next.js",
            "React",
            "TypeScript",
            "Tailwind CSS",
            "Responsive UI",
            "Animations",
          ],
        },
        {
          id: "backend",
          title: "Backend",
          description:
            "Application logic, validation, secure flows, and data structures that keep products reliable as they grow.",
          value:
            "The frontend only feels polished when the backend is stable, predictable, and easy to evolve.",
          icon: "backend",
          items: [
            "Node.js",
            "API Routes",
            "Prisma",
            "PostgreSQL",
            "Authentication",
            "Server-side validation",
          ],
        },
        {
          id: "systems",
          title: "Business Systems",
          description:
            "Custom workflow layers designed around how a real business tracks customers, requests, approvals, and delivery.",
          value:
            "Good systems reduce confusion, speed up response time, and make teams more accountable.",
          icon: "systems",
          items: [
            "Admin dashboards",
            "CRM-style systems",
            "Booking systems",
            "Quote systems",
            "Client portals",
            "Content management systems",
          ],
        },
        {
          id: "growth",
          title: "Growth & SEO",
          description:
            "Search visibility, landing-page structure, analytics signals, and metadata that support long-term discovery.",
          value:
            "A website should not only look serious. It should also be discoverable, measurable, and ready to convert traffic.",
          icon: "growth",
          items: [
            "SEO architecture",
            "Google Analytics",
            "Google Ads landing pages",
            "Metadata",
            "Structured data",
            "Performance optimization",
          ],
        },
        {
          id: "ai",
          title: "AI & Automation",
          description:
            "Practical assistants, workflow triggers, smart forms, and internal tools that save time where repetition is highest.",
          value:
            "Automation matters most when it removes real friction instead of adding novelty.",
          icon: "ai",
          items: [
            "AI assistants",
            "Workflow automation",
            "Smart forms",
            "Email notifications",
            "Lead capture systems",
            "Internal business tools",
          ],
        },
        {
          id: "tools",
          title: "Tools & Deployment",
          description:
            "Modern delivery workflows for shipping, iteration, asset handling, email, and production hosting.",
          value:
            "Reliable deployment and disciplined workflow are part of product quality, not an afterthought.",
          icon: "tools",
          items: [
            "GitHub",
            "Vercel",
            "Resend",
            "Cloudinary",
            "PostgreSQL tools",
            "Modern development workflows",
          ],
        },
      ],
    },
    projects: {
      eyebrow: "Selected work",
      title:
        "Projects that show technical range, product thinking, and delivery style",
      description:
        "Some entries are live client-oriented builds, while others are internal products, reusable system models, or strategic concepts. Labels are intentionally precise so the portfolio stays honest.",
      caseStudyCta: "View Case Study",
      buildSimilarCta: "Build Something Similar",
      items: [
        {
          slug: "job-seeker-os",
          name: "Job Seeker OS",
          category: "Production App",
          description:
            "A career-focused platform designed to help job seekers organize applications, improve their professional materials, and manage their job search process.",
          problem:
            "Job seekers often manage applications, CV updates, and follow-ups across scattered notes, files, and email threads.",
          solution:
            "A structured platform with organized workflows, better visibility, and a more intentional user journey.",
          role: "Product strategy, UX direction, full-stack implementation, and system architecture.",
          businessValue:
            "Demonstrates how teChia can turn messy personal or business workflows into a guided digital operating system.",
          techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Auth"],
          caseStudyPath: "/portfolio/job-seeker-os",
        },
        {
          slug: "teloh-global-business",
          name: "Teloh Global Business",
          category: "Client Project",
          description:
            "A multi-service business digitalization concept combining a public company website, service presentation, admin-controlled content, multilingual structure, and future dashboard possibilities.",
          problem:
            "A multi-service business needs clarity, trust, and room to grow without looking fragmented online.",
          solution:
            "A premium company presence with structured messaging, scalable content architecture, and future-ready operational pathways.",
          role: "Website architecture, UI implementation, localization structure, and business presentation strategy.",
          businessValue:
            "Improves digital credibility while laying the groundwork for more advanced internal systems later.",
          techStack: ["Next.js", "TypeScript", "Tailwind CSS", "SEO metadata"],
          caseStudyPath: "/portfolio/teloh-global-business",
        },
        {
          slug: "teloh-global-travels",
          name: "Teloh Global Travels",
          category: "Client Project",
          description:
            "A travel consultancy digital platform concept focused on credibility, inquiry capture, content structure, and future travel service workflows.",
          problem:
            "Travel consultancies need trust-first information architecture and cleaner inquiry capture to convert interest into qualified conversations.",
          solution:
            "A polished platform concept that makes services easier to understand while preparing for deeper operational workflows.",
          role: "Digital strategy, UX structure, frontend delivery, and growth-focused content layout.",
          businessValue:
            "Shows how travel and consultancy brands can look more serious and capture better leads online.",
          techStack: [
            "Next.js",
            "Localized routing",
            "Structured content",
            "Lead capture",
          ],
          caseStudyPath: "/portfolio/teloh-global-travels",
        },
        {
          slug: "mentora",
          name: "Mentor@",
          category: "Prototype",
          description:
            "An AI-powered mindset coaching and career orientation platform concept designed to guide students, graduates, and career changers with practical advice and goal direction.",
          problem:
            "Students and early-career professionals often lack structured, practical guidance they can access consistently.",
          solution:
            "A prototype concept that blends mentoring logic, coaching journeys, and AI-assisted guidance into one experience.",
          role: "Concept design, product architecture, AI workflow direction, and interface strategy.",
          businessValue:
            "Illustrates teChia’s ability to frame AI around practical user outcomes instead of novelty alone.",
          techStack: [
            "Next.js",
            "AI workflow patterns",
            "Prompt-assisted UX",
            "Dashboard concepts",
          ],
          caseStudyPath: "/portfolio/mentora",
        },
        {
          slug: "mickey-car-sales",
          name: "Mickey Car Sales",
          category: "Concept",
          description:
            "A premium automotive website concept for showcasing cars, parts, inquiries, and international vehicle-related services.",
          problem:
            "Automotive businesses often rely on informal listings and inconsistent presentation that weaken buyer trust.",
          solution:
            "A higher-end concept with stronger product presentation, inquiry flow, and service positioning.",
          role: "Visual direction, information architecture, and conversion-focused interface planning.",
          businessValue:
            "Demonstrates how teChia can elevate inventory-driven businesses into more premium digital brands.",
          techStack: [
            "Responsive UI",
            "Inventory-style layouts",
            "Lead capture",
            "Brand presentation",
          ],
          caseStudyPath: "/portfolio/mickey-car-sales",
        },
        {
          slug: "techia-digital-solutions",
          name: "teChia Digital Solutions",
          category: "Internal Product",
          description:
            "The official digital home for teChia, built to demonstrate premium websites, digital transformation systems, automation, AI tools, and business operating systems.",
          problem:
            "A technology studio must prove its standards through its own product, not only through sales language.",
          solution:
            "A bilingual, SEO-ready platform that acts as brand presence, lead engine, portfolio layer, and systems showcase.",
          role: "Brand translation into product, full-stack implementation, content architecture, and conversion strategy.",
          businessValue:
            "Functions as both marketing site and live demonstration of teChia’s quality bar.",
          techStack: [
            "Next.js App Router",
            "TypeScript",
            "Tailwind CSS",
            "Structured data",
            "Analytics",
          ],
          caseStudyPath: "/portfolio/techia-digital-solutions",
        },
        {
          slug: "custom-business-os",
          name: "Custom Business OS Concept",
          category: "Concept",
          description:
            "A reusable business system model combining public website, admin dashboard, customer records, quote management, workflow automation, and analytics.",
          problem:
            "Many growing businesses operate with disconnected tools that create blind spots, duplication, and slow response times.",
          solution:
            "A modular system model that connects front-facing visibility with back-office operations in one delivery pattern.",
          role: "System modeling, workflow design, technical architecture, and delivery strategy.",
          businessValue:
            "Makes it easier to scope repeatable digital transformation offers for service businesses and SMEs.",
          techStack: [
            "Admin workflows",
            "Dashboards",
            "Automation logic",
            "Analytics",
            "Portal thinking",
          ],
          caseStudyPath: "/portfolio/custom-business-os",
        },
      ],
    },
    experience: {
      eyebrow: "Professional journey",
      title:
        "A path shaped by hands-on building, training, independent delivery, and business reality",
      description:
        "The goal is not to look impressive on paper. It is to become useful in the room when a business needs someone who can think, design, and build.",
      items: [
        {
          stage: "Current role",
          title: "Founder",
          organization: "teChia Digital Solutions",
          summary:
            "Leads the technical direction, product thinking, delivery standards, and business transformation mission behind teChia.",
          highlights: [
            "Premium websites and digital systems",
            "Automation and AI-ready product thinking",
            "Business-first client delivery",
          ],
        },
        {
          stage: "Industry experience",
          title: "Full-Stack Developer",
          organization: "Blue Window Cameroon Ltd",
          summary:
            "Contributed as a professional developer within a structured company environment, sharpening delivery discipline and practical engineering habits.",
          highlights: [
            "Team-based implementation",
            "Real-world delivery expectations",
            "Professional software workflow",
          ],
        },
        {
          stage: "Independent delivery",
          title: "Freelance Full-Stack Developer",
          organization: "Client and concept work",
          summary:
            "Worked across business websites, system concepts, and product ideas with a focus on clarity, trust, and usable workflows.",
          highlights: [
            "Direct client understanding",
            "Rapid problem framing",
            "Custom product execution",
          ],
        },
        {
          stage: "Technical instruction",
          title: "Programming Instructor and Technical Mentor",
          organization: "Rebase Code Camp",
          summary:
            "Taught junior developers programming fundamentals, problem-solving methods, data structures and algorithms, and interview preparation within a structured learning environment.",
          highlights: [
            "Programming fundamentals and problem solving",
            "Data structures and algorithms",
            "Interview preparation and technical mentorship",
          ],
        },
        {
          stage: "Client delivery",
          title: "Software Delivery Contributor",
          organization: "Rebase Solutions",
          summary:
            "Worked on real client projects and helped deliver useful software solutions with attention to detail, implementation quality, and practical business value.",
          highlights: [
            "Real-world client delivery",
            "Attention to detail in implementation",
            "Collaborative solution building",
          ],
        },
        {
          stage: "Mentorship and review",
          title: "Student Mentor and Professional Code Reviewer",
          organization: "Microverse Inc.",
          summary:
            "Supported developers in training through structured mentorship, code reviews, technical feedback, and professional guidance that strengthened engineering habits and interview readiness.",
          highlights: [
            "Code review discipline",
            "Developer mentorship",
            "Professional growth support",
          ],
        },
        {
          stage: "Continuous growth",
          title: "Open-source and bounty-based development",
          organization: "Independent contribution practice",
          summary:
            "Used contribution-oriented work to keep sharpening implementation quality, debugging habits, and code-reading speed.",
          highlights: [
            "Problem-solving under constraints",
            "Learning through real codebases",
            "Sharper review and debugging instincts",
          ],
        },
      ],
    },
    principles: {
      eyebrow: "Operating philosophy",
      title: "How Chia and teChia approach digital products",
      description:
        "The strongest systems are not the ones with the most features. They are the ones that stay clear, useful, and reliable as the business grows.",
      items: [
        {
          title: "Business-first technology",
          description:
            "Every technical choice should support a business goal, not exist for its own sake.",
          icon: "briefcase",
        },
        {
          title: "Clean and scalable architecture",
          description:
            "Build clearly now so the product can evolve without accumulating hidden fragility.",
          icon: "layers",
        },
        {
          title: "SEO-conscious implementation",
          description:
            "Visibility, metadata, structure, and page performance are part of the build from the start.",
          icon: "search",
        },
        {
          title: "Security and privacy by default",
          description:
            "Inputs, access, and user data should be handled with discipline even in early-stage products.",
          icon: "shield",
        },
        {
          title: "Mobile-first user experience",
          description:
            "Many users first experience the product on a phone, so clarity cannot be desktop-only.",
          icon: "smartphone",
        },
        {
          title: "Automation where it saves real time",
          description:
            "Automate the repeatable friction points that slow teams down and weaken follow-up.",
          icon: "workflow",
        },
        {
          title: "AI where it creates real value",
          description:
            "Use AI to improve guidance, speed, and decision support where it genuinely helps.",
          icon: "sparkles",
        },
        {
          title: "Honest communication",
          description:
            "Clear expectations and truthful positioning create better collaboration and stronger trust.",
          icon: "message",
        },
        {
          title: "Long-term maintainability",
          description:
            "A useful product should remain understandable to improve, debug, and extend later.",
          icon: "wrench",
        },
      ],
    },
    testimonials: {
      eyebrow: "Testimonials",
      title: "References and collaboration feedback",
      placeholder:
        "Client and collaborator testimonials will be added here as teChia continues to grow its project portfolio.",
    },
    download: {
      title: "Preview & Download Founder CV",
      body: "For partnerships, collaborations, technical opportunities, or project evaluation, preview Chia’s CV directly in your browser — covering his technical background, project focus, and teChia’s digital transformation mission. Download it directly from the preview.",
      cta: "Preview CV",
      placeholderNote: "",
    },
    finalCta: {
      eyebrow: "Build with teChia",
      title: "Want to build something practical, beautiful, and useful?",
      body: "Whether you need a premium website, a dashboard, a client portal, automation, or a complete business operating system, teChia Digital Solutions can help you turn your idea into a reliable digital product.",
      primaryCta: "Start a Project",
      secondaryCta: "Explore teChia Solutions",
      tertiaryCta: "Contact Chia",
    },
  },
  fr: {
    pageTitle: "Rencontrez le Fondateur",
    metadata: {
      title:
        "Rencontrez le Fondateur | Chia Carlyle | teChia Digital Solutions",
      description:
        "Découvrez Chia Carlyle, développeur full-stack, créateur de systèmes numériques et fondateur de teChia Digital Solutions. Explorez son portfolio, ses compétences, son histoire, ses recommandations LinkedIn et son approche orientée business pour créer des sites web, tableaux de bord, automatisations et systèmes numériques.",
    },
    title:
      "Développeur Full-Stack, Créateur de Systèmes Numériques et Fondateur de teChia Digital Solutions",
    hero: {
      badge: "Profil fondateur",
      headline:
        "Bonjour, je suis Chia Carlyle. Je crée des systèmes numériques qui aident les entreprises à travailler plus intelligemment.",
      subtext:
        "Je suis développeur full-stack et fondateur de teChia Digital Solutions. Je conçois des sites web premium, des systèmes de gestion, des tableaux de bord, des outils d’automatisation et des solutions alimentées par l’IA pour les entreprises locales et internationales.",
      positioning:
        "Exécution technique, vision produit et clarté business réunies dans un seul partenaire de livraison.",
      primaryCta: "Voir Mes Projets",
      secondaryCta: "Travailler avec teChia",
      downloadCta: "Aperçu & Téléchargement du CV Fondateur",
      linkedinCta: "Me Contacter sur LinkedIn",
      githubCta: "Voir GitHub",
      trustHighlights: [
        "Sites web premium",
        "Tableaux de bord et portails",
        "Systèmes prêts pour l’automatisation",
        "Outils assistés par l’IA",
        "Implémentation pensée pour le SEO",
        "Vision locale, qualité internationale",
      ],
    },
    snapshot: {
      eyebrow: "Vue d’ensemble",
      title:
        "Une crédibilité technique construite autour de résultats business concrets",
      description:
        "Cette page montre le créateur derrière teChia : sa logique d’ingénierie, ses réflexes produit et son orientation business.",
      items: [
        {
          title: "Expérience en développement full-stack",
          detail:
            "Frontend moderne, logique backend, modèles de données, authentification et livraison prête pour la production.",
          icon: "code",
        },
        {
          title: "Systèmes métiers et tableaux de bord",
          detail:
            "Workflows admin, dossiers clients, portails, devis, réservations et visibilité opérationnelle.",
          icon: "layout",
        },
        {
          title: "Ingénierie orientée business",
          detail:
            "Des choix techniques guidés par la vitesse, la clarté, la maintenabilité et l’usage réel.",
          icon: "briefcase",
        },
        {
          title: "Vision locale + internationale",
          detail:
            "Pensé pour les réalités africaines tout en répondant aux standards de clients et partenaires globaux.",
          icon: "globe",
        },
        {
          title: "Sites, systèmes, automatisation, IA",
          detail:
            "Une approche connectée qui traite présence digitale, opérations et croissance comme un seul système.",
          icon: "sparkles",
        },
      ],
    },
    summary: {
      eyebrow: "À propos de Chia",
      title:
        "Un créateur focalisé sur la transformation de processus dispersés en systèmes numériques structurés",
      body: [
        "Chia Carlyle est un développeur full-stack et créateur de systèmes numériques basé au Cameroun. À travers teChia Digital Solutions, il aide les entreprises à passer de processus manuels dispersés à des plateformes numériques structurées qui améliorent leur visibilité, leur organisation, leur service client et leur croissance.",
        "Son travail se concentre sur des solutions technologiques pratiques, élégantes et orientées business : sites web premium, tableaux de bord, systèmes de gestion, automatisations, outils alimentés par l’IA et expériences numériques conçues pour résoudre de vrais problèmes.",
      ],
      highlights: [
        "Basé au Cameroun, avec une livraison pensée pour les entreprises locales et les clients internationaux",
        "Associe implémentation technique, réflexion produit et logique opérationnelle",
        "Privilégie des systèmes propres à une complexité inutile",
        "Construit pour la confiance, la rapidité, la maintenabilité et la valeur mesurable",
      ],
    },
    story: {
      title: "Pourquoi j’ai créé teChia Digital Solutions",
      body: "J’ai créé teChia Digital Solutions parce que beaucoup d’entreprises autour de moi dépendent encore de messages WhatsApp dispersés, de documents papier, de fichiers Excel, d’une faible visibilité en ligne et de processus manuels. Je crois qu’une technologie simple, bien conçue et adaptée peut aider ces entreprises à devenir plus professionnelles, mieux servir leurs clients, gagner du temps et se développer au-delà de leurs limites locales.",
      painPoints: [
        "Une communication WhatsApp dispersée sans workflow central",
        "Des documents papier et fichiers Excel qui ralentissent les décisions et le suivi",
        "Une faible visibilité en ligne qui fait paraître de bonnes entreprises plus petites qu’elles ne le sont",
      ],
    },
    skills: {
      eyebrow: "Compétences techniques",
      title:
        "Une stack orientée produit, pensée pour la crédibilité, la rapidité et la livraison durable",
      description:
        "Ces capacités reflètent les systèmes que Chia construit le plus souvent : sites publics premium, outils internes structurés, tableaux de bord opérationnels, pages de croissance et couches d’automatisation qui retirent le travail répétitif.",
      categories: [
        {
          id: "frontend",
          title: "Frontend",
          description:
            "Des interfaces responsive, premium et agréables à utiliser sur mobile, tablette et desktop.",
          value:
            "La qualité de présentation compte, car la confiance se gagne souvent avant le premier échange.",
          icon: "frontend",
          items: [
            "Next.js",
            "React",
            "TypeScript",
            "Tailwind CSS",
            "Responsive UI",
            "Animations",
          ],
        },
        {
          id: "backend",
          title: "Backend",
          description:
            "Logique applicative, validation, sécurité et structures de données pour des produits fiables.",
          value:
            "Le frontend ne paraît vraiment premium que si le backend est stable, prévisible et évolutif.",
          icon: "backend",
          items: [
            "Node.js",
            "API Routes",
            "Prisma",
            "PostgreSQL",
            "Authentication",
            "Server-side validation",
          ],
        },
        {
          id: "systems",
          title: "Systèmes Métiers",
          description:
            "Des couches métier sur mesure conçues autour du fonctionnement réel d’une entreprise.",
          value:
            "De bons systèmes réduisent la confusion, accélèrent la réponse et améliorent la responsabilité des équipes.",
          icon: "systems",
          items: [
            "Admin dashboards",
            "CRM-style systems",
            "Booking systems",
            "Quote systems",
            "Client portals",
            "Content management systems",
          ],
        },
        {
          id: "growth",
          title: "Croissance & SEO",
          description:
            "Visibilité organique, landing pages, analytics et métadonnées pour soutenir la découverte et la conversion.",
          value:
            "Un site ne doit pas seulement être beau. Il doit aussi être trouvable, mesurable et prêt à convertir.",
          icon: "growth",
          items: [
            "SEO architecture",
            "Google Analytics",
            "Google Ads landing pages",
            "Metadata",
            "Structured data",
            "Performance optimization",
          ],
        },
        {
          id: "ai",
          title: "IA & Automatisation",
          description:
            "Assistants utiles, déclencheurs métier, formulaires intelligents et outils internes qui font gagner du temps.",
          value:
            "L’automatisation compte surtout lorsqu’elle enlève une vraie friction au lieu d’ajouter de la nouveauté.",
          icon: "ai",
          items: [
            "AI assistants",
            "Workflow automation",
            "Smart forms",
            "Email notifications",
            "Lead capture systems",
            "Internal business tools",
          ],
        },
        {
          id: "tools",
          title: "Outils & Déploiement",
          description:
            "Des workflows modernes pour livrer, itérer, gérer les assets, envoyer des emails et héberger en production.",
          value:
            "La fiabilité du déploiement et la discipline de travail font partie de la qualité produit.",
          icon: "tools",
          items: [
            "GitHub",
            "Vercel",
            "Resend",
            "Cloudinary",
            "PostgreSQL tools",
            "Modern development workflows",
          ],
        },
      ],
    },
    projects: {
      eyebrow: "Projets sélectionnés",
      title:
        "Des projets qui montrent l’étendue technique, la réflexion produit et le style de livraison",
      description:
        "Certaines entrées sont des réalisations orientées client, d’autres sont des produits internes, des modèles réutilisables ou des concepts stratégiques. Les labels restent volontairement précis pour garder un portfolio honnête.",
      caseStudyCta: "Voir l’Étude de Cas",
      buildSimilarCta: "Créer Quelque Chose de Similaire",
      items: [
        {
          slug: "job-seeker-os",
          name: "Job Seeker OS",
          category: "Application en production",
          description:
            "Une plateforme orientée carrière pour aider les chercheurs d’emploi à organiser leurs candidatures, améliorer leurs supports professionnels et gérer leur recherche.",
          problem:
            "Les chercheurs d’emploi gèrent souvent candidatures, CV et suivis dans des notes, fichiers et emails dispersés.",
          solution:
            "Une plateforme structurée avec des workflows organisés, plus de visibilité et un parcours utilisateur plus intentionnel.",
          role: "Stratégie produit, direction UX, implémentation full-stack et architecture système.",
          businessValue:
            "Montre comment teChia peut transformer un workflow désordonné en système numérique guidé.",
          techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Auth"],
          caseStudyPath: "/portfolio/job-seeker-os",
        },
        {
          slug: "teloh-global-business",
          name: "Teloh Global Business",
          category: "Projet client",
          description:
            "Un concept de digitalisation multi-service combinant site d’entreprise, présentation des services, contenu administrable, structure multilingue et potentiel futur de tableau de bord.",
          problem:
            "Une entreprise multi-service a besoin de clarté, de crédibilité et d’espace pour grandir sans paraître fragmentée en ligne.",
          solution:
            "Une présence premium avec message structuré, architecture de contenu évolutive et voies opérationnelles prêtes pour l’avenir.",
          role: "Architecture web, implémentation UI, structure de localisation et stratégie de présentation business.",
          businessValue:
            "Améliore la crédibilité digitale tout en préparant le terrain pour des systèmes plus avancés.",
          techStack: ["Next.js", "TypeScript", "Tailwind CSS", "SEO metadata"],
          caseStudyPath: "/portfolio/teloh-global-business",
        },
        {
          slug: "teloh-global-travels",
          name: "Teloh Global Travels",
          category: "Projet client",
          description:
            "Un concept de plateforme digitale pour le conseil voyage, centré sur la crédibilité, la capture de demandes, la structure de contenu et de futurs workflows de service.",
          problem:
            "Les cabinets de voyage ont besoin d’une architecture d’information rassurante et d’une meilleure capture des demandes.",
          solution:
            "Une plateforme premium qui clarifie les services tout en préparant des workflows plus profonds.",
          role: "Stratégie digitale, structure UX, delivery frontend et mise en page orientée croissance.",
          businessValue:
            "Montre comment les marques voyage et conseil peuvent mieux convertir leur crédibilité en leads qualifiés.",
          techStack: [
            "Next.js",
            "Localized routing",
            "Structured content",
            "Lead capture",
          ],
          caseStudyPath: "/portfolio/teloh-global-travels",
        },
        {
          slug: "mentora",
          name: "Mentor@",
          category: "Prototype",
          description:
            "Un concept de plateforme de coaching mindset et d’orientation de carrière alimenté par l’IA pour étudiants, diplômés et personnes en reconversion.",
          problem:
            "Beaucoup d’étudiants et de jeunes professionnels manquent d’un accompagnement structuré et accessible en continu.",
          solution:
            "Un prototype qui combine logique de mentorat, parcours de coaching et guidance assistée par l’IA.",
          role: "Conception de concept, architecture produit, direction des workflows IA et stratégie d’interface.",
          businessValue:
            "Illustre la capacité de teChia à cadrer l’IA autour d’un résultat pratique et non autour de la nouveauté seule.",
          techStack: [
            "Next.js",
            "AI workflow patterns",
            "Prompt-assisted UX",
            "Dashboard concepts",
          ],
          caseStudyPath: "/portfolio/mentora",
        },
        {
          slug: "mickey-car-sales",
          name: "Mickey Car Sales",
          category: "Concept",
          description:
            "Un concept de site automobile premium pour présenter véhicules, pièces, demandes et services liés à l’international.",
          problem:
            "Les entreprises automobiles s’appuient souvent sur des listings informels et une présentation incohérente qui affaiblissent la confiance.",
          solution:
            "Un concept plus haut de gamme avec une meilleure présentation produit, un meilleur flux de demande et un positionnement plus clair.",
          role: "Direction visuelle, architecture de l’information et planification d’interface orientée conversion.",
          businessValue:
            "Démontre comment teChia peut élever des entreprises pilotées par catalogue vers une image plus premium.",
          techStack: [
            "Responsive UI",
            "Inventory-style layouts",
            "Lead capture",
            "Brand presentation",
          ],
          caseStudyPath: "/portfolio/mickey-car-sales",
        },
        {
          slug: "techia-digital-solutions",
          name: "teChia Digital Solutions",
          category: "Produit interne",
          description:
            "La maison digitale officielle de teChia, conçue pour démontrer sites premium, systèmes numériques, automatisations, outils IA et systèmes d’exploitation business.",
          problem:
            "Un studio technologique doit prouver son niveau à travers son propre produit, pas seulement à travers son discours commercial.",
          solution:
            "Une plateforme bilingue et SEO-ready qui sert à la fois de présence de marque, moteur de leads, portfolio et vitrine système.",
          role: "Traduction de la marque en produit, implémentation full-stack, architecture de contenu et stratégie de conversion.",
          businessValue:
            "Fonctionne à la fois comme site marketing et comme démonstration vivante du niveau de qualité de teChia.",
          techStack: [
            "Next.js App Router",
            "TypeScript",
            "Tailwind CSS",
            "Structured data",
            "Analytics",
          ],
          caseStudyPath: "/portfolio/techia-digital-solutions",
        },
        {
          slug: "custom-business-os",
          name: "Custom Business OS Concept",
          category: "Concept",
          description:
            "Un modèle réutilisable combinant site public, dashboard admin, dossiers clients, gestion de devis, automatisation de workflow et analytics.",
          problem:
            "Beaucoup d’entreprises en croissance fonctionnent avec des outils déconnectés qui créent lenteur, duplication et angles morts.",
          solution:
            "Un modèle modulaire qui relie visibilité externe et opérations internes dans une même logique de livraison.",
          role: "Modélisation système, design de workflow, architecture technique et stratégie de livraison.",
          businessValue:
            "Facilite la création d’offres de transformation digitale répétables pour PME et entreprises de services.",
          techStack: [
            "Admin workflows",
            "Dashboards",
            "Automation logic",
            "Analytics",
            "Portal thinking",
          ],
          caseStudyPath: "/portfolio/custom-business-os",
        },
      ],
    },
    experience: {
      eyebrow: "Parcours professionnel",
      title:
        "Un parcours façonné par la construction concrète, la formation, l’indépendance et la réalité business",
      description:
        "L’objectif n’est pas d’avoir un profil impressionnant sur papier. L’objectif est d’être utile quand une entreprise a besoin de quelqu’un qui sait penser, concevoir et construire.",
      items: [
        {
          stage: "Rôle actuel",
          title: "Fondateur",
          organization: "teChia Digital Solutions",
          summary:
            "Porte la direction technique, la réflexion produit, les standards de livraison et la mission de transformation numérique de teChia.",
          highlights: [
            "Sites premium et systèmes numériques",
            "Réflexion produit orientée automatisation et IA",
            "Livraison pensée business",
          ],
        },
        {
          stage: "Expérience en entreprise",
          title: "Développeur Full-Stack",
          organization: "Blue Window Cameroon Ltd",
          summary:
            "A contribué comme développeur au sein d’un environnement structuré, en renforçant rigueur de livraison et habitudes d’ingénierie concrètes.",
          highlights: [
            "Implémentation en équipe",
            "Exigences réelles de production",
            "Workflow logiciel professionnel",
          ],
        },
        {
          stage: "Livraison indépendante",
          title: "Développeur Full-Stack Freelance",
          organization: "Travaux clients et concepts",
          summary:
            "A travaillé sur des sites business, des concepts système et des idées produit avec un focus sur la clarté, la confiance et des workflows utiles.",
          highlights: [
            "Compréhension directe du client",
            "Cadrage rapide des problèmes",
            "Exécution produit sur mesure",
          ],
        },
        {
          stage: "Instruction technique",
          title: "Formateur en programmation et mentor technique",
          organization: "Rebase Code Camp",
          summary:
            "A formé de jeunes développeurs aux bases de la programmation, aux méthodes de résolution de problèmes, aux structures de données, aux algorithmes et à la préparation aux entretiens techniques.",
          highlights: [
            "Bases de la programmation et résolution de problèmes",
            "Structures de données et algorithmes",
            "Préparation aux entretiens et mentorat technique",
          ],
        },
        {
          stage: "Livraison client",
          title: "Contributeur en livraison logicielle",
          organization: "Rebase Solutions",
          summary:
            "A travaillé sur des projets concrets pour de vrais clients et a contribué à livrer des solutions logicielles utiles avec rigueur, sens du détail et valeur pratique pour le business.",
          highlights: [
            "Livraison sur projets réels",
            "Souci du détail dans l’implémentation",
            "Construction de solutions en équipe",
          ],
        },
        {
          stage: "Mentorat et revue",
          title: "Mentor d’étudiants et relecteur de code professionnel",
          organization: "Microverse Inc.",
          summary:
            "A accompagné des développeurs en formation grâce à un mentorat structuré, des revues de code, des retours techniques et un accompagnement professionnel renforçant les habitudes d’ingénierie et la préparation aux entretiens.",
          highlights: [
            "Discipline de revue de code",
            "Mentorat développeur",
            "Accompagnement vers la progression professionnelle",
          ],
        },
        {
          stage: "Progression continue",
          title: "Développement open-source et orienté bounty",
          organization: "Pratique de contribution indépendante",
          summary:
            "A utilisé le travail de contribution pour renforcer qualité d’implémentation, capacité de debug et vitesse de lecture de code.",
          highlights: [
            "Résolution de problèmes sous contraintes",
            "Apprentissage sur de vrais codebases",
            "Réflexes de revue et de debug plus solides",
          ],
        },
      ],
    },
    principles: {
      eyebrow: "Philosophie de travail",
      title: "Comment Chia et teChia abordent les produits numériques",
      description:
        "Les meilleurs systèmes ne sont pas ceux qui ont le plus de fonctionnalités. Ce sont ceux qui restent clairs, utiles et fiables pendant la croissance.",
      items: [
        {
          title: "Technologie orientée business",
          description:
            "Chaque choix technique doit servir un objectif business concret.",
          icon: "briefcase",
        },
        {
          title: "Architecture propre et scalable",
          description:
            "Construire clairement dès maintenant pour mieux évoluer ensuite.",
          icon: "layers",
        },
        {
          title: "Implémentation pensée SEO",
          description:
            "Visibilité, structure, métadonnées et performance font partie du build.",
          icon: "search",
        },
        {
          title: "Sécurité et confidentialité par défaut",
          description:
            "Les accès, entrées et données utilisateurs doivent être traités avec rigueur.",
          icon: "shield",
        },
        {
          title: "Expérience mobile-first",
          description:
            "Pour beaucoup d’utilisateurs, le premier contact se fait sur téléphone.",
          icon: "smartphone",
        },
        {
          title: "Automatisation là où elle fait gagner du temps",
          description:
            "Automatiser les points de friction répétitifs qui ralentissent les équipes.",
          icon: "workflow",
        },
        {
          title: "IA là où elle crée une vraie valeur",
          description:
            "Utiliser l’IA pour guider, accélérer ou assister quand elle aide réellement.",
          icon: "sparkles",
        },
        {
          title: "Communication honnête",
          description:
            "Des attentes claires et un positionnement vrai créent une meilleure collaboration.",
          icon: "message",
        },
        {
          title: "Maintenabilité long terme",
          description:
            "Un bon produit doit rester lisible pour évoluer, corriger et améliorer.",
          icon: "wrench",
        },
      ],
    },
    testimonials: {
      eyebrow: "Témoignages",
      title: "Références et retours de collaboration",
      placeholder:
        "Les témoignages de clients et collaborateurs seront ajoutés ici au fur et à mesure que teChia développe son portfolio de projets.",
    },
    download: {
      title: "Aperçu & Téléchargement du CV Fondateur",
      body: "Pour les partenariats, collaborations, opportunités techniques ou évaluations de projet, prévisualisez le CV de Chia directement dans votre navigateur — couvrant son parcours technique, ses domaines de travail et la mission de transformation numérique de teChia. Téléchargez-le directement depuis l'aperçu.",
      cta: "Aperçu du CV",
      placeholderNote: "",
    },
    finalCta: {
      eyebrow: "Construire avec teChia",
      title: "Vous voulez créer quelque chose de pratique, beau et utile ?",
      body: "Que vous ayez besoin d’un site web premium, d’un tableau de bord, d’un portail client, d’une automatisation ou d’un système métier complet, teChia Digital Solutions peut vous aider à transformer votre idée en produit numérique fiable.",
      primaryCta: "Démarrer un Projet",
      secondaryCta: "Explorer les Solutions teChia",
      tertiaryCta: "Contacter Chia",
    },
  },
} satisfies Record<Locale, FounderContent>;

export function getFounderContent(locale: Locale) {
  return founderContent[locale];
}

export function getFounderLinks(locale: Locale) {
  return {
    portfolioHref: getLocalizedSectionHref(
      locale,
      "/about",
      mergedPageAnchors.about.portfolio,
    ),
    projectHref: getLocalizedHref(locale, "/start-project"),
    solutionsHref: getLocalizedSectionHref(
      locale,
      "/services",
      mergedPageAnchors.services.solutions,
    ),
    contactHref: getLocalizedHref(locale, "/contact"),
    linkedinHref: founderLinks.linkedin,
    githubHref: GITHUB_URL || siteConfig.socials.github,
    downloadHref: founderLinks.resumeDownload,
    hasDirectCvDownload: false,
    usesCompanyGithubFallback: false,
  };
}
