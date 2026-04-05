import { useEffect, useState } from 'react';
import {
  Building2, Users, TrendingUp, ShieldCheck, CheckCircle,
  XCircle, Loader2, Crown, ChevronDown, Search, ToggleLeft, ToggleRight
} from 'lucide-react';
import { orgService } from '../../services';
import type { Organization, Plan } from '../../types';
import { PLAN_DETAILS } from '../../types';
import toast from 'react-hot-toast';

const PLAN_BADGE: Record<Plan, string> = {
  FREE:       'bg-slate-100 text-slate-600',
  STARTER:    'bg-blue-100 text-blue-700',
  PRO:        'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
};

export default function SuperAdminDashboard() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<Plan | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    orgService.getAllOrgs()
      .then(setOrgs)
      .catch(() => toast.error('Failed to load organizations'))
      .finally(() => setLoading(false));
  }, []);

  const handlePlanChange = async (orgId: string, plan: Plan) => {
    setUpdatingId(orgId);
    try {
      await orgService.updatePlan(orgId, plan);
      setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan } : o));
      toast.success('Plan updated');
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (org: Organization) => {
    setUpdatingId(org.id);
    try {
      await orgService.updatePlan(org.id, org.plan, !org.isActive);
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, isActive: !o.isActive } : o));
      toast.success(org.isActive ? 'Organization suspended' : 'Organization activated');
    } catch {
      toast.error('Failed to toggle status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase());
    const matchPlan = !planFilter || o.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const stats = {
    total: orgs.length,
    active: orgs.filter(o => o.isActive).length,
    byPlan: {
      FREE: orgs.filter(o => o.plan === 'FREE').length,
      STARTER: orgs.filter(o => o.plan === 'STARTER').length,
      PRO: orgs.filter(o => o.plan === 'PRO').length,
      ENTERPRISE: orgs.filter(o => o.plan === 'ENTERPRISE').length,
    },
    totalUsers: orgs.reduce((s, o) => s + (o._count?.users ?? 0), 0),
    totalPatients: orgs.reduce((s, o) => s + (o._count?.patients ?? 0), 0),
    mrr: orgs.reduce((s, o) => {
      const price = PLAN_DETAILS[o.plan]?.price ?? 0;
      return s + (o.isActive ? price : 0);
    }, 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Super Admin</h1>
          <p className="text-slate-500 text-sm">Platform-wide management</p>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Total Orgs" value={stats.total} icon={Building2} color="blue" span />
        <StatCard label="Active" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard label="Users" value={stats.totalUsers} icon={Users} color="purple" />
        <StatCard label="Patients" value={stats.totalPatients} icon={Users} color="slate" />
        <StatCard label="Est. MRR" value={`₱${stats.mrr.toLocaleString()}`} icon={TrendingUp} color="amber" span />
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(stats.byPlan) as [Plan, number][]).map(([plan, count]) => (
          <div key={plan} className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{plan}</p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
            </div>
            <span className={`badge text-sm ${PLAN_BADGE[plan]}`}>{PLAN_DETAILS[plan].label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input className="input pl-9 text-sm" placeholder="Search organizations..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['', 'FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as const).map(p => (
            <button key={p} onClick={() => setPlanFilter(p as any)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                planFilter === p ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
              {p || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Orgs table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Organization</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Plan</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Users</th>
                <th className="text-center px-4 py-3 font-medium text-slate-500">Patients</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Change Plan</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No organizations found.</td></tr>
              )}
              {filtered.map(org => (
                <tr key={org.id} className={`hover:bg-slate-50 transition-colors ${!org.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img src={`http://localhost:5000${org.logoUrl}`} alt="" className="w-8 h-8 rounded-lg object-contain border border-slate-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                          <Building2 size={14} className="text-brand-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-xs text-slate-400">{org.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{org.slug}</code>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`badge ${PLAN_BADGE[org.plan]}`}>{org.plan}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-700 font-medium">
                    {org._count?.users ?? 0}
                    <span className="text-slate-300">/{org.maxUsers}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-700 font-medium">
                    {org._count?.patients ?? 0}
                    <span className="text-slate-300">/{org.maxPatients}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {org.isActive ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={13} />Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={13} />Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <select
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 pr-6 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={org.plan}
                        onChange={e => handlePlanChange(org.id, e.target.value as Plan)}
                        disabled={updatingId === org.id}
                      >
                        {(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] as Plan[]).map(p => (
                          <option key={p} value={p}>{PLAN_DETAILS[p].label} — ₱{PLAN_DETAILS[p].price}/mo</option>
                        ))}
                      </select>
                      {updatingId === org.id
                        ? <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-brand-500" />
                        : <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => handleToggleActive(org)} disabled={updatingId === org.id}
                      className={`p-1.5 rounded-lg transition-colors ${org.isActive ? 'text-green-600 hover:bg-red-50 hover:text-red-500' : 'text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
                      title={org.isActive ? 'Suspend' : 'Activate'}>
                      {org.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, span }: {
  label: string; value: string | number; icon: any; color: string; span?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600', slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className={`card p-4 ${span ? 'col-span-2' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
