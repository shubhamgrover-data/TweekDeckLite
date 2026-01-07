import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RefreshCw, Bird, ChevronDown, UserPlus, AlertCircle, AlertTriangle, ArrowDown, Sparkles } from 'lucide-react';
import { Tweet, Message } from './types';
import { fetchTweetsForUser } from './services/tweetService';
import { TweetCard } from './components/TweetCard';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { DEFAULT_SUMMARY_PROMPT } from './services/llmService';

// Included the user's test account 'BotChrome114342'
const DEFAULT_ACCOUNTS = ['SahilKapoor',  'OpenAI', 'SpaceX'];

const App: React.FC = () => {
  // --- State ---
  const [accounts, setAccounts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('twitter_accounts');
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch (error) {
      console.error('Failed to parse twitter_accounts from localStorage:', error);
      return DEFAULT_ACCOUNTS;
    }
  });

  const [selectedAccount, setSelectedAccount] = useState<string>(() => {
    // Derive the initial accounts list again to ensure selectedAccount fallback is valid relative to the actual list
    let currentAccounts = DEFAULT_ACCOUNTS;
    try {
        const savedAccounts = localStorage.getItem('twitter_accounts');
        if (savedAccounts) {
            currentAccounts = JSON.parse(savedAccounts);
        }
    } catch (error) {
        console.error('Failed to parse twitter_accounts for selection initialization:', error);
    }

    const savedSelection = localStorage.getItem('last_selected_account');
    
    // If we have a saved selection and it exists in our current list, use it
    if (savedSelection && currentAccounts.includes(savedSelection)) {
      return savedSelection;
    }
    
    // Otherwise fallback to the first account of the ACTUAL list (not necessarily the default list)
    return currentAccounts.length > 0 ? currentAccounts[0] : '';
  });

  // --- Caching State ---
  const [tweetCache, setTweetCache] = useState<Record<string, { tweets: Tweet[], nextCursor: string | null, lastRefreshed: Date }>>({});
  const [aiCache, setAiCache] = useState<Record<string, { messages: Message[], hasSummarized: boolean }>>({});

  // --- Prompt State ---
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    return localStorage.getItem('ai_custom_prompt') || DEFAULT_SUMMARY_PROMPT;
  });

  useEffect(() => {
    localStorage.setItem('ai_custom_prompt', customPrompt);
  }, [customPrompt]);

  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState<boolean>(false);
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
  const loadTweets = useCallback(async (username: string, cursor?: string, forceRefresh = false) => {
    if (!username) return;
    
    const isPagination = !!cursor;

    // Check Cache first (if not paginating and not forcing refresh)
    if (!isPagination && !forceRefresh && tweetCache[username]) {
        console.log(`Loading tweets for ${username} from cache`);
        setTweets(tweetCache[username].tweets);
        setNextCursor(tweetCache[username].nextCursor);
        setLastRefreshed(tweetCache[username].lastRefreshed);
        setError(null);
        return;
    }

    if (isPagination) {
        setIsLoadingMore(true);
    } else {
        setIsLoading(true);
        setTweets([]); // Clear current tweets while loading initial set
    }
    
    setError(null);
    
    try {
      const { tweets: newTweets, nextCursor: newCursor } = await fetchTweetsForUser(username, cursor);
      
      setTweets(prev => {
          if (isPagination) {
              // Deduplicate based on ID just in case
              const existingIds = new Set(prev.map(t => t.id));
              const uniqueNewTweets = newTweets.filter(t => !existingIds.has(t.id));
              const updatedList = [...prev, ...uniqueNewTweets];
              
              // Update Cache with new pagination data
              setTweetCache(cache => ({
                  ...cache,
                  [username]: {
                      tweets: updatedList,
                      nextCursor: newCursor || null,
                      lastRefreshed: cache[username]?.lastRefreshed || new Date()
                  }
              }));

              return updatedList;
          }
          
          // Initial Load - Set Cache
          const refreshedDate = new Date();
          setTweetCache(cache => ({
              ...cache,
              [username]: {
                  tweets: newTweets,
                  nextCursor: newCursor || null,
                  lastRefreshed: refreshedDate
              }
          }));
          setLastRefreshed(refreshedDate);
          
          return newTweets;
      });

      setNextCursor(newCursor || null);

    } catch (err: any) {
      console.error("App: Failed to fetch tweets", err);
      if (!isPagination) {
          setError(err.message || "An unexpected error occurred while fetching tweets.");
      } else {
           alert("Failed to load more tweets: " + (err.message || "Unknown error"));
      }
    } finally {
      if (isPagination) {
          setIsLoadingMore(false);
      } else {
          setIsLoading(false);
      }
    }
  }, [tweetCache]); // Added tweetCache to dep array to ensure we read latest

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
    
    // Clear cache for removed user
    setTweetCache(prev => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
    });
    setAiCache(prev => {
        const copy = { ...prev };
        delete copy[username];
        return copy;
    });
    
    if (selectedAccount === username) {
      // If we removed the currently selected account, select the first available, or empty
      setSelectedAccount(newAccounts.length > 0 ? newAccounts[0] : '');
      if (newAccounts.length === 0) {
        setTweets([]);
        setNextCursor(null);
      }
    }
  };

  const handleLoadMore = () => {
      if (nextCursor && !isLoadingMore) {
          loadTweets(selectedAccount, nextCursor);
      }
  };

  const toggleAIPanel = () => {
    setIsAIPanelOpen(!isAIPanelOpen);
  };

  const handleAICacheUpdate = useCallback((messages: Message[], hasSummarized: boolean) => {
      if (selectedAccount) {
          setAiCache(prev => ({
              ...prev,
              [selectedAccount]: { messages, hasSummarized }
          }));
      }
  }, [selectedAccount]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className={`mx-auto px-4 h-16 flex items-center justify-between transition-all duration-300 ${isAIPanelOpen ? 'max-w-7xl' : 'max-w-2xl'}`}>
          
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
              onClick={toggleAIPanel}
              className={`p-2 rounded-full transition-all flex items-center gap-1 ${isAIPanelOpen ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
              title="AI Assistant"
            >
              <Sparkles size={20} className={isAIPanelOpen ? "fill-blue-600/20" : ""} />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => loadTweets(selectedAccount, undefined, true)}
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
      <main className={`flex-1 w-full mx-auto px-4 py-4 flex flex-col lg:flex-row gap-6 transition-all duration-300 ${isAIPanelOpen ? 'max-w-7xl' : 'max-w-2xl'}`}>
        
        {/* Tweet Feed Column */}
        <div className="flex-1 min-w-0 transition-all">
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
                      onClick={() => loadTweets(selectedAccount, undefined, true)}
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

            {/* Loading State Skeleton (Initial Load) */}
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
            {tweets.length > 0 && (
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
            
            {/* Footer: Load More or End of Feed */}
            {!isLoading && !error && tweets.length > 0 && (
              <div className="py-6 text-center">
                  {isLoadingMore ? (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                          <RefreshCw size={20} className="animate-spin" />
                          <span className="text-sm font-medium">Loading more tweets...</span>
                      </div>
                  ) : nextCursor ? (
                      <button 
                          onClick={handleLoadMore}
                          className="group flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 rounded-full font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                      >
                          <span>Load More</span>
                          <ArrowDown size={18} className="transition-transform group-hover:translate-y-0.5" />
                      </button>
                  ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 rounded-full text-sm text-slate-500">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          You're all caught up
                      </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        {isAIPanelOpen && (
            <AIAssistantPanel 
                key={selectedAccount} // Important: Forces component remount when user changes
                isOpen={isAIPanelOpen}
                onClose={() => setIsAIPanelOpen(false)}
                tweets={tweets}
                username={selectedAccount}
                initialMessages={aiCache[selectedAccount]?.messages}
                initialHasSummarized={aiCache[selectedAccount]?.hasSummarized}
                onCacheUpdate={handleAICacheUpdate}
                customPrompt={customPrompt}
            />
        )}
      </main>

      {/* Settings Modal */}
      <AccountSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accounts={accounts}
        onAddAccount={handleAddAccount}
        onRemoveAccount={handleRemoveAccount}
        customPrompt={customPrompt}
        onSavePrompt={setCustomPrompt}
        defaultPrompt={DEFAULT_SUMMARY_PROMPT}
      />
    </div>
  );
};

export default App;