import React, { useState } from 'react';
import { X, Trash2, Plus, AtSign } from 'lucide-react';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: string[];
  onAddAccount: (username: string) => void;
  onRemoveAccount: (username: string) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddAccount,
  onRemoveAccount,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Manage Accounts</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          
          {/* Add Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Twitter Account
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
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Watching {accounts.length} accounts
            </h3>
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No accounts added yet.
              </div>
            ) : (
              accounts.map((acc) => (
                <div 
                  key={acc}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
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

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
