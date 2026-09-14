import { MeetingsPageClient } from "@/components/activities/meetings-page-client";
import { meetingMocks } from "@/lib/mock-meetings";
import { leadOwners } from "@/lib/mock-leads";

export default function MeetingsPage() {
  const ownerNames = leadOwners.map((owner) => owner.name);
  return (
    <MeetingsPageClient initialMeetings={meetingMocks} owners={ownerNames} />
  );
}