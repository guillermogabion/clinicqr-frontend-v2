import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, ChevronRight, Loader2 } from 'lucide-react';
import { patientService } from '../../services';
import type { Patient } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const canCreate = ['ORG_ADMIN', 'DOCTOR'].includes(user?.role || '');

  const load = (s = '') => {
    setLoading(true);
    patientService.getAll({ search: s })
      .then(setPatients)
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 text-sm mt-0.5">{patients.length} patient(s) found</p>
        </div>
        {canCreate && (
          <Link to="/patients/new" className="btn-primary">
            <Plus size={16} /> Add Patient
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by name or patient number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        </div>
      ) : patients.length === 0 ? (
        <div className="card p-12 text-center">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No patients found.</p>
          {canCreate && <Link to="/patients/new" className="btn-primary mt-4 inline-flex">Add First Patient</Link>}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {patients.map(p => (
            <Link
              key={p.id}
              to={`/patients/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-700 font-semibold text-sm">{p.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{p.name}</p>
                <p className="text-sm text-slate-400">{p.patientNo} · {p.gender} · {calcAge(p.dateOfBirth)} yrs</p>
              </div>
              <div className="text-right hidden sm:block">
                {p.doctor && <p className="text-xs text-slate-400">Dr. {p.doctor.name}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  {p._count?.labResults ?? 0} result(s) · {p._count?.prescriptions ?? 0} Rx
                </p>
              </div>
              <ChevronRight className="text-slate-300 flex-shrink-0" size={16} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
