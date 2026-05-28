"use client";

import { buttonVariants } from "@/components/site/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
          <div className="elevated-panel max-w-lg p-8">
            <p className="eyebrow justify-center">Erreur d’application</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold text-foreground">Une erreur est survenue</h1>
            <p className="mt-3 text-muted">Veuillez réessayer. L’application protège les détails techniques sensibles.</p>
            <button className={`${buttonVariants({ variant: "primary", size: "lg" })} mt-6`} type="button" onClick={() => reset()}>
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
