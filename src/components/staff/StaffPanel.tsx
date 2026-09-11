import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon, Users, FileText, ShieldAlert, Search, Filter,
  CheckCircle2, Clock, Award, ChevronRight, Eye, UserCheck, AlertCircle, Plus, Sparkles
} from 'lucide-react';
import { Scholarship, Application, FreezePeriod, UserProfile, InterviewSchedule, ApplicationStatus } from '../../types';
import { EmergencyFreezeModal } from './EmergencyFreezeModal';
import { ApplicationReviewDrawer } from './ApplicationReviewDrawer';
import { UserProfileModal } from '../common/UserProfileModal';

/**
 * Standardized date formatter — outputs 'MMM D, YYYY' (e.g. Sep 6, 2026).
 * Accepts ISO strings, YYYY-MM-DD strings, or any Date-parseable value.
 */
function formatDate(dateStr: string): string {
  try {
    // Parse YYYY-MM-DD as local date to avoid UTC off-by-one shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

interface StaffPanelProps {
  user: UserProfile;
  scholarships: Scholarship[];
  applications: Application[];
  freezePeriods: FreezePeriod[];
  interviews: InterviewSchedule[];
  onUpdateApplication: (app: Application) => void;
  onDeleteApplication?: (id: string) => void;
  onSaveFreeze: (freeze: FreezePeriod) => void;
  onUpdateUser?: (user: UserProfile) => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({
  user,
  scholarships,
  applications,
  freezePeriods,
  interviews,
  onUpdateApplication,
  onDeleteApplication,
  onSaveFreeze,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'queue' | 'roster'>('queue');
  
  // Filters for Queue
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('All');

  // Modal / Drawer state
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Filter queue items
  const filteredQueue = applications.filter(app => {
    const matchesSearch =
      `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.reference_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    const matchesSch = scholarshipFilter === 'All' || app.scholarship_id === scholarshipFilter;

    return matchesSearch && matchesStatus && matchesSch;
  });

  // Calculate Metrics for Queue
  const pendingCount = applications.filter(a => a.status === 'Pending').length;
  const inReviewCount = applications.filter(a => a.status === 'In Review').length;
  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const approvedCount = applications.filter(a => a.status === 'Approved').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Panel Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase">
              Staff Coordinator Dashboard
            </span>
            <span className="text-xs text-slate-500 font-medium">{user.department}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1 flex flex-wrap items-center gap-2">
            <span>Scholarship Review & Evaluation Desk</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 font-bold">
              👤 {user.full_name}
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center justify-center space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Edit reviewer profile details"
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Edit Faculty / Profile</span>
          </button>

          <button
            onClick={() => setShowFreezeModal(true)}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Emergency Freeze / Extension</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Application Queue ({applications.length})</span>
          {pendingCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span>Calendar & Deadlines</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Applicant Directory</span>
        </button>
      </div>

      {/* TAB 1: APPLICATION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          
          {/* Status Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">Pending</span>
              <span className="text-2xl font-bold text-slate-900">{pendingCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-sky-600 uppercase block">In Review</span>
              <span className="text-2xl font-bold text-slate-900">{inReviewCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">Shortlisted</span>
              <span className="text-2xl font-bold text-slate-900">{shortlistedCount}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">Approved Scholars</span>
              <span className="text-2xl font-bold text-slate-900">{approvedCount}</span>
            </div>
          </div>

          {/* Queue Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
            
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, student ID, ref code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mr-1">Status:</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Review">In Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mr-1">Scholarship:</label>
                <select
                  value={scholarshipFilter}
                  onChange={e => setScholarshipFilter(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold max-w-xs truncate focus:outline-none"
                >
                  <option value="All">All Scholarships</option>
                  {scholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Ref Code & Student</th>
                    <th className="p-4">Scholarship Program</th>
                    <th className="p-4">Program & GWA</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Awarded (₱)</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No applications matched your queue filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map(app => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-indigo-600 block">{app.reference_code}</span>
                          <span className="font-bold text-slate-900 block">{app.first_name} {app.last_name}</span>
                          <span className="text-[10px] text-slate-400">ID #{app.student_number}</span>
                        </td>
                        <td className="p-4 max-w-xs">
                          <span className="font-bold text-slate-800 line-clamp-1">{app.scholarship_title}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-800 block">{app.program}</span>
                          <span className="text-[10px] font-bold text-indigo-600">GWA: {app.gwa.toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-slate-500">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                            app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            app.status === 'Shortlisted' ? 'bg-indigo-100 text-indigo-800' :
                            app.status === 'In Review' ? 'bg-sky-100 text-sky-800' :
                            app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {app.status === 'Approved' ? `₱${app.awarded_amount.toLocaleString()}` : '—'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="bg-slate-900 hover:bg-indigo-600 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: OVERVIEW / INTERACTIVE CALENDAR & SCHEDULES */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Deadlines List */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>Upcoming Scholarship Deadlines</span>
              </h3>

              <div className="space-y-3">
                {scholarships.map(s => (
                  <div key={s.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 block">{s.code}</span>
                      <p className="font-bold text-slate-900 text-sm">{s.title}</p>
                      <p className="text-[11px] text-slate-500">{s.category} Grant • {s.slots_remaining} slots left</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-indigo-600 text-sm block">{formatDate(s.deadline)}</span>
                      {s.is_frozen ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Paused
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Open For Submissions
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interview Schedules */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>Shortlist Interviews</span>
              </h3>

              <div className="space-y-3">
                {interviews.map(inv => (
                  <div key={inv.id} className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                    <p className="font-bold text-slate-900">{inv.student_name}</p>
                    <p className="text-[11px] text-indigo-600 font-medium">{inv.scholarship_title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">📅 {inv.date_time}</p>
                    <p className="text-[10px] text-slate-500">📍 {inv.location}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: APPLICANT DIRECTORY */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Institutional Student Applicant Directory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Applicant Name & ID</th>
                  <th className="p-3">Degree Program & Year</th>
                  <th className="p-3">GWA / GPA</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Target Grant</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      {a.first_name} {a.last_name}
                      <span className="block text-[10px] text-slate-400 font-mono">ID #{a.student_number}</span>
                    </td>
                    <td className="p-3">{a.program} ({a.year_level})</td>
                    <td className="p-3 font-bold text-indigo-600">{a.gwa.toFixed(2)}</td>
                    <td className="p-3 text-slate-600">{a.email}<br/>{a.phone}</td>
                    <td className="p-3 font-medium">{a.scholarship_title}</td>
                    <td className="p-3">
                      <span className="font-bold text-xs">{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emergency Freeze Modal */}
      <AnimatePresence>
        {showFreezeModal && (
          <EmergencyFreezeModal
            scholarships={scholarships}
            onClose={() => setShowFreezeModal(false)}
            onSaveFreeze={onSaveFreeze}
          />
        )}
      </AnimatePresence>

      {/* Application Review Drawer */}
      <AnimatePresence>
        {selectedApp && (
          <ApplicationReviewDrawer
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onUpdateApplication={onUpdateApplication}
            onDeleteApplication={onDeleteApplication}
          />
        )}
      </AnimatePresence>

      {/* Faculty Profile Editor Modal (Direct Cloud Firestore sync) */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={async (updatedUser) => {
          if (onUpdateUser) {
            await onUpdateUser(updatedUser);
          }
        }}
        title="Edit Faculty & Coordinator Profile"
      />

    </div>
  );
};
