import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Check, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [activeContact, setActiveContact] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await api.getMessages();
      const nextMessages = res?.data || [];
      setMessages(nextMessages);
      if (nextMessages.length > 0) {
        const first = nextMessages[0];
        const isSender = first.senderId === user?._id;
        setActiveContact({
          id: isSender ? first.recipientId : first.senderId,
          name: isSender ? first.recipientName : first.senderName,
          conversationId: first.conversationId
        });
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load authorized conversations.');
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
      if (!activeContact) throw new Error('Select a persisted conversation before sending a message.');
      await api.sendMessage({
        conversationId: activeContact.conversationId,
        recipientId: activeContact.id,
        recipientName: activeContact.name,
        content: text.trim()
      });
      setText('');
      fetchMessages();
    } catch (err) {
      setError(err.message || 'Unable to send message.');
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

      {error && <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-xs text-[#F87171]">{error}</div>}
      {/* Main Messaging Interface */}
      <div className="bg-[#171717] border border-[#303030] rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
        {/* Left Contacts Column */}
        <div className="md:col-span-4 border-r border-[#303030] p-4 bg-[#101010]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] block mb-3 px-2">
            Active Candidates
          </span>

          <div className="space-y-1.5">
            {activeContact ? <div className="p-3 rounded-2xl bg-[#202020] border border-[#303030] flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#171717] border border-[#303030] flex items-center justify-center text-xs text-[#A3A3A3]">{activeContact.name.slice(0, 1)}</div>
              <div className="overflow-hidden"><p className="text-xs font-bold text-[#F5F5F5] truncate">{activeContact.name}</p><p className="text-[10px] text-[#777777] truncate">Persisted conversation</p></div>
            </div> : <p className="px-2 py-8 text-center text-xs text-[#777777]">No authorized conversations yet.</p>}
          </div>
        </div>

        {/* Right Chat Column */}
        <div className="md:col-span-8 flex flex-col justify-between bg-[#171717]">
          {/* Active Chat Header */}
          <div className="px-6 py-4 border-b border-[#303030] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#202020] border border-[#303030] flex items-center justify-center text-xs text-[#A3A3A3]">{activeContact?.name?.slice(0, 1) || '?'}</div>
              <div>
                <h3 className="text-xs font-bold text-[#F5F5F5]">{activeContact?.name || 'No conversation selected'}</h3>
                <p className="text-[10px] text-[#777777]">{activeContact ? 'Authorized conversation' : 'Select a conversation to begin'}</p>
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
              disabled={!text.trim() || !activeContact}
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
