import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, RefreshCw, Bot, AlertCircle } from 'lucide-react';
import { Tweet, Message } from '../types';
import { getFinancialSummary, getChatResponse } from '../services/llmService';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tweets: Tweet[];
  username: string;
  initialMessages?: Message[];
  initialHasSummarized?: boolean;
  onCacheUpdate: (messages: Message[], hasSummarized: boolean) => void;
  customPrompt?: string;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ 
  isOpen, 
  onClose, 
  tweets, 
  username,
  initialMessages = [],
  initialHasSummarized = false,
  onCacheUpdate,
  customPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSummarized, setHasSummarized] = useState(initialHasSummarized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Sync state changes to parent cache
  useEffect(() => {
    onCacheUpdate(messages, hasSummarized);
  }, [messages, hasSummarized, onCacheUpdate]);

  // Auto-summarize on open if not done yet
  useEffect(() => {
    if (isOpen && !hasSummarized && tweets.length >= 1 && !isLoading) {
      handleGenerateSummary();
    }
  }, [isOpen, hasSummarized, tweets, username]);

  const handleGenerateSummary = async () => {
    if (tweets.length === 0) return;

    setIsLoading(true);
    try {
      const summary = await getFinancialSummary(username, tweets, customPrompt);
      setMessages(prev => [
        ...prev, 
        { role: 'model', text: summary }
      ]);
      setHasSummarized(true);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: 'model', text: "Sorry, I encountered an error while analyzing the tweets." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    
    // Add user message
    const newHistory: Message[] = [...messages, { role: 'user', text: userQuestion }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const answer = await getChatResponse(username, tweets, messages, userQuestion);
      setMessages(prev => [...prev, { role: 'model', text: answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process your request right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-full lg:w-[400px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 shadow-xl lg:shadow-none z-30 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2 text-blue-600">
          <Sparkles size={20} className="fill-blue-100" />
          <h2 className="font-bold text-slate-800">AI Analyst</h2>
        </div>
        <div className="flex items-center gap-1">
             <button
                onClick={() => {
                    setMessages([]);
                    handleGenerateSummary();
                }}
                disabled={isLoading || tweets.length === 0}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate Summary"
            >
                <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
        {tweets.length < 5 && tweets.length > 0 && (
             <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex gap-2 text-yellow-700 text-xs mb-4">
                <AlertCircle size={16} className="flex-shrink-0" />
                <p>Analysis might be limited due to low tweet count ({tweets.length}).</p>
             </div>
        )}

        {tweets.length === 0 ? (
          <div className="text-center text-slate-400 mt-20 px-4">
            <Bot size={48} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No tweets available to analyze.</p>
          </div>
        ) : (
          <>
            {/* Initial Loader for Summary */}
            {messages.length === 0 && isLoading && (
                <div className="text-center text-slate-500 mt-10 p-4 animate-pulse">
                    <Sparkles size={32} className="mx-auto mb-3 text-blue-300" />
                    <p className="font-medium text-sm">Analyzing financial insights...</p>
                    <p className="text-xs text-slate-400 mt-1">Checking Stocks, Crypto, & Real Estate</p>
                </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}
                  `}
                >
                  {/* Simple Markdown-like bolding for key terms if Gemini returns asterisks */}
                  {msg.text.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator for Chat */}
            {messages.length > 0 && isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tweets.length > 0 ? "Ask about these tweets..." : "No context"}
            disabled={isLoading || tweets.length === 0}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || tweets.length === 0}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
        
        {messages.length > 0 && (
            <div className="flex justify-center mt-2">
                <button 
                    onClick={() => {
                        setMessages([]);
                        handleGenerateSummary();
                    }}
                    className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    disabled={isLoading}
                >
                    <RefreshCw size={10} />
                    Regenerate Summary
                </button>
            </div>
        )}
      </div>
    </div>
  );
};