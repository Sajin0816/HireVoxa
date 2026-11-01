import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  LifeBuoy,
  Search,
  Plus,
  RefreshCw,
  X,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Send
} from 'lucide-react';

export default function AdminSupportPage() {
  const { user: currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail / note state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // New Ticket Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('general');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [ticketUserEmail, setTicketUserEmail] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createFeedback, setCreateFeedback] = useState({ text: '', type: '' });

  const isAnalyst = currentUser?.adminRole === 'analyst';

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getAdminSupportTickets({
        search,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setTickets(res.tickets || []);
        setTotalPages(res.totalPages || 1);
      } else {
        setError('Failed to load support tickets.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with support service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setNewNote('');
  };

  const handleUpdateStatus = async (ticketId, nextStatus) => {
    try {
      const res = await api.updateAdminSupportTicket(ticketId, { status: nextStatus });
      if (res.success) {
        setSelectedTicket(res.ticket);
        fetchTickets();
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedTicket) return;
    setSubmittingNote(true);
    try {
      const res = await api.addAdminSupportTicketNote(selectedTicket._id, { note: newNote.trim() });
      if (res.success) {
        setSelectedTicket(res.ticket);
        setNewNote('');
        fetchTickets();
      }
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    setCreatingTicket(true);
    setCreateFeedback({ text: '', type: '' });
    try {
      const res = await api.createAdminSupportTicket({
        subject: ticketSubject.trim(),
        description: ticketDesc.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        userEmail: ticketUserEmail.trim() || currentUser?.email
      });
      if (res.success) {
        setCreateFeedback({ text: 'Support ticket logged.', type: 'success' });
        setTimeout(() => {
          setShowCreateModal(false);
          setTicketSubject('');
          setTicketDesc('');
          setTicketUserEmail('');
          fetchTickets();
        }, 1000);
      }
    } catch (err) {
      setCreateFeedback({ text: err.message || 'Failed to open ticket.', type: 'error' });
    } finally {
      setCreatingTicket(false);
    }
  };

  const priorityBadge = (priority) => {
    const colors = {
      urgent: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      medium: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      low: 'bg-zinc-800 text-zinc-400 border-zinc-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    );
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span className="capitalize">{status}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="w-3 h-3" />
            <span>In Progress</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertCircle className="w-3 h-3" />
            <span>Open</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <LifeBuoy className="w-5 h-5 text-rose-400" />
            <span>Support & Operational Incident Management</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track reported platform bugs, candidate timezone mismatches, company verification requests, and add internal notes.
          </p>
        </div>

        <button
          disabled={isAnalyst}
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Open Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#141414] border border-[#262626] rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by subject, ID, or user email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B1B1B] border border-[#303030] rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="bg-[#1B1B1B] border border-[#303030] rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={fetchTickets}
            className="p-2 bg-[#1B1B1B] hover:bg-[#242424] border border-[#303030] rounded-lg text-zinc-300 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400 mb-2" />
            <span>Loading support queue...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            No support tickets match the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#181818] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Subject & User</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {tickets.map((t) => (
                  <tr key={t._id} className="hover:bg-[#181818]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-rose-400">
                      {t.ticketNumber || t._id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">{t.subject}</div>
                      <div className="text-[11px] text-zinc-500">{t.userEmail || 'Internal Operator'}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-zinc-400">{t.category || 'general'}</td>
                    <td className="py-3.5 px-4">{priorityBadge(t.priority || 'medium')}</td>
                    <td className="py-3.5 px-4">{statusBadge(t.status || 'open')}</td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenTicket(t)}
                        className="px-3 py-1 rounded text-[11px] font-medium bg-[#1F1F1F] hover:bg-[#2A2A2A] text-zinc-300 border border-[#333333] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* Ticket Details & Notes Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#262626] pb-4 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-rose-400 mb-1">
                <span>{selectedTicket.ticketNumber}</span>
                <span>•</span>
                <span className="capitalize">{selectedTicket.category}</span>
              </div>
              <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
              <p className="text-xs text-zinc-400 mt-2 bg-[#121212] p-3 rounded-lg border border-[#222222]">
                {selectedTicket.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Status:</span>
                  {statusBadge(selectedTicket.status)}
                </div>
                {!isAnalyst && (
                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'in_progress')}
                        className="px-2 py-1 rounded text-[11px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      >
                        Set In Progress
                      </button>
                    )}
                    {selectedTicket.status !== 'resolved' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                        className="px-2 py-1 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Internal Operational Notes
              </h4>
              {selectedTicket.notes && selectedTicket.notes.length > 0 ? (
                selectedTicket.notes.map((n, idx) => (
                  <div key={idx} className="bg-[#121212] border border-[#222222] p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="font-semibold text-zinc-300">{n.authorName || 'Staff'}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-300">{n.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-600 italic">No operational notes recorded yet.</p>
              )}
            </div>

            {/* Add Note Form */}
            {!isAnalyst && (
              <form onSubmit={handleAddNote} className="border-t border-[#262626] pt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add internal investigation note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-[#1F1F1F] border border-[#333333] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Open New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#303030] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Open Support Incident</h3>
            <p className="text-xs text-zinc-400 mb-4">Log a platform inquiry or candidate report.</p>

            {createFeedback.text && (
              <div className={`p-3 rounded-lg text-xs mb-4 ${
                createFeedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {createFeedback.text}
              </div>
            )}

            <form onSubmit={handleCreateTicketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of the issue..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Full details of the incident or reported behavior..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="general">General Support</option>
                    <option value="interview">Interview & Calendar</option>
                    <option value="verification">Company Verification</option>
                    <option value="account">Account Access</option>
                    <option value="billing">Billing / Payment Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Associated User Email (Optional)</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={ticketUserEmail}
                  onChange={(e) => setTicketUserEmail(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] rounded-lg text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
                >
                  {creatingTicket ? 'Submitting...' : 'Log Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
