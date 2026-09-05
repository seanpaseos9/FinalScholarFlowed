import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck, GraduationCap } from 'lucide-react';
import { ScholarFlowLogo } from './ScholarFlowLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-2xs">
                <ScholarFlowLogo size="sm" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Scholar<span className="text-indigo-400">Flow</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              An institutional scholarship and financial aid management platform designed for transparent evaluations, paperless grant processing, and real-time student tracking.
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Academic Excellence • Equity • Opportunity
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#scholarships" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>Browse Scholarship Programs</span>
                </a>
              </li>
              <li>
                <a href="#tracker" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>Application Status Tracker</span>
                </a>
              </li>
              <li>
                <a href="#requirements" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>Eligibility & Requirements Guide</span>
                </a>
              </li>
              <li>
                <a href="#faq" className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1">
                  <span>Frequently Asked Questions</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Academic Aid Office
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Student Services Center, University Campus</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+1 (800) 555-0199</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>aid@scholarflow.edu</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Data Privacy & Security */}
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center space-x-2 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Security & Data Integrity
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All submitted student documents, identification cards, and financial statements are securely handled and strictly restricted to authorized scholarship review committees.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {new Date().getFullYear()} ScholarFlow Platform. All rights reserved.</p>
          <p className="text-slate-400 font-medium">Enterprise Scholarship Operations System</p>
        </div>
      </div>
    </footer>
  );
};
