export interface TwitterUser {
  username: string; // The @handle
  displayName?: string; // The display name
  avatar?: string;
}

export interface TweetStats {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  author: TwitterUser;
  stats: TweetStats;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
}

export interface AppState {
  accounts: string[];
  selectedAccount: string | null;
  isLoading: boolean;
  tweets: Tweet[];
  error: string | null;
}
