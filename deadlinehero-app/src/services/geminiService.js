import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let ai = null;
let chatSession = null;

const SYSTEM_PROMPT = `You are DeadlineHero AI, an intelligent productivity assistant embedded in a task management app. Your role is to help users manage their tasks, schedule meetings, plan their day, and achieve their goals.

You can perform the following ACTIONS by including a JSON block in your response. When you decide to perform an action, include it at the END of your message inside a code fence like this:

\`\`\`action
{"type": "add_task", "title": "Task name", "priority": "high", "category": "Work", "dueDate": "2024-12-25T14:00:00", "description": "optional description"}
\`\`\`

Available actions:
1. add_task - Add a new task. Fields: title (required), priority (critical/high/medium/low), category (Work/Personal/Health/Learning), dueDate (ISO string), description
2. add_tasks - Add multiple tasks (useful for breaking down complex tasks). Fields: tasks (array of task objects with title, priority, dueDate, description)
3. add_event - Add a calendar event. Fields: title (required), date (ISO string), time (string), description
4. complete_task - Mark a task as done. Fields: taskTitle (partial match is fine)

Guidelines:
- Be concise but helpful. Use a friendly, professional tone.
- When the user asks to add something, confirm what you're adding and include the action block.
- When asked for advice on tasks or productivity, give specific, actionable suggestions.
- If a user asks "what should I focus on?" - analyze their current tasks and recommend based on urgency and priority.
- For scheduling, consider the current time and suggest reasonable slots.
- You can reference the user's current tasks when provided as context.
- Use markdown formatting for readability (bold, lists, etc.)
- Keep responses brief - 2-4 sentences for simple requests, more for complex planning.

Current date/time: ${new Date().toLocaleString()}`;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const getChatSession = (tasksContext = '') => {
  if (!isConfigured()) {
    return null;
  }

  if (!chatSession) {
    const genai = getAI();
    chatSession = genai.chats.create({
      model: 'gemini-2.0-flash-lite',
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      history: [
        {
          role: 'user',
          parts: [{ text: "Initialize AI assistant." }],
        },
        {
          role: 'model',
          parts: [{ text: "Hey! 👋 I'm your DeadlineHero AI assistant. I can help you manage tasks, schedule meetings, plan your day, and stay on top of deadlines. Just tell me what you need!" }],
        },
      ],
    });
  }
  return chatSession;
};

export const sendMessage = async (message, tasksContext = '') => {
  const session = getChatSession(tasksContext);

  if (!session) {
    return generateFallbackResponse(message);
  }

  try {
    const fullMessage = `[SYSTEM CONTEXT: Current Tasks:\n${tasksContext || 'No active tasks.'}]\n\nUser Message: ${message}`;
    const result = await session.sendMessage({ message: fullMessage });
    return parseResponse(result.text);
  } catch (error) {
    console.error('Gemini API error:', error);

    // If the chat session is broken, reset it so next message creates a fresh one
    chatSession = null;

    return {
      text: "I'm having trouble connecting right now. Please try again in a moment. If this persists, double-check your API key in the `.env` file.",
      action: null,
    };
  }
};

export const resetChat = () => {
  chatSession = null;
};

const parseResponse = (text) => {
  const actionMatch = text.match(/```action\s*([\s\S]*?)```/);
  let action = null;

  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1].trim());
    } catch (e) {
      console.warn('Failed to parse action:', e);
    }
  }

  // Remove the action block from displayed text
  const cleanText = text.replace(/```action\s*[\s\S]*?```/g, '').trim();

  return { text: cleanText, action };
};

const generateFallbackResponse = (message) => {
  const lower = message.toLowerCase();

  if (lower.includes('add') && (lower.includes('task') || lower.includes('meeting') || lower.includes('event'))) {
    const titleMatch = message.match(/(?:add|create|schedule)\s+(?:a\s+)?(?:task|meeting|event)?\s*(?:called|named|titled|:)?\s*["']?(.+?)["']?(?:\s+(?:for|on|at|due|by)\s|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'New Task';

    return {
      text: `I'd add **"${title}"** to your tasks, but I need a Gemini API key to work fully. Add your key to the \`.env\` file as \`VITE_GEMINI_API_KEY=your_key\` and restart the dev server.\n\nIn the meantime, you can use the **+ New Task** button to add tasks manually!`,
      action: null,
    };
  }

  if (lower.includes('focus') || lower.includes('priority') || lower.includes('what should')) {
    return {
      text: "Great question! I can analyze your tasks and recommend what to focus on.\nTo unlock full AI-powered advice, add your Gemini API key to the `.env` file and restart the dev server. I'll then provide personalized suggestions based on your deadlines and priorities.",
      action: null,
    };
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      text: "Hey there! 👋 I'm your DeadlineHero AI assistant. To unlock my full capabilities (adding tasks via chat, smart scheduling, personalized advice), add your Gemini API key to the `.env` file and restart the dev server!",
      action: null,
    };
  }

  return {
    text: "I'm your AI productivity assistant! To use me fully, add your Gemini API key to the `.env` file as `VITE_GEMINI_API_KEY=your_key` and restart the dev server.\n\nOnce configured, I can:\n\n- 📋 **Add tasks & meetings** via natural language\n- 🎯 **Prioritize your day** based on deadlines\n- 💡 **Suggest task breakdowns** for complex projects\n- 📅 **Schedule events** on your calendar",
    action: null,
  };
};

export const isConfigured = () => {
  return !!(API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && API_KEY.length > 10);
};
