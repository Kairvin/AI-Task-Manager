import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { inviteMember, getWorkspaceMembers } from '../services/storageService';

export default function TeamSettings() {
  const { currentWorkspace } = useApp();
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (currentWorkspace && !currentWorkspace.is_personal) {
      loadMembers();
    }
  }, [currentWorkspace]);

  const loadMembers = async () => {
    const mems = await getWorkspaceMembers(currentWorkspace.id);
    setMembers(mems);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setMsg('');
    setInviteLink('');
    const originUrl = window.location.origin;
    const res = await inviteMember(currentWorkspace.id, email, 'member', originUrl);
    if (res.error) {
      setMsg(`Error: ${res.error}`);
    } else {
      setMsg('Invite created!');
      setInviteLink(`${originUrl}/join?token=${res.token}`);
      setEmail('');
    }
    setLoading(false);
  };

  if (!currentWorkspace || currentWorkspace.is_personal) {
    return <div style={{ padding: 40 }}>This is a personal workspace. Switch to a team workspace to view settings.</div>;
  }

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <h1>{currentWorkspace.name} - Settings</h1>
      
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3>Invite Members</h3>
        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 8 }}>
          Generate a secure link to invite team members to this workspace. Anyone with the link can join.
        </p>
        
        <div style={{ marginTop: 16 }}>
          {!inviteLink ? (
            <button 
              onClick={() => {
                const dummyEmail = `invite-${Date.now()}@link.local`;
                const originUrl = window.location.origin;
                setLoading(true);
                inviteMember(currentWorkspace.id, dummyEmail, 'member', originUrl).then(res => {
                  if (res.error) {
                    setMsg(`Error: ${res.error}`);
                  } else {
                    setMsg('');
                    setInviteLink(`${originUrl}/join?token=${res.token}`);
                  }
                  setLoading(false);
                });
              }} 
              className="btn btn-primary" 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>link</span>
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </button>
          ) : (
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, 
              background: 'var(--surface-container-high)', padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>check_circle</span>
                <a href={inviteLink} target="_blank" rel="noreferrer" style={{ 
                  color: 'var(--on-surface)', fontSize: 14, fontWeight: 500, 
                  textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {inviteLink}
                </a>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setMsg('Link copied to clipboard!');
                }}
                title="Copy Link"
                style={{ 
                  background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', 
                  borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500, flexShrink: 0,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
                Copy
              </button>
            </div>
          )}
        </div>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: msg.startsWith('Error') ? 'var(--error)' : 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {msg.startsWith('Error') ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span> : <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
          {msg}
        </div>}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3>Members</h3>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {members.map(m => (
            <div key={m.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface-container)', borderRadius: 8 }}>
              <div>
                <strong>{m.full_name || m.email || 'Unknown User'}</strong>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
              <div style={{ textTransform: 'capitalize', fontSize: 13, background: 'var(--surface-container-high)', padding: '4px 12px', borderRadius: 12 }}>
                {m.role}
              </div>
            </div>
          ))}
          {members.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No members found.</div>}
        </div>
      </div>
    </div>
  );
}
