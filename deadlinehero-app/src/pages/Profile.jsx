import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar } from '../services/authService';

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

export default function Profile() {
  const { user, setUser } = useAuth();
  const meta = user?.user_metadata || {};
  const [fullName, setFullName] = useState(meta.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(meta.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const updatedUser = await updateProfile({ full_name: fullName, avatar_url: avatarUrl });
      setUser(updatedUser.user);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Error updating profile', type: 'error' });
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg({ text: '', type: '' });
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      const updatedUser = await updateProfile({ avatar_url: publicUrl });
      setUser(updatedUser.user);
      setMsg({ text: 'Profile picture updated!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Error uploading image', type: 'error' });
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', width: '100%' }} className="animate-fade-in">
      <h1 className="page-title" style={{ marginBottom: 24 }}>Your Profile</h1>
      
      <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div 
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              width: 120, height: 120, borderRadius: '50%', background: 'var(--surface-container-high)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
              color: 'var(--primary)', cursor: uploading ? 'not-allowed' : 'pointer', overflow: 'hidden',
              position: 'relative', border: '2px solid var(--outline-variant)'
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={DEFAULT_AVATAR} alt="Default Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#e0e0e0' }} />
            )}
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', color: 'white' }}>sync</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ fontSize: 13, padding: '4px 12px' }}
          >
            Change Photo
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        <div style={{ height: 1, background: 'var(--surface-container)' }} />

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Email Address (Read Only)</label>
            <input 
              type="text" 
              className="form-input" 
              value={user?.email || ''} 
              disabled 
              style={{ opacity: 0.7 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name / Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              placeholder="e.g. John Doe" 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div style={{ fontSize: 13, color: msg.type === 'error' ? 'var(--error)' : 'var(--primary)' }}>
              {msg.text}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
