import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, ShieldCheck, ArrowRight, Award, FileText, Lock, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScholarFlowLogo } from '../common/ScholarFlowLogo';

interface PortalSelectionProps {
  onSelectPortal: (portal: 'student' | 'login') => void;
  openScholarshipsCount: number;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({
  onSelectPortal,
  openScholarshipsCount,
}) => {
  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 flex flex-col justify-between">
      
      {/* 1. Hero Section: Minimal, High-Contrast White/Slate */}
      <div className="bg-white border-b border-slate-200 py-14 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {/* Official ScholarFlow Logo Feature */}
            <div className="w-24 h-24 mb-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-2">
              <ScholarFlowLogo size="xl" />
            </div>

            <span className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academic Year 2026–2027 Grants</span>
            </span>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Scholarship Management & Application Portal
            </h1>
            
            <p className="text-slate-600 text-sm sm:text-base font-normal max-w-2xl mx-auto mt-4 leading-relaxed">
              Explore available institutional fellowships, submit verified documentation, and monitor your evaluation progress through a single centralized gateway.
            </p>
          </motion.div>
        </div>
      </div>

      {/* 2. Main Portal Selection Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Two Clean Minimal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Card 1: Student Applicant Portal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -3 }}
            onClick={() => onSelectPortal('student')}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-2xs group-hover:border-indigo-400 p-1 transition-colors">
                  <ScholarFlowLogo size="md" />
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
                  {openScholarshipsCount} Open Programs
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                Student Applicant Portal
              </h3>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Browse available merit, financial aid, athletic, and industry grants. Complete your paperless application and track real-time status.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                <li className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Searchable scholarship & grant catalog</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Streamlined 3-step digital document submission</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Instant reference code & progress tracking</span>
                </li>
              </ul>
            </div>

            <button className="w-full bg-slate-900 hover:bg-indigo-600 py-3.5 rounded-xl text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer">
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 2: Staff & Admin Portal */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -3 }}
            onClick={() => onSelectPortal('login')}
            className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between group cursor-pointer hover:border-slate-700 hover:shadow-md transition-all duration-200 relative overflow-hidden"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                  Restricted Access
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-900 transition-colors">
                Staff & Admin Portal
              </h3>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Secure access for scholarship committee reviewers, faculty evaluators, and system administrators to manage grants and process approvals.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8">
                <li className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Applicant review drawer & document verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Program slots, criteria & deadline control</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Analytics dashboard & formal PDF reporting</span>
                </li>
              </ul>
            </div>

            <button className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 py-3.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer">
              <span>Enter Staff & Admin Portal</span>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </button>
          </motion.div>

        </div>
      </div>

      {/* 3. Subtle Bottom Ribbon */}
      <div className="bg-white border-t border-slate-200 text-slate-500 py-4 text-center text-xs">
        <p>ScholarFlow Operations Platform • Institutional Financial Aid System</p>
      </div>

    </div>
  );
};
