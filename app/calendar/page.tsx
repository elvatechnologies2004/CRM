import { CalendarPageClient } from "@/components/activities/calendar-page-client";
import { meetingMocks } from "@/lib/mock-meetings";
import { taskMocks } from "@/lib/mock-tasks";

export default function CalendarPage() {
  return (
    <CalendarPageClient initialTasks={taskMocks} initialMeetings={meetingMocks} />
  );
}