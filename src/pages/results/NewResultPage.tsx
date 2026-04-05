import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { resultService, patientService } from '../../services';
import type { Patient } from '../../types';
import toast from 'react-hot-toast';

const TEST_TEMPLATES: Record<string, Record<string, string>> = {
  CBC: { WBC: '', RBC: '', Hemoglobin: '', Hematocrit: '', Platelets: '' },
  URINALYSIS: { Color: '', Clarity: '', pH: '', Protein: '', Glucose: '', WBC: '', RBC: '' },
  STOOL: { Color: '', Consistency: '', WBC: '', RBC: '', Parasites: '' },
  BLOOD_CHEM: { Glucose: '', Creatinine: '', Uric_Acid: '', Cholesterol: '', Triglycerides: '' },
  XRAY: { Findings: '', Impression: '' },
  OTHER: { Result: '' },
};

export default function NewResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(params.get('patientId') || '');
  const [testType, setTestType] = useState('CBC');
  const [fields, setFields] = useState<{ key: string; value: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    patientService.getAll().then(setPatients);
  }, []);

  useEffect(() => {
    const template = TEST_TEMPLATES[testType] || {};
    setFields(Object.entries(template).map(([key, value]) => ({ key, value })));
  }, [testType]);

  const addField = () => setFields(f => [...f, { key: '', value: '' }]);
  const removeField = (i: number) => setFields(f => f.filter((_, idx) => idx !== i));
  const updateField = (i: number, k: 'key' | 'value', v: string) => {
    setFields(f => f.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) { toast.error('Select a patient'); return; }

    const resultData: Record<string, string> = {};
    for (const { key, value } of fields) {
      if (key.trim()) resultData[key.trim()] = value;
    }

    setLoading(true);
    try {
      const result = await resultService.create({ patientId, testType, resultData, notes });
      toast.success('Lab result saved with QR code!');
      navigate(`/results/${result.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/results" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Lab Result</h1>
          <p className="text-sm text-slate-500">Fill in the test result values</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" value={patientId} onChange={e => setPatientId(e.target.value)} required>
              <option value="">Select patient...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.patientNo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Test Type *</label>
            <select className="input" value={testType} onChange={e => setTestType(e.target.value)}>
              {Object.keys(TEST_TEMPLATES).map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Result Values</h2>
            <button type="button" onClick={addField} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Add Field
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Parameter name"
                  value={field.key}
                  onChange={e => updateField(i, 'key', e.target.value)}
                />
                <input
                  className="input flex-1"
                  placeholder="Value"
                  value={field.value}
                  onChange={e => updateField(i, 'value', e.target.value)}
                />
                <button type="button" onClick={() => removeField(i)} className="p-2 text-slate-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <label className="label">Notes / Remarks</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Additional observations or remarks..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/results" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save Result & Generate QR'}
          </button>
        </div>
      </form>
    </div>
  );
}
