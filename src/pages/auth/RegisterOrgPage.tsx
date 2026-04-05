import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { authService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
  'QR-linked lab results',
  'Multi-role access (Doctors, Lab Techs)',
  'Email notifications',
  'Custom clinic branding',
  'Free plan — no credit card needed',
];

export default function RegisterOrgPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authService.registerOrg(form);
      // Auto-login after registration
      await login(form.email, form.password);
      toast.success(`Welcome to ClinicQR! Your organization "${form.orgName}" is ready.`);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

        {/* Left panel */}
        <div className="text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-xl">ClinicQR</p>
              <p className="text-brand-200 text-sm">Lab Result Management</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">Start managing your clinic smarter</h1>
          <p className="text-brand-200 mb-8">Set up your organization in minutes. No credit card required.</p>
          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-brand-100">
                <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Create your organization</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Clinic / Organization Name *</label>
              <input className="input" placeholder="e.g. St. Luke's Medical Clinic"
                value={form.orgName} onChange={e => set('orgName', e.target.value)} required />
            </div>
            <div>
              <label className="label">Your Full Name *</label>
              <input className="input" placeholder="e.g. Dr. Maria Santos"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input type="email" className="input" placeholder="admin@yourclinic.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10"
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={e => set('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Creating...' : 'Create Organization — Free'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
