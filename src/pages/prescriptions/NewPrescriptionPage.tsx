import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { prescriptionService, patientService } from '../../services';
import type { Patient } from '../../types';
import toast from 'react-hot-toast';

const TEST_TYPES = ['CBC', 'XRAY', 'STOOL', 'URINE', 'URINALYSIS', 'BLOOD_CHEM', 'OTHER'];

export default function NewPrescriptionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(params.get('patientId') || '');
  const [notes, setNotes] = useState('');
  const [tests, setTests] = useState([{ testType: 'CBC', instructions: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { patientService.getAll().then(setPatients); }, []);

  const addTest = () => setTests(t => [...t, { testType: 'CBC', instructions: '' }]);
  const removeTest = (i: number) => setTests(t => t.filter((_, idx) => idx !== i));
  const updateTest = (i: number, k: 'testType' | 'instructions', v: string) => {
    setTests(t => t.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error('Select a patient'); return; }
    setLoading(true);
    try {
      const rx = await prescriptionService.create({ patientId, notes, testRequests: tests });
      toast.success('Prescription created with QR code!');
      navigate(`/prescriptions/${rx.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/prescriptions" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Prescription</h1>
          <p className="text-sm text-slate-500">Request lab tests for a patient</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)} required>
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patientNo})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Doctor's Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Clinical notes or remarks..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Requested Tests</h2>
            <button type="button" onClick={addTest} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Add Test
            </button>
          </div>
          <div className="space-y-3">
            {tests.map((test, i) => (
              <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <select className="input" value={test.testType} onChange={e => updateTest(i, 'testType', e.target.value)}>
                    {TEST_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                  <input
                    className="input"
                    placeholder="Special instructions (optional)"
                    value={test.instructions}
                    onChange={e => updateTest(i, 'instructions', e.target.value)}
                  />
                </div>
                {tests.length > 1 && (
                  <button type="button" onClick={() => removeTest(i)} className="p-2 text-slate-400 hover:text-red-500 mt-0.5">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/prescriptions" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {loading ? 'Creating...' : 'Create Prescription & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  );
}
