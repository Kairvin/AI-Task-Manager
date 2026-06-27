import { format, formatDistanceToNow, isToday, isTomorrow, isPast, differenceInHours, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');
export const formatTime = (date) => format(new Date(date), 'h:mm a');
export const formatDateTime = (date) => format(new Date(date), 'MMM d, yyyy h:mm a');
export const formatShort = (date) => format(new Date(date), 'MMM d');

export const getRelativeTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const getDueStatus = (dueDateStr, isCompleted = false, completedAtStr = null) => {
  if (!dueDateStr) return 'none';
  const due = new Date(dueDateStr);
  const comparisonDate = isCompleted 
    ? (completedAtStr ? new Date(completedAtStr) : due) // If no completedAt but is done, assume done on time
    : new Date();

  // If completed and done on time, it shouldn't show "soon" or "urgent"
  if (isCompleted && due >= comparisonDate) return 'completed';

  const isOverdue = due < comparisonDate;
  if (isOverdue) return 'overdue';

  const hoursLeft = differenceInHours(due, comparisonDate);
  const daysLeft = differenceInDays(due, comparisonDate);

  if (hoursLeft <= 4) return 'urgent';
  if (daysLeft <= 1) return 'soon';
  return 'normal';
};

export const getMonthDays = (date) => {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end });
};

export const getWeekDays = (date) => {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  return eachDayOfInterval({ start, end });
};

export { addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, isToday, format, startOfMonth };

export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
