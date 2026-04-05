import { useState, useEffect, FormEvent } from 'react';
import { UserPlus, Trash2, Eye, EyeOff, Loader2, ShieldCheck, Stethoscope, FlaskConical } from 'lucide-react';
import api from '../../services/api';
import type { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', DOCTOR: 'Doctor', LAB_TECH: 'Lab Tech', PATIENT: 'Patient',
};
const ROLE_COLORS: Record<string, string> = {
  ORG_ADMIN: 'badge bg-purple-100 text-purple-700',
  DOCTOR: 'badge bg-blue-100 text-blue-700',
  LAB_TECH: 'badge bg-green-100 text-green-700',
  PATIENT: 'badge bg-orange-100 text-orange-700',
};
const ROLE_ICONS: Record<string, any> = {
  ADMIN: ShieldCheck, DOCTOR: Stethoscope, LAB_TECH: FlaskConical,
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'DOCTOR' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterRole, setFilterRole] = useState('');

  const load = () => {
    setLoading(true);
    api.get<User[]>('/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', form);
      toast.success(`${ROLE_LABELS[form.role]} account created!`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      setUsers(u => u.filter(x => x.id !== id));
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage doctors, lab techs, and admins</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">New User Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" placeholder="e.g. Dr. Maria Santos" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="DOCTOR">Doctor</option>
                  <option value="LAB_TECH">Lab Tech</option>
                  <option value="ORG_ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="user@clinic.com" value={form.email}
                  onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'ADMIN', 'DOCTOR', 'LAB_TECH'].map(r => (
          <button key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filterRole === r
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
            {r ? ROLE_LABELS[r] : 'All'}
          </button>
        ))}
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No users found.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {filtered.map(u => {
            const Icon = ROLE_ICONS[u.role];
            const isMe = u.id === currentUser?.id;
            return (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-semibold text-slate-600 text-sm">{u.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    {isMe && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">You</span>}
                  </div>
                  <p className="text-sm text-slate-400">{u.email}</p>
                </div>
                <span className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</span>
                {!isMe && (
                  <button onClick={() => handleDelete(u.id, u.name)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
