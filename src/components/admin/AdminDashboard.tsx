import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart as BarChartIcon, DollarSign, Users, Award,
  Plus, Edit, Trash2, Printer, TrendingUp, FileText, RotateCcw, AlertTriangle,
  Eye, ChevronLeft, ChevronRight, RefreshCw, Calendar, Search,
  CheckCircle2, Clock, ShieldAlert, CalendarX, Layers, User,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { Scholarship, Application, UserProfile, ApplicationStatus, FreezePeriod, InterviewSchedule } from '../../types';
import { ScholarshipModal } from './ScholarshipModal';
import { ReportExporterModal } from './ReportExporterModal';
import { DeleteScholarshipModal } from './DeleteScholarshipModal';
import { UserProfileModal } from '../common/UserProfileModal';
import { ApplicationReviewDrawer } from '../staff/ApplicationReviewDrawer';
import { EmergencyFreezeModal } from '../staff/EmergencyFreezeModal';

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  'Pending':     'bg-slate-200 text-slate-800',
  'In Review':   'bg-sky-100 text-sky-800',
  'Shortlisted': 'bg-indigo-100 text-indigo-800',
  'Approved':    'bg-emerald-100 text-emerald-800',
  'Rejected':    'bg-rose-100 text-rose-800',
  'For Renewal': 'bg-amber-100 text-amber-800',
  'Expired':     'bg-orange-100 text-orange-800',
  'Removed':     'bg-red-100 text-red-900',
};

const ALL_STATUSES: ApplicationStatus[] = [
  'Pending',
  'In Review',
  'Shortlisted',
  'Approved',
  'Rejected',
  'Expired',
  'Removed',
];

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

interface AdminDashboardProps {
  user: UserProfile;
  users?: UserProfile[];
  scholarships: Scholarship[];
  applications: Application[];
  freezePeriods?: FreezePeriod[];
  onSaveScholarship: (scholarship: Scholarship) => void;
  onDeleteScholarship: (id: string) => void;
  onRestoreDefaultScholarships?: () => void;
  onUpdateUser?: (user: UserProfile) => void;
  onDeleteUser?: (id: string) => void;
  onUpdateApplication?: (app: Application) => void;
  onDeleteApplication?: (id: string) => void;
  onSaveFreeze?: (freeze: FreezePeriod) => void;
  onSaveInterview?: (interview: InterviewSchedule) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  users = [],
  scholarships,
  applications,
  freezePeriods = [],
  onSaveScholarship,
  onDeleteScholarship,
  onRestoreDefaultScholarships,
  onUpdateUser,
  onDeleteUser,
  onUpdateApplication,
  onDeleteApplication,
  onSaveFreeze,
  onSaveInterview,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'analytics' | 'queue' | 'scholarships' | 'staff'>('analytics');

  // Modal States
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [scholarshipToEdit, setScholarshipToEdit] = useState<Scholarship | null>(null);
  const [scholarshipToDelete, setScholarshipToDelete] = useState<Scholarship | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  // User Profile Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userModalTitle, setUserModalTitle] = useState('Edit Profile');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Application Queue state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('All');
  const [appDateFrom, setAppDateFrom] = useState('');
  const [appDateTo, setAppDateTo] = useState('');
  const [appPageSize, setAppPageSize] = useState(20);
  const [appCurrentPage, setAppCurrentPage] = useState(1);
  const [appSortOrder, setAppSortOrder] = useState<'desc' | 'asc'>('desc');

  // Scholarships list state
  const [schSearch, setSchSearch] = useState('');
  const [schPageSize, setSchPageSize] = useState(20);
  const [schCurrentPage, setSchCurrentPage] = useState(1);
  const [schSortOrder, setSchSortOrder] = useState<'desc' | 'asc'>('desc');

  // Staff list state
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPageSize, setStaffPageSize] = useState(20);
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);

  // Key KPI Metrics
  const totalSubmissions = applications.length;
  const approvedApps = applications.filter(a => a.status === 'Approved');
  const activeScholarsCount = approvedApps.length;
  const totalApprovedDisbursement = approvedApps.reduce((acc, curr) => acc + (curr.awarded_amount || 0), 0);
  const approvalRate = totalSubmissions > 0 ? ((activeScholarsCount / totalSubmissions) * 100).toFixed(1) : '0.0';

  // Status counts breakdown
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All': applications.length,
      'Pending': 0,
      'In Review': 0,
      'Shortlisted': 0,
      'Approved': 0,
      'Rejected': 0,
      'For Renewal': 0,
      'Expired': 0,
      'Removed': 0,
    };
    applications.forEach(app => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      }
    });
    return counts;
  }, [applications]);

  // Keyboard Accessibility: Escape key dismisses open overlays and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (userToDelete) setUserToDelete(null);
        else if (appToDelete) setAppToDelete(null);
        else if (scholarshipToDelete) setScholarshipToDelete(null);
        else if (showScholarshipModal) {
          setShowScholarshipModal(false);
          setScholarshipToEdit(null);
        }
        else if (showReportModal) setShowReportModal(false);
        else if (showUserModal) {
          setShowUserModal(false);
          setUserToEdit(null);
        }
        else if (selectedApp) setSelectedApp(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userToDelete, appToDelete, scholarshipToDelete, showScholarshipModal, showReportModal, showUserModal, selectedApp]);

  // Monthly Fund Disbursement — real aggregation from approved applications
  const monthlyDisbursementData = useMemo(() => {
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals: Record<number, number> = {};

    approvedApps.forEach((app) => {
      const monthIndex = new Date(app.created_at).getMonth();
      monthlyTotals[monthIndex] = (monthlyTotals[monthIndex] || 0) + (app.awarded_amount || 0);
    });

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

  // Program Distribution Pie Chart Data
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

  // Filtered Applications for Queue Tab with interactive chronological sort
  const filteredApplications = useMemo(() => {
    const sorted = [...applications].sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return appSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return sorted.filter(app => {
      // Status filter
      if (appStatusFilter !== 'All' && app.status !== appStatusFilter) {
        return false;
      }

      // Search text
      if (appSearch.trim()) {
        const q = appSearch.toLowerCase();
        const match =
          `${app.first_name} ${app.last_name}`.toLowerCase().includes(q) ||
          app.student_number.toLowerCase().includes(q) ||
          app.email.toLowerCase().includes(q) ||
          app.scholarship_title.toLowerCase().includes(q) ||
          app.reference_code.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Date range filter
      if (appDateFrom) {
        const fromDate = new Date(appDateFrom);
        const appDate = new Date(app.created_at);
        if (appDate < fromDate) return false;
      }
      if (appDateTo) {
        const toDate = new Date(appDateTo);
        toDate.setHours(23, 59, 59, 999);
        const appDate = new Date(app.created_at);
        if (appDate > toDate) return false;
      }

      return true;
    });
  }, [applications, appStatusFilter, appSearch, appDateFrom, appDateTo, appSortOrder]);

  // Pagination for Applications Queue
  const totalAppPages = Math.max(1, Math.ceil(filteredApplications.length / appPageSize));
  const paginatedApplications = useMemo(() => {
    const start = (appCurrentPage - 1) * appPageSize;
    return filteredApplications.slice(start, start + appPageSize);
  }, [filteredApplications, appCurrentPage, appPageSize]);

  // Filtered Scholarships with interactive chronological sort by date/deadline
  const filteredScholarships = useMemo(() => {
    const sorted = [...scholarships].sort((a, b) => {
      const timeA = new Date(a.created_at || a.deadline || '').getTime();
      const timeB = new Date(b.created_at || b.deadline || '').getTime();
      return schSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    if (!schSearch.trim()) return sorted;
    const q = schSearch.toLowerCase();
    return sorted.filter(
      s => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [scholarships, schSearch, schSortOrder]);

  const totalSchPages = Math.max(1, Math.ceil(filteredScholarships.length / schPageSize));
  const paginatedScholarships = useMemo(() => {
    const start = (schCurrentPage - 1) * schPageSize;
    return filteredScholarships.slice(start, start + schPageSize);
  }, [filteredScholarships, schCurrentPage, schPageSize]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    const staffOnly = users.filter(u => u.role === 'staff');
    if (!staffSearch.trim()) return staffOnly;
    const q = staffSearch.toLowerCase();
    return staffOnly.filter(
      u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q))
    );
  }, [users, staffSearch]);

  const totalStaffPages = Math.max(1, Math.ceil(filteredStaff.length / staffPageSize));
  const paginatedStaff = useMemo(() => {
    const start = (staffCurrentPage - 1) * staffPageSize;
    return filteredStaff.slice(start, start + staffPageSize);
  }, [filteredStaff, staffCurrentPage, staffPageSize]);

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

        <div className="flex items-center justify-end gap-3 flex-wrap md:flex-nowrap md:ml-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setUserToEdit(user);
              setUserModalTitle('Edit System Administrator Profile');
              setShowUserModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors shadow-2xs cursor-pointer whitespace-nowrap box-border"
            title="Edit profile details"
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFreezeModal(true)}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap box-border"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Emergency Freeze / Extension</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center justify-center gap-2 h-[42px] px-5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors shadow-xs uppercase tracking-wide cursor-pointer whitespace-nowrap box-border"
          >
            <Printer className="w-4 h-4 text-indigo-300" />
            <span>Export Official PDF Summary</span>
          </button>
        </div>
      </div>

      {/* Main Admin Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveAdminTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analytics & Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('queue')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'queue'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Application Queue</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeAdminTab === 'queue' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('scholarships')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'scholarships'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Scholarship Programs</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeAdminTab === 'scholarships' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {scholarships.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('staff')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'staff'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty & Staff Accounts</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeAdminTab === 'staff' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {users.filter(u => u.role === 'staff').length}
          </span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS & OVERVIEW */}
      {activeAdminTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Key Metrics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Status Summary Cards (Clickable to jump to Queue) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Application Status Distribution Breakdown
              </h2>
              <span className="text-xs text-slate-500">Click any status card to view filtered records in the Queue</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {ALL_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setAppStatusFilter(status);
                    setActiveAdminTab('queue');
                  }}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all text-left space-y-1 cursor-pointer group"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded block text-center truncate ${STATUS_BADGE[status]}`}>
                    {status}
                  </span>
                  <p className="text-xl font-bold text-slate-900 text-center font-mono">
                    {statusCounts[status]}
                  </p>
                  <p className="text-[10px] text-slate-400 text-center group-hover:text-indigo-600 transition-colors">
                    View in Queue →
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Monthly Fund Disbursement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cumulative tuition grants released across the recent terms
                  </p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BarChartIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyDisbursementData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(value: any) => [`₱${Number(value || 0).toLocaleString()}`, 'Approved Amount']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '11px', border: 'none' }}
                      itemStyle={{ color: '#818CF8' }}
                    />
                    <Bar dataKey="amount" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Distribution by Degree Program
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applicant volume segmented by academic department
                  </p>
                </div>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                {programDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={programDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {programDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: any, name: any) => [`${val} applications`, name]}
                        contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', fontSize: '11px', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">No applicants registered yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATION QUEUE & SCHOLAR MANAGEMENT (Same as Staff with Edit & Delete) */}
      {activeAdminTab === 'queue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Student Application & Scholar Management Queue
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Admin Full Privileges
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Full administrative authority to review documents, verify qualifications, approve/reject/remove scholarships, and delete application records.
              </p>
            </div>

            {/* Pagination Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Show max per page:</span>
              <select
                value={appPageSize}
                onChange={(e) => {
                  setAppPageSize(Number(e.target.value));
                  setAppCurrentPage(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
              </select>
            </div>
          </div>

          {/* Filter Bar: Status, Search, Date Range */}
          <div className="space-y-3">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => { setAppStatusFilter('All'); setAppCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  appStatusFilter === 'All'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({applications.length})
              </button>
              {ALL_STATUSES.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => { setAppStatusFilter(st); setAppCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    appStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st} ({statusCounts[st] || 0})
                </button>
              ))}
            </div>

            {/* Search & Date Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search student, ID, email, program, ref..."
                  value={appSearch}
                  onChange={(e) => { setAppSearch(e.target.value); setAppCurrentPage(1); }}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="text-[10px] text-slate-400 absolute left-3 top-0.5">From</span>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={appDateFrom}
                    onChange={(e) => {
                      const today = new Date().toISOString().split('T')[0];
                      const val = e.target.value > today ? today : e.target.value;
                      setAppDateFrom(val);
                      setAppCurrentPage(1);
                    }}
                    className="w-full text-xs pt-4 pb-1 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="text-[10px] text-slate-400 absolute left-3 top-0.5">To</span>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={appDateTo}
                    onChange={(e) => {
                      const today = new Date().toISOString().split('T')[0];
                      const val = e.target.value > today ? today : e.target.value;
                      setAppDateTo(val);
                      setAppCurrentPage(1);
                    }}
                    className="w-full text-xs pt-4 pb-1 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAppSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="text-xs text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 shrink-0"
                  title={`Sort by Date: currently ${appSortOrder === 'desc' ? 'Descending (Newest First)' : 'Ascending (Oldest First)'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{appSortOrder === 'desc' ? 'Newest (Desc)' : 'Oldest (Asc)'}</span>
                </button>
                {(appSearch || appStatusFilter !== 'All' || appDateFrom || appDateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppSearch('');
                      setAppStatusFilter('All');
                      setAppDateFrom('');
                      setAppDateTo('');
                      setAppCurrentPage(1);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  Total in list: <strong className="text-slate-900">{filteredApplications.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">
                    <button
                      type="button"
                      onClick={() => setAppSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="inline-flex items-center gap-1.5 uppercase font-bold text-[10px] text-white hover:text-indigo-300 transition-colors cursor-pointer group"
                      title={`Sort by Reference & Date: currently ${appSortOrder === 'desc' ? 'Descending (Newest First)' : 'Ascending (Oldest First)'}`}
                    >
                      <span>Reference &amp; Date</span>
                      <span className="p-0.5 rounded bg-white/10 group-hover:bg-indigo-600 transition-colors inline-flex items-center">
                        {appSortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      </span>
                    </button>
                  </th>
                  <th className="p-3">Student Name & ID</th>
                  <th className="p-3">Scholarship Applied</th>
                  <th className="p-3">GWA</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Grant Validity</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No applications match the selected criteria or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedApplications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono">
                        <span className="font-bold text-slate-900 block">{app.reference_code}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(app.created_at)}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{app.first_name} {app.last_name}</span>
                        <span className="text-[10px] text-slate-500">{app.student_number} • {app.program}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-900 block">{app.scholarship_title}</span>
                        <span className="text-[10px] text-indigo-600 font-bold">
                          {app.awarded_amount ? `₱${app.awarded_amount.toLocaleString()}` : 'Under Review'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {app.gwa.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE[app.status]}`}>
                          {app.status}
                        </span>
                        {app.status === 'Removed' && app.removal_reason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5 truncate max-w-[150px]" title={app.removal_reason}>
                            {app.removal_reason}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-600">
                        {app.expires_at ? (
                          <div>
                            <span className="text-slate-400 text-[10px] block">Expires:</span>
                            <span className="font-medium text-slate-800">{formatDate(app.expires_at)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Review and Edit Application"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setAppToDelete(app)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Application Record"
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing {filteredApplications.length > 0 ? (appCurrentPage - 1) * appPageSize + 1 : 0} to{' '}
              {Math.min(appCurrentPage * appPageSize, filteredApplications.length)} of{' '}
              <strong className="text-slate-900">{filteredApplications.length}</strong> total applications
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={appCurrentPage <= 1}
                onClick={() => setAppCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 text-slate-700 font-bold">
                Page {appCurrentPage} of {totalAppPages}
              </span>

              <button
                type="button"
                disabled={appCurrentPage >= totalAppPages}
                onClick={() => setAppCurrentPage(p => Math.min(totalAppPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SCHOLARSHIP PROGRAMS WITH POLICY RULES & PAGINATION */}
      {activeAdminTab === 'scholarships' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Active Institutional Scholarship Programs
                </h3>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Policy Rules Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure program eligibility rules, grade minimums, term duration, renewal deadlines, and maximum approved limits.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Show max:</span>
                <select
                  value={schPageSize}
                  onChange={(e) => {
                    setSchPageSize(Number(e.target.value));
                    setSchCurrentPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddNewScholarship}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Scholarship</span>
              </button>
            </div>
          </div>

          {/* Search bar & count */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search scholarship name, code..."
                value={schSearch}
                onChange={(e) => { setSchSearch(e.target.value); setSchCurrentPage(1); }}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setSchSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 shrink-0"
                title={`Sort by Deadline: currently ${schSortOrder === 'desc' ? 'Descending (Latest First)' : 'Ascending (Earliest First)'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>{schSortOrder === 'desc' ? 'Latest First (Desc)' : 'Earliest First (Asc)'}</span>
              </button>
              <span className="text-xs text-slate-500">
                Total Scholarships: <strong className="text-slate-900">{filteredScholarships.length}</strong>
              </span>
            </div>
          </div>

          {/* Scholarships Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Code & Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Grant Value</th>
                  <th className="p-3">Slots (Taken / Total)</th>
                  <th className="p-3">Min GWA</th>
                  <th className="p-3">Duration & Renewal</th>
                  <th className="p-3">
                    <button
                      type="button"
                      onClick={() => setSchSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="inline-flex items-center gap-1.5 uppercase font-bold text-[10px] text-white hover:text-indigo-300 transition-colors cursor-pointer group"
                      title={`Sort by Deadline: currently ${schSortOrder === 'desc' ? 'Descending (Latest First)' : 'Ascending (Earliest First)'}`}
                    >
                      <span>Deadline</span>
                      <span className="p-0.5 rounded bg-white/10 group-hover:bg-indigo-600 transition-colors inline-flex items-center">
                        {schSortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      </span>
                    </button>
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedScholarships.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center bg-slate-50">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto border border-amber-300">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">No Scholarships Found</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {scholarships.length === 0
                              ? 'All scholarship records have been cleared. Restore default programs below.'
                              : 'No scholarships match your search query.'}
                          </p>
                        </div>
                        {scholarships.length === 0 && onRestoreDefaultScholarships && (
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
                  paginatedScholarships.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-[10px] text-slate-400 block">{s.code}</span>
                        <span className="font-bold text-slate-900">{s.title}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {s.category}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-indigo-600 font-mono">
                        ₱{s.grant_amount.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {s.slots - s.slots_remaining} / {s.slots}
                      </td>
                      <td className="p-3 font-bold text-slate-800">≤ {s.min_gwa.toFixed(2)}</td>
                      <td className="p-3 text-slate-600">
                        <span className="block font-medium text-slate-900">
                          {s.duration_years || 1} { (s.duration_years || 1) === 1 ? 'Year' : 'Years'}
                        </span>
                        {s.is_renewable ? (
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Renewable {s.renewal_deadline ? `(Due: ${s.renewal_deadline})` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">Non-Renewable</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{s.deadline}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleEditScholarship(s)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Scholarship Rules"
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing {filteredScholarships.length > 0 ? (schCurrentPage - 1) * schPageSize + 1 : 0} to{' '}
              {Math.min(schCurrentPage * schPageSize, filteredScholarships.length)} of{' '}
              <strong className="text-slate-900">{filteredScholarships.length}</strong> total scholarships
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={schCurrentPage <= 1}
                onClick={() => setSchCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 text-slate-700 font-bold">
                Page {schCurrentPage} of {totalSchPages}
              </span>

              <button
                type="button"
                disabled={schCurrentPage >= totalSchPages}
                onClick={() => setSchCurrentPage(p => Math.min(totalSchPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: FACULTY & STAFF DIRECTORY WITH PAGINATION */}
      {activeAdminTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
          
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

            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Show max:</span>
                <select
                  value={staffPageSize}
                  onChange={(e) => {
                    setStaffPageSize(Number(e.target.value));
                    setStaffCurrentPage(1);
                  }}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                </select>
              </div>

              <button
                type="button"
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
                className="flex items-center space-x-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty Reviewer</span>
              </button>
            </div>
          </div>

          {/* Search bar & count */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reviewer name, email, dept..."
                value={staffSearch}
                onChange={(e) => { setStaffSearch(e.target.value); setStaffCurrentPage(1); }}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Total Reviewers: <strong className="text-slate-900">{filteredStaff.length}</strong>
            </span>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Reviewer Name & Title</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Security Role</th>
                  <th className="p-3">Account Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No faculty reviewers found matching the search.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[10px] text-slate-500">{u.title || 'Faculty Reviewer'}</div>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {u.department || 'Academic Committee'}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{u.email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">
                        {u.created_at ? formatDate(u.created_at) : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setUserModalTitle(`Edit Reviewer: ${u.full_name}`);
                              setShowUserModal(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Reviewer Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Reviewer Account"
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
            <div>
              Showing {filteredStaff.length > 0 ? (staffCurrentPage - 1) * staffPageSize + 1 : 0} to{' '}
              {Math.min(staffCurrentPage * staffPageSize, filteredStaff.length)} of{' '}
              <strong className="text-slate-900">{filteredStaff.length}</strong> total reviewers
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={staffCurrentPage <= 1}
                onClick={() => setStaffCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-3 py-1.5 text-slate-700 font-bold">
                Page {staffCurrentPage} of {totalStaffPages}
              </span>

              <button
                type="button"
                disabled={staffCurrentPage >= totalStaffPages}
                onClick={() => setStaffCurrentPage(p => Math.min(totalStaffPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Application Review & Edit Drawer (Admin has same power as staff) */}
      {selectedApp && (
        <ApplicationReviewDrawer
          application={selectedApp}
          scholarships={scholarships}
          onClose={() => setSelectedApp(null)}
          onUpdateApplication={(updated) => {
            onUpdateApplication?.(updated);
            setSelectedApp(null);
          }}
          onDeleteApplication={(id) => {
            onDeleteApplication?.(id);
            setSelectedApp(null);
          }}
          onSaveInterview={onSaveInterview}
        />
      )}

      {/* Emergency Freeze Modal */}
      <AnimatePresence>
        {showFreezeModal && onSaveFreeze && (
          <EmergencyFreezeModal
            scholarships={scholarships}
            onClose={() => setShowFreezeModal(false)}
            onSaveFreeze={onSaveFreeze}
          />
        )}
      </AnimatePresence>

      {/* Delete Application Confirmation Modal */}
      <AnimatePresence>
        {appToDelete && (
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
                  <h3 className="text-base font-bold text-slate-900">Delete Application Record?</h3>
                  <p className="text-xs text-slate-500">Permanently delete from database</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Are you sure you want to permanently delete the application for{' '}
                <strong className="text-slate-900">{appToDelete.first_name} {appToDelete.last_name}</strong> (Ref: {appToDelete.reference_code})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAppToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteApplication) {
                      onDeleteApplication(appToDelete.id);
                    }
                    setAppToDelete(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                >
                  Delete Application
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Scholarship Modal with Policy Rules */}
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
        existingUsers={users}
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
