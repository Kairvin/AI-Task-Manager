import { supabase } from './supabaseClient';

const getLocal = (key, userId) => JSON.parse(localStorage.getItem(`${key}_${userId || 'demo'}`)) || null;
const setLocal = (key, userId, data) => localStorage.setItem(`${key}_${userId || 'demo'}`, JSON.stringify(data));

// Mappings between Database snake_case and Javascript camelCase
const mapTask = (t, userId) => ({
  id: t.id || crypto.randomUUID(),
  user_id: userId,
  title: t.title || 'Untitled',
  description: t.description || '',
  priority: t.priority || 'medium',
  category: t.category || 'Work',
  due_date: t.dueDate || t.due_date || null,
  completed: t.completed ?? false,
  status: t.status || 'todo',
  workspace_id: t.workspaceId || t.workspace_id || null,
  assignee_id: t.assigneeId || t.assignee_id || null,
  completed_at: t.completedAt || t.completed_at || null,
  created_at: t.createdAt || t.created_at || new Date().toISOString()
});

const mapTaskJS = (t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  priority: t.priority,
  category: t.category,
  dueDate: t.due_date,
  completed: t.completed,
  status: t.status,
  workspaceId: t.workspace_id,
  assigneeId: t.assignee_id,
  completedAt: t.completed_at,
  createdAt: t.created_at
});

const mapHabit = (h, userId) => ({
  id: h.id || crypto.randomUUID(),
  user_id: userId,
  name: h.name,
  description: h.desc || h.description || '',
  icon: h.icon || '✅',
  color: h.color || '#0058be',
  created_at: h.createdAt || h.created_at || new Date().toISOString()
});

const mapHabitJS = (h) => ({
  id: h.id,
  name: h.name,
  desc: h.description,
  icon: h.icon,
  color: h.color,
  createdAt: h.created_at
});

// ---- Tasks Operations ----
export const getTasks = async (userId, workspaceId = null) => {
  if (supabase) {
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      } else {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error) return data.map(mapTaskJS);
      console.warn('Supabase Tasks query failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase Tasks query exception:', e);
    }
  }
  const local = getLocal('tasks', userId) || [];
  return workspaceId ? local.filter(t => t.workspaceId === workspaceId) : local;
};

export const saveTask = async (userId, task) => {
  const dbTask = mapTask(task, userId);
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tasks').upsert(dbTask).select().single();
      if (!error) return mapTaskJS(data);
      console.warn('Supabase saveTask failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase saveTask exception:', e);
    }
  }
  const tasks = getLocal('tasks', userId) || [];
  const idx = tasks.findIndex(t => t.id === dbTask.id);
  const jsTask = mapTaskJS(dbTask);
  if (idx >= 0) tasks[idx] = jsTask;
  else tasks.unshift(jsTask);
  setLocal('tasks', userId, tasks);
  return jsTask;
};

// ---- Workspaces Operations ----
let creatingPersonal = {};

export const getWorkspaces = async (userId) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('workspaces(*)')
      .eq('user_id', userId);
    
    if (!error && data) {
      let wsList = data.map(d => d.workspaces).filter(Boolean);
      
      // Ensure the user always has a Personal Workspace
      if (!wsList.some(ws => ws.is_personal)) {
        if (!creatingPersonal[userId]) {
          creatingPersonal[userId] = createWorkspace('Personal Workspace', userId, true).finally(() => {
            setTimeout(() => { delete creatingPersonal[userId]; }, 1000);
          });
        }
        const personalWs = await creatingPersonal[userId];
        if (personalWs && !wsList.find(w => w.id === personalWs.id)) {
          wsList.push(personalWs);
        }
      }
      return wsList;
    } else if (error) {
      console.error('Error fetching workspaces:', error);
    }
  }
  // Local fallback
  return [{ id: 'local-personal', name: 'Personal Workspace', is_personal: true }];
};

export const createWorkspace = async (name, userId, isPersonal = false) => {
  if (supabase) {
    const { data: ws, error } = await supabase.from('workspaces').insert({ name, owner_id: userId, is_personal: isPersonal }).select().single();
    if (!error && ws) {
      await supabase.from('workspace_members').insert({ workspace_id: ws.id, user_id: userId, role: 'owner' });
      return ws;
    }
  }
  return { id: crypto.randomUUID(), name, is_personal: isPersonal };
};

export const inviteMember = async (workspaceId, email, role, originUrl) => {
  if (!supabase) return { error: 'Supabase required' };
  
  // Create invite record
  const { data: invite, error } = await supabase
    .from('workspace_invites')
    .insert({ workspace_id: workspaceId, email, role })
    .select().single();
    
  if (error) return { error: error.message };

  // Get workspace name
  const { data: ws } = await supabase.from('workspaces').select('name').eq('id', workspaceId).single();

  // Call Edge function to send email (Errors ignored for local testing)
  await supabase.functions.invoke('invite-team-member', {
    body: { email, workspaceName: ws?.name || 'A Workspace', inviteToken: invite.token, originUrl }
  }).catch(console.warn);

  return { success: true, token: invite.token };
};

export const getWorkspaceMembers = async (workspaceId) => {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_workspace_members_details', {
    ws_id: workspaceId
  });
  if (!error && data) return data;
  return [];
};

export const acceptInvite = async (token, userId) => {
  if (!supabase) return { error: 'Supabase required' };
  
  // Find invite
  const { data: invite, error: invErr } = await supabase
    .from('workspace_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single();

  if (invErr || !invite) return { error: 'Invalid or expired invite' };

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', userId)
    .single();

  if (!existingMember) {
    // Add member
    const { error: memErr } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: invite.workspace_id, user_id: userId, role: invite.role });

    if (memErr) return { error: memErr.message };
  }

  // Mark invite accepted
  await supabase.from('workspace_invites').update({ status: 'accepted' }).eq('id', invite.id);

  return { success: true, workspaceId: invite.workspace_id };
};

export const deleteTask = async (userId, taskId) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
      if (!error) return;
      console.warn('Supabase deleteTask failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase deleteTask exception:', e);
    }
  }
  const tasks = getLocal('tasks', userId) || [];
  setLocal('tasks', userId, tasks.filter(t => t.id !== taskId));
};

// ---- Habits Operations ----
export const getHabits = async (userId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (!error) return data.map(mapHabitJS);
      console.warn('Supabase Habits failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase Habits exception:', e);
    }
  }
  return getLocal('habits', userId) || [];
};

export const saveHabit = async (userId, habit) => {
  const dbHabit = mapHabit(habit, userId);
  if (supabase) {
    try {
      const { data, error } = await supabase.from('habits').upsert(dbHabit).select().single();
      if (!error) return mapHabitJS(data);
      console.warn('Supabase saveHabit failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase saveHabit exception:', e);
    }
  }
  const habits = getLocal('habits', userId) || [];
  const idx = habits.findIndex(h => h.id === dbHabit.id);
  const jsHabit = mapHabitJS(dbHabit);
  if (idx >= 0) habits[idx] = jsHabit;
  else habits.push(jsHabit);
  setLocal('habits', userId, habits);
  return jsHabit;
};

export const deleteHabit = async (userId, habitId) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
      if (!error) return;
      console.warn('Supabase deleteHabit failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase deleteHabit exception:', e);
    }
  }
  const habits = getLocal('habits', userId) || [];
  setLocal('habits', userId, habits.filter(h => h.id !== habitId));
  
  const log = getLocal('habit_log', userId) || {};
  Object.keys(log).forEach(d => log[d] && delete log[d][habitId]);
  setLocal('habit_log', userId, log);
};

// ---- Habit Logs Operations ----
export const getHabitLog = async (userId) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('habit_logs').select('*').eq('user_id', userId).eq('completed', true);
      if (!error) {
        const log = {};
        data.forEach(r => {
          if (!log[r.date]) log[r.date] = {};
          log[r.date][r.habit_id] = true;
        });
        return log;
      }
      console.warn('Supabase HabitLog failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase HabitLog exception:', e);
    }
  }
  return getLocal('habit_log', userId) || {};
};

export const toggleHabitLog = async (userId, habitId, date, completed) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('habit_logs').upsert({ user_id: userId, habit_id: habitId, date, completed }, { onConflict: 'user_id,habit_id,date' });
      if (!error) return;
      console.warn('Supabase toggleHabitLog failed, fallback to local:', error.message);
    } catch (e) {
      console.warn('Supabase toggleHabitLog exception:', e);
    }
  }
  const log = getLocal('habit_log', userId) || {};
  if (!log[date]) log[date] = {};
  log[date][habitId] = completed;
  setLocal('habit_log', userId, log);
};

// ---- Chat History Operations ----
export const getChatHistory = async (userId) => getLocal('chat', userId) || [];
export const saveChatHistory = async (userId, msgs) => setLocal('chat', userId, msgs);

// ---- Seeding Demo Data ----
export const seedDemoData = async (userId) => {
  // Demo data seeding has been disabled by user request
  return;
};
