import type { TrackedOrder } from "@/lib/orderStatus";

export type RunningTabData = {
  sessionId: string;
  cabinNumber: number;
  cabinLabel: string;
  confirmedTotal: number;
  pendingTotal: number;
  orders: TrackedOrder[];
};

export type CabinDashboardCard = {
  cabinNumber: number;
  cabinLabel: string;
  session: {
    id: string;
    status: string;
    checkedInAt: string;
  } | null;
  confirmedTotal: number;
  pendingTotal: number;
  orderCount: number;
};

export type SessionDetailData = {
  session: {
    id: string;
    cabinNumber: number;
    cabinLabel: string;
    status: string;
    checkedInAt: string;
    checkedOutAt: string | null;
    closedTotal: number | null;
  };
  confirmedTotal: number;
  pendingTotal: number;
  orders: TrackedOrder[];
  guestCount: number;
};
