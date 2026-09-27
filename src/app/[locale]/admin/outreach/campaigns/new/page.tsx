import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getOutreachActor } from "@/lib/outreach/auth";
import { createMetadata } from "@/lib/seo";
import { OutreachCampaignForm } from "@/components/admin/outreach/outreach-campaign-form";
import { OutreachPanel } from "@/components/admin/outreach/outreach-ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "New outreach campaign",
      description: "Create a teChia SME outreach campaign.",
      path: "/admin/outreach/campaigns/new",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function NewOutreachCampaignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canManage && actor.roleLevel < 100)) notFound();

  return (
    <OutreachPanel>
      <h2 className="text-lg font-semibold">New campaign</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        Campaigns start in draft with human approval required. Nothing is discovered and nothing is sent until the
        campaign is active and the global send switch is armed.
      </p>
      <div className="mt-5">
        <OutreachCampaignForm />
      </div>
    </OutreachPanel>
  );
}
