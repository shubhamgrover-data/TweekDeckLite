import { GoogleGenAI } from "@google/genai";
import { Tweet } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const DEFAULT_SUMMARY_PROMPT = `Analyze the following tweets from user @{{USERNAME}}.
    
TASK:
Generate a summary specifically focusing on financial information. Look for mentions of:
- Stocks (individual tickers)
- ETFs
- Mutual Funds
- Crypto / Cryptocurrency
- Real Estate / Housing Market

OUTPUT GUIDELINES:
1. If the user discusses these topics, summarize their key points, specific assets mentioned, and their apparent sentiment (Bullish/Bearish/Neutral).
2. If the user DOES NOT mention any of the above financial topics, provide a concise general summary of what they are talking about instead.
3. Be specific but concise. Do not make up information not present in the tweets.
4. Strictly use ONLY the provided tweets for context. Do not use external knowledge.

TWEETS:
{{TWEETS}}`;

// Format tweets into a string context
const formatTweetsForContext = (tweets: Tweet[]): string => {
  // Take up to 50 tweets to ensure we stay within context window while providing ample data
  // Min required by user was 20.
  const slicedTweets = tweets.slice(0, 50);
  
  return slicedTweets.map(t => {
    const date = new Date(t.createdAt).toLocaleDateString();
    return `[${date}] Tweet: "${t.text}"`;
  }).join('\n\n');
};

export const getFinancialSummary = async (username: string, tweets: Tweet[], promptTemplate: string = DEFAULT_SUMMARY_PROMPT): Promise<string> => {
  if (tweets.length === 0) return "No tweets available to analyze.";

  const context = formatTweetsForContext(tweets);
  
  // Replace placeholders
  const prompt = promptTemplate
    .replace('{{USERNAME}}', username)
    .replace('{{TWEETS}}', context);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("LLM Service Error (Summary):", error);
    throw new Error("Failed to generate summary.");
  }
};

export const getChatResponse = async (
  username: string, 
  tweets: Tweet[], 
  chatHistory: { role: 'user' | 'model'; text: string }[], 
  question: string
): Promise<string> => {
  const context = formatTweetsForContext(tweets);
  
  // Format history for the prompt
  const historyText = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  const prompt = `
    You are a helpful assistant analyzing the tweets of @${username}.

    CONTEXT (TWEETS):
    ${context}

    CHAT HISTORY:
    ${historyText}

    USER QUESTION:
    ${question}

    INSTRUCTIONS:
    1. Answer the user's question using ONLY the information provided in the "CONTEXT (TWEETS)" section above.
    2. If the answer is not found in the tweets, state clearly that the information is not present in the provided tweets.
    3. Do not use external knowledge or web search.
    4. Keep answers relevant and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("LLM Service Error (Chat):", error);
    throw new Error("Failed to generate response.");
  }
};