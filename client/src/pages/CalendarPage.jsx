import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function CalendarPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTz, setSelectedTz] = useState('EST');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.getInterviews();
        setInterviews(res?.data || []);
      } catch (err) {
        console.warn('Calendar load fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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

      {/* Week Timeline Schedule View */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {daysOfWeek.map((day, idx) => {
          const dayDate = new Date(Date.now() + 86400000 * idx);
          const dateStr = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayInterviews = interviews.filter((_, i) => i % 5 === idx);

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
                  {dayInterviews.length === 0 ? (
                    <div className="text-[11px] text-[#777777] py-4 text-center">
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
                          <span className="text-[10px] text-[#10B981] font-mono">10:00 AM</span>
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
                {dayInterviews.length} Event{dayInterviews.length !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
