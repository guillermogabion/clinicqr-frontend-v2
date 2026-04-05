import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { patientService } from '../../services';
import api from '../../services/api';
import type { User } from '../../types';
import toast from 'react-hot-toast';

export default function NewPatientPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    contact: '',
    address: '',
    doctorId: '',
  });

  useEffect(() => {
    // Fetch doctors list for assignment
    api.get<User[]>('/users?role=DOCTOR')
      .then(r => setDoctors(r.data))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patient = await patientService.create({
        ...form,
        doctorId: form.doctorId || undefined,
      });
      toast.success('Patient added successfully!');
      navigate(`/patients/${patient.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/patients" className="btn-secondary p-2"><ArrowLeft size={16} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Add New Patient</h1>
          <p className="text-sm text-slate-500">Fill in the patient's information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">Personal Information</h2>

          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="e.g. Juan dela Cruz" value={form.name}
              onChange={e => set('name', e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth *</label>
              <input type="date" className="input" value={form.dateOfBirth}
                onChange={e => set('dateOfBirth', e.target.value)} required />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Contact Number</label>
            <input className="input" placeholder="e.g. 09171234567" value={form.contact}
              onChange={e => set('contact', e.target.value)} />
          </div>

          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="e.g. Cebu City" value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-3">Assigned Doctor</h2>
          <div>
            <label className="label">Doctor (optional)</label>
            <select className="input" value={form.doctorId} onChange={e => set('doctorId', e.target.value)}>
              <option value="">— No doctor assigned —</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/patients" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Saving...' : 'Add Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
