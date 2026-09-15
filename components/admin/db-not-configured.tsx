import { DatabaseZap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function DbNotConfigured() {
  return (
    <div className="flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <DatabaseZap className="h-7 w-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-ink">Platform database not configured</h1>
            <p className="text-sm text-muted-foreground">
              The Platform Admin console requires the Supabase secret (service-role) key so it can
              read platform data. Set{" "}
              <span className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span> (or{" "}
              <span className="font-mono text-xs">SUPABASE_SECRET_KEY</span>) and{" "}
              <span className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</span> in the server
              environment (in Vercel: Project → Settings → Environment Variables), then redeploy and
              restart the dev server.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}