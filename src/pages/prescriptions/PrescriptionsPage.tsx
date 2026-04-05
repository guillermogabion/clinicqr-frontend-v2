import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FileText, Search, ChevronRight, Loader2 } from 'lucide-react';
import { prescriptionService } from '../../services';
import type { Prescription } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge bg-yellow-100 text-yellow-700',
  SENT_TO_LAB: 'badge bg-blue-100 text-blue-700',
  COMPLETED: 'badge bg-green-100 text-green-700',
};

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const canCreate = ['ORG_ADMIN', 'DOCTOR'].includes(user?.role || '');
  const patientId = params.get('patientId') || undefined;

  const load = (status = '') => {
    setLoading(true);
    prescriptionService.getAll({ patientId, status: status || undefined })
      .then(setPrescriptions)
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (s: string) => { setStatusFilter(s); load(s); };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{prescriptions.length} prescription(s)</p>
        </div>
        {canCreate && (
          <Link to={`/prescriptions/new${patientId ? `?patientId=${patientId}` : ''}`} className="btn-primary">
            <Plus size={16} /> New Prescription
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'SENT_TO_LAB', 'COMPLETED'].map(s => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${statusFilter === s
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
      ) : prescriptions.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No prescriptions found.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {prescriptions.map(p => (
            <Link key={p.id} to={`/prescriptions/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{p.patient?.name}</p>
                <p className="text-sm text-slate-400">
                  {p.prescNo} · {p.testRequests?.length ?? 0} test(s) · Dr. {p.doctor?.name}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <span className={STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</span>
                <p className="text-xs text-slate-400 mt-1">{new Date(p.createdAt).toLocaleDateString('en-PH')}</p>
              </div>
              <ChevronRight className="text-slate-300 flex-shrink-0" size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
