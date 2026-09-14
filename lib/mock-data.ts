import type {
  DealRisk,
  DealStageOverview,
  Lead,
  Meeting,
  Notification,
  RevenuePoint,
  SalesPerformancePoint,
  StatCardData,
  Task,
  TeamMemberPerformance,
} from "@/lib/types";

export const kpiStats: StatCardData[] = [];

export const revenueData: RevenuePoint[] = [];

export const dealsByStage: DealStageOverview[] = [];

export const salesPerformanceData: SalesPerformancePoint[] = [];

export const recentLeads: Lead[] = [];

export const upcomingTasks: Task[] = [];

export const todayMeetings: Meeting[] = [];

export const teamPerformance: TeamMemberPerformance[] = [];

export const dealRisks: DealRisk[] = [];

export const notifications: Notification[] = [];

export const aiQuickActions: string[] = [];
