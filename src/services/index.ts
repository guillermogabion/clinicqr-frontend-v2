import api from './api';
import type {
  AuthResponse, User, Patient, Prescription, LabResult,
  DashboardStats, Organization, OrgUsage, Notification
} from '../types';

export const authService = {
  registerOrg: (data: { orgName: string; email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register-org', data).then(r => r.data),
  login: (email: string, password: string, slug?: string) =>
    api.post<AuthResponse | { multiOrg: true; orgs: { slug: string; name: string }[] }>('/auth/login', { email, password, slug }).then(r => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then(r => r.data.user),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then(r => r.data),
  verifyResetToken: (token: string) =>
    api.get<{ valid: boolean }>(`/auth/verify-reset-token/${token}`).then(r => r.data),
};

export const orgService = {
  getMe: () => api.get<Organization>('/organizations/me').then(r => r.data),
  updateMe: (data: Partial<Organization>) => api.put<Organization>('/organizations/me', data).then(r => r.data),
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('logo', file);
    return api.post<{ logoUrl: string }>('/organizations/me/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
  },
  deleteLogo: () => api.delete('/organizations/me/logo').then(r => r.data),
  getUsage: () => api.get<OrgUsage>('/organizations/me/usage').then(r => r.data),
  // Super admin
  getAllOrgs: () => api.get<Organization[]>('/organizations').then(r => r.data),
  updatePlan: (id: string, plan: string, isActive?: boolean) =>
    api.put(`/organizations/${id}/plan`, { plan, isActive }).then(r => r.data),
};

export const patientService = {
  getAll: (params?: { search?: string; doctorId?: string }) =>
    api.get<Patient[]>('/patients', { params }).then(r => r.data),
  getOne: (id: string) => api.get<Patient>(`/patients/${id}`).then(r => r.data),
  create: (data: Partial<Patient>) => api.post<Patient>('/patients', data).then(r => r.data),
  update: (id: string, data: Partial<Patient>) => api.put<Patient>(`/patients/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/patients/${id}`).then(r => r.data),
};

export const resultService = {
  getAll: (params?: { patientId?: string; testType?: string; search?: string }) =>
    api.get<LabResult[]>('/results', { params }).then(r => r.data),
  getOne: (id: string) => api.get<LabResult>(`/results/${id}`).then(r => r.data),
  create: (data: any) => api.post<LabResult>('/results', data).then(r => r.data),
  markPrinted: (id: string) => api.put(`/results/${id}/print`).then(r => r.data),
};

export const prescriptionService = {
  getAll: (params?: { patientId?: string; status?: string }) =>
    api.get<Prescription[]>('/prescriptions', { params }).then(r => r.data),
  getOne: (id: string) => api.get<Prescription>(`/prescriptions/${id}`).then(r => r.data),
  create: (data: any) => api.post<Prescription>('/prescriptions', data).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.put(`/prescriptions/${id}/status`, { status }).then(r => r.data),
};

export const qrService = {
  scan: (token: string) => api.get(`/qr/scan/${token}`).then(r => r.data),
};

export const dashboardService = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
};

export const userService = {
  getAll: (params?: { role?: string }) => api.get<User[]>('/users', { params }).then(r => r.data),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<User>('/users', data).then(r => r.data),
  toggleActive: (id: string) => api.put(`/users/${id}/toggle`).then(r => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};

export const notificationService = {
  getAll: () => api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications').then(r => r.data),
  markRead: (id: string) => api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.put('/notifications/read-all').then(r => r.data),
  savePushToken: (token: any, platform = 'web') =>
    api.post('/notifications/push-token', { token, platform }).then(r => r.data),
};
