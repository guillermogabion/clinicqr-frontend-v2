import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Loader2, Building2, Palette, Users, Package } from 'lucide-react';
import { orgService } from '../../services';
import type { Organization, OrgUsage } from '../../types';
import { PLAN_DETAILS } from '../../types';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [usage, setUsage] = useState<OrgUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', primaryColor: '#0d87f5' });

  useEffect(() => {
    Promise.all([orgService.getMe(), orgService.getUsage()])
      .then(([o, u]) => {
        setOrg(o);
        setUsage(u);
        setForm({ name: o.name, email: o.email || '', phone: o.phone || '', address: o.address || '', primaryColor: o.primaryColor || '#0d87f5' });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await orgService.updateMe(form);
      setOrg(updated);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { logoUrl } = await orgService.uploadLogo(file);
      setOrg(prev => prev ? { ...prev, logoUrl } : prev);
      toast.success('Logo updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Remove your organization logo?')) return;
    try {
      await orgService.deleteLogo();
      setOrg(prev => prev ? { ...prev, logoUrl: undefined } : prev);
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>;

  const plan = org?.plan || 'FREE';
  const planInfo = PLAN_DETAILS[plan];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your clinic's profile, branding, and plan.</p>
      </div>

      {/* Logo & Branding */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} className="text-brand-500" />
          <h2 className="font-semibold text-slate-900">Logo & Branding</h2>
        </div>

        <div className="flex items-start gap-6">
          {/* Logo preview */}
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 flex-shrink-0 overflow-hidden">
            {org?.logoUrl ? (
              <img src={`${API_URL}${org.logoUrl}`} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-slate-700">Organization Logo</p>
            <p className="text-xs text-slate-400">PNG, JPG, SVG or WebP. Max 5MB. Shown in sidebar, printouts, and scan page.</p>
            <div className="flex gap-2">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} className="btn-secondary text-xs py-1.5">
                {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Upload size={13} />}
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </button>
              {org?.logoUrl && (
                <button onClick={handleDeleteLogo} className="btn-secondary text-xs py-1.5 text-red-500 hover:bg-red-50 hover:border-red-200">
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Brand Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
            <input className="input flex-1 font-mono text-sm" value={form.primaryColor}
              onChange={e => set('primaryColor', e.target.value)} placeholder="#0d87f5" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Used in sidebar, QR printouts, and scan page header.</p>
        </div>
      </div>

      {/* Org Info */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={16} className="text-brand-500" />
          <h2 className="font-semibold text-slate-900">Organization Information</h2>
        </div>

        <div>
          <label className="label">Organization Name *</label>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact Email</label>
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="clinic@example.com" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(032) 123-4567" />
          </div>
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Cebu City, Philippines" />
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Plan & Usage */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-brand-500" />
            <h2 className="font-semibold text-slate-900">Plan & Usage</h2>
          </div>
          <span className={`badge text-sm font-semibold px-3 py-1 ${
            plan === 'FREE' ? 'bg-slate-100 text-slate-600' :
            plan === 'STARTER' ? 'bg-blue-100 text-blue-700' :
            plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700'
          }`}>{planInfo.label} Plan</span>
        </div>

        {usage && (
          <div className="space-y-3">
            <UsageBar label="Users" used={usage.userCount} max={usage.limits.users} />
            <UsageBar label="Patients" used={usage.patientCount} max={usage.limits.patients} />
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Your plan includes:</p>
          <ul className="space-y-1">
            {planInfo.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-500">Need more capacity?</p>
          <a href="mailto:sales@clinicqr.com" className="btn-secondary text-sm">Contact Sales</a>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min((used / max) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-brand-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-medium">{used} / {max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
