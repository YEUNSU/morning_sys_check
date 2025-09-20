export type Schedule = Map<number, { member: string | null; isHoliday: boolean; holidayName?: string; isOverridden?: boolean }>;

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
}

export interface Member {
  id: string;
  name: string;
  group: '운영' | '기획';
  email: string;
  phone: string;
}

export interface ChangeLogEntry {
  timestamp: string; // ISO 8601 format
  description: string;
}

export type CheckStatus = 'CompletedNormal' | 'CompletedWithIssues';

export interface CheckResult {
    status: CheckStatus;
    checklist: {
        [key: number]: {
            status: 'default' | 'issue';
            note: string;
        }
    };
    timestamp: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
}