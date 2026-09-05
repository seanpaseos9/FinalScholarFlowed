import React from 'react';
import { Award, LogOut, Shield, GraduationCap, Home, ChevronRight, Sparkles } from 'lucide-react';
import { UserProfile } from '../../types';
import { ScholarFlowLogo } from './ScholarFlowLogo';

interface HeaderProps {
  activeUser: UserProfile | null;
  onLogout: () => void;
  currentView: 'portal' | 'student' | 'login' | 'staff' | 'admin';
  onNavigate: (view: 'portal' | 'student' | 'login' | 'staff' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onLogout,
  currentView,
  onNavigate,
}) => {
  return (
    <>
      {/* Top Subtle Announcement Bar */}
      <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs py-2 px-4 font-medium flex justify-between items-center z-50 relative border-b border-slate-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              NOTICE
            </span>
            <span className="text-slate-300 hidden sm:inline">
              A.Y. 2026-2027 institutional scholarship applications & evaluations are active.
            </span>
            <span className="text-slate-300 sm:hidden">
              A.Y. 2026-2027 Portal
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-400">Cloud Firestore</span>
            <span className="text-slate-400 hidden md:inline">| scholarflowed3</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-[70px]">
            
            {/* Logo & Title */}
            <div
              onClick={() => {
                if (activeUser) {
                  onNavigate(activeUser.role === 'admin' ? 'admin' : 'staff');
                } else {
                  onNavigate('portal');
                }
              }}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* ScholarFlow Official Emblem Logo */}
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center p-1 group-hover:border-indigo-400 group-hover:shadow-xs transition-all duration-300">
                <ScholarFlowLogo size="md" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">
                    Scholar<span className="text-indigo-600">Flow</span>
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-slate-200">
                    PORTAL
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Academic Scholarship & Grant Management Platform
                </span>
              </div>
            </div>

            {/* Navigation Items / Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                {/* Home Button - Only when not logged in */}
                {!activeUser && (
                  <button
                    onClick={() => onNavigate('portal')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      currentView === 'portal'
                        ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="w-4 h-4 text-slate-600" />
                    <span className="hidden sm:inline">Home</span>
                  </button>
                )}

                {/* Site/Portal Breadcrumb Badge */}
                {!activeUser && currentView === 'student' && (
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-150 flex items-center space-x-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Student Portal</span>
                    </span>
                  </div>
                )}

                {!activeUser && currentView === 'login' && (
                  <div className="flex items-center space-x-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="bg-slate-100 text-slate-900 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-700" />
                      <span>Staff Sign In</span>
                    </span>
                  </div>
                )}

                {activeUser && (
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 border ${
                      activeUser.role === 'admin'
                        ? 'bg-slate-900 text-white border-slate-800'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{activeUser.role === 'admin' ? 'System Admin Dashboard' : 'Staff Coordinator Dashboard'}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Active User Controls */}
              {activeUser && (
                <div className="flex items-center space-x-3 bg-slate-50 p-1.5 pl-3 rounded-xl border border-slate-200 ml-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-900 text-white">
                      {activeUser.role === 'admin' ? <Shield className="w-4 h-4 text-indigo-400" /> : <Award className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{activeUser.full_name}</p>
                      <p className="text-[10px] text-slate-500 font-medium capitalize mt-0.5">
                        {activeUser.title || (activeUser.role === 'admin' ? 'System Administrator' : 'Staff Coordinator')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    title="Sign Out"
                    className="flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
};
