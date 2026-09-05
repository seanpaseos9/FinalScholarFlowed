import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart as BarChartIcon, PieChart as PieChartIcon, DollarSign, Users, Award, ShieldCheck,
  Plus, Edit, Trash2, Printer, TrendingUp, CheckCircle2, FileText, Sparkles, Filter, RotateCcw, AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Scholarship, Application, UserProfile } from '../../types';
import { ScholarshipModal } from './ScholarshipModal';
import { ReportExporterModal } from './ReportExporterModal';
import { DeleteScholarshipModal } from './DeleteScholarshipModal';
import { UserProfileModal } from '../common/UserProfileModal';

interface AdminDashboardProps {
  user: UserProfile;
  users?: UserProfile[];
  scholarships: Scholarship[];
  applications: Application[];
  onSaveScholarship: (scholarship: Scholarship) => void;
  onDeleteScholarship: (id: string) => void;
  onRestoreDefaultScholarships?: () => void;
  onUpdateUser?: (user: UserProfile) => void;
  onDeleteUser?: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  users = [],
  scholarships,
  applications,
  onSaveScholarship,
  onDeleteScholarship,
  onRestoreDefaultScholarships,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [scholarshipToEdit, setScholarshipToEdit] = useState<Scholarship | null>(null);
  const [scholarshipToDelete, setScholarshipToDelete] = useState<Scholarship | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // User Profile Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userModalTitle, setUserModalTitle] = useState('Edit Profile');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Calculate Key KPIs
  const totalSubmissions = applications.length;
  const approvedApps = applications.filter(a => a.status === 'Approved');
  const activeScholarsCount = approvedApps.length;
  const totalApprovedDisbursement = approvedApps.reduce((acc, curr) => acc + (curr.awarded_amount || 0), 0);
  const approvalRate = totalSubmissions > 0 ? ((activeScholarsCount / totalSubmissions) * 100).toFixed(1) : '0.0';

  // 1. Monthly Fund Disbursement — real aggregation from approved applications
  const monthlyDisbursementData = useMemo(() => {
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals: Record<number, number> = {};

    approvedApps.forEach((app) => {
      const monthIndex = new Date(app.created_at).getMonth(); // 0 = Jan
      monthlyTotals[monthIndex] = (monthlyTotals[monthIndex] || 0) + (app.awarded_amount || 0);
    });

    // Show the last 8 months relative to today
    const today = new Date();
    const result = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      result.push({
        month: MONTH_LABELS[monthIndex],
        amount: monthlyTotals[monthIndex] || 0,
      });
    }
    return result;
  }, [approvedApps]);

  // 2. Program Distribution Pie Chart Data
  const programDistributionData = useMemo(() => {
    const programMap: Record<string, number> = {};
    applications.forEach(a => {
      programMap[a.program] = (programMap[a.program] || 0) + 1;
    });
    const pieColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];
    return Object.keys(programMap).map((prog, idx) => ({
      name: prog.replace('BS ', ''),
      value: programMap[prog],
      color: pieColors[idx % pieColors.length],
    }));
  }, [applications]);

  const handleEditScholarship = (sch: Scholarship) => {
    setScholarshipToEdit(sch);
    setShowScholarshipModal(true);
  };

  const handleAddNewScholarship = () => {
    setScholarshipToEdit(null);
    setShowScholarshipModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
              System Admin Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">{user.department}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Scholarship Fund Analytics & Program Administration
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setUserToEdit(user);
              setUserModalTitle('Edit System Administrator Profile');
              setShowUserModal(true);
            }}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            title="Edit profile details"
          >
            <span>👤 Edit Profile</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-xs uppercase tracking-wide cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-300" />
            <span>Export Official PDF Summary</span>
          </button>
        </div>
      </div>

      {/* Analytics & KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Total Approved Disbursement */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Total Approved Disbursement
            </span>
            <div className="p-2 bg-slate-800 text-indigo-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-white font-mono">
            ₱{totalApprovedDisbursement.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Sum allocated for active scholars</p>
        </div>

        {/* KPI 2: Overall Approval Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Approval Rate %
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {approvalRate}%
          </p>
          <p className="text-[11px] text-slate-400">{activeScholarsCount} of {totalSubmissions} applications approved</p>
        </div>

        {/* KPI 3: Active Scholars Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Scholars
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-600">
            {activeScholarsCount}
          </p>
          <p className="text-[11px] text-slate-400">Scholars with active grants</p>
        </div>

        {/* KPI 4: Total Submissions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {totalSubmissions}
          </p>
          <p className="text-[11px] text-slate-400">Total applications registered</p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Monthly Fund Disbursement Bar Graph */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monthly Fund Disbursement (₱)
              </h3>
              <p className="text-xs text-slate-500">Historical trend of disbursed scholarship capital.</p>
            </div>
            <BarChartIcon className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDisbursementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={val => `₱${val / 1000}k`} />
                <RechartsTooltip
                  formatter={(val: number) => [`₱${val.toLocaleString()}`, 'Disbursed Capital']}
                />
                <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Program Distribution Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Program Distribution
              </h3>
              <p className="text-xs text-slate-500">Breakdown of applicants by degree program.</p>
            </div>
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {programDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Scholarship CRUD Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Scholarship Programs CRUD Manager
            </h3>
            <p className="text-xs text-slate-500">
              Create, update, or adjust slot counts, grant amounts, and minimum GWA requirements.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {onRestoreDefaultScholarships && (
              <button
                type="button"
                onClick={onRestoreDefaultScholarships}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Restore default scholarship programs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Restore Default Programs</span>
              </button>
            )}

            <button
              onClick={handleAddNewScholarship}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Scholarship</span>
            </button>
          </div>
        </div>

        {/* Scholarships Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Code & Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Grant Value (₱)</th>
                <th className="p-3">Slots (Left/Total)</th>
                <th className="p-3">Min GWA</th>
                <th className="p-3">Deadline</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scholarships.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center bg-slate-50">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-300">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">No Scholarships Available</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          All scholarship records have been cleared or removed. You can restore default programs with one click.
                        </p>
                      </div>
                      {onRestoreDefaultScholarships && (
                        <button
                          type="button"
                          onClick={onRestoreDefaultScholarships}
                          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4 text-indigo-300" />
                          <span>Restore Default Scholarships</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                scholarships.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-mono font-bold text-[10px] text-slate-400 block">{s.code}</span>
                      <span className="font-bold text-slate-900">{s.title}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {s.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      ₱{s.grant_amount.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {s.slots_remaining} / {s.slots}
                    </td>
                    <td className="p-3 font-bold">{s.min_gwa.toFixed(2)}</td>
                    <td className="p-3 text-slate-600">{s.deadline}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditScholarship(s)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Scholarship"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setScholarshipToDelete(s)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Scholarship"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Faculty, Professors & Staff Management (Live Cloud Firestore & Backend API) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-slate-900">
                Faculty Reviewers & Coordinator Accounts
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Staff Directory</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active faculty reviewers and scholarship staff coordinators. System administrator accounts are excluded from this directory.
            </p>
          </div>

          <button
            onClick={() => {
              const newProf: UserProfile = {
                id: `usr-faculty-${Date.now()}`,
                full_name: '',
                email: '',
                password: 'staff123',
                role: 'staff',
                title: 'Professor & Faculty Reviewer',
                department: 'Academic Affairs',
                created_at: new Date().toISOString(),
              };
              setUserToEdit(newProf);
              setUserModalTitle('Add New Faculty Reviewer');
              setShowUserModal(true);
            }}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Reviewer</span>
          </button>
        </div>

        {/* Faculty & Staff Table (Excludes Administrator Accounts) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Faculty / Reviewer Name</th>
                <th className="p-3">Academic Title</th>
                <th className="p-3">Department</th>
                <th className="p-3">Institutional Email</th>
                <th className="p-3">System Role</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.filter((u) => u.role === 'staff').length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No faculty reviewer or coordinator accounts found. Click &ldquo;Add Faculty Reviewer&rdquo; to create one.
                  </td>
                </tr>
              ) : (
                users
                  .filter((u) => u.role === 'staff')
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {u.full_name ? u.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.full_name}</p>
                          <p className="text-[11px] text-slate-400">{u.title || 'Faculty Reviewer'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{u.title || 'Faculty Reviewer'}</td>
                      <td className="p-3 text-slate-600">{u.department || 'Academic Affairs'}</td>
                      <td className="p-3 font-mono text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 inline-flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                          <span>Staff Coordinator</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setUserModalTitle('Edit Faculty Reviewer Details');
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold"
                            title="Edit details"
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold"
                            title="Delete faculty reviewer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Scholarship Confirmation Modal */}
      <AnimatePresence>
        {scholarshipToDelete && (
          <DeleteScholarshipModal
            scholarship={scholarshipToDelete}
            applications={applications}
            onClose={() => setScholarshipToDelete(null)}
            onConfirmDelete={onDeleteScholarship}
          />
        )}
      </AnimatePresence>

      {/* Scholarship Modal */}
      <AnimatePresence>
        {showScholarshipModal && (
          <ScholarshipModal
            scholarshipToEdit={scholarshipToEdit}
            onClose={() => setShowScholarshipModal(false)}
            onSave={onSaveScholarship}
          />
        )}
      </AnimatePresence>

      {/* Report Exporter Modal */}
      <AnimatePresence>
        {showReportModal && (
          <ReportExporterModal
            applications={applications}
            scholarships={scholarships}
            currentUser={user}
            users={users}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* User / Faculty Profile Editor Modal */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setUserToEdit(null);
        }}
        user={userToEdit}
        title={userModalTitle}
        allowRoleChange={false}
        onSave={async (updated) => {
          if (onUpdateUser) {
            await onUpdateUser(updated);
          }
        }}
      />

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Reviewer Account?</h3>
                  <p className="text-xs text-slate-500">Remove reviewer from database</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to remove <span className="font-bold text-slate-900">{userToDelete.full_name}</span> ({userToDelete.email})? This reviewer will no longer be able to log in to the scholarship portal.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteUser) {
                      onDeleteUser(userToDelete.id);
                    }
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Reviewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
