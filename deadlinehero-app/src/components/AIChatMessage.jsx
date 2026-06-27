import { Bot, User } from 'lucide-react';

export default function AIChatMessage({ message }) {
  const isAI = message.role === 'ai';

  // Simple markdown-like rendering for bold text
  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--on-surface)' }}>{part.slice(2, -2)}</strong>;
      }
      // Handle line breaks
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <div className={`chat-message ${isAI ? 'ai' : 'user'}`}>
      <div className="chat-message-avatar">
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: isAI ? 'var(--on-primary)' : 'var(--on-surface-variant)' }}>
          {isAI ? 'smart_toy' : 'person'}
        </span>
      </div>
      <div className="chat-bubble">
        {renderText(message.text)}
        {message.action && (
          <div className="action-card" style={{ marginTop: 12 }}>
            <div className="action-card-title">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {message.action.type === 'add_task' ? 'task' :
                 message.action.type === 'add_event' ? 'event' :
                 message.action.type === 'complete_task' ? 'check_circle' : 'bolt'}
              </span>
              {message.action.type === 'add_task' ? 'New Task' :
               message.action.type === 'add_event' ? 'New Event' :
               message.action.type === 'complete_task' ? 'Complete Task' : 'Action'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
              {message.action.title || message.action.taskTitle}
            </p>
            {message.action.confirmed ? (
              <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> Done
              </p>
            ) : (
              <div className="action-card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => message.onConfirm?.(message.action)}
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => message.onDismiss?.()}
                  style={{ fontSize: 12, padding: '4px 12px' }}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
