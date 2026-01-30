// import OpenAI from "openai";
// import { generateStreamToken } from "../lib/stream.js";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });


// let sessionMessages = {}; // in-memory session store

// export const chatWithGPT = async (req, res) => {
//   const { message, sessionId } = req.body;

//   if (!message || !sessionId) {
//     return res.status(400).json({ message: "Message and sessionId required" });
//   }

//   if (!sessionMessages[sessionId]) {
//     sessionMessages[sessionId] = [
//       {
//         role: "system",
//         content: "You are a friendly AI that helps users learn new languages through chat.",
//       },
//     ];
//   }

//   sessionMessages[sessionId].push({ role: "user", content: message });

//   try {
//     const completion = await openai.createChatCompletion({
//       model: "gpt-4",
//       messages: sessionMessages[sessionId],
//     });

//     const reply = completion.data.choices[0].message;
//     sessionMessages[sessionId].push(reply);

//     res.status(200).json({ reply: reply.content });
//   } catch (err) {
//     console.error("Chat error:", err);
//     res.status(500).json({ message: "Failed to get AI response" });
//   }
// };


// export async function getStreamToken(req, res) {
//   try {
//     const token = generateStreamToken(req.user.id);

//     res.status(200).json({ token });
//   } catch (error) {
//     console.log("Error in getStreamToken controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// }

import OpenAI from "openai";
import { generateStreamToken } from "../lib/stream.js";
import { tavily } from "@tavily/core";

// Support both OpenAI and Groq (free alternative)
const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined;

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

// Initialize Tavily for web search
const tavilyClient = process.env.TAVILY_API_KEY ? tavily({ apiKey: process.env.TAVILY_API_KEY }) : null;

// Helper function to detect if query needs web search
const needsWebSearch = (message) => {
  const searchKeywords = [
    'latest', 'recent', 'current', 'today', 'news', 'now', 'this year', '2024', '2025', '2026',
    'what happened', 'update', 'new', 'trending', 'price', 'stock', 'weather'
  ];
  const lowerMessage = message.toLowerCase();
  return searchKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Helper function to perform web search
const performWebSearch = async (query) => {
  if (!tavilyClient) return null;
  
  try {
    const response = await tavilyClient.search(query, {
      maxResults: 3,
      searchDepth: "basic",
    });
    
    if (response.results && response.results.length > 0) {
      const searchSummary = response.results
        .map((r, i) => `${i + 1}. ${r.content}`)
        .join('\n\n');
      return searchSummary;
    }
  } catch (error) {
    console.error("Web search error:", error);
  }
  return null;
};

let sessionMessages = {}; // in-memory session store

export const chatWithGPT = async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ message: "Message and sessionId required" });
  }

  // Initialize session if not present
  if (!sessionMessages[sessionId]) {
    sessionMessages[sessionId] = [
      {
        role: "system",
        content: `You are a friendly and helpful AI assistant. Your role is to:
- Answer questions on any topic clearly and accurately
- Help users learn new languages through conversation
- Explain complex concepts in a simple, understandable way
- Provide helpful information, suggestions, and guidance
- Be patient, supportive, and encouraging
- Keep responses concise yet informative

Be conversational and friendly. Use emojis occasionally to make interactions engaging! 🤖`,
      },
    ];
  }

  // Add user message
  sessionMessages[sessionId].push({ role: "user", content: message });

  try {
    // Use Groq's llama model if Groq key is set, otherwise use OpenAI
    const model = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo";
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: sessionMessages[sessionId],
    });

    const reply = completion.choices[0].message;
    sessionMessages[sessionId].push(reply); // Store bot reply

    res.status(200).json({ reply: reply.content });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Failed to get AI response" });
  }
};
export async function getStreamToken(req, res) {
  try {
    const token = await generateStreamToken(req.user.id); // must be a string!
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// New controller for AI assistant in chat
export const sendAIMessage = async (req, res) => {
  const { message, channelId } = req.body;

  if (!message || !channelId) {
    return res.status(400).json({ message: "Message and channelId required" });
  }

  // Use channelId as sessionId to maintain context per chat channel
  const sessionId = channelId;

  // Initialize session if not present
  if (!sessionMessages[sessionId]) {
    sessionMessages[sessionId] = [
      {
        role: "system",
        content: `You are a helpful AI assistant integrated into a chat application. 
Answer questions clearly and concisely. Be friendly and helpful. 
You can assist with: general knowledge, coding help, explanations, suggestions, language learning, and more.
When provided with web search results, use them to give accurate, up-to-date information.
Keep responses brief but informative (2-4 sentences unless more detail is needed). Use emojis sparingly. 🤖`,
      },
    ];
  }

  try {
    // Check if we need to search the web for current information
    let searchContext = "";
    if (needsWebSearch(message) && tavilyClient) {
      const searchResults = await performWebSearch(message);
      if (searchResults) {
        searchContext = `\n\nWeb Search Results:\n${searchResults}\n\nUse the above information to answer the question accurately.`;
      }
    }

    // Add user message with optional search context
    const userMessage = message + searchContext;
    sessionMessages[sessionId].push({ role: "user", content: userMessage });

    // Use Groq's llama model if Groq key is set, otherwise use OpenAI
    const model = process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo";
    
    const completion = await openai.chat.completions.create({
      model: model,
      messages: sessionMessages[sessionId],
      max_tokens: 500,
    });

    const reply = completion.choices[0].message;
    sessionMessages[sessionId].push(reply); // Store bot reply

    res.status(200).json({ reply: reply.content });
  } catch (err) {
    console.error("AI Chat error:", err);
    res.status(500).json({ message: "Failed to get AI response" });
  }
};
