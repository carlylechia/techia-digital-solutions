export type BrandAsset = {
  src: string;
  width: number;
  height: number;
};

const logoPackBasePath = "/brand/techia_logo_pack";
const svgBasePath = `${logoPackBasePath}/SVG`;
const iconBasePath = `${logoPackBasePath}/Favicons_App_Icons`;

export const logoAssets = {
  primary: {
    src: `${svgBasePath}/01-primary-logo-symbol-wordmark.svg`,
    width: 2000,
    height: 700
  },
  horizontal: {
    src: `${svgBasePath}/02-horizontal-logo.svg`,
    width: 1400,
    height: 460
  },
  stacked: {
    src: `${svgBasePath}/03-stacked-logo.svg`,
    width: 1024,
    height: 920
  },
  icon: {
    src: `${svgBasePath}/04-icon-only-nexus-mark.svg`,
    width: 1024,
    height: 1024
  },
  monochromeBlack: {
    src: `${svgBasePath}/05-monochrome-black-logo.svg`,
    width: 1400,
    height: 460
  },
  monochromeWhite: {
    src: `${svgBasePath}/06-monochrome-white-logo-transparent.svg`,
    width: 1400,
    height: 460
  },
  dark: {
    src: `${svgBasePath}/07-dark-background-logo.svg`,
    width: 1400,
    height: 500
  },
  light: {
    src: `${svgBasePath}/08-light-background-logo.svg`,
    width: 1400,
    height: 500
  }
} as const satisfies Record<string, BrandAsset>;

export type LogoVariant = keyof typeof logoAssets;

export const logoIconThemeAssets = {
  light: logoAssets.icon,
  dark: {
    src: `${svgBasePath}/04c-icon-only-white.svg`,
    width: 1024,
    height: 1024
  },
  black: {
    src: `${svgBasePath}/04b-icon-only-black.svg`,
    width: 1024,
    height: 1024
  }
} as const satisfies Record<string, BrandAsset>;

export const brandIconAssets = {
  faviconSvg: {
    src: `${svgBasePath}/09-favicon-app-icon-master.svg`,
    width: 1024,
    height: 1024
  },
  socialProfile: {
    src: `${svgBasePath}/10-social-profile-icon.svg`,
    width: 1080,
    height: 1080
  },
  faviconIco: {
    src: `${iconBasePath}/favicon.ico`
  },
  appleTouch: {
    src: `${iconBasePath}/techia-app-icon-180x180.png`,
    width: 180,
    height: 180
  },
  appIcon192: {
    src: `${iconBasePath}/techia-app-icon-192x192.png`,
    width: 192,
    height: 192
  },
  appIcon512: {
    src: `${iconBasePath}/techia-app-icon-512x512.png`,
    width: 512,
    height: 512
  }
} as const;
