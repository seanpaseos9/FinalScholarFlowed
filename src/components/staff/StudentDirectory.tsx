import React, { useMemo, useState } from 'react';
import { Search, X, GraduationCap, Mail, Phone, Users as UsersIcon, FileText } from 'lucide-react';
import { Application, UserProfile, ApplicationStatus } from '../../types';
import { StandardPagination } from '../common/StandardPagination';

const PAGE_SIZE = 15;

const STATUS_BADGE: Record<string, string> = {
  'Pending': 'bg-slate-200 text-slate-800',
  'In Review': 'bg-sky-100 text-sky-800',
  'Shortlisted': 'bg-indigo-100 text-indigo-800',
  'For Approval': 'bg-violet-100 text-violet-800',
  'Approved': 'bg-emerald-100 text-emerald-800',
  'Rejected': 'bg-rose-100 text-rose-800',
  'For Renewal': 'bg-amber-100 text-amber-800',
  'Expired': 'bg-orange-100 text-orange-800',
  'Removed': 'bg-red-100 text-red-900',
};
const statusLabel = (s: ApplicationStatus) => (s === 'Shortlisted' ? 'For Interview' : s === 'Pending' ? 'In Review' : s);
const peso = (n?: number) => (typeof n === 'number' ? `₱${n.toLocaleString()}` : '—');

interface Props {
  users: UserProfile[];
  applications: Application[];
}

interface Row {
  key: string;
  studentNumber: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  yearLevel: string;
  activated: boolean;
  apps: Application[];
  latest?: Application;
}

export const StudentDirectory: React.FC<Props> = ({ users, applications }) => {
  const [query, setQuery] = useState('');
  const [program, setProgram] = useState('all');
  const [filter, setFilter] = useState<'all' | 'applied' | 'none' | 'approved'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const u of users) {
      if (u.role !== 'student') continue;
      const sn = u.university_id || '';
      map.set(sn || u.id, {
        key: u.id, studentNumber: sn, name: u.full_name, email: u.email, phone: u.phone || '',
        program: u.program || '', yearLevel: u.year_level || '', activated: true, apps: [],
      });
    }
    for (const a of applications) {
      let r = map.get(a.student_number);
      if (!r) {
        r = {
          key: a.student_number, studentNumber: a.student_number,
          name: [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' '),
          email: a.email, phone: a.phone, program: a.program, yearLevel: a.year_level, activated: false, apps: [],
        };
        map.set(a.student_number, r);
      }
      r.apps.push(a);
      if (!r.program) r.program = a.program;
      if (!r.yearLevel) r.yearLevel = a.year_level;
      if (!r.phone) r.phone = a.phone;
    }
    const out = [...map.values()];
    for (const r of out) {
      r.apps.sort((x, y) => (y.created_at || '').localeCompare(x.created_at || ''));
      r.latest = r.apps[0];
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, applications]);

  const programs = useMemo(() => [...new Set(rows.map((r) => r.program).filter(Boolean))].sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (program !== 'all' && r.program !== program) return false;
    if (filter === 'applied' && r.apps.length === 0) return false;
    if (filter === 'none' && r.apps.length > 0) return false;
    if (filter === 'approved' && !r.apps.some((a) => a.status === 'Approved')) return false;
    const q = query.toLowerCase().trim();
    return !q || `${r.name} ${r.studentNumber} ${r.email} ${r.program}`.toLowerCase().includes(q);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const view = filtered.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, student number, email or program"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
        <select value={program} onChange={(e) => { setProgram(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="all">All programs</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filter} onChange={(e) => { setFilter(e.target.value as any); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="all">All students</option>
          <option value="applied">Has applied</option>
          <option value="none">No application yet</option>
          <option value="approved">Scholars (approved)</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Student</th>
              <th className="text-left px-4 py-3">Program / Year</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Applications</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {view.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No students match.</td></tr>
            )}
            {view.map((r) => (
              <tr key={r.key} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.studentNumber || '—'}</div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <div>{r.program || '—'}</div>
                  <div className="text-xs text-slate-500">{r.yearLevel || ''}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div>{r.email}</div>
                  <div>{r.phone}</div>
                </td>
                <td className="px-4 py-3">
                  {r.latest ? (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BADGE[r.latest.status] || 'bg-slate-200'}`}>
                      {statusLabel(r.latest.status)}{r.apps.length > 1 ? ` · ${r.apps.length} total` : ''}
                    </span>
                  ) : <span className="text-xs text-slate-400">None</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(r)} className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StandardPagination currentPage={Math.min(page, pages)} totalPages={pages} totalItems={filtered.length}
        pageSize={PAGE_SIZE} pageSizeOptions={[PAGE_SIZE]} itemLabel="students" onPageChange={setPage} />

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{selected.name}</h3>
                <p className="text-xs text-slate-500">{selected.studentNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Info icon={<GraduationCap className="w-4 h-4" />} label="Program" value={selected.program} />
              <Info icon={<GraduationCap className="w-4 h-4" />} label="Year level" value={selected.yearLevel} />
              <Info icon={<Mail className="w-4 h-4" />} label="Email" value={selected.email} />
              <Info icon={<Phone className="w-4 h-4" />} label="Phone" value={selected.phone} />
              <Info icon={<UsersIcon className="w-4 h-4" />} label="Account" value={selected.activated ? 'Activated' : 'Not activated'} />
              {selected.latest?.gender && <Info label="Gender" value={selected.latest.gender} />}
              {selected.latest?.birthdate && <Info label="Birthdate" value={selected.latest.birthdate} />}
              {selected.latest && <Info label="Latest GWA" value={String(selected.latest.gwa)} />}
              {selected.latest && <Info label="Monthly family income" value={peso(selected.latest.monthly_family_income)} />}
              {selected.latest?.is_working_student && <Info label="Working student" value={`Yes · ${peso(selected.latest.student_annual_income)}/yr`} />}
            </div>

            {selected.latest && selected.latest.household_members?.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Household members</h4>
                <ul className="text-sm space-y-1">
                  {selected.latest.household_members.map((m: any, i: number) => (
                    <li key={i} className="text-slate-700">
                      {m.name || [m.first_name, m.last_name].filter(Boolean).join(' ')}{m.relation ? ` (${m.relation})` : ''}{m.employment_status ? ` · ${m.employment_status}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Scholarship applications ({selected.apps.length})
              </h4>
              {selected.apps.length === 0 ? (
                <p className="text-sm text-slate-400">This student has not applied for any scholarship yet.</p>
              ) : (
                <ul className="space-y-2">
                  {selected.apps.map((a) => (
                    <li key={a.id} className="border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{a.scholarship_title}</div>
                        <div className="text-[11px] text-slate-500">{a.reference_code}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${STATUS_BADGE[a.status] || 'bg-slate-200'}`}>
                        {statusLabel(a.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ icon?: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
  <div className="bg-slate-50 rounded-xl px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">{icon}{label}</div>
    <div className="text-slate-900 font-semibold break-words">{value || '—'}</div>
  </div>
);
