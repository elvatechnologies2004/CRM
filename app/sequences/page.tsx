import { SequencesPageClient } from "@/components/sequences/sequences-page-client";
import { sequenceMocks, enrollmentMocks } from "@/lib/mock-sequences";

export default function SequencesPage() {
  return (
    <SequencesPageClient
      initialSequences={sequenceMocks}
      initialEnrollments={enrollmentMocks}
    />
  );
}