import type { Metadata } from "next";

import { ForbiddenState } from "@/components/admin/forbidden-state";

export const metadata: Metadata = {
  title: "Forbidden",
  description: "You do not have permission to view this page",
};

export default function AdminForbiddenPage() {
  return (
    <ForbiddenState
      title="Forbidden"
      description="Your platform role does not grant access to this section. Ask a Super Admin to adjust your platform permissions."
    />
  );
}