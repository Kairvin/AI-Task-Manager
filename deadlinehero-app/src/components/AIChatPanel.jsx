import './Chat.css';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sendMessage, resetChat } from '../services/geminiService';
import AIChatMessage from './AIChatMessage';

const SUGGESTIONS = [
  "What should I focus on today?",
  "Add a meeting tomorrow at 3pm",
  "Help me plan my week",
  "How can I be more productive?",
];

export default function AIChatPanel() {
  const { chatOpen, setChatOpen, chatMessages, addChatMessage, clearChat, tasks, addTask, updateTask } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(''); // Clear input for new voice command
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [chatOpen]);

  const getTasksContext = () => {
    return tasks
      .filter(t => !t.completed)
      .map(t => `- "${t.title}" (priority: ${t.priority}, due: ${t.dueDate || 'no date'}, category: ${t.category})`)
      .join('\n');
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    addChatMessage({ role: 'user', text });
    setLoading(true);

    try {
      const response = await sendMessage(text, getTasksContext());

      const aiMsg = {
        role: 'ai',
        text: response.text,
      };

      if (response.action) {
        aiMsg.action = response.action;
        aiMsg.onConfirm = (action) => {
          if (action.type === 'add_task') {
            addTask({
              title: action.title,
              priority: action.priority || 'medium',
              category: action.category || 'Work',
              dueDate: action.dueDate || null,
              description: action.description || '',
            });
            addChatMessage({ role: 'ai', text: `✅ **"${action.title}"** has been added to your tasks!` });
          } else if (action.type === 'add_tasks') {
            const tasksToAdd = action.tasks || [];
            tasksToAdd.forEach(t => {
              addTask({
                title: t.title,
                priority: t.priority || 'medium',
                category: t.category || 'Work',
                dueDate: t.dueDate || null,
                description: t.description || '',
              });
            });
            addChatMessage({ role: 'ai', text: `✅ **${tasksToAdd.length} tasks** have been added to your list!` });
          } else if (action.type === 'add_event') {
            // Map event to a task with a specific due date/time
            let eventDate = action.date;
            if (eventDate && action.time) {
               // naive parsing if time is provided separately
               try {
                 const dateObj = new Date(action.date);
                 const [hours, minutes] = action.time.split(':');
                 dateObj.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0);
                 eventDate = dateObj.toISOString();
               } catch (e) {}
            }
            addTask({
              title: action.title,
              priority: 'high',
              category: 'Personal',
              dueDate: eventDate || null,
              description: action.description || '',
            });
            addChatMessage({ role: 'ai', text: `✅ Event **"${action.title}"** has been scheduled!` });
          } else if (action.type === 'complete_task') {
            // Find task by title (partial match)
            const target = tasks.find(t => !t.completed && t.title.toLowerCase().includes(action.taskTitle.toLowerCase()));
            if (target) {
              updateTask(target.id, { ...target, completed: true, status: 'done' });
              addChatMessage({ role: 'ai', text: `✅ **"${target.title}"** has been marked as complete!` });
            } else {
              addChatMessage({ role: 'ai', text: `⚠️ I couldn't find an active task matching "${action.taskTitle}".` });
            }
          }
        };
      }

      addChatMessage(aiMsg);
    } catch (err) {
      addChatMessage({
        role: 'ai',
        text: "Sorry, something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearChat();
    resetChat();
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!chatOpen && (
        <button
          className="chat-fab"
          onClick={() => setChatOpen(true)}
          aria-label="Open AI Assistant"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>auto_awesome</span>
        </button>
      )}

      {/* Chat Panel */}
      <div className={`chat-panel ${chatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-title">
            <div className="chat-ai-avatar">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-primary)' }}>smart_toy</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>AI Assistant</h3>
              <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)' }}>Powered by Gemini</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost btn-icon" onClick={handleClear} title="Clear chat" style={{ padding: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
            </button>
            <button className="btn-ghost btn-icon" onClick={() => setChatOpen(false)} title="Close" style={{ padding: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div className="chat-ai-avatar" style={{ width: 48, height: 48, margin: '0 auto 16px', borderRadius: 'var(--radius-lg)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--on-primary)' }}>smart_toy</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--on-surface)' }}>Hi! I'm your AI Assistant</h4>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 24 }}>
                Ask me to add tasks, schedule meetings, or get productivity advice.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="btn btn-secondary"
                    onClick={() => handleSuggestionClick(s)}
                    style={{ fontSize: 12, justifyContent: 'flex-start', textAlign: 'left', padding: '8px 12px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)', flexShrink: 0 }}>auto_awesome</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <AIChatMessage key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="chat-message ai">
              <div className="chat-message-avatar">
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--on-primary)' }}>smart_toy</span>
              </div>
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className={`chat-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Use voice input"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
