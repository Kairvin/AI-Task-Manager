import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/authService';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/tasks', icon: 'checklist', label: 'Tasks' },
  { to: '/goals', icon: 'grid_view', label: 'Goals' },
  { to: '/calendar', icon: 'calendar_today', label: 'Calendar' },
];

export default function Sidebar({ onNewTask }) {
  const { tasks, workspaces, currentWorkspace, setCurrentWorkspace, createTeamWorkspace, sidebarOpen, setSidebarOpen } = useApp();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pendingCount = tasks.filter(t => !t.completed).length;

  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const handleCreateTeam = () => {
    const name = window.prompt('Enter Team Workspace Name:');
    if (name && name.trim()) {
      createTeamWorkspace(name.trim());
    }
  };

  const handleJoinTeam = () => {
    const linkOrToken = window.prompt('Enter the invite link or token:');
    if (linkOrToken && linkOrToken.trim()) {
      let token = linkOrToken.trim();
      // If it's a full URL, extract the token
      try {
        if (token.includes('http')) {
          const url = new URL(token);
          if (url.searchParams.has('token')) {
            token = url.searchParams.get('token');
          }
        }
      } catch (e) {
        // Not a valid URL, treat as raw token
      }
      navigate(`/join?token=${token}`);
    }
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.name || user?.email || 'U';
    return name[0].toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Header with avatar + brand */}
        <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <button 
            onClick={() => { navigate('/profile'); handleNavClick(); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 12, background: 'transparent', 
              border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              padding: '8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div className="sidebar-avatar" style={{ overflow: 'hidden' }}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getUserInitials()
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className="sidebar-brand" style={{ marginBottom: 2 }}>DeadlineHero</span>
              <span className="sidebar-role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.user_metadata?.full_name || user?.name || user?.email || 'User'}
              </span>
            </div>
          </button>
          
          {workspaces.length > 1 && (
            <div style={{ marginTop: 16, position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--outline)', background: 'var(--surface-container)',
                  color: 'var(--on-surface)', fontFamily: 'var(--font-body)', fontSize: 13, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--outline)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>
                    {currentWorkspace?.is_personal ? 'person' : 'workspaces'}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentWorkspace?.name}
                  </span>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 16, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-md)', zIndex: 10, overflow: 'hidden'
                }}>
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setCurrentWorkspace(ws);
                        setDropdownOpen(false);
                      }}
                      style={{
                        width: '100%', padding: '10px 12px', background: 'transparent', border: 'none',
                        color: ws.id === currentWorkspace?.id ? 'var(--primary)' : 'var(--on-surface)',
                        textAlign: 'left', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                        borderBottom: '1px solid var(--surface-container)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-container)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {ws.is_personal ? 'person' : 'workspaces'}
                      </span>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ws.name}
                      </span>
                      {ws.id === currentWorkspace?.id && (
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          className="sidebar-cta"
          onClick={() => { onNewTask(); handleNavClick(); }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          New Entry
        </button>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              end={item.to === '/dashboard'}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: `'FILL' 0`,
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.label === 'Tasks' && pendingCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontFamily: 'var(--font-label)',
                  background: 'var(--primary)',
                  color: 'var(--on-primary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 8px',
                  fontWeight: 600,
                }}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {(!currentWorkspace || currentWorkspace.is_personal) && (
            <>
              <button className="sidebar-footer-link" onClick={() => { handleCreateTeam(); handleNavClick(); }} style={{ color: 'var(--primary)', marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_circle</span>
                Create Team Workspace
              </button>
              <button className="sidebar-footer-link" onClick={() => { handleJoinTeam(); handleNavClick(); }} style={{ color: 'var(--primary)', marginBottom: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>link</span>
                Join Team Workspace
              </button>
            </>
          )}
          {currentWorkspace && !currentWorkspace.is_personal && (
            <button className="sidebar-footer-link" onClick={() => { navigate('/team-settings'); handleNavClick(); }} style={{ color: 'var(--primary)', marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>group</span>
              Team Settings
            </button>
          )}
          <button className="sidebar-footer-link" onClick={handleSignOut}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
