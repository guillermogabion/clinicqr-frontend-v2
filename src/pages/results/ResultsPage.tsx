import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FlaskConical, Search, ChevronRight, Printer, Loader2 } from 'lucide-react';
import { resultService } from '../../services';
import type { LabResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TEST_LABELS: Record<string, string> = {
  CBC: 'CBC', XRAY: 'X-Ray', STOOL: 'Stool', URINE: 'Urine',
  URINALYSIS: 'Urinalysis', BLOOD_CHEM: 'Blood Chem', OTHER: 'Other',
};

export default function ResultsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [results, setResults] = useState<LabResult[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const canCreate = ['ADMIN', 'LAB_TECH'].includes(user?.role || '');
  const patientId = params.get('patientId') || undefined;

  const load = (s = '') => {
    setLoading(true);
    resultService.getAll({ search: s, patientId })
      .then(setResults)
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lab Results</h1>
          <p className="text-slate-500 text-sm mt-0.5">{results.length} result(s)</p>
        </div>
        {canCreate && (
          <Link to={`/results/new${patientId ? `?patientId=${patientId}` : ''}`} className="btn-primary">
            <Plus size={16} /> New Result
          </Link>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="input pl-9" placeholder="Search by result no. or patient..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
      ) : results.length === 0 ? (
        <div className="card p-12 text-center">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No lab results found.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {results.map(r => (
            <Link key={r.id} to={`/results/${r.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={16} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{r.patient?.name}</p>
                <p className="text-sm text-slate-400">{r.resultNo} · {TEST_LABELS[r.testType] || r.testType}</p>
              </div>
              <div className="text-right hidden sm:block">
                {r.printedAt
                  ? <span className="badge bg-green-100 text-green-700 flex items-center gap-1"><Printer size={11} /> Printed</span>
                  : <span className="badge bg-slate-100 text-slate-500">Not printed</span>}
                <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-PH')}</p>
              </div>
              <ChevronRight className="text-slate-300 flex-shrink-0" size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
