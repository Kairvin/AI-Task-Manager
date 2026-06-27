import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { acceptInvite } from '../services/storageService';

export default function Join() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Processing invite...');

  useEffect(() => {
    if (!token) {
      setStatus('Invalid invite link.');
      return;
    }

    if (!user) {
      // User must be logged in to accept an invite
      sessionStorage.setItem('pendingInvite', token);
      navigate('/login?redirect=join');
      return;
    }

    const processInvite = async () => {
      const res = await acceptInvite(token, user.id);
      if (res.error) {
        setStatus(`Failed to join: ${res.error}`);
      } else {
        setStatus('Successfully joined the workspace! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload(); // Hard reload to refresh contexts
        }, 2000);
      }
    };

    processInvite();
  }, [token, user, navigate]);

  return (
    <div style={{ padding: 40, textAlign: 'center', marginTop: 100 }}>
      <h2>{status}</h2>
    </div>
  );
}
