import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, QrCode, Loader2, Download } from 'lucide-react';
import { resultService } from '../../services';
import type { LabResult } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [result, setResult] = useState<LabResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  const canPrint = ['ORG_ADMIN', 'LAB_TECH'].includes(user?.role || '');

  useEffect(() => {
    if (!id) return;
    resultService.getOne(id)
      .then(setResult)
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkPrinted = async () => {
    if (!id) return;
    setPrinting(true);
    try {
      const updated = await resultService.markPrinted(id);
      setResult(updated);
      toast.success('Marked as printed');
    } catch {
      toast.error('Failed to mark as printed');
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintWindow = () => {
    window.print();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>;
  if (!result) return <div className="p-6 text-slate-500">Result not found.</div>;

  const data = typeof result.resultData === 'string' ? JSON.parse(result.resultData) : result.resultData;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 print:p-0">
      {/* Header — hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/results" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{result.resultNo}</h1>
            <p className="text-sm text-slate-500">{result.testType} result</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canPrint && !result.printedAt && (
            <button onClick={handleMarkPrinted} disabled={printing} className="btn-secondary">
              {printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              Mark Printed
            </button>
          )}
          <button onClick={handlePrintWindow} className="btn-primary">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Printable result card */}
      <div className="card p-6 print:shadow-none print:border-0">
        {/* Clinic header */}
        <div className="flex items-start justify-between mb-6 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-brand-700">ClinicQR Medical Center</h2>
            <p className="text-sm text-slate-500">Laboratory Department</p>
            <p className="text-xs text-slate-400 mt-1">Cebu City, Philippines</p>
          </div>
          {result.qrCode && (
            <div className="text-center">
              <img src={result.qrCode} alt="QR Code" className="w-24 h-24" />
              <p className="text-xs text-slate-400 mt-1">Scan for digital copy</p>
            </div>
          )}
        </div>

        {/* Patient info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoBlock label="Patient Name" value={result.patient?.name || '—'} />
          <InfoBlock label="Patient No." value={result.patient?.patientNo || '—'} />
          <InfoBlock label="Result No." value={result.resultNo} />
          <InfoBlock label="Test Type" value={result.testType} />
          <InfoBlock label="Lab Technician" value={result.labTech?.name || '—'} />
          <InfoBlock label="Date" value={new Date(result.createdAt).toLocaleDateString('en-PH', { dateStyle: 'long' })} />
        </div>

        {/* Results table */}
        <div className="mb-5">
          <h3 className="font-semibold text-slate-900 mb-3">Test Results</h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-slate-600 font-medium">Parameter</th>
                  <th className="text-left px-4 py-2.5 text-slate-600 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(data).map(([key, val]) => (
                  <tr key={key}>
                    <td className="px-4 py-2.5 text-slate-600 capitalize">{key.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {result.notes && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 mb-1">NOTES</p>
            <p className="text-sm text-slate-700">{result.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-end">
          <div>
            <p className="text-xs text-slate-400">Verified by</p>
            <p className="text-sm font-medium text-slate-700 mt-4 border-t border-slate-300 pt-1 pr-16">{result.labTech?.name}</p>
          </div>
          {result.printedAt && (
            <p className="text-xs text-slate-400">Printed: {new Date(result.printedAt).toLocaleDateString('en-PH')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}
