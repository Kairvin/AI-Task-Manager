export default function PriorityBadge({ priority }) {
  const classMap = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };

  return (
    <span className={`priority-badge ${classMap[priority] || 'medium'}`}>
      {priority}
    </span>
  );
}
