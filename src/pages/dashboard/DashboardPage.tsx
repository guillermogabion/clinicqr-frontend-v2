import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FlaskConical, FileText, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { dashboardService } from '../../services';
import type { DashboardStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TEST_TYPE_LABELS: Record<string, string> = {
  CBC: 'Complete Blood Count', XRAY: 'X-Ray', STOOL: 'Stool Test',
  URINE: 'Urine Test', URINALYSIS: 'Urinalysis', BLOOD_CHEM: 'Blood Chemistry', OTHER: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge bg-yellow-100 text-yellow-700',
  SENT_TO_LAB: 'badge bg-blue-100 text-blue-700',
  COMPLETED: 'badge bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then(setData)
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  );

  const stats = data?.stats;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening in your clinic today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients ?? 0} color="blue" />
        <StatCard icon={FlaskConical} label="Lab Results" value={stats?.totalResults ?? 0} color="green" />
        <StatCard icon={FileText} label="Prescriptions" value={stats?.totalPrescriptions ?? 0} color="purple" />
        <StatCard icon={Clock} label="Pending" value={stats?.pendingPrescriptions ?? 0} color="yellow" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Lab Results</h2>
            <Link to="/results" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.recentResults?.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No results yet.</p>
            )}
            {data?.recentResults?.map(r => (
              <Link
                key={r.id}
                to={`/results/${r.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{r.patient?.name}</p>
                  <p className="text-xs text-slate-400">{TEST_TYPE_LABELS[r.testType] || r.testType}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Recent Prescriptions</h2>
            <Link to="/prescriptions" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.recentPrescriptions?.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No prescriptions yet.</p>
            )}
            {data?.recentPrescriptions?.map(p => (
              <Link
                key={p.id}
                to={`/prescriptions/${p.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{p.patient?.name}</p>
                  <p className="text-xs text-slate-400">{p.testRequests?.length} test(s) requested</p>
                </div>
                <span className={STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
