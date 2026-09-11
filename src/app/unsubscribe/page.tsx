import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { unsubscribeFromNewsletter } from "@/lib/newsletter/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribed | teChia Growth Brief",
  description:
    "Confirmation that you have unsubscribed from the teChia Growth Brief.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawEmail = params.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;

  if (email) {
    await unsubscribeFromNewsletter({ email });
  }

  return (
    <main id="main-content" className="container py-16 md:py-24">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="size-7" />
        </div>
        <p className="eyebrow mt-6">Newsletter</p>
        <h1 className="mt-4 text-balance text-3xl font-semibold text-primary md:text-5xl">
          You have successfully unsubscribed from the teChia Growth Brief.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted">
          You will no longer receive teChia Growth Brief newsletter sends. If
          this was a mistake, you can subscribe again from the website footer.
        </p>
        <Link href="/" className="btn-primary mt-8 px-5 py-3">
          Return to teChia
        </Link>
      </section>
    </main>
  );
}
