import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, QrCode, FlaskConical, Loader2, CheckCircle } from 'lucide-react';
import { prescriptionService } from '../../services';
import type { Prescription } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge bg-yellow-100 text-yellow-700',
  SENT_TO_LAB: 'badge bg-blue-100 text-blue-700',
  COMPLETED: 'badge bg-green-100 text-green-700',
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'SENT_TO_LAB',
  SENT_TO_LAB: 'COMPLETED',
};

const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Mark as Sent to Lab',
  SENT_TO_LAB: 'Mark as Completed',
};

export default function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const canUpdateStatus = ['ORG_ADMIN', 'DOCTOR', 'LAB_TECH'].includes(user?.role || '');

  useEffect(() => {
    if (!id) return;
    prescriptionService.getOne(id)
      .then(setPrescription)
      .catch(() => toast.error('Failed to load prescription'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!prescription || !id) return;
    const next = NEXT_STATUS[prescription.status];
    if (!next) return;
    setUpdating(true);
    try {
      const updated = await prescriptionService.updateStatus(id, next);
      setPrescription(prev => prev ? { ...prev, status: updated.status } : prev);
      toast.success(`Status updated to ${next.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>;
  if (!prescription) return <div className="p-6 text-slate-500">Prescription not found.</div>;

  const results = (prescription as any).labResults || [];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/prescriptions" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{prescription.prescNo}</h1>
            <p className="text-sm text-slate-500">Prescription</p>
          </div>
        </div>
        <span className={STATUS_COLORS[prescription.status]}>{prescription.status.replace('_', ' ')}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left: QR + Status */}
        <div className="space-y-4">
          {/* QR Code */}
          <div className="card p-4 text-center">
            {prescription.qrCode ? (
              <>
                <img src={prescription.qrCode} alt="QR Code" className="w-40 h-40 mx-auto" />
                <p className="text-xs text-slate-400 mt-2">Scan to view details</p>
                <p className="text-xs font-mono text-slate-300 mt-1 truncate">{prescription.qrToken}</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-4 text-slate-400">
                <QrCode size={40} />
                <p className="text-sm">No QR code</p>
              </div>
            )}
          </div>

          {/* Status action */}
          {canUpdateStatus && NEXT_STATUS[prescription.status] && (
            <button onClick={handleUpdateStatus} disabled={updating} className="btn-primary w-full justify-center">
              {updating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {NEXT_LABEL[prescription.status]}
            </button>
          )}

          <Link
            to={`/results/new?patientId=${prescription.patientId}&prescriptionId=${prescription.id}`}
            className="btn-secondary w-full justify-center text-sm"
          >
            <FlaskConical size={14} /> Add Lab Result
          </Link>
        </div>

        {/* Right: Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Patient & Doctor */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-slate-900 text-sm">Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Patient</p>
                <Link to={`/patients/${prescription.patientId}`} className="font-medium text-brand-600 hover:underline">
                  {prescription.patient?.name}
                </Link>
                <p className="text-xs text-slate-400">{prescription.patient?.patientNo}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Doctor</p>
                <p className="font-medium text-slate-900">{prescription.doctor?.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Date</p>
                <p className="font-medium text-slate-900">{new Date(prescription.createdAt).toLocaleDateString('en-PH', { dateStyle: 'long' })}</p>
              </div>
            </div>
            {prescription.notes && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{prescription.notes}</p>
              </div>
            )}
          </div>

          {/* Requested tests */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">Requested Tests</h2>
            <div className="space-y-2">
              {prescription.testRequests?.map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                  <FlaskConical size={14} className="text-brand-500 flex-shrink-0" />
                  <span className="font-medium text-slate-900">{t.testType.replace('_', ' ')}</span>
                  {t.instructions && <span className="text-slate-400 text-xs">· {t.instructions}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Completed Results */}
          {results.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-3">Lab Results</h2>
              <div className="space-y-2">
                {results.map((r: any) => (
                  <Link key={r.id} to={`/results/${r.id}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg text-sm hover:bg-green-100 transition-colors">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span className="font-medium text-slate-900">{r.testType}</span>
                    <span className="text-slate-400 text-xs ml-auto">{r.resultNo}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
