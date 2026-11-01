import React, { useState, useEffect, useRef } from 'react';
import FieldError from '../../components/common/FieldError';
import { getInputErrorClass, focusFirstError } from '../../utils/validation';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(''); // 'suspend', 'reactivate', 'role'
  const [actionReason, setActionReason] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetAdminRole, setTargetAdminRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const actionReasonRef = useRef(null);

  const isAnalyst = currentUser?.adminRole === 'analyst';
  const isOwner = currentUser?.adminRole === 'owner';

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminUsers({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setUsers(res.users || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load user directory.');
      }
    } catch (err) {
      setError(err.message || 'Error fetching users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setActionReason('');
    setTargetRole(user.role || 'candidate');
    setTargetAdminRole(user.adminRole || 'ops_admin');
    setActionMessage({ text: '', type: '' });
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setActionType('');
    setActionReason('');
    setActionMessage({ text: '', type: '' });
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    setActionMessage({ text: '', type: '' });

    try {
      if (actionType === 'suspend' || actionType === 'reactivate') {
        const nextStatus = actionType === 'suspend' ? 'suspended' : 'active';
        const res = await api.updateAdminUserStatus(selectedUser._id, {
          status: nextStatus,
          reason: actionReason
        });
        if (res.success) {
          setActionMessage({ text: res.message || 'Status updated successfully.', type: 'success' });
          setTimeout(() => {
            handleCloseModal();
            fetchUsers();
          }, 1200);
        }
      } else if (actionType === 'role') {
        const res = await api.updateAdminUserRole(selectedUser._id, {
          role: targetRole,
          adminRole: targetRole === 'admin' ? targetAdminRole : null
        });
        if (res.success) {
          setActionMessage({ text: 'User role updated successfully.', type: 'success' });
          setTimeout(() => {
            handleCloseModal();
            fetchUsers();
          }, 1200);
        }
      }
    } catch (err) {
      setActionMessage({ text: err.message || 'Operation failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>User Management & Governance</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse accounts, review administrative tiers, and manage account access with safeguards.
          </p>
        </div>
        {isAnalyst && (
          <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
            Read-Only Analyst: Mutations Disabled
          </span>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form noValidate onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B1B1B] border border-[#303030] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="candidate">Candidate</option>
            <option value="company">Company</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
            <span>Loading user directory...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No matching user records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Admin Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {users.map((u) => {
                  const isCurrent = (currentUser?._id || currentUser?.id) === u._id;
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u._id} className="hover:bg-[#181818]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200">{u.name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                        {u.companyName && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{u.companyName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.adminRole ? (
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            u.adminRole === 'owner'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : u.adminRole === 'ops_admin'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}>
                            {u.adminRole}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          isSuspended
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                          <span className="capitalize">{u.status || 'active'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* Suspend / Reactivate Button */}
                        <button
                          disabled={isAnalyst || isCurrent}
                          onClick={() => handleOpenAction(u, isSuspended ? 'reactivate' : 'suspend')}
                          title={isCurrent ? 'Cannot modify self' : isAnalyst ? 'Analyst read-only' : ''}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
                            isCurrent || isAnalyst
                              ? 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500 border-zinc-700'
                              : isSuspended
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>

                        {/* Change Role Button (Owner only) */}
                        {isOwner && (
                          <button
                            onClick={() => handleOpenAction(u, 'role')}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#1F1F1F] hover:bg-[#2A2A2A] text-zinc-300 border border-[#333333] transition-colors"
                          >
                            Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-[#262626] bg-[#161616] flex items-center justify-between text-xs text-zinc-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-[#1B1B1B] hover:bg-[#252525] disabled:opacity-40 rounded border border-[#303030] text-zinc-300 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-[#1B1B1B] hover:bg-[#252525] disabled:opacity-40 rounded border border-[#303030] text-zinc-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Action Consequential Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl border ${
                actionType === 'suspend'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : actionType === 'reactivate'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {actionType === 'suspend' ? <Ban className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">{actionType} User Account</h3>
                <p className="text-xs text-zinc-400">{selectedUser.email}</p>
              </div>
            </div>

            {actionMessage.text && (
              <div className={`p-3 rounded-lg text-xs mb-4 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {actionMessage.text}
              </div>
            )}

            <form noValidate onSubmit={handleSubmitAction} className="space-y-4">
              {actionType === 'suspend' || actionType === 'reactivate' ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Operational Reason {actionType === 'suspend' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    id="admin-user-reason"
                    ref={actionReasonRef}
                    rows={3}
                    placeholder={
                      actionType === 'suspend'
                        ? 'Describe violation or reason for suspension...'
                        : 'Reason for reactivation...'
                    }
                    value={actionReason}
                    onChange={(e) => {
                      setActionReason(e.target.value);
                      if (fieldErrors.actionReason) setFieldErrors((prev) => ({ ...prev, actionReason: '' }));
                    }}
                    aria-invalid={!!fieldErrors.actionReason}
                    aria-describedby={fieldErrors.actionReason ? 'admin-user-reason-error' : undefined}
                    className={`w-full bg-[#1F1F1F] border ${getInputErrorClass(
                      fieldErrors.actionReason,
                      'border-[#333333] focus:border-emerald-500',
                      'border-[#EF4444]/60 focus:border-[#EF4444]'
                    )} rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors`}
                  />
                  <FieldError id="admin-user-reason-error" error={fieldErrors.actionReason} />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    This action will be appended to the immutable administrative audit log.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Account Role</label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="company">Company</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {targetRole === 'admin' && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Admin Security Tier</label>
                      <select
                        value={targetAdminRole}
                        onChange={(e) => setTargetAdminRole(e.target.value)}
                        className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ops_admin">Operations Admin</option>
                        <option value="analyst">Read-Only Analyst</option>
                        <option value="owner">Platform Owner</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] rounded-lg text-xs font-medium text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50 ${
                    actionType === 'suspend'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {actionLoading ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
