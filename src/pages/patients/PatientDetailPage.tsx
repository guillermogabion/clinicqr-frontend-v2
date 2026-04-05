import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, FileText, Phone, MapPin, Loader2 } from 'lucide-react';
import { patientService } from '../../services';
import type { Patient } from '../../types';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'badge bg-yellow-100 text-yellow-700',
  SENT_TO_LAB:'badge bg-blue-100 text-blue-700',
  COMPLETED:  'badge bg-green-100 text-green-700',
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    patientService.getOne(id)
      .then(setPatient)
      .catch(() => toast.error('Failed to load patient'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>;
  if (!patient) return <div className="p-6 text-slate-500">Patient not found.</div>;

  const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/patients" className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
          <p className="text-sm text-slate-500">{patient.patientNo}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Info card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mx-auto">
            <span className="text-2xl font-bold text-brand-700">{patient.name.charAt(0)}</span>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900">{patient.name}</p>
            <p className="text-sm text-slate-500">{patient.gender} · {age} years old</p>
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2 text-sm">
            <InfoRow label="Patient No." value={patient.patientNo} />
            <InfoRow label="Date of Birth" value={new Date(patient.dateOfBirth).toLocaleDateString('en-PH')} />
            <InfoRow label="Doctor" value={patient.doctor ? `Dr. ${patient.doctor.name}` : '—'} />
            {patient.contact && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={13} className="text-slate-400" />
                <span>{patient.contact}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={13} className="text-slate-400" />
                <span>{patient.address}</span>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <Link to={`/prescriptions/new?patientId=${patient.id}`} className="btn-primary flex-1 justify-center text-xs py-2">
              <FileText size={13} /> New Rx
            </Link>
            <Link to={`/results/new?patientId=${patient.id}`} className="btn-secondary flex-1 justify-center text-xs py-2">
              <FlaskConical size={13} /> Add Result
            </Link>
          </div>
        </div>

        {/* Tabs content */}
        <div className="md:col-span-2 space-y-5">
          {/* Lab Results */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Lab Results</h2>
              <Link to={`/results?patientId=${patient.id}`} className="text-xs text-brand-600">View all</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(patient as any).labResults?.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">No lab results yet.</p>
              )}
              {(patient as any).labResults?.map((r: any) => (
                <Link key={r.id} to={`/results/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-sm">
                  <FlaskConical size={14} className="text-green-500 flex-shrink-0" />
                  <span className="flex-1 text-slate-700">{r.testType}</span>
                  <span className="text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-PH')}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Prescriptions */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Prescriptions</h2>
              <Link to={`/prescriptions?patientId=${patient.id}`} className="text-xs text-brand-600">View all</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(patient as any).prescriptions?.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">No prescriptions yet.</p>
              )}
              {(patient as any).prescriptions?.map((p: any) => (
                <Link key={p.id} to={`/prescriptions/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 text-sm">
                  <FileText size={14} className="text-purple-500 flex-shrink-0" />
                  <span className="flex-1 text-slate-700">{p.prescNo}</span>
                  <span className={STATUS_COLORS[p.status]}>{p.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  );
}
