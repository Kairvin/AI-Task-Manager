import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as storage from '../services/storageService';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLog, setHabitLog] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Workspace State
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  // Handle Resize for Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load from storage when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setTasks([]);
        setHabits([]);
        setHabitLog({});
        setChatMessages([]);
        return;
      }

      try {
        await storage.seedDemoData(user.id);
        await reloadWorkspaces();
        const [loadedHabits, loadedLog, loadedChat] = await Promise.all([
          storage.getHabits(user.id),
          storage.getHabitLog(user.id),
          storage.getChatHistory(user.id)
        ]);

        setHabits(loadedHabits);
        setHabitLog(loadedLog);
        setChatMessages(loadedChat);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();
  }, [user]);

  const handleSetCurrentWorkspace = useCallback((ws) => {
    setCurrentWorkspace(ws);
    if (ws) {
      localStorage.setItem('deadlinehero_last_workspace', ws.id);
    }
  }, []);

  const reloadWorkspaces = async () => {
    if (!user) return;
    const loadedWorkspaces = await storage.getWorkspaces(user.id);
    setWorkspaces(loadedWorkspaces);
    if (loadedWorkspaces.length > 0 && !currentWorkspace) {
      const savedId = localStorage.getItem('deadlinehero_last_workspace');
      const savedWs = savedId ? loadedWorkspaces.find(w => w.id === savedId) : null;
      handleSetCurrentWorkspace(savedWs || loadedWorkspaces.find(w => w.is_personal) || loadedWorkspaces[0]);
    }
  };

  const createTeamWorkspace = async (name) => {
    if (!user || !name) return;
    const ws = await storage.createWorkspace(name, user.id, false);
    setWorkspaces(prev => [...prev, ws]);
    handleSetCurrentWorkspace(ws);
  };

  // Load Tasks whenever Workspace changes
  useEffect(() => {
    const loadTasks = async () => {
      if (!user || !currentWorkspace) {
        setTasks([]);
        return;
      }
      try {
        const loadedTasks = await storage.getTasks(user.id, currentWorkspace.id);
        setTasks(loadedTasks);
      } catch (err) {
        console.error('Error loading tasks:', err);
      }
    };
    loadTasks();
  }, [user, currentWorkspace]);

  // ---- TASK OPERATIONS ----
  const addTask = useCallback(async (taskData) => {
    if (!user) return;
    try {
      const taskWithWorkspace = {
        ...taskData,
        id: crypto.randomUUID(),
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        category: taskData.category || 'Work',
        dueDate: taskData.dueDate || null,
        completed: false,
        status: taskData.status || 'todo',
        createdAt: new Date().toISOString(),
        workspace_id: currentWorkspace?.id
      };
      const savedTask = await storage.saveTask(user.id, taskWithWorkspace);
      setTasks(prev => [savedTask, ...prev]);
    } catch (e) {
      console.error('Failed to add task', e);
    }
  }, [user, currentWorkspace]);

  const updateTask = useCallback(async (id, updates) => {
    if (!user) return;
    try {
      const existingTask = tasks.find(t => t.id === id);
      if (!existingTask) return;
      const updated = { ...existingTask, ...updates };
      
      // Sync status and completed boolean
      if ('status' in updates && !('completed' in updates)) {
        updated.completed = updates.status === 'done';
      } else if ('completed' in updates && !('status' in updates)) {
        updated.status = updates.completed ? 'done' : (existingTask.status === 'done' ? 'todo' : existingTask.status);
      } else if ('status' in updates && 'completed' in updates) {
        if (updates.status === 'done' && !updates.completed) updated.completed = true;
        if (updates.status !== 'done' && updates.completed) updated.status = 'done';
      }

      // Track completion timestamp
      if (updated.completed && !existingTask.completed) {
        updated.completedAt = new Date().toISOString();
      } else if (!updated.completed && existingTask.completed) {
        updated.completedAt = null;
      }

      const saved = await storage.saveTask(user.id, updated);
      setTasks(prev => prev.map(t => t.id === id ? saved : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [user, tasks]);

  const deleteTask = useCallback(async (id) => {
    if (!user) return;
    try {
      await storage.deleteTask(user.id, id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [user]);

  const toggleTask = useCallback(async (id) => {
    if (!user) return;
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return;
    const updated = {
      ...existingTask,
      completed: !existingTask.completed,
      status: !existingTask.completed ? 'done' : 'todo',
      completedAt: !existingTask.completed ? new Date().toISOString() : null
    };
    try {
      const saved = await storage.saveTask(user.id, updated);
      setTasks(prev => prev.map(t => t.id === id ? saved : t));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  }, [user, tasks]);

  const moveTask = useCallback(async (id, newStatus) => {
    if (!user) return;
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return;
    const updated = {
      ...existingTask,
      status: newStatus,
      completed: newStatus === 'done'
    };
    try {
      const saved = await storage.saveTask(user.id, updated);
      setTasks(prev => prev.map(t => t.id === id ? saved : t));
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  }, [user, tasks]);

  // ---- HABIT OPERATIONS ----
  const addHabit = useCallback(async (habit) => {
    if (!user) return;
    const newHabit = {
      id: crypto.randomUUID(),
      name: habit.name,
      icon: habit.icon || '✅',
      color: habit.color || '#0058be',
      createdAt: new Date().toISOString(),
    };
    try {
      const saved = await storage.saveHabit(user.id, newHabit);
      setHabits(prev => [...prev, saved]);
    } catch (err) {
      console.error('Failed to add habit:', err);
    }
  }, [user]);

  const deleteHabit = useCallback(async (id) => {
    if (!user) return;
    try {
      await storage.deleteHabit(user.id, id);
      setHabits(prev => prev.filter(h => h.id !== id));
      setHabitLog(prev => {
        const newLog = { ...prev };
        Object.keys(newLog).forEach(date => {
          if (newLog[date]) {
            delete newLog[date][id];
          }
        });
        return newLog;
      });
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  }, [user]);

  const toggleHabitDay = useCallback(async (habitId, dateKey) => {
    if (!user) return;
    const isCompleted = !habitLog[dateKey]?.[habitId];
    
    setHabitLog(prev => {
      const newLog = { ...prev };
      if (!newLog[dateKey]) newLog[dateKey] = {};
      newLog[dateKey][habitId] = isCompleted;
      return newLog;
    });

    try {
      await storage.toggleHabitLog(user.id, habitId, dateKey, isCompleted);
    } catch (err) {
      console.error('Failed to toggle habit day:', err);
      // Revert state on error
      setHabitLog(prev => {
        const newLog = { ...prev };
        if (!newLog[dateKey]) newLog[dateKey] = {};
        newLog[dateKey][habitId] = !isCompleted;
        return newLog;
      });
    }
  }, [user, habitLog]);

  const getHabitStreak = useCallback((habitId) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      if (habitLog[key]?.[habitId]) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [habitLog]);

  // ---- CHAT OPERATIONS ----
  const addChatMessage = useCallback((msg) => {
    if (!user) return;
    const newMsg = { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setChatMessages(prev => {
      const updated = [...prev, newMsg];
      storage.saveChatHistory(user.id, updated);
      return updated;
    });
  }, [user]);

  const clearChat = useCallback(async () => {
    if (!user) return;
    setChatMessages([]);
    await storage.saveChatHistory(user.id, []);
  }, [user]);

  return (
    <AppContext.Provider value={{
      tasks, addTask, updateTask, deleteTask, toggleTask, moveTask,
      habits, addHabit, deleteHabit,
      habitLog, toggleHabitDay, getHabitStreak,
      chatMessages, addChatMessage, clearChat,
      chatOpen, setChatOpen,
      sidebarOpen, setSidebarOpen,
      searchQuery, setSearchQuery,
      workspaces, currentWorkspace, setCurrentWorkspace: handleSetCurrentWorkspace, setWorkspaces,
      reloadWorkspaces, createTeamWorkspace
    }}>
      {children}
    </AppContext.Provider>
  );
}
