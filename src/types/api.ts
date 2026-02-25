export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalProspects: number;
  emailsSent: number;
  pending: number;
  noEmail: number;
  sendRate: number;
  bySector: Record<string, { total: number; sent: number }>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  name: string;
  status: string;
  sector: string;
  timestamp: string;
}
