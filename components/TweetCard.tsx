import React, { useState } from 'react';
import { Tweet } from '../types';
import { Heart, MessageCircle, Repeat, BarChart2, ExternalLink, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';

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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const tweetUrl = `https://x.com/${tweet.author.username}/status/${tweet.id}`;

  const hasMedia = tweet.media && tweet.media.length > 0;
  
  const handlePrevMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tweet.media) return;
    setCurrentMediaIndex((prev) => (prev - 1 + tweet.media!.length) % tweet.media!.length);
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!tweet.media) return;
    setCurrentMediaIndex((prev) => (prev + 1) % tweet.media!.length);
  };

  const renderMediaItem = (media: { type: 'image' | 'video'; url: string }) => {
    const isVideo = media.type === 'video';
    
    // Check if URL looks like a video file
    const isVideoFile = media.url.includes('.mp4') || media.url.includes('.m3u8');

    if (isVideo && isVideoFile) {
        return (
            <video 
                src={media.url} 
                controls 
                className="w-full h-full object-contain bg-black"
                preload="metadata"
            >
                Your browser does not support the video tag.
            </video>
        );
    }

    return (
        <div className="relative w-full h-full">
            <img 
                src={media.url} 
                alt="Tweet media" 
                className={`w-full h-full object-cover ${isVideo ? 'brightness-75' : ''}`}
                loading="lazy"
            />
            {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm text-white">
                        <PlayCircle size={48} fill="currentColor" className="text-white opacity-90" />
                    </div>
                </div>
            )}
        </div>
    );
  };

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
          <p className="text-slate-800 whitespace-pre-wrap mb-3 text-[15px] leading-relaxed break-words">
            {tweet.text}
          </p>

          {/* Media Carousel */}
          {hasMedia && tweet.media && (
            <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative group/media aspect-[16/9] sm:aspect-[2/1] md:aspect-[16/9]">
              {/* Media Content */}
              <div className="w-full h-full flex items-center justify-center">
                  {renderMediaItem(tweet.media[currentMediaIndex])}
              </div>

              {/* Navigation Controls (only if > 1 item) */}
              {tweet.media.length > 1 && (
                <>
                  {/* Prev Button */}
                  <button 
                    onClick={handlePrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover/media:opacity-100 backdrop-blur-sm z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Next Button */}
                  <button 
                    onClick={handleNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all opacity-0 group-hover/media:opacity-100 backdrop-blur-sm z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>

                  {/* Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {tweet.media.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentMediaIndex(idx);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all shadow-sm ${idx === currentMediaIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>

                  {/* Counter */}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs font-medium rounded-md backdrop-blur-md z-10">
                    {currentMediaIndex + 1} / {tweet.media.length}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Stats (Informational only) */}
          <div className="flex justify-between items-center text-slate-500 max-w-sm mt-3 pt-2">
            <div className="flex items-center gap-2" title="Replies">
              <MessageCircle size={18} className="text-slate-400" />
              <span className="text-xs font-medium">{formatNumber(tweet.stats.replies)}</span>
            </div>
            <div className="flex items-center gap-2" title="Retweets">
              <Repeat size={18} className="text-slate-400" />
              <span className="text-xs font-medium">{formatNumber(tweet.stats.retweets)}</span>
            </div>
            <div className="flex items-center gap-2" title="Likes">
              <Heart size={18} className="text-slate-400" />
              <span className="text-xs font-medium">{formatNumber(tweet.stats.likes)}</span>
            </div>
            <div className="flex items-center gap-2" title="Views">
              <BarChart2 size={18} className="text-slate-400" />
              <span className="text-xs font-medium">{formatNumber(tweet.stats.views)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
