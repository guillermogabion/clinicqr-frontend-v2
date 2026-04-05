import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FlaskConical, FileText, QrCode,
  LogOut, Menu, ChevronRight, Bell, Settings, UserCog, Crown
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ROLE_COLORS: Record<string, string> = {
  ORG_ADMIN: 'bg-purple-100 text-purple-700',
  DOCTOR: 'bg-blue-100 text-blue-700',
  LAB_TECH: 'bg-green-100 text-green-700',
  PATIENT: 'bg-orange-100 text-orange-700',
  SUPER_ADMIN: 'bg-amber-100 text-amber-700',
};

const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: 'Admin', DOCTOR: 'Doctor', LAB_TECH: 'Lab Tech',
  PATIENT: 'Patient', SUPER_ADMIN: 'Super Admin',
};

export default function MainLayout() {
  const { user, logout, unreadCount, isSuperAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const org = user?.organization;
  const brandColor = org?.primaryColor || '#0d87f5';

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, roles: ['ORG_ADMIN', 'DOCTOR', 'LAB_TECH'] },
    { to: '/patients', label: 'Patients', icon: Users, exact: false, roles: ['DOCTOR', 'LAB_TECH'] },
    { to: '/prescriptions', label: 'Prescriptions', icon: FileText, exact: false, roles: ['DOCTOR', 'LAB_TECH'] },
    { to: '/results', label: 'Lab Results', icon: FlaskConical, exact: false, roles: ['DOCTOR', 'LAB_TECH'] },
    { to: '/users', label: 'User Accounts', icon: UserCog, exact: false, roles: ['ORG_ADMIN'] },
    { to: '/settings', label: 'Settings', icon: Settings, exact: false, roles: ['ORG_ADMIN'] },
    ...(isSuperAdmin ? [{ to: '/superadmin', label: 'Super Admin', icon: Crown, exact: false, roles: ['SUPER_ADMIN'] }] : []),
  ].filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0
      `}>
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          {org?.logoUrl ? (
            <img src={`${API_URL}${org.logoUrl}`} alt={org.name} className="w-9 h-9 rounded-lg object-contain flex-shrink-0 border border-slate-100" />
          ) : (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandColor }}>
              <QrCode className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-slate-900 leading-tight truncate">{isSuperAdmin ? 'ClinicQR' : org?.name || 'ClinicQR'}</p>
            <p className="text-xs text-slate-400">{isSuperAdmin ? 'Platform Admin' : 'Lab Result System'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: brandColor } : {}}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {label}
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unreadCount}</span>
                  )}
                  {isActive && label !== 'Notifications' && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{ backgroundColor: brandColor }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[user?.role || 'LAB_TECH']}`}>
                {ROLE_LABELS[user?.role || 'LAB_TECH']}
              </span>
            </div>
            <button onClick={logout} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 lg:px-6 print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 lg:hidden">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <NavLink to="/notifications"
              className={({ isActive }) =>
                `relative p-2 rounded-lg transition-colors ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`
              }>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
