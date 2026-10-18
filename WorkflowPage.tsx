import React from 'react';
import {
  Globe,
  LogIn,
  LayoutDashboard,
  Database,
  Search,
  ShieldCheck,
  CheckCircle2,
  ArrowDown,
  ArrowRight,
  GitFork,
  AlertTriangle,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { NavigationTab } from '../components/Sidebar';

interface WorkflowPageProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const WorkflowPage: React.FC<WorkflowPageProps> = ({ onSelectTab }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
          <GitFork className="w-3.5 h-3.5" />
          <span>CampusVault Operational Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          System Workflow & Life Cycle
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          An end-to-end interactive visual map of how lost and found items flow from initial report to verified campus return.
        </p>
      </div>

      {/* Visual Flow Diagram */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-10 space-y-6">
        {/* Step 1: START */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-widest shadow-xs">
            START
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 2: Open Website / App */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-slate-900 text-white flex items-center gap-4 shadow-sm border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm">1. Open Website / Web App</div>
              <div className="text-xs text-slate-400">CampusVault landing portal loaded with live statistics</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 3: Login / Register */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center gap-4 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">2. Login / Register with College Email</div>
              <div className="text-xs text-blue-800">Firebase Auth validates identity, student ID, and role permissions</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 4: Choose Role / Enter Dashboard (3 Branches) */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            3. Choose Action / Role Branch
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Branch A: Reporter */}
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>Reporter Role</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Report Lost / Found</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit item photo, location, category, date, and distinguishing features into Firestore.
              </p>
              <button
                onClick={() => onSelectTab('report-lost')}
                className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Try Reporting</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Branch B: Owner / Claimant */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wide">
                <Search className="w-4 h-4" />
                <span>Claimant Role</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Search & Claim Item</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use relevance matching filters and submit confidential ownership verification proofs.
              </p>
              <button
                onClick={() => onSelectTab('search-match')}
                className="text-xs font-bold text-teal-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Try Search & Match</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Branch C: Admin */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Role</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">Verify & Manage</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review claims, inspect serial numbers or private marks, arbitrate handovers, and audit logs.
              </p>
              <button
                onClick={() => onSelectTab('admin')}
                className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Open Admin Console</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <ArrowDown className="w-5 h-5 text-slate-400 my-4" />
        </div>

        {/* Step 5: Database Update */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-teal-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">4. Cloud Firestore Persistent Storage</div>
              <div className="text-xs text-slate-500">Atomic document creation with strict attribute-based security rules</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 6: Search & Matching Engine */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">5. Smart Search & Matching</div>
              <div className="text-xs text-teal-800">Deterministic scoring across name tokens, category, location, and date proximity</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 7: Verification */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">6. Ownership Proof Verification</div>
              <div className="text-xs text-indigo-800">Claimant provides confidential details verified by reporter or campus desk</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 8: Return Handover & Close */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">7. Handover & Case Closure</div>
              <div className="text-xs text-emerald-800">Status marked as "Returned / Resolved" and archived from active search</div>
            </div>
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
        </div>

        {/* Step 9: END */}
        <div className="flex flex-col items-center">
          <div className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest shadow-xs">
            END · ITEM REUNITED 🎉
          </div>
        </div>
      </div>
    </div>
  );
};
