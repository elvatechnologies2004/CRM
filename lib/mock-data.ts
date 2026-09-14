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
  User,
} from "@/lib/types";

export const currentUser: User = {
  id: "usr_001",
  name: "Hussain Ali",
  role: "Product Manager",
  email: "hussain.ali@finlonexa.com",
};

export const kpiStats: StatCardData[] = [
  { id: "stat_1", label: "Total Leads", value: "248", change: "+12%", comparison: "vs last month" },
  { id: "stat_2", label: "Active Deals", value: "86", change: "+8%", comparison: "vs last month" },
  { id: "stat_3", label: "Expected Revenue", value: "$125,000", change: "+8%", comparison: "vs last month" },
  { id: "stat_4", label: "Won Deals", value: "24", change: "+20%", comparison: "vs last month" },
];

export const revenueData: RevenuePoint[] = [
  { month: "Jan", value: 9200 },
  { month: "Feb", value: 11800 },
  { month: "Mar", value: 10400 },
  { month: "Apr", value: 14600 },
  { month: "May", value: 17200 },
  { month: "Jun", value: 15800 },
  { month: "Jul", value: 21400 },
  { month: "Aug", value: 28600 },
  { month: "Sep", value: 36500 },
];

export const dealsByStage: DealStageOverview[] = [
  { stage: "New", count: 18, percentage: 21 },
  { stage: "Qualified", count: 24, percentage: 28 },
  { stage: "Proposal", count: 20, percentage: 23 },
  { stage: "Negotiation", count: 16, percentage: 19 },
  { stage: "Won", count: 8, percentage: 9 },
];

export const salesPerformanceData: SalesPerformancePoint[] = [
  { month: "Jan", leads: 96, deals: 42, won: 16 },
  { month: "Feb", leads: 128, deals: 58, won: 21 },
  { month: "Mar", leads: 118, deals: 52, won: 19 },
  { month: "Apr", leads: 152, deals: 66, won: 24 },
  { month: "May", leads: 174, deals: 74, won: 28 },
  { month: "Jun", leads: 161, deals: 68, won: 25 },
  { month: "Jul", leads: 198, deals: 84, won: 31 },
  { month: "Aug", leads: 224, deals: 96, won: 34 },
  { month: "Sep", leads: 248, deals: 104, won: 38 },
];

export const recentLeads: Lead[] = [
  { id: "lead_1", name: "Ahmed Khan", company: "Techno Solutions", source: "Website", score: 92, time: "2h ago" },
  { id: "lead_2", name: "Sarah Malik", company: "BrightWave", source: "LinkedIn", score: 78, time: "4h ago" },
  { id: "lead_3", name: "John Smith", company: "Nova Systems", source: "Referral", score: 88, time: "6h ago" },
  { id: "lead_4", name: "Fatima Noor", company: "GreenTech", source: "Website", score: 71, time: "1d ago" },
  { id: "lead_5", name: "Ali Raza", company: "BuildPro", source: "WhatsApp", score: 65, time: "1d ago" },
];

export const upcomingTasks: Task[] = [
  { id: "task_1", title: "Call Ahmed Khan", time: "10:00 AM", subtitle: "Techno Solutions", priority: "high", completed: false },
  { id: "task_2", title: "Send proposal", time: "11:30 AM", subtitle: "BrightWave", priority: "medium", completed: false },
  { id: "task_3", title: "Meeting with Sarah", time: "2:00 PM", subtitle: "Google Meet", priority: "high", completed: false },
  { id: "task_4", title: "Follow up with John", time: "4:00 PM", subtitle: "Nova Systems", priority: "medium", completed: false },
  { id: "task_5", title: "Review quotes", time: "5:00 PM", subtitle: "Internal", priority: "low", completed: false },
];

export const todayMeetings: Meeting[] = [
  { id: "meet_1", title: "Discovery Call", time: "10:00 AM", company: "Techno Solutions", type: "call" },
  { id: "meet_2", title: "Project Discussion", time: "12:00 PM", company: "BrightWave", type: "video" },
  { id: "meet_3", title: "Demo Meeting", time: "3:00 PM", company: "Nova Systems", type: "video" },
];

export const teamPerformance: TeamMemberPerformance[] = [
  { id: "tm_1", name: "Ali Khan", dealsWon: 12, revenue: 48000, growth: 32 },
  { id: "tm_2", name: "Sara Ahmed", dealsWon: 8, revenue: 32000, growth: 24 },
  { id: "tm_3", name: "Hussain Ali", dealsWon: 6, revenue: 28000, growth: 18 },
  { id: "tm_4", name: "Zain Malik", dealsWon: 5, revenue: 21000, growth: 12 },
];

export const dealRisks: DealRisk[] = [
  { id: "risk_1", company: "ABC Technologies", reason: "No activity for 6 days", amount: 25000, status: "red" },
  { id: "risk_2", company: "Zenix Solutions", reason: "Proposal viewed, no reply", amount: 18000, status: "orange" },
  { id: "risk_3", company: "BrightWave", reason: "Follow-up overdue", amount: 12000, status: "yellow" },
];

export const notifications: Notification[] = [
  { id: "notif_1", title: "New hot lead assigned", description: "Ahmed Khan from Techno Solutions scored 92", time: "2h ago", read: false, type: "lead" },
  { id: "notif_2", title: "Deal risk detected", description: "ABC Technologies has no activity for 6 days", time: "5h ago", read: false, type: "deal" },
  { id: "notif_3", title: "Meeting starting soon", description: "Discovery Call with Techno Solutions at 10:00 AM", time: "1h ago", read: true, type: "task" },
  { id: "notif_4", title: "Quarterly report ready", description: "Your Q3 sales report has been generated", time: "Yesterday", read: true, type: "system" },
];

export const aiQuickActions: string[] = [
  "Show my hot leads",
  "Deals likely to close this month",
  "Draft a follow-up email",
  "Generate sales report",
];