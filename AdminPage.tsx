import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  FileCheck2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Database,
  Lock,
  ArrowRight,
  Clock,
  Eye,
} from 'lucide-react';
import { ItemReport, ClaimRequest, UserProfile, AuditLogEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { listAllUsers } from '../services/authService';
import { updateItemReport, deleteItemReport, resolveItemReport } from '../services/itemService';
import { reviewClaimStatus } from '../services/claimService';
import { recordAuditLog, subscribeToAuditLogs } from '../services/auditService';
import { seedInitialCampusItemsIfEmpty } from '../services/seedService';
import { getCategoryIcon } from '../components/ItemCard';

interface AdminPageProps {
  items: ItemReport[];
  claims: ClaimRequest[];
  onViewItem: (item: ItemReport) => void;
}

type AdminTab = 'overview' | 'reports' | 'claims' | 'users' | 'audit';

export const AdminPage: React.FC<AdminPageProps> = ({
  items,
  claims,
  onViewItem,
}) => {
  const { userProfile, currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Directory & Audit states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [reportSearch, setReportSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (isAdmin) {
      listAllUsers()
        .then(setUsers)
        .catch((e) => console.warn('Could not list users:', e));

      const unsubAudit = subscribeToAuditLogs((logs) => setAuditLogs(logs));
      return () => unsubAudit();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600">
          This module is reserved exclusively for authorized CampusVault Safety Administrators.
        </p>
      </div>
    );
  }

  // Real Database Metrics
  const totalReports = items.length;
  const pendingClaims = claims.filter((c) => c.status === 'Pending').length;
  const verifiedUsersCount = users.length > 0 ? users.length : 1;
  const resolvedItemsCount = items.filter((i) => i.status === 'Returned / Resolved').length;

  const handleStatusChange = async (itemId: string, newStatus: any) => {
    try {
      await updateItemReport(itemId, { status: newStatus });
      await recordAuditLog({
        actorId: currentUser?.uid || '',
        actorEmail: userProfile?.email || '',
        action: 'UPDATE_ITEM_STATUS',
        targetType: 'item',
        targetId: itemId,
        details: `Updated item status to "${newStatus}"`,
      });
      alert(`Status changed to ${newStatus}`);
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleDeleteItem = async (item: ItemReport) => {
    if (!window.confirm(`Delete item "${item.itemName}" from database?`)) return;
    try {
      await deleteItemReport(item.id);
      await recordAuditLog({
        actorId: currentUser?.uid || '',
        actorEmail: userProfile?.email || '',
        action: 'DELETE_ITEM',
        targetType: 'item',
        targetId: item.id,
        details: `Deleted item "${item.itemName}"`,
      });
    } catch (e) {
      console.error(e);
      alert('Failed to delete item');
    }
  };

  const handleAdminReviewClaim = async (
    claim: ClaimRequest,
    decision: 'Approved' | 'Rejected' | 'Completed'
  ) => {
    const notes = adminNotes[claim.id] || '';
    try {
      await reviewClaimStatus(claim, decision, currentUser?.uid || 'admin', notes);
      await recordAuditLog({
        actorId: currentUser?.uid || '',
        actorEmail: userProfile?.email || '',
        action: `CLAIM_${decision.toUpperCase()}`,
        targetType: 'claim',
        targetId: claim.id,
        details: `Admin reviewed claim for item "${claim.itemTitle}": ${decision}. Notes: ${notes || 'None'}`,
      });
      alert(`Claim marked as ${decision}`);
    } catch (e) {
      console.error(e);
      alert('Failed to update claim');
    }
  };

  const handleSeedDemoData = async () => {
    setIsProcessing(true);
    try {
      const added = await seedInitialCampusItemsIfEmpty();
      if (added) {
        alert('Official campus records added to Firestore!');
      } else {
        alert('Database already has records.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Security Console</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Campus Lost & Found Administration
          </h2>
          <p className="text-xs text-slate-400">
            Manage reports, arbitrate claims, oversee registered users, and inspect immutable audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDemoData}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 hover:bg-teal-900/50 transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Seed Campus Records</span>
          </button>
        </div>
      </div>

      {/* Admin Module Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Reports</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalReports}
          </div>
          <p className="text-[11px] text-slate-400">Active and archived catalog</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-purple-600 uppercase tracking-wider">
            <span>Pending Claims</span>
            <FileCheck2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-600 tabular-nums">
            {pendingClaims}
          </div>
          <p className="text-[11px] text-slate-400">Awaiting administrative decision</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Verified Users</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tabular-nums">
            {verifiedUsersCount}
          </div>
          <p className="text-[11px] text-slate-400">Registered campus members</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-teal-600 uppercase tracking-wider">
            <span>Resolved Items</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-teal-600 tabular-nums">
            {resolvedItemsCount}
          </div>
          <p className="text-[11px] text-slate-400">Successfully returned</p>
        </div>
      </div>

      {/* Admin Module Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'reports', label: `Manage Reports (${items.length})` },
          { id: 'claims', label: `Claim Verification (${claims.length})` },
          { id: 'users', label: `Users Directory (${users.length})` },
          { id: 'audit', label: `Audit Log History (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Claims Needs Review */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Claims Requiring Verification ({pendingClaims})
                </h3>
                <button
                  onClick={() => setActiveTab('claims')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              {pendingClaims === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No claims currently waiting for review.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {claims
                    .filter((c) => c.status === 'Pending')
                    .slice(0, 4)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.itemTitle}</div>
                          <div className="text-slate-500">
                            Claimant: {c.claimantName} ({c.claimantEmail})
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('claims')}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Administrative Audit Events */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Recent Administrative Actions
                </h3>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View All Logs
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No administrative events recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] truncate">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reports Management */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports by title or ID..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="p-3">Item</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Location</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items
                  .filter((i) =>
                    i.itemName.toLowerCase().includes(reportSearch.toLowerCase()) ||
                    i.id.toLowerCase().includes(reportSearch.toLowerCase())
                  )
                  .map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CategoryIcon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <span className="font-semibold text-slate-900 max-w-[180px] truncate block">
                              {item.itemName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.ownerName}
                          <span className="text-[10px] text-slate-400 block">{item.ownerEmail}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.reportType === 'lost'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.reportType}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white font-medium"
                          >
                            <option value="Active">Active</option>
                            <option value="Claim Pending">Claim Pending</option>
                            <option value="Matched">Matched</option>
                            <option value="Returned / Resolved">Returned / Resolved</option>
                            <option value="Closed">Closed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate">
                          {item.location}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-blue-600"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Claims Verification */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['All', 'Pending', 'Approved', 'Rejected', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setClaimStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  claimStatusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {claims
              .filter((c) => claimStatusFilter === 'All' || c.status === claimStatusFilter)
              .map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase">
                        Claim #{claim.id}
                      </div>
                      <h4 className="font-bold text-base text-slate-900">
                        {claim.itemTitle}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">Claimant:</span>
                      <div>Name: <strong>{claim.claimantName}</strong></div>
                      <div>Email: {claim.claimantEmail}</div>
                      <div>Filed: {new Date(claim.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 block">Explanation:</span>
                      <p>{claim.explanation}</p>
                    </div>
                  </div>

                  {claim.identifyingDetails && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-mono">
                      <strong>Private Verification Proofs:</strong> {claim.identifyingDetails}
                    </div>
                  )}

                  {claim.status === 'Pending' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <input
                        type="text"
                        placeholder="Admin notes or instructions for claimant..."
                        value={adminNotes[claim.id] || ''}
                        onChange={(e) =>
                          setAdminNotes({ ...adminNotes, [claim.id]: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdminReviewClaim(claim, 'Approved')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                        >
                          Approve Ownership Claim
                        </button>
                        <button
                          onClick={() => handleAdminReviewClaim(claim, 'Rejected')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                        >
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 4: Users Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">ID / Number</th>
                  <th className="p-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{u.fullName}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3 text-slate-600">{u.department || 'Campus'}</td>
                    <td className="p-3 text-slate-600 font-mono">{u.studentId || 'N/A'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Log History */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-bold text-base text-slate-900">
            Administrative Audit Trail (Immutable Records)
          </h3>
          <p className="text-xs text-slate-500">
            Every administrative decision, status change, and verification is logged for accountability.
          </p>

          <div className="space-y-2 pt-2">
            {auditLogs.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-400">
                No administrative events recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                        Target: {log.targetType}/{log.targetId}
                      </span>
                    </div>
                    <p className="text-slate-600">{log.details}</p>
                    <div className="text-[11px] text-slate-400">
                      By: {log.actorEmail}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
