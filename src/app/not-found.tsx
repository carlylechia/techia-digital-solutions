import Link from "next/link";
import { buttonVariants } from "@/components/site/button";

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div className="elevated-panel max-w-lg p-8">
        <p className="eyebrow justify-center">404</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold text-foreground">Page introuvable / Page not found</h1>
        <p className="mt-3 text-muted">La page recherchée n’existe pas ou a été déplacée.</p>
        <Link href="/" className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-6`}>
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
