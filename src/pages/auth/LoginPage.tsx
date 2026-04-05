import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, Eye, EyeOff, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showSlug, setShowSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgChoices, setOrgChoices] = useState<{ slug: string; name: string }[]>([]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss(); // Clear any "stuck" toasts

    try {
      const result = await login(email, password, slug || undefined);

      if (result?.multiOrg) {
        setOrgChoices(result.orgs);
        return;
      }

      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      console.error("Caught error:", err);

      // Robust error message detection
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Invalid email or password"; // Fallback so it doesn't "blink" silently

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSelect = async (selectedSlug: string) => {
    setLoading(true);
    toast.dismiss();

    try {
      await login(email, password, selectedSlug);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'Organization login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fill = (e: string, p: string, s = '') => { setEmail(e); setPassword(p); setSlug(s); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ClinicQR</h1>
          <p className="text-brand-200 mt-1">Lab Result Management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {orgChoices.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Select your organization</h2>
              <div className="space-y-2">
                {orgChoices.map(org => (
                  <button key={org.slug} onClick={() => handleOrgSelect(org.slug)}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-colors text-left">
                    <Building2 size={18} className="text-brand-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{org.name}</p>
                      <p className="text-xs text-slate-400">{org.slug}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setOrgChoices([])} className="mt-4 text-sm text-slate-400 hover:text-slate-600">← Back</button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Sign in to your account</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className="input" placeholder="you@clinic.com"
                    value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input pr-10"
                      placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {showSlug && (
                  <div>
                    <label className="label">Organization slug <span className="text-slate-400 font-normal">(optional)</span></label>
                    <input className="input" placeholder="e.g. st-lukes"
                      value={slug} onChange={e => setSlug(e.target.value)} />
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setShowSlug(s => !s)}
                    className="text-slate-400 hover:text-slate-600">
                    {showSlug ? 'Hide org field' : 'Have an org slug?'}
                  </button>
                  <Link to="/forgot-password" className="text-brand-600 hover:text-brand-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-600 font-medium hover:underline">Register your clinic</Link>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Dev quick-fill (For Demo Use)</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Admin', e: 'admin@clinic.com', p: 'password123', s: '' },
                    { label: 'Doctor', e: 'doctor@clinic.com', p: 'password123', s: '' },
                    { label: 'Lab Tech', e: 'lab@clinic.com', p: 'password123', s: '' },
                  ].map(({ label, e, p, s }) => (
                    <button key={label} type="button" onClick={() => fill(e, p, s)}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
