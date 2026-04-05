import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, FlaskConical, FileText, CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { qrService } from '../../services';
import type { QRScanResult, LabResult, Prescription } from '../../types';

export default function ScanPage() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<QRScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('No QR token provided'); setLoading(false); return; }
    qrService.scan(token)
      .then(setResult)
      .catch(() => setError('QR code not found or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
        <p className="text-slate-500">Reading QR code...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card p-8 max-w-sm w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="font-bold text-slate-900 text-lg mb-2">QR Not Found</h2>
        <p className="text-slate-500 text-sm">{error}</p>
        <Link to="/login" className="btn-primary mt-5 inline-flex">Go to Login</Link>
      </div>
    </div>
  );

  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur rounded-2xl mb-3">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ClinicQR</h1>
          <p className="text-brand-200 text-sm">Lab Result System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {result.type === 'LAB_RESULT' ? (
            <LabResultView data={result.data as LabResult} />
          ) : (
            <PrescriptionView data={result.data as Prescription} />
          )}
        </div>

        <p className="text-center text-brand-300 text-xs mt-4">
          This is a digitally verified result from ClinicQR System
        </p>
      </div>
    </div>
  );
}

function LabResultView({ data }: { data: LabResult }) {
  const resultData = typeof data.resultData === 'string' ? JSON.parse(data.resultData) : data.resultData;

  return (
    <>
      <div className="bg-green-50 px-5 py-4 border-b border-green-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Lab Result</p>
          <p className="text-sm text-slate-500">{data.resultNo} · {data.testType}</p>
        </div>
        {data.printedAt && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle size={12} /> Printed
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ScanInfoBlock label="Patient" value={data.patient?.name || '—'} />
          <ScanInfoBlock label="Patient No." value={data.patient?.patientNo || '—'} />
          <ScanInfoBlock label="Lab Tech" value={data.labTech?.name || '—'} />
          <ScanInfoBlock label="Date" value={new Date(data.createdAt).toLocaleDateString('en-PH', { dateStyle: 'long' })} />
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Results</div>
          <div className="divide-y divide-slate-100">
            {Object.entries(resultData).map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                <span className="font-medium text-slate-900">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>

        {data.notes && (
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="text-xs font-medium text-slate-400 mb-1">NOTES</p>
            {data.notes}
          </div>
        )}
      </div>
    </>
  );
}

function PrescriptionView({ data }: { data: Prescription }) {
  return (
    <>
      <div className="bg-purple-50 px-5 py-4 border-b border-purple-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Prescription / Lab Request</p>
          <p className="text-sm text-slate-500">{data.prescNo}</p>
        </div>
        <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${
          data.status === 'COMPLETED' ? 'bg-green-100 text-green-700'
          : data.status === 'SENT_TO_LAB' ? 'bg-blue-100 text-blue-700'
          : 'bg-yellow-100 text-yellow-700'
        }`}>{data.status.replace('_', ' ')}</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ScanInfoBlock label="Patient" value={data.patient?.name || '—'} />
          <ScanInfoBlock label="Patient No." value={data.patient?.patientNo || '—'} />
          <ScanInfoBlock label="Requesting Doctor" value={data.doctor?.name || '—'} />
          <ScanInfoBlock label="Date" value={new Date(data.createdAt).toLocaleDateString('en-PH', { dateStyle: 'long' })} />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tests Requested</p>
          <div className="space-y-2">
            {data.testRequests?.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm">
                <FlaskConical size={14} className="text-brand-500" />
                <span className="font-medium">{t.testType.replace('_', ' ')}</span>
                {t.instructions && <span className="text-slate-400 text-xs">· {t.instructions}</span>}
              </div>
            ))}
          </div>
        </div>

        {data.notes && (
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="text-xs font-medium text-slate-400 mb-1">DOCTOR'S NOTES</p>
            {data.notes}
          </div>
        )}
      </div>
    </>
  );
}

function ScanInfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-900 text-sm mt-0.5">{value}</p>
    </div>
  );
}
