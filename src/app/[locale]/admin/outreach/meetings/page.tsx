import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/content/site";
import { getPrisma } from "@/lib/prisma";
import { getOutreachActor } from "@/lib/outreach/auth";
import { loadMeetings } from "@/lib/outreach/queries";
import { createMetadata } from "@/lib/seo";
import {
  OutreachEmptyState,
  OutreachPanel,
  OutreachPill,
  OutreachTable,
  OutreachTd,
  OutreachTh,
  OutreachTr,
} from "@/components/admin/outreach/outreach-ui";
import { OutreachPager, formatDateTime } from "@/components/admin/outreach/outreach-nav";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return {
    ...createMetadata({
      locale,
      title: "Outreach meetings",
      description: "Meetings booked from outreach conversations.",
      path: "/admin/outreach/meetings",
    }),
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AdminOutreachMeetingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await getOutreachActor();
  if (!actor || (!actor.canView && actor.roleLevel < 100)) notFound();

  const prisma = getPrisma();
  if (!prisma) {
    return (
      <OutreachPanel>
        <h2 className="text-2xl font-semibold">Meetings cannot load right now.</h2>
      </OutreachPanel>
    );
  }

  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const result = await loadMeetings(prisma, page);

  return (
    <div className="grid gap-5">
      <OutreachPanel>
        <h2 className="text-lg font-semibold">Meetings</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          {result.total} meeting{result.total === 1 ? "" : "s"} recorded from outreach. Recording a meeting stops the
          follow-up sequence for that prospect. If a booking provider is connected, this list is the record of what it
          reported.
        </p>

        <div className="mt-5">
          {result.rows.length === 0 ? (
            <OutreachEmptyState
              title="No meetings recorded yet"
              description="Add a meeting from a prospect page, or connect a booking provider to populate this list automatically."
            />
          ) : (
            <OutreachTable className="min-w-[860px]">
              <thead>
                <tr className="border-b border-border">
                  <OutreachTh>Prospect</OutreachTh>
                  <OutreachTh>When</OutreachTh>
                  <OutreachTh>Duration</OutreachTh>
                  <OutreachTh>Status</OutreachTh>
                  <OutreachTh>Links</OutreachTh>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((meeting) => (
                  <OutreachTr key={meeting.id}>
                    <OutreachTd>
                      <Link
                        href={`/admin/outreach/prospects/${meeting.prospect.id}`}
                        className="font-semibold text-primary hover:text-accent"
                      >
                        {meeting.prospect.businessName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">{meeting.prospect.city ?? "—"}</p>
                    </OutreachTd>
                    <OutreachTd className="whitespace-nowrap text-sm">{formatDateTime(meeting.scheduledAt)}</OutreachTd>
                    <OutreachTd className="tabular-nums text-sm text-muted">{meeting.duration} min</OutreachTd>
                    <OutreachTd>
                      <OutreachPill
                        tone={
                          meeting.status === "COMPLETED"
                            ? "good"
                            : meeting.status === "CANCELLED"
                              ? "danger"
                              : meeting.status === "NO_SHOW"
                                ? "warn"
                                : "default"
                        }
                      >
                        {meeting.status.replace(/_/g, " ").toLowerCase()}
                      </OutreachPill>
                    </OutreachTd>
                    <OutreachTd className="text-xs">
                      {meeting.meetingUrl ? (
                        <a href={meeting.meetingUrl} target="_blank" rel="noreferrer noopener" className="text-accent hover:underline">
                          Join
                        </a>
                      ) : null}
                      {meeting.bookingUrl ? (
                        <a href={meeting.bookingUrl} target="_blank" rel="noreferrer noopener" className="ml-3 text-accent hover:underline">
                          Booking
                        </a>
                      ) : null}
                      {!meeting.meetingUrl && !meeting.bookingUrl ? <span className="text-muted">—</span> : null}
                    </OutreachTd>
                  </OutreachTr>
                ))}
              </tbody>
            </OutreachTable>
          )}
        </div>

        <OutreachPager page={result.page} totalPages={result.totalPages} buildHref={(next) => `/admin/outreach/meetings?page=${next}`} />
      </OutreachPanel>

      <OutreachPanel>
        <h3 className="text-sm font-semibold">Booking integration</h3>
        <p className="mt-2 text-sm text-muted">
          The engine stores meetings in its own database abstraction and deliberately does not invent a booking vendor.
          Meetings can be entered manually from any prospect page today. If a booking provider is added later, it only
          needs to write into <code>OutreachMeeting</code> and set the prospect status to meeting booked.
        </p>
        {actor.canManage ? null : <p className="mt-2 text-xs text-muted">You have read-only access.</p>}
      </OutreachPanel>
    </div>
  );
}
