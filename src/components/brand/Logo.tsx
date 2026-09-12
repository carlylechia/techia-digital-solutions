"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { getLocalizedHref, type Locale } from "@/content/site";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  logoAssets,
  logoIconThemeAssets,
  type BrandAsset,
  type LogoVariant,
} from "./logo-assets";

export type LogoSize = "sm" | "md" | "lg" | "xl";
export type LogoTheme = "light" | "dark" | "auto";

export type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  locale?: Locale;
  href?: string | null;
  className?: string;
  interactive?: boolean;
  priority?: boolean;
  decorative?: boolean;
  alt?: string;
};

const wideSizeClasses = {
  sm: "w-[8.5rem] sm:w-36",
  md: "w-[9.75rem] sm:w-44",
  lg: "w-[11rem] sm:w-52",
  xl: "w-[12rem] sm:w-60",
} as const satisfies Record<LogoSize, string>;

const primarySizeClasses = {
  sm: "w-24 sm:w-28",
  md: "w-32 sm:w-36",
  lg: "w-40 sm:w-44",
  xl: "w-48 sm:w-52",
} as const satisfies Record<LogoSize, string>;

const stackedSizeClasses = {
  sm: "w-[4.75rem] sm:w-20",
  md: "w-[5.5rem] sm:w-24",
  lg: "w-24 sm:w-28",
  xl: "w-32 sm:w-36",
} as const satisfies Record<LogoSize, string>;

const iconSizeClasses = {
  sm: "w-8",
  md: "w-10",
  lg: "w-12",
  xl: "w-16",
} as const satisfies Record<LogoSize, string>;

const backgroundLockupSizeClasses = {
  sm: "w-40",
  md: "w-48",
  lg: "w-56",
  xl: "w-64",
} as const satisfies Record<LogoSize, string>;

function resolveThemeAsset(
  variant: LogoVariant,
  theme: Exclude<LogoTheme, "auto">,
): BrandAsset {
  // The logo pack includes transparent dark-surface alternates for the horizontal lockup and icon mark only.
  if (variant === "horizontal") {
    return theme === "dark"
      ? logoAssets.monochromeWhite
      : logoAssets.monochromeBlack;
  }

  if (variant === "icon") {
    return theme === "dark" ? logoIconThemeAssets.dark : logoAssets.icon;
  }

  return logoAssets[variant];
}

function getSizeClass(variant: LogoVariant, size: LogoSize) {
  if (variant === "icon") return iconSizeClasses[size];
  if (variant === "stacked") return stackedSizeClasses[size];
  if (variant === "primary") return primarySizeClasses[size];
  if (variant === "dark" || variant === "light")
    return backgroundLockupSizeClasses[size];
  return wideSizeClasses[size];
}

function LogoImage({
  asset,
  alt,
  priority,
  decorative,
}: {
  asset: BrandAsset;
  alt: string;
  priority: boolean;
  decorative: boolean;
}) {
  return (
    <Image
      src={asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      unoptimized
      aria-hidden={decorative}
      className="h-auto w-full object-contain"
    />
  );
}

export function Logo({
  variant = "horizontal",
  size = "md",
  theme = "auto",
  locale,
  href,
  className,
  interactive = false,
  priority = false,
  decorative = false,
  alt = "teChia Digital Solutions",
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const resolvedHref = decorative
    ? null
    : href === undefined
      ? locale
        ? getLocalizedHref(locale)
        : "/"
      : href;
  const altText = decorative ? "" : alt;
  const imageSizeClass = getSizeClass(variant, size);
  const imageClassName = cn("block shrink-0", imageSizeClass);
  const asset = useMemo(() => {
    const activeTheme = theme === "auto" ? resolvedTheme : theme;
    return resolveThemeAsset(variant, activeTheme);
  }, [resolvedTheme, theme, variant]);

  const content = (
    <span className={cn(imageClassName, "logo-media relative z-[1]")}>
      <LogoImage
        asset={asset}
        alt={altText}
        priority={priority}
        decorative={decorative}
      />
    </span>
  );

  if (!resolvedHref) {
    return (
      <span
        className={cn(
          "logo-lockup inline-flex shrink-0 items-center",
          interactive && "logo-lockup--interactive",
          className,
        )}
        aria-hidden={decorative || undefined}
      >
        {interactive ? (
          <>
            <span aria-hidden="true" className="logo-orbit logo-orbit-one" />
            <span aria-hidden="true" className="logo-orbit logo-orbit-two" />
            <span aria-hidden="true" className="logo-orbit logo-orbit-three" />
          </>
        ) : null}
        {content}
      </span>
    );
  }

  return (
    <Link
      href={resolvedHref}
      className={cn(
        "logo-lockup inline-flex shrink-0 items-center",
        interactive && "logo-lockup--interactive",
        className,
      )}
      aria-label="teChia Digital Solutions home"
    >
      {interactive ? (
        <>
          <span aria-hidden="true" className="logo-orbit logo-orbit-one" />
          <span aria-hidden="true" className="logo-orbit logo-orbit-two" />
          <span aria-hidden="true" className="logo-orbit logo-orbit-three" />
        </>
      ) : null}
      {content}
    </Link>
  );
}
