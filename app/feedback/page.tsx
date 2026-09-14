import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Send feedback</h1>
        <p className="text-sm text-muted-foreground">
          Report a bug, request a feature, or tell us what to improve.
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}