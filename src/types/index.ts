export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'DOCTOR' | 'LAB_TECH' | 'PATIENT';

export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  plan: Plan;
  planExpiresAt?: string;
  isActive: boolean;
  maxUsers: number;
  maxPatients: number;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
  _count?: { users: number; patients: number };
}
export interface QRScanResult {
  type: 'LAB_RESULT' | 'PRESCRIPTION' | 'RESULT'; // 🚩 Add 'LAB_RESULT' here
  id: string;
  token?: string;
  status?: string;
  data?: any; // 🚩 Add this to fix the second error
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startedAt: string;
  expiresAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  organization?: Pick<Organization, 'id' | 'name' | 'slug' | 'logoUrl' | 'primaryColor' | 'plan'>;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Patient {
  id: string;
  patientNo: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  contact?: string;
  address?: string;
  organizationId: string;
  doctorId?: string;
  doctor?: { id: string; name: string };
  createdAt: string;
  _count?: { labResults: number; prescriptions: number };
}

export type TestType = 'CBC' | 'XRAY' | 'STOOL' | 'URINE' | 'URINALYSIS' | 'BLOOD_CHEM' | 'OTHER';

export interface TestRequest {
  id: string;
  testType: TestType;
  instructions?: string;
  prescriptionId: string;
}

export type PrescriptionStatus = 'PENDING' | 'SENT_TO_LAB' | 'COMPLETED';

export interface Prescription {
  id: string;
  prescNo: string;
  qrCode?: string;
  qrToken?: string;
  notes?: string;
  status: PrescriptionStatus;
  patientId: string;
  patient?: Pick<Patient, 'id' | 'name' | 'patientNo'>;
  doctorId: string;
  doctor?: { id: string; name: string };
  testRequests: TestRequest[];
  createdAt: string;
  updatedAt: string;
  _count?: { labResults: number };
}

export interface LabResult {
  id: string;
  resultNo: string;
  testType: TestType;
  resultData: Record<string, string | number>;
  notes?: string;
  qrCode?: string;
  qrToken?: string;
  printedAt?: string;
  patientId: string;
  patient?: Pick<Patient, 'id' | 'name' | 'patientNo'>;
  labTechId: string;
  labTech?: { id: string; name: string };
  prescriptionId?: string;
  prescription?: Prescription;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'RESULT_READY' | 'PRESCRIPTION_CREATED' | 'STATUS_UPDATED' | 'SYSTEM';
  title: string;
  body: string;
  data?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  patientName?: string;
  message?: string;
}

export interface DashboardStats {
  stats: {
    totalPatients: number;
    totalResults: number;
    totalPrescriptions: number;
    pendingPrescriptions: number;
  };
  recentResults: LabResult[];
  recentPrescriptions: Prescription[];
}

export interface OrgUsage {
  userCount: number;
  patientCount: number;
  resultCount: number;
  rxCount: number;
  limits: { users: number; patients: number };
  plan: Plan;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const PLAN_DETAILS: Record<Plan, { label: string; price: number; color: string; features: string[] }> = {
  FREE: { label: 'Free', price: 0, color: 'slate', features: ['5 users', '100 patients', 'QR results', 'Basic dashboard'] },
  STARTER: { label: 'Starter', price: 499, color: 'blue', features: ['20 users', '500 patients', 'Email notifications', 'Logo upload'] },
  PRO: { label: 'Pro', price: 999, color: 'purple', features: ['100 users', '5,000 patients', 'Push notifications', 'Priority support'] },
  ENTERPRISE: { label: 'Enterprise', price: 2499, color: 'gold', features: ['Unlimited users', 'Unlimited patients', 'Custom branding', 'Dedicated support'] },
};
