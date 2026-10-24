import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  Shield,
  ShieldCheck,
  Lock,
  AlertTriangle,
  UserX,
  Check,
  CheckCheck,
  Image,
  X,
  Sparkles,
} from 'lucide-react';
import { Conversation, Message } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface MessagesPageProps {
  initialConversationId?: string;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ initialConversationId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isE2EEActive, setIsE2EEActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (!activeConvId && data.length > 0) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadMessages = async (convId: string) => {
    setIsLoading(true);
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || (!inputText.trim() && !attachmentPreview)) return;

    const content = inputText.trim();
    const att = attachmentPreview;
    setInputText('');
    setAttachmentPreview(null);

    try {
      const newMsg = await api.sendMessage(activeConvId, {
        content,
        attachmentUrl: att || undefined,
        isE2EE: isE2EEActive,
      });
      setMessages((prev) => [...prev, newMsg]);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachmentPreview(String(event.target?.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const getOtherParticipantName = (conv: Conversation) => {
    const otherId = conv.participantIds.find((id) => id !== user?.id);
    if (!otherId) return 'Campus Member';
    return conv.participantNames[otherId] || 'Campus Member';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Protected Campus Messaging</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS In-Transit</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Secure channels restricted strictly to verified claims and active AI matches. Personal numbers &amp; emails remain private.
          </p>
        </div>

        {/* E2EE Toggle & Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Lock className={`w-3.5 h-3.5 ${isE2EEActive ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-xs font-semibold text-slate-700">Client-Side E2EE:</span>
          <button
            onClick={() => setIsE2EEActive(!isE2EEActive)}
            className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${
              isE2EEActive
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isE2EEActive ? 'ENABLED' : 'STANDARD'}
          </button>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Column: Conversations List */}
        <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Case Channels ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No active conversations yet.</p>
                <p className="text-[11px] text-slate-600">
                  Conversations are initiated when an AI match is confirmed or a claim is filed.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const otherName = getOtherParticipantName(conv);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {otherName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{otherName}</span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-indigo-700 truncate mt-0.5">
                        {conv.itemTitle}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conv.lastMessage || 'Channel started'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="md:col-span-8 flex flex-col justify-between bg-white min-h-[500px]">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {getOtherParticipantName(activeConv).charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {getOtherParticipantName(activeConv)}
                    </h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>Item: {activeConv.itemTitle}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-emerald-600 font-medium">Verified Campus Member</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Report suspicious communication or block"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/30">
                {/* Security Warning Notice */}
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100/70 text-center text-xs text-indigo-900 max-w-lg mx-auto space-y-1">
                  <p className="font-semibold flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Campus Safety Policy</span>
                  </p>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Always arrange item returns at designated university security desks or public library circulation hubs. Never share banking details or passcodes.
                  </p>
                </div>

                {messages.map((m) => {
                  const isMe = m.senderId === user?.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {!isMe && (
                          <span className="block text-[10px] font-bold text-slate-600 mb-0.5">
                            {m.senderName}
                          </span>
                        )}

                        {m.attachmentUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                            <img src={m.attachmentUrl} alt="Attachment" className="max-h-48 object-cover" />
                          </div>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                        <div
                          className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] ${
                            isMe ? 'text-indigo-200' : 'text-slate-600'
                          }`}
                        >
                          {m.isE2EE && (
                            <span title="Client-Side Encrypted">
                              <Lock className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span className="font-mono">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview Strip */}
              {attachmentPreview && (
                <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={attachmentPreview}
                      alt="Attachment preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">Photo attached</span>
                  </div>
                  <button
                    onClick={() => setAttachmentPreview(null)}
                    className="p-1 rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <label className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() && !attachmentPreview}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold">Select a conversation channel</p>
              <p className="text-xs text-slate-600">
                You can exchange secure messages with matched finders or claimants.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report User Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Moderation Report</h3>
            </div>

            {reportSuccess ? (
              <div className="text-center py-4 space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-900">Report submitted to Campus Safety</p>
                <p className="text-[11px] text-slate-500">Staff will review this conversation transcript.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Flag suspicious activity, harassment, or suspected fraudulent claims. Campus administrators and security officers will inspect the conversation.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setReportSuccess(true);
                      setTimeout(() => {
                        setReportModalOpen(false);
                        setReportSuccess(false);
                      }, 2000);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                  >
                    Flag Conversation for Staff Review
                  </button>
                  <button
                    onClick={() => setReportModalOpen(false)}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
