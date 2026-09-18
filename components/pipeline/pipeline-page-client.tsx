export function PipelinePageClient({ initialDeals = [] }: { initialDeals?: unknown[] }) {
  void initialDeals;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Pipeline reset</h1>
      <p className="text-sm text-muted-foreground">
        The legacy pipeline UI has been retired to keep the dashboard and shared CRM record flow intact.
      </p>
    </main>
  );
}
