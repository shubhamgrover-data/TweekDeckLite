import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RefreshCw, Bird, ChevronDown, UserPlus, AlertCircle, AlertTriangle } from 'lucide-react';
import { Tweet } from './types';
import { fetchTweetsForUser } from './services/tweetService';
import { TweetCard } from './components/TweetCard';
import { AccountSettingsModal } from './components/AccountSettingsModal';

// Included the user's test account 'BotChrome114342'
const DEFAULT_ACCOUNTS = ['SahilKapoor',  'OpenAI', 'SpaceX'];

const App: React.FC = () => {
  // --- State ---
  const [accounts, setAccounts] = useState<string[]>(() => {
    const saved = localStorage.getItem('twitter_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [selectedAccount, setSelectedAccount] = useState<string>(() => {
    const saved = localStorage.getItem('last_selected_account');
    // If saved account exists in current accounts list, use it, else use first one
    if (saved) {
      const savedAccounts = localStorage.getItem('twitter_accounts');
      const currentList = savedAccounts ? JSON.parse(savedAccounts) : DEFAULT_ACCOUNTS;
      if (currentList.includes(saved)) return saved;
    }
    return DEFAULT_ACCOUNTS[0];
  });

  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('twitter_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (selectedAccount) {
      localStorage.setItem('last_selected_account', selectedAccount);
    }
  }, [selectedAccount]);

  // --- Data Fetching ---
  const loadTweets = useCallback(async (username: string) => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    setTweets([]); // Clear current tweets while loading to show transition
    
    try {
      const data = await fetchTweetsForUser(username);
      if (data.length === 0) {
          // This isn't an error thrown by service, but a logical empty state
          // We don't set error here, handled by UI empty state
      }
      setTweets(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("App: Failed to fetch tweets", err);
      setError(err.message || "An unexpected error occurred while fetching tweets.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load or when selection changes
  useEffect(() => {
    loadTweets(selectedAccount);
  }, [selectedAccount, loadTweets]);

  // --- Handlers ---
  const handleAddAccount = (username: string) => {
    setAccounts(prev => [...prev, username]);
    // If it's the first account added, select it automatically
    if (accounts.length === 0) {
      setSelectedAccount(username);
    }
  };

  const handleRemoveAccount = (username: string) => {
    const newAccounts = accounts.filter(a => a !== username);
    setAccounts(newAccounts);
    
    if (selectedAccount === username) {
      // If we removed the currently selected account, select the first available, or empty
      setSelectedAccount(newAccounts.length > 0 ? newAccounts[0] : '');
      if (newAccounts.length === 0) {
        setTweets([]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 text-blue-500">
            <Bird size={28} strokeWidth={2.5} />
            <h1 className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">
              TweetDeck<span className="text-blue-500">Lite</span>
            </h1>
          </div>

          {/* Account Dropdown Selector */}
          <div className="relative group min-w-[180px]">
            {accounts.length > 0 ? (
              <div className="relative">
                 <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-blue-300 transition-all cursor-pointer shadow-sm"
                >
                  {accounts.map(acc => (
                    <option key={acc} value={acc}>@{acc}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 font-medium">No accounts</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadTweets(selectedAccount)}
              disabled={isLoading || !selectedAccount}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              title="Refresh Feed"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="Manage Accounts"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-lg font-bold text-slate-800">
            {selectedAccount ? `Tweets from @${selectedAccount}` : 'Feed'}
          </h2>
          {lastRefreshed && !isLoading && !error && (
            <span className="text-xs text-slate-400 font-medium">
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800 mb-4 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-sm">Failed to load tweets</h3>
                <p className="text-sm mt-1 opacity-90">{error}</p>
                <button 
                    onClick={() => loadTweets(selectedAccount)}
                    className="text-xs font-bold mt-2 hover:underline"
                >
                    Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State: No Accounts */}
          {accounts.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center px-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to TweetDeck Lite</h3>
              <p className="text-slate-500 max-w-sm mb-6">
                Start by adding your favorite Twitter accounts to create your personalized feed.
              </p>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-blue-500/30"
              >
                Add Your First Account
              </button>
            </div>
          )}

          {/* Loading State Skeleton */}
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Tweet List */}
          {!isLoading && tweets.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {tweets.map(tweet => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
            </div>
          )}

          {/* Empty State: No Tweets Found (Logic Empty) */}
          {!isLoading && !error && accounts.length > 0 && tweets.length === 0 && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-3">
                <AlertCircle size={24} />
              </div>
              <p className="text-slate-500 font-medium">No tweets found for @{selectedAccount}</p>
              <p className="text-slate-400 text-sm mt-1">
                 This user might have no recent tweets, or the API response format has changed.
              </p>
            </div>
          )}
          
          {/* End of Feed */}
          {!isLoading && !error && tweets.length > 0 && (
             <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full text-sm text-slate-500">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                You're all caught up
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Settings Modal */}
      <AccountSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        onAddAccount={handleAddAccount}
        onRemoveAccount={handleRemoveAccount}
      />
    </div>
  );
};

export default App;
