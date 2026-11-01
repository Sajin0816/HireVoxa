import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Video, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';

export default function CalendarPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTz, setSelectedTz] = useState('EST');
  const [weekOffset, setWeekOffset] = useState(0);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getInterviews();
      setInterviews(res?.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load interview calendar events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Calculate Monday of the target week based on weekOffset
  const getMonday = (offsetWeeks = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const currentMonday = getMonday(weekOffset);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#303030]">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#F5F5F5]" />
            <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Hiring Calendar & Timeline</h1>
          </div>
          <p className="text-xs text-[#777777] mt-1">
            Persisted interview events aligned with US and Latin American timezones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#303030] bg-[#202020] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              title="Previous week"
              aria-label="Previous week"
              className="p-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 text-xs text-[#A3A3A3] hover:text-[#F5F5F5] border-x border-[#303030] transition-colors"
            >
              {weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              title="Next week"
              aria-label="Next week"
              className="p-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-[#777777]">Timezone:</span>
          <select
            value={selectedTz}
            onChange={(e) => setSelectedTz(e.target.value)}
            className="bg-[#202020] border border-[#303030] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-[#505050]"
          >
            <option value="EST">Eastern Time (EST)</option>
            <option value="CST">Central Time (CST)</option>
            <option value="PST">Pacific Time (PST)</option>
            <option value="BRT">Brasília Time (BRT)</option>
          </select>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#F87171] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadInterviews}
            disabled={loading}
            className="text-xs self-start sm:self-auto shrink-0"
          >
            Retry Sync
          </Button>
        </div>
      )}

      {/* Week Timeline Schedule View */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {daysOfWeek.map((day, idx) => {
          const colDate = new Date(currentMonday);
          colDate.setDate(currentMonday.getDate() + idx);
          const dateStr = colDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayInterviews = interviews.filter((item) => {
            const proposed = new Date(item.proposedDate);
            if (Number.isNaN(proposed.getTime())) return false;
            return (
              proposed.getFullYear() === colDate.getFullYear() &&
              proposed.getMonth() === colDate.getMonth() &&
              proposed.getDate() === colDate.getDate()
            );
          });

          return (
            <div
              key={day}
              className="bg-[#171717] border border-[#303030] rounded-2xl p-4 flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="pb-3 border-b border-[#303030] mb-3">
                  <h3 className="font-bold text-sm text-[#F5F5F5]">{day}</h3>
                  <span className="text-[11px] font-mono text-[#777777]">{dateStr}</span>
                </div>

                <div className="space-y-2.5">
                  {loading ? (
                    <div className="space-y-2 py-2">
                      <div className="h-16 rounded-xl bg-[#202020]/70 border border-[#303030]/60 animate-pulse" />
                      <div className="h-16 rounded-xl bg-[#202020]/40 border border-[#303030]/40 animate-pulse" />
                    </div>
                  ) : error ? (
                    <div className="text-[11px] text-[#EF4444]/80 py-6 text-center">
                      Events unavailable
                    </div>
                  ) : dayInterviews.length === 0 ? (
                    <div className="text-[11px] text-[#777777] py-6 text-center">
                      No sessions scheduled
                    </div>
                  ) : (
                    dayInterviews.map((item) => (
                      <div
                        key={item._id}
                        className="p-3 rounded-xl bg-[#202020] border border-[#303030] text-xs hover:border-[#404040] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[#F5F5F5] truncate max-w-[110px]">
                            {item.candidateName}
                          </span>
                          <span className="text-[10px] text-[#10B981] font-mono">
                            {new Date(item.proposedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#777777] truncate">{item.jobTitle}</p>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-[#A3A3A3]">
                          <span className="flex items-center gap-1">
                            <Video className="w-3 h-3 text-[#777777]" />
                            <span>Video Sync</span>
                          </span>
                          <span className="font-mono">{selectedTz}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#303030] text-[10px] text-[#777777] text-center">
                {loading ? (
                  <span className="animate-pulse text-[#777777]">Syncing schedule...</span>
                ) : error ? (
                  <span className="text-[#EF4444]">Sync failed</span>
                ) : (
                  `${dayInterviews.length} Event${dayInterviews.length !== 1 ? 's' : ''}`
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
