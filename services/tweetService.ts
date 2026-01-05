import axios from 'axios';
import { Tweet } from '../types';

const API_KEY = 'dc72b9f392mshd21f62898fe4dafp1fa965jsn23559a746370';
const API_HOST = 'twitter-api45.p.rapidapi.com';

/**
 * Resolves a Username (screenname) to a numeric REST ID.
 * This is required because the timeline API uses numeric IDs.
 */
const getRestId = async (username: string): Promise<string> => {
  const config = {
    method: 'GET',
    url: `https://${API_HOST}/screenname.php`,
    params: { screenname: username },
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await axios.request(config);
    const data = response.data;

    // Check for direct ID or rest_id in root or nested objects
    if (data.id) return data.id;
    if (data.rest_id) return data.rest_id;
    
    // Common nested structure
    if (data.user_result?.result?.rest_id) return data.user_result.result.rest_id;
    if (data.data?.user_result?.result?.rest_id) return data.data.user_result.result.rest_id;

    // If response is just a string ID
    if (typeof data === 'string' && /^\d+$/.test(data)) return data;
    
    console.warn('Response from screenname.php:', data);
    throw new Error(`Could not retrieve ID for user @${username}`);
  } catch (error: any) {
    console.error(`Error resolving screenname for ${username}:`, error);
    throw new Error(`Failed to resolve user ID for @${username}`);
  }
};

interface FetchTweetsResponse {
  tweets: Tweet[];
  nextCursor?: string;
}

/**
 * Fetches tweets for a specific username using the 2-step process.
 * Step 1: Get ID from username.
 * Step 2: Get Timeline from ID (using the flat JSON structure).
 */
export const fetchTweetsForUser = async (username: string, cursor?: string): Promise<FetchTweetsResponse> => {
  try {
    // Step 1: Get the numeric REST ID (Skipped as per user request to use screenname directly with timeline.php)
    
    // Step 2: Fetch the Timeline using the screenname
    const config = {
      method: 'GET',
      url: `https://${API_HOST}/timeline.php`,
      params: {
        screenname: username,
        cursor: cursor
      },
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': API_HOST
      }
    };

    const response = await axios.request(config);
    const data = response.data;
    console.log(data);

    // Validate based on new flat structure: { timeline: [...] }
    if (!data || !data.timeline || !Array.isArray(data.timeline)) {
        // If the array is empty or missing, return empty
        console.warn('API response missing timeline array', data);
        return { tweets: [] };
    }

    const tweets: Tweet[] = data.timeline.map((item: any) => {
        // Handle media based on different API response structures
        let formattedMedia: { type: 'image' | 'video'; url: string }[] = [];

        if (item.media) {
            // Case 1: Media is an object with photo/video arrays (as seen in screenshot)
            if (item.media.photo && Array.isArray(item.media.photo)) {
                item.media.photo.forEach((p: any) => {
                    formattedMedia.push({
                        type: 'image',
                        url: p.media_url_https || p.url
                    });
                });
            }
            if (item.media.video && Array.isArray(item.media.video)) {
                item.media.video.forEach((v: any) => {
                    formattedMedia.push({
                        type: 'video',
                        url: v.media_url_https || v.url
                    });
                });
            }
            
            // Case 2: Media is directly an array (Legacy/RapidAPI specific)
            if (Array.isArray(item.media)) {
                item.media.forEach((m: any) => {
                     formattedMedia.push({
                        type: m.type === 'video' ? 'video' : 'image',
                        url: m.url || m.media_url_https || m.media_url
                     });
                 });
            }
        }
        
        // Case 3: Fallback to entities.media if root media is empty
        if (formattedMedia.length === 0 && item.entities?.media && Array.isArray(item.entities.media)) {
             item.entities.media.forEach((m: any) => {
                 formattedMedia.push({
                     type: m.type === 'video' ? 'video' : 'image',
                     url: m.media_url_https || m.url
                 });
             });
        }

        return {
            id: item.tweet_id,
            text: item.text || '',
            createdAt: item.created_at,
            author: {
                username: item.author?.screen_name || username,
                displayName: item.author?.name || username,
                avatar: item.author?.avatar || item.author?.profile_image_url_https
            },
            stats: {
                likes: item.favorites || 0,
                retweets: item.retweets || 0,
                replies: item.replies || 0,
                views: item.views ? parseInt(item.views, 10) : 0
            },
            media: formattedMedia.length > 0 ? formattedMedia : undefined
        };
    });

    // Sort by date (newest first)
    const sortedTweets = tweets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
        tweets: sortedTweets,
        nextCursor: data.next_cursor || data.cursor?.next
    };

  } catch (error: any) {
    console.error("Failed to fetch tweets:", error);
    
    if (axios.isAxiosError(error)) {
        if (error.response) {
            throw new Error(`API returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
            throw new Error("No response from API. This might be a CORS issue or network problem.");
        }
    }
    
    throw error;
  }
};