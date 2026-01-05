import React from 'react';
import { Tweet } from '../types';
import { Heart, MessageCircle, Repeat, Share, BarChart2, ExternalLink } from 'lucide-react';

interface TweetCardProps {
  tweet: Tweet;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const TweetCard: React.FC<TweetCardProps> = ({ tweet }) => {
  const tweetUrl = `https://x.com/${tweet.author.username}/status/${tweet.id}`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors duration-200 mb-4 shadow-sm relative group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img 
            src={tweet.author.avatar} 
            alt={tweet.author.username} 
            className="w-12 h-12 rounded-full object-cover border border-slate-200"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <span className="font-bold text-slate-900 truncate leading-tight">{tweet.author.displayName}</span>
              <span className="text-slate-500 text-sm truncate leading-tight">@{tweet.author.username}</span>
              <span className="text-slate-400 text-sm leading-tight flex-shrink-0">·</span>
              <a 
                href={tweetUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-500 text-sm hover:underline cursor-pointer leading-tight whitespace-nowrap flex-shrink-0"
              >
                {formatDate(tweet.createdAt)}
              </a>
            </div>
            
            <a 
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-500 p-1 -mt-1 -mr-2 rounded-full hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Open on X"
              aria-label="Open on X"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Text */}
          <p className="text-slate-800 whitespace-pre-wrap mb-3 text-[15px] leading-relaxed">
            {tweet.text}
          </p>

          {/* Media */}
          {tweet.media && tweet.media.length > 0 && (
            <div className="mb-3 rounded-xl overflow-hidden border border-slate-200">
              {tweet.media[0].type === 'image' && (
                <img 
                  src={tweet.media[0].url} 
                  alt="Tweet media" 
                  className="w-full h-auto object-cover max-h-[400px]"
                  loading="lazy"
                />
              )}
               {tweet.media[0].type === 'video' && (
                 <div className="bg-black flex items-center justify-center h-64 text-slate-500 text-sm">
                    Video content (preview not available)
                 </div>
               )}
            </div>
          )}

          {/* Stats / Action Bar */}
          <div className="flex justify-between items-center text-slate-500 max-w-md mt-2">
            <button className="flex items-center gap-1.5 group/btn hover:text-blue-500 transition-colors">
              <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs font-medium">{formatNumber(tweet.stats.replies)}</span>
            </button>
            <button className="flex items-center gap-1.5 group/btn hover:text-green-500 transition-colors">
              <div className="p-2 rounded-full group-hover/btn:bg-green-50 transition-colors">
                <Repeat size={18} />
              </div>
              <span className="text-xs font-medium">{formatNumber(tweet.stats.retweets)}</span>
            </button>
            <button className="flex items-center gap-1.5 group/btn hover:text-pink-500 transition-colors">
              <div className="p-2 rounded-full group-hover/btn:bg-pink-50 transition-colors">
                <Heart size={18} />
              </div>
              <span className="text-xs font-medium">{formatNumber(tweet.stats.likes)}</span>
            </button>
            <button className="flex items-center gap-1.5 group/btn hover:text-blue-500 transition-colors">
               <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <BarChart2 size={18} />
              </div>
              <span className="text-xs font-medium">{formatNumber(tweet.stats.views)}</span>
            </button>
            <button className="flex items-center gap-1.5 group/btn hover:text-blue-500 transition-colors">
               <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
