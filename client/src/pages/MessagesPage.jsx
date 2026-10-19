import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Check, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const activeContact = {
    name: 'Rodrigo Feynman Silva',
    title: 'Senior Frontend & React Engineer • São Paulo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    id: 'cand-001'
  };

  const fetchMessages = async () => {
    try {
      const res = await api.getMessages();
      setMessages(res?.data || []);
    } catch (err) {
      console.warn('Messages fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      await api.sendMessage({
        conversationId: 'conv-cand-001',
        senderId: user?._id || 'usr-company-001',
        senderName: user?.name || 'Richard Feynman',
        senderRole: user?.role || 'company',
        recipientId: activeContact.id,
        recipientName: activeContact.name,
        content: text.trim()
      });
      setText('');
      fetchMessages();
    } catch (err) {
      console.warn('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#303030]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#F5F5F5]" />
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Direct Messaging</h1>
        </div>
        <p className="text-xs text-[#777777] mt-1">
          Coordinate technical evaluations and communication directly with Latin American candidates.
        </p>
      </div>

      {/* Main Messaging Interface */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        {/* Left Contacts Column */}
        <div className="md:col-span-4 border-r border-[#303030] p-4 bg-[#101010]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] block mb-3 px-2">
            Active Candidates
          </span>

          <div className="space-y-1.5">
            <div className="p-3 rounded-2xl bg-[#202020] border border-[#303030] flex items-center gap-3 cursor-pointer">
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-10 h-10 rounded-xl object-cover border border-[#303030] shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#F5F5F5] truncate">{activeContact.name}</p>
                <p className="text-[10px] text-[#777777] truncate">Senior React Engineer</p>
                <span className="text-[9px] text-[#10B981] font-medium block mt-0.5">Online • São Paulo</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl hover:bg-[#171717] flex items-center gap-3 cursor-pointer opacity-70">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                alt="Camila Fernandez"
                className="w-10 h-10 rounded-xl object-cover border border-[#303030] shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[#D4D4D4] truncate">Camila Fernandez</p>
                <p className="text-[10px] text-[#777777] truncate">Lead Frontend • Buenos Aires</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chat Column */}
        <div className="md:col-span-8 flex flex-col justify-between bg-[#171717]">
          {/* Active Chat Header */}
          <div className="px-6 py-4 border-b border-[#303030] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeContact.avatar}
                alt={activeContact.name}
                className="w-9 h-9 rounded-xl object-cover border border-[#303030]"
              />
              <div>
                <h3 className="text-xs font-bold text-[#F5F5F5]">{activeContact.name}</h3>
                <p className="text-[10px] text-[#777777]">{activeContact.title}</p>
              </div>
            </div>
            <span className="text-[10px] text-[#10B981] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
              Live
            </span>
          </div>

          {/* Messages Scroll Body */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-[400px] flex-1">
            {loading ? (
              <div className="text-center text-xs text-[#777777] py-12">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-xs text-[#777777] py-12">
                No conversation history yet. Send a greeting to initiate the technical sync.
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderRole === 'company' || m.senderId === user?._id;
                return (
                  <div key={m._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-[#777777] mb-1 px-1">
                      {isMe ? 'You' : m.senderName}
                    </span>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#F5F5F5] text-[#090909] font-medium'
                          : 'bg-[#202020] border border-[#303030] text-[#F5F5F5]'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-[#303030] bg-[#101010] flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message to discuss roles, tech stack, or interview availability..."
              className="flex-1 bg-[#202020] border border-[#303030] rounded-xl px-4 py-2.5 text-xs text-[#F5F5F5] placeholder-[#777777] focus:outline-none focus:border-[#505050]"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              loading={sending}
              disabled={!text.trim()}
              className="px-4 py-2.5 text-xs font-semibold"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
