import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, AtSign, RotateCcw, Save } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: string[];
  onAddAccount: (username: string) => void;
  onRemoveAccount: (username: string) => void;
  customPrompt: string;
  onSavePrompt: (prompt: string) => void;
  defaultPrompt: string;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onRemoveAccount,
  customPrompt,
  onSavePrompt,
  defaultPrompt
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [localPrompt, setLocalPrompt] = useState(customPrompt);
  const [isPromptSaved, setIsPromptSaved] = useState(false);

  // Sync prop to local state when modal opens or prop changes
  useEffect(() => {
    setLocalPrompt(customPrompt);
  }, [customPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newUsername.trim().replace(/^@/, '');
    
    if (!cleaned) {
      setError("Username cannot be empty");
      return;
    }
    
    if (accounts.includes(cleaned)) {
      setError("Account already exists");
      return;
    }

    onAddAccount(cleaned);
    setNewUsername('');
    setError(null);
  };

  const handleSavePrompt = () => {
    onSavePrompt(localPrompt);
    setIsPromptSaved(true);
    setTimeout(() => setIsPromptSaved(false), 2000);
  };

  const handleResetPrompt = () => {
    
    
        setLocalPrompt(defaultPrompt);
        // Note: We do not auto-save here. The user must click "Save Changes" to persist the reset.
    
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Configuration</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Section: Accounts */}
          <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Twitter Accounts
              </h3>
              
              {/* Add Form */}
              <form onSubmit={handleSubmitAccount} className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Add New Account
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <AtSign size={16} />
                    </div>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value);
                        if(error) setError(null);
                      }}
                      placeholder="username"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-300'}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              </form>

              {/* List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar bg-slate-50 p-3 rounded-xl border border-slate-100">
                {accounts.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No accounts added yet.
                  </div>
                ) : (
                  accounts.map((acc) => (
                    <div 
                      key={acc}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {acc.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">@{acc}</span>
                      </div>
                      <button
                        onClick={() => onRemoveAccount(acc)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Remove account"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
          </section>

          <hr className="border-slate-100" />

          {/* Section: AI Configuration */}
          <section>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                      AI Analyst Instructions
                  </h3>
                  <button 
                    type="button"
                    onClick={handleResetPrompt}
                    className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                    title="Reset to default prompt"
                  >
                    <RotateCcw size={12} />
                    Reset Default
                  </button>
              </div>

              <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                      Customize how the AI summarizes the tweets. 
                      Click <span className="text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded">Save Changes</span> every time prompt is changed/reset. <br/><br/>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{'{{USERNAME}}'}</span> will be replaced with the handle. <br/>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{'{{TWEETS}}'}</span> will be replaced with the tweet content. <br/>
                      <strong className="text-slate-600 ml-1">Do not remove these placeholders.</strong>
                  </p>
                  
                  <div className="relative">
                      <textarea 
                          value={localPrompt}
                          onChange={(e) => setLocalPrompt(e.target.value)}
                          className="w-full h-48 p-4 text-sm font-mono text-slate-700 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-400 outline-none transition-all resize-y"
                          placeholder="Enter system prompt..."
                          spellCheck={false}
                      />
                  </div>

                  <div className="flex justify-end">
                      <button 
                          onClick={handleSavePrompt}
                          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                              isPromptSaved 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                          }`}
                      >
                          {isPromptSaved ? (
                              <>Saved!</>
                          ) : (
                              <>
                                <Save size={16} />
                                Save Changes
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};