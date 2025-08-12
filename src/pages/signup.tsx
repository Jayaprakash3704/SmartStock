import React, { useState } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import { authAPI } from '../services/api';
import { User } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface SignUpProps {
  onRegister: (user: User) => void;
  onSwitchToSignIn: () => void;
}

const container: Variants = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const card: Variants = { initial: { y: 16, opacity: 0, scale: 0.98 }, animate: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 250, damping: 24 }}, exit: { y: -8, opacity: 0, scale: 0.98 }};

export default function SignUp({ onRegister, onSwitchToSignIn }: SignUpProps) {
  const prefersReducedMotion = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    const res = await authAPI.register(email, password, name);
    setIsLoading(false);
    if (res.success) onRegister(res.data.user); else setError(res.error || 'Registration failed');
  };

  const google = async () => {
    const res = await authAPI.loginWithGoogle();
    if (res.success) onRegister(res.data.user); else setError(res.error || 'Google login failed');
  };

  return (
    <motion.div className="min-h-screen flex items-center justify-center" style={{ padding: 16, background: 'linear-gradient(135deg, var(--bg), color-mix(in srgb, var(--primary) 6%, transparent))' }} variants={container} initial="initial" animate="animate" exit="exit">
      <motion.div className="auth-card" variants={prefersReducedMotion ? undefined : card}>
        <Card padding="lg">
          <div className="auth-header">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join SmartStock and manage inventory smarter</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="name">Name</label>
              <input id="name" className="modern-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="modern-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
            </div>
            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="modern-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <div>
              <label className="form-label" htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type="password" className="modern-input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <Button type="submit" loading={isLoading} fullWidth size="lg">Create Account</Button>
            <Button type="button" variant="outline" fullWidth onClick={google}>Continue with Google</Button>
          </form>
          <p className="helper-text text-center mt-4">Already have an account? <button className="btn-link" onClick={onSwitchToSignIn}>Sign In</button></p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
