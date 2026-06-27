import { differenceInHours, isPast, format } from 'date-fns';

/**
 * Scores and sorts tasks by AI-determined priority.
 * Factors: user-set priority, due date urgency, completion status
 */

const PRIORITY_WEIGHTS = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

export const scoreTask = (task) => {
  let score = PRIORITY_WEIGHTS[task.priority] || 50;

  // Due date urgency
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    const hoursLeft = differenceInHours(d, new Date());

    if (isPast(d) && !task.completed) {
      score += 200; // Overdue tasks get highest boost
    } else if (hoursLeft <= 2) {
      score += 150;
    } else if (hoursLeft <= 8) {
      score += 100;
    } else if (hoursLeft <= 24) {
      score += 60;
    } else if (hoursLeft <= 72) {
      score += 30;
    }
  }

  // Completed tasks drop to bottom
  if (task.completed) {
    score = -1;
  }

  return score;
};

export const sortByPriority = (tasks) => {
  return [...tasks].sort((a, b) => scoreTask(b) - scoreTask(a));
};

// Actionable tips organized by category
const TIPS_BY_CATEGORY = {
  Work: [
    "Break it into 3 smaller sub-tasks and tackle the easiest one first to build momentum.",
    "Block out a 45-minute focus session — close all tabs, silence notifications, and power through it.",
    "Try the Pomodoro technique: work for 25 minutes, take a 5-minute break, repeat.",
    "Write down the single next physical action needed — not the whole task, just the very next step.",
    "If you've been procrastinating, spend just 2 minutes on it. Often that's enough to get rolling.",
  ],
  Personal: [
    "Set a specific time today to handle this — scheduling it makes it 3x more likely to happen.",
    "Pair it with something enjoyable: put on music, grab a coffee, then dive in.",
    "Ask yourself: 'Will this take less than 15 minutes?' If yes, do it right now.",
    "Tell someone about your plan — accountability partners boost completion rates by 65%.",
    "Break the resistance: commit to just 5 minutes. You can stop after that if you want.",
  ],
  Health: [
    "Schedule it as a non-negotiable appointment in your calendar — treat it like a meeting.",
    "Lay out everything you need the night before so there's zero friction in the morning.",
    "Start with the smallest version: a 10-minute walk instead of a full workout. Consistency beats intensity.",
    "Find an accountability buddy — working out or cooking healthy with someone makes it more fun.",
    "Attach it to an existing habit: 'After I brush my teeth, I will do 10 push-ups.'",
  ],
  Learning: [
    "Use the Feynman Technique: try to explain the concept in simple words to test your understanding.",
    "Set a tiny daily goal: read just 5 pages or watch one tutorial. Small wins compound fast.",
    "Create flashcards or teach someone else — active recall beats passive reading every time.",
    "Block a 30-minute 'learning sprint' first thing in the morning when your brain is sharpest.",
    "Don't aim for perfection — aim for 'good enough to move on' and iterate later.",
  ],
};

const GENERAL_TIPS = [
  "Start with the hardest task of the day while your willpower is at its peak.",
  "Use the 2-minute rule: if it takes less than 2 minutes, just do it now.",
  "Set a timer for 25 minutes and work on nothing else. Short sprints beat marathon sessions.",
  "Write out your 3 most important tasks for today — no more, no less. Focus on those.",
  "If you're feeling overwhelmed, pick the one task that would make you feel the most relieved once done.",
  "Batch similar tasks together to reduce context-switching and maximize focus.",
  "Try 'eating the frog' — tackle your most dreaded task first and coast through the rest.",
  "Remove distractions: phone on silent, close social media, and set a Do Not Disturb timer.",
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const getAISuggestion = (tasks) => {
  const incomplete = tasks.filter(t => !t.completed);

  // All done!
  if (incomplete.length === 0) {
    return {
      text: "All caught up! 🎉 Great job. Consider adding new goals or habits to keep the momentum going.",
      icon: "celebration",
    };
  }

  const sorted = sortByPriority(incomplete);
  const topTask = sorted[0];
  const overdue = incomplete.filter(t => t.dueDate && isPast(new Date(t.dueDate)));

  // Critical: overdue top task
  if (topTask.dueDate && isPast(new Date(topTask.dueDate))) {
    const tip = pickRandom(TIPS_BY_CATEGORY[topTask.category] || GENERAL_TIPS);
    return {
      text: `⚠️ **"${topTask.title}"** is overdue! ${tip}`,
      icon: "warning",
      taskId: topTask.id,
    };
  }

  // Urgent: due within 4 hours
  if (topTask.dueDate) {
    const hoursLeft = differenceInHours(new Date(topTask.dueDate), new Date());
    if (hoursLeft <= 4) {
      const tip = pickRandom(TIPS_BY_CATEGORY[topTask.category] || GENERAL_TIPS);
      return {
        text: `🔥 **"${topTask.title}"** is due in ${hoursLeft <= 1 ? 'less than an hour' : `${hoursLeft} hours`}. ${tip}`,
        icon: "priority_high",
        taskId: topTask.id,
      };
    }
  }

  // Multiple overdue tasks
  if (overdue.length > 1) {
    const randomOverdue = pickRandom(overdue);
    const tip = pickRandom(TIPS_BY_CATEGORY[randomOverdue.category] || GENERAL_TIPS);
    return {
      text: `You have **${overdue.length} overdue tasks**. Start with **"${randomOverdue.title}"**: ${tip}`,
      icon: "schedule",
      taskId: randomOverdue.id,
    };
  }

  // Default: pick a random incomplete task and give advice
  const randomTask = pickRandom(incomplete);
  const categoryTips = TIPS_BY_CATEGORY[randomTask.category] || GENERAL_TIPS;
  const tip = pickRandom(categoryTips);

  const dueInfo = randomTask.dueDate
    ? ` (due ${format(new Date(randomTask.dueDate), 'EEE, MMM d')})`
    : '';

  return {
    text: `💡 **"${randomTask.title}"**${dueInfo} — ${tip}`,
    icon: "lightbulb",
    taskId: randomTask.id,
  };
};
