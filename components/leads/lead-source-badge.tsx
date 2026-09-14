import {
  Camera,
  CircleHelp,
  ContactRound,
  Globe,
  Link,
  Mail,
  MessageCircle,
  Phone,
  ThumbsUp,
  UserPlus,
} from "lucide-react";

import type { LeadSourceOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const sourceIcons: Record<LeadSourceOption, React.ReactNode> = {
  Website: <Globe className="h-3.5 w-3.5" aria-hidden />,
  WhatsApp: <MessageCircle className="h-3.5 w-3.5" aria-hidden />,
  LinkedIn: <Link className="h-3.5 w-3.5" aria-hidden />,
  Facebook: <ThumbsUp className="h-3.5 w-3.5" aria-hidden />,
  Instagram: <Camera className="h-3.5 w-3.5" aria-hidden />,
  Referral: <UserPlus className="h-3.5 w-3.5" aria-hidden />,
  Email: <Mail className="h-3.5 w-3.5" aria-hidden />,
  "Cold Call": <Phone className="h-3.5 w-3.5" aria-hidden />,
  Manual: <ContactRound className="h-3.5 w-3.5" aria-hidden />,
  Other: <CircleHelp className="h-3.5 w-3.5" aria-hidden />,
};

interface LeadSourceBadgeProps {
  source: LeadSourceOption;
  className?: string;
}

function LeadSourceBadge({ source, className }: LeadSourceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] text-muted-foreground",
        className
      )}
    >
      <span className="text-muted-foreground/70">{sourceIcons[source]}</span>
      {source}
    </span>
  );
}

export { LeadSourceBadge, sourceIcons };