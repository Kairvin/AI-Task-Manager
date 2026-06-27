import { supabase } from './supabaseClient';

// Sign Up with Email/Password
export const signUp = async (email, password, name) => {
  if (!supabase) {
    const users = JSON.parse(localStorage.getItem('deadlinehero_users') || '[]');
    if (users.find(u => u.email === email)) throw new Error('Account already exists.');
    const user = { id: crypto.randomUUID(), email, name, created_at: new Date().toISOString() };
    users.push({ ...user, password });
    localStorage.setItem('deadlinehero_users', JSON.stringify(users));
    localStorage.setItem('deadlinehero_session', JSON.stringify(user));
    return { user };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  return data;
};

// Sign In with Email/Password
export const signIn = async (email, password) => {
  if (!supabase) {
    const users = JSON.parse(localStorage.getItem('deadlinehero_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password.');
    const { password: _, ...user } = found;
    localStorage.setItem('deadlinehero_session', JSON.stringify(found));
    return { user };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// Google OAuth Login
export const signInWithGoogle = async () => {
  if (!supabase) {
    const user = { id: 'google-demo-id', email: 'googleuser@gmail.com', name: 'Google User', created_at: new Date().toISOString() };
    localStorage.setItem('deadlinehero_session', JSON.stringify(user));
    return { user };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' }
  });
  if (error) throw error;
  return data;
};

// Sign Out
export const signOut = async () => {
  if (!supabase) {
    localStorage.removeItem('deadlinehero_session');
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get Session Status
export const getSession = async () => {
  if (!supabase) {
    const session = localStorage.getItem('deadlinehero_session');
    return session ? { user: JSON.parse(session) } : null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Get Current User Info
export const getUser = async () => {
  if (!supabase) {
    const session = localStorage.getItem('deadlinehero_session');
    return session ? JSON.parse(session) : null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Listen for Session/Auth changes
export const onAuthChange = (callback) => {
  if (!supabase) {
    const check = () => {
      const session = localStorage.getItem('deadlinehero_session');
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session ? { user: JSON.parse(session) } : null);
    };
    check();
    window.addEventListener('storage', check);
    return { data: { subscription: { unsubscribe: () => window.removeEventListener('storage', check) } } };
  }
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

export const updateProfile = async (updates) => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  });
  if (error) throw error;
  return data;
};

export const uploadAvatar = async (userId, file) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
