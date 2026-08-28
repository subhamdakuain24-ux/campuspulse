import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Clock,
  BookOpen,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { initialChatMessages } from '../data/mockData';
import { ChatMessage } from '../types';
import { CampusPulseLogo } from '../components/CampusPulseLogo';

export const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    'What is my next exam and syllabus status?',
    'How do I fix my Algorithms attendance shortage?',
    'What assignments are due today?',
    'Give me a 2-day study plan for Data Structures',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Generate intelligent contextual response
    setTimeout(() => {
      let replyText = '';
      let suggestions: string[] = [];

      const lower = query.toLowerCase();
      if (lower.includes('exam') || lower.includes('data structures') || lower.includes('syllabus')) {
        replyText = `📅 **Next Exam Alert: Data Structures & Algorithms**\n\n- **Date & Time:** Oct 26, 2023 at 10:00 AM – 1:00 PM\n- **Location:** Room 402, CS Building\n- **Current Preparation:** 85% Syllabus covered.\n\n💡 **Top Priority Topics to Review:**\n1. **Dynamic Programming:** Knapsack & Longest Common Subsequence (65% master level)\n2. **Graph Algorithms:** Dijkstra's shortest path & Prim's MST\n3. **Binary Search Tree Balances:** AVL Rotations.`;
        suggestions = ['Explain Dijkstra’s algorithm step-by-step', 'Generate 3 practice questions for Trees'];
      } else if (lower.includes('attendance') || lower.includes('algorithms') || lower.includes('shortage')) {
        replyText = `⚠️ **Attendance Analysis for Alex:**\n\n- **Overall Attendance:** **82%** (Safe, above the 75% university requirement).\n- **Risk Alert:** **Algorithms (CS303)** is currently at **68%** (24/35 classes attended).\n\n🎯 **Action Plan:** You need to attend the next **2 consecutive classes** without missing any to bring CS303 back to **75.6%**!`;
        suggestions = ['When is the next Algorithms lecture?', 'Show full attendance breakdown'];
      } else if (lower.includes('assignment') || lower.includes('due') || lower.includes('project')) {
        replyText = `📋 **Pending Coursework Deadlines:**\n\n1. 🔴 **Final Project Proposal** (CS101)\n   - **Deadline:** **Tonight at 11:59 PM** (High Priority)\n2. 🟠 **Essay 2: The Great Gatsby** (ENG301)\n   - **Deadline:** Oct 26, 5:00 PM (Draft Saved)\n3. 🟢 **Weekly Problem Set 5** (MATH202)\n   - **Deadline:** Oct 30, 11:59 PM`;
        suggestions = ['Help me outline my CS101 Final Project Proposal', 'Check completed assignments'];
      } else if (lower.includes('study plan') || lower.includes('plan')) {
        replyText = `⏱️ **2-Day Cram & Master Schedule for Data Structures:**\n\n**Day 1 (Today):**\n- **04:00 PM - 06:00 PM:** Trees & Graphs (AVL Rotations, BFS/DFS, Dijkstra)\n- **07:30 PM - 09:30 PM:** Dynamic Programming memoization patterns\n\n**Day 2 (Tomorrow):**\n- **10:00 AM - 12:30 PM:** Solve 2022 & 2021 Mid-term Past Question Papers\n- **03:00 PM - 05:00 PM:** Quick Formula & Time Complexity Cheat Sheet Revision\n- **08:00 PM:** Rest early before 10 AM exam.`;
        suggestions = ['Show Time Complexity cheat sheet', 'Explain BFS vs DFS'];
      } else {
        replyText = `I analyzed your student records for Semester 5 (Fall 2023). You currently have **GPA 3.8**, **82% overall attendance**, and **3 pending assignments**. Feel free to ask me to explain any engineering concept, summarize lectures, or organize your exam prep!`;
        suggestions = ['What is my next exam?', 'What assignments are due today?'];
      }

      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 750);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>CampusPulse AI Assistant</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                Connected
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Context: Alex Johnson (CS, 5th Sem) • Real-time schedule &amp; syllabus integration
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages(initialChatMessages)}
          title="Clear Chat"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-blue-600 border border-slate-200'
                }`}
              >
                {isUser ? 'AJ' : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[82%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>

                {/* Timestamp & Copy Action */}
                <div
                  className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.text)}
                      className="hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Suggested follow up chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestions.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip)}
                        className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 px-3 py-1.5 rounded-full transition-all text-left"
                      >
                        ⚡ {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts on empty or initial view */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/40 overflow-x-auto flex gap-2 no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            className="shrink-0 text-xs text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50/50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about exams, timetable, assignments, or concepts..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl shadow-xs transition-all flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
