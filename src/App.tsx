import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdDashboard, MdCategory, MdInventory, MdAssessment, MdPeople, MdSettings } from 'react-icons/md';
import type { IconBaseProps } from 'react-icons';
import { authAPI, productsAPI } from './services/api';
import { User, ProductFormData } from './types';
import { formatCurrency } from './utils/helpers';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useNotifications } from './hooks/useDashboard';
import { notificationManager } from './services/notificationManager';
import { dataManager } from './services/dataManager';
import { isFirebaseEnabled, getAuthInstance, getDbInstance } from './services/firebase';
import { migrateLocalProductsToFirestore } from './services/migration';
import './styles/globals.css';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Import pages
import Dashboard from './pages/dashboard_dynamic';
import Inventory from './pages/inventory_dynamic';
import Products from './pages/products';
import Reports from './pages/reports';
import Settings from './pages/settings';
import Users from './pages/users';
import { AnimatedLayout } from './components/AnimatedLayout';

// Shared nav item types for top/side navigation
type PageKey = 'dashboard' | 'products' | 'inventory' | 'reports' | 'settings' | 'users';
type NavItem = { name: string; page: PageKey; Icon: React.ComponentType<IconBaseProps>; desc: string };

// Enhanced Login Component
const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (mode === 'login') {
        const response = await authAPI.login({ username, password });
        if (response.success) {
          onLogin(response.data.user);
        } else {
          setError(response.error || 'Login failed');
        }
      } else if (mode === 'signup') {
        if (!isFirebaseEnabled()) {
          setError('Sign up requires Firebase to be configured.');
        } else if (password !== confirmPassword) {
          setError('Passwords do not match');
        } else {
          const auth = getAuthInstance();
          const db = getDbInstance();
          if (!auth || !db) throw new Error('Auth/DB not initialized');
          const cred = await createUserWithEmailAndPassword(auth, username, password);
          const fbUser = cred.user;
          await setDoc(doc(db, 'users', fbUser.uid), {
            email: fbUser.email,
            role: 'staff',
            isActive: true,
            profile: {
              firstName,
              lastName,
              phone: '',
              department: ''
            },
            settings: {
              notifications: { email: true, push: false, sms: false },
              dashboard: { showRecentActivities: true, showQuickStats: true }
            },
            createdAt: new Date().toISOString()
          });
          const appUser: User = {
            id: fbUser.uid,
            username: fbUser.email || fbUser.uid,
            email: fbUser.email || '',
            role: 'staff',
            permissions: ['products:read','inventory:read','reports:read'],
            isActive: true,
            lastLogin: new Date()
          };
          onLogin(appUser);
        }
      } else if (mode === 'reset') {
        if (!isFirebaseEnabled()) {
          setError('Password reset requires Firebase to be configured.');
        } else {
          const auth = getAuthInstance();
          if (!auth) throw new Error('Auth not initialized');
          await sendPasswordResetEmail(auth, username);
          setMode('login');
          notificationManager.showSuccess('Password reset', 'Check your email for a reset link.');
        }
      }
    } catch (err: unknown) {
      let message = 'Operation failed';
      let code: string | undefined;
      if (err && typeof err === 'object' && 'code' in (err as any)) {
        code = (err as any).code as string;
      }
      if (code) {
        switch (code) {
          case 'auth/email-already-in-use':
            message = 'An account already exists for this email. Please sign in or use “Forgot password”.';
            // If this happened during sign up, guide the user to Sign In
            if (mode === 'signup') setMode('login');
            break;
          case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            message = 'Password is too weak. Use at least 6 characters.';
            break;
          case 'auth/operation-not-allowed':
            message = 'Email/password sign-in is not enabled for this project.';
            break;
          case 'auth/user-disabled':
            message = 'This account has been disabled. Contact support.';
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            message = 'Incorrect email or password.';
            break;
          default:
            message = (err as any).message || message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px'
    }}>
      <div className="glass-card auth-card">
        <div className="auth-header">
          <div className="auth-title">SmartStock</div>
          <div className="auth-subtitle">Inventory Management System</div>
        </div>
        <div className="tab-nav" style={{ marginBottom: 16 }}>
          <button type="button" className={`tab-button ${mode==='login' ? 'active' : ''}`} onClick={()=>setMode('login')}>Sign In</button>
          <button type="button" className={`tab-button ${mode==='signup' ? 'active' : ''}`} onClick={()=>setMode('signup')}>Sign Up</button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="modern-input"
                  value={firstName}
                  onChange={(e)=>setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="modern-input"
                  value={lastName}
                  onChange={(e)=>setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="modern-input"
            />
          </div>

          {mode !== 'reset' && (
            <>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="modern-input"
                    id="password"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => {
                      const el = document.getElementById('password') as HTMLInputElement | null;
                      if (el) el.type = el.type === 'password' ? 'text' : 'password';
                    }}
                    className="btn-link"
                    style={{ position: 'absolute', right: 12, top: 12 }}
                  >
                    Show
                  </button>
                </div>
              </div>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="modern-input"
                  />
                </div>
              )}
            </>
          )}
          {mode === 'login' && (
            <div className="inline-group" style={{ marginBottom: 12 }}>
              <label className="checkbox">
                <input type="checkbox" onChange={(e)=>{
                  try { localStorage.setItem('remember_me', e.target.checked ? '1' : '0'); } catch {}
                }} /> Remember me
              </label>
              <button type="button" className="btn-link" onClick={()=>setMode('reset')}>Forgot password?</button>
            </div>
          )}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isLoading && <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>}
            {isLoading
              ? (mode === 'signup' ? 'Creating...' : mode === 'reset' ? 'Sending...' : 'Signing in...')
              : (mode === 'signup' ? 'Create Account' : mode === 'reset' ? 'Send Reset Link' : 'Sign In')}
          </button>
          <div style={{ marginTop: '16px', fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {mode === 'login' && (
              <>
                <span>New here? </span>
                <button type="button" className="btn-link" onClick={()=>setMode('signup')}>Create an account</button>
              </>
            )}
            {mode === 'signup' && (
              <>
                <span>Already have an account? </span>
                <button type="button" className="btn-link" onClick={()=>setMode('login')}>Sign in</button>
              </>
            )}
            {mode === 'reset' && (
              <>
                <span>Remembered your password? </span>
                <button type="button" className="btn-link" onClick={()=>setMode('login')}>Back to sign in</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Navbar Component
const ThemeToggle: React.FC = () => {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>Theme</span>
      <select
        value={preference}
        onChange={(e) => setPreference(e.target.value as any)}
        className="modern-select"
        style={{ marginBottom: 0, padding: '6px 10px', fontSize: '12px', width: '120px' }}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
};

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: 'dashboard' | 'products' | 'inventory' | 'reports' | 'settings' | 'users';
  onNavigate: (page: 'dashboard' | 'products' | 'inventory' | 'reports' | 'settings' | 'users') => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, onNavigate }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  return (
    <nav style={{ 
      background: 'var(--surface)', 
      borderBottom: '1px solid var(--border)', 
      padding: '0 24px',
      boxShadow: 'var(--shadow)',
      position: 'relative',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: 'var(--text)' }}>
            SmartStock
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--surface-2)', padding: '4px 8px', borderRadius: '4px' }}>
            v2.0 Dynamic
          </span>
          {/* Real-time indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            fontSize: '12px', 
            color: 'var(--text)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            <div style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: 'var(--primary)',
              animation: 'pulse 2s infinite'
            }}></div>
            Live
          </div>

          {/* Quick Top Navigation moved to second row below */}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ThemeToggle />
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleNotificationClick}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                position: 'relative',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: '400px',
                maxHeight: '500px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)',
                zIndex: 1001,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                      <div>No notifications</div>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleMarkAsRead(notification.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: notification.read ? 'transparent' : 'var(--surface-2)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'var(--surface-2)'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: notification.read ? 'var(--text-muted)' : 'var(--text)'
                          }}>
                            {notification.title}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            marginLeft: '8px'
                          }}>
                            {new Date(notification.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: notification.read ? 'var(--text-muted)' : 'var(--text-muted)',
                          lineHeight: '1.4'
                        }}>
                          {notification.message}
                        </div>
                        {!notification.read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            position: 'absolute',
                            right: '12px',
                            top: '18px'
                          }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '8px 16px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Second row: Quick Navigation - full-width, wraps, colorful badges */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        width: '100%',
        padding: '8px 0 12px'
      }}>
        {(([ 
          { name: 'Dashboard', page: 'dashboard', Icon: MdDashboard, desc: 'Overview & Analytics' },
          { name: 'Products', page: 'products', Icon: MdCategory, desc: 'Manage Products' },
          { name: 'Inventory', page: 'inventory', Icon: MdInventory, desc: 'Stock Management' },
          { name: 'Reports', page: 'reports', Icon: MdAssessment, desc: 'Analytics & Reports' },
          { name: 'Users', page: 'users', Icon: MdPeople, desc: 'User Management' },
          { name: 'Settings', page: 'settings', Icon: MdSettings, desc: 'Configuration' },
        ] as NavItem[])).map((item) => {
          const IconComp = item.Icon;
          const accentBg =
            item.page === 'dashboard' ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' :
            item.page === 'products' ? 'linear-gradient(135deg, #ec4899, #f59e0b)' :
            item.page === 'inventory' ? 'linear-gradient(135deg, #10b981, #06b6d4)' :
            item.page === 'reports' ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' :
            item.page === 'users' ? 'linear-gradient(135deg, #f97316, #ef4444)' :
            'linear-gradient(135deg, #6b7280, #374151)';
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="btn-icon"
              style={{
                padding: '10px 12px',
                width: 'auto',
                height: 'auto',
                borderRadius: 8,
                border: currentPage === item.page ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: currentPage === item.page ? 'var(--surface-2)' : 'var(--surface)',
                color: currentPage === item.page ? 'var(--primary)' : 'var(--text-muted)',
                flex: '1 1 200px',
                minWidth: '200px',
              }}
              title={`${item.name} — ${item.desc}`}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: accentBg,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)'
                }}>
                  <IconComp size={16} color="#fff" />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowNotifications(false)}
        />
      )}
    </nav>
  );
};

// Product Form Modal Component
interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    quantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    supplier: '',
    barcode: '',
    gstRate: 18,
    hsnCode: '',
    brand: '',
    unit: 'pieces',
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'minStockLevel' || name === 'maxStockLevel' || name === 'gstRate' 
        ? Number(value) 
        : value
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <motion.div
        initial={{ y: 12, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -6, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="glass-card"
        style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Add New Product</h2>
          <button
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="modern-input"
                placeholder="Enter product name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="modern-input"
                placeholder="Enter brand name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="modern-input"
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="modern-select"
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Health & Beauty">Health & Beauty</option>
                <option value="Dairy">Dairy</option>
                <option value="Grocery">Grocery</option>
                <option value="Clothing">Clothing</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Sports">Sports</option>
                <option value="Books">Books</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                className="modern-input"
                placeholder="Enter supplier name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="modern-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">GST Rate (%) *</label>
              <select
                name="gstRate"
                value={formData.gstRate}
                onChange={handleChange}
                className="modern-select"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Current Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="modern-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="modern-select"
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Stock Level *</label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
                required
                min="0"
                className="modern-input"
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Stock Level *</label>
              <input
                type="number"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleChange}
                required
                min="0"
                className="modern-input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Barcode</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="modern-input"
                placeholder="Enter barcode"
              />
            </div>
            <div className="form-group">
              <label className="form-label">HSN Code</label>
              <input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                className="modern-input"
                placeholder="Enter HSN code"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Storage Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="modern-input"
              placeholder="e.g., A1-Shelf-01"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isLoading && <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>}
              {isLoading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'products' | 'inventory' | 'reports' | 'settings' | 'users'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  // Sidebar removed; no toggle state

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  // Initialize dynamic features when user logs in
  useEffect(() => {
    if (user) {
      // Show welcome notification for dynamic features
      setTimeout(() => {
        notificationManager.showInfo(
          '🚀 SmartStock Dynamic Features Activated!',
          'Your inventory management system now includes real-time updates, notifications, and enhanced analytics.'
        );
      }, 1000);
    }
  }, [user]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Kick off one-time migration to Firestore after login
    if (isFirebaseEnabled()) {
      migrateLocalProductsToFirestore().then(res => {
        if (res && res.imported > 0) {
          notificationManager.showSuccess('Migration complete', `${res.imported} products imported to Firestore`);
        }
      });
    }
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  // Sidebar removed; no toggle handler

  const handleAddProduct = async (productData: ProductFormData) => {
    setIsAddingProduct(true);
    try {
      const response = await productsAPI.create(productData);
      if (response.success) {
        setIsProductFormOpen(false);
        // Reset form or show success message
        alert('Product added successfully!');
      } else {
        alert('Failed to add product: ' + response.error);
      }
    } catch (error) {
      alert('Failed to add product');
    } finally {
      setIsAddingProduct(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ color: 'var(--text)', fontSize: '14px' }}>Loading SmartStock...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <Users />;
      default:
        return (
          <Dashboard />
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      {/* Main Content - full width now that sidebar is removed */}
      <main style={{ padding: '24px' }}>
        <AnimatedLayout id={currentPage}>
          {renderCurrentPage()}
        </AnimatedLayout>
      </main>

      {/* Product Form Modal */}
      {isProductFormOpen && (
        <ProductForm
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          onSubmit={handleAddProduct}
          isLoading={isAddingProduct}
        />
      )}
    </div>
  );
};

export default function AppWithCurrency() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </ThemeProvider>
  );
}