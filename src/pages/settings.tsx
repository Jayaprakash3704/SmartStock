import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getDbInstance, getAuthInstance, isFirebaseEnabled } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { notificationManager } from '../services/notificationManager';
import { AppSettings, BusinessSettings, CurrencySettings, INDIAN_CURRENCY } from '../types';
import { useCurrency, AVAILABLE_CURRENCIES } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContextNew';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
];

const Settings: React.FC = () => {
  const { currentCurrency, setCurrency, formatCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'business' | 'preferences' | 'security' | 'integrations'>('business');
  const [settings, setSettings] = useState<AppSettings>({
    business: {
      companyName: 'SmartStock Store',
      businessName: 'SmartStock Store',
      gstNumber: '29ABCDE1234F1Z5',
      address: '123 Main Street, City, State - 560001',
      phone: '+91 98765 43210',
      email: 'info@smartstock.com',
      currency: INDIAN_CURRENCY,
      taxSettings: {
        defaultGstRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
      },
    },
    preferences: {
      theme: 'system',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      numberFormat: 'indian',
      notifications: true,
      autoBackup: true,
      lowStockThreshold: 10,
      itemsPerPage: 20,
      dataRetention: 365,
      timezone: 'Asia/Kolkata',
    },
    features: {
      multiLocation: false,
      barcodeScranning: true,
      gstReporting: true,
      advancedAnalytics: false,
      inventory: true,
      sales: true,
      purchases: true,
      reports: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Email Notifications modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [smtp, setSmtp] = useState({
    host: localStorage.getItem('smtp_host') || '',
    port: Number(localStorage.getItem('smtp_port') || 587),
    user: localStorage.getItem('smtp_user') || '',
    pass: localStorage.getItem('smtp_pass') || '',
    from: localStorage.getItem('smtp_from') || '',
    secure: (localStorage.getItem('smtp_secure') || 'false') === 'true'
  });
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState(localStorage.getItem('smtp_test_to') || settings.business.email || '');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Persist settings per account when Firebase is enabled
      if (isFirebaseEnabled()) {
        const db = getDbInstance();
        const auth = getAuthInstance();
        const uid = auth?.currentUser?.uid;
        if (!db || !uid) throw new Error('Not authenticated');
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { profile: {}, settings });
        } else {
          await updateDoc(ref, { settings });
        }
      } else {
        // Local fallback
        localStorage.setItem('app_settings', JSON.stringify(settings));
      }
  setSaveStatus('saved');
  notificationManager.showSuccess('Settings Saved', 'Your preferences have been updated.');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
  notificationManager.showError('Save Failed', 'Could not save your settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusinessSettings = (field: keyof BusinessSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      business: {
        ...prev.business,
        [field]: value,
      },
    }));
  };

  const updatePreferences = (field: keyof AppSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const updateFeatures = (field: keyof AppSettings['features'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: 'business', label: 'Business Info', icon: '⚙️' },
    { id: 'preferences', label: 'Preferences', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🛡️' },
    { id: 'integrations', label: 'Integrations', icon: '💾' },
  ];

  useEffect(() => {
    (async () => {
      try {
        if (isFirebaseEnabled()) {
          const db = getDbInstance();
          const auth = getAuthInstance();
          const uid = auth?.currentUser?.uid;
          if (db && uid) {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            const data = snap.exists() ? snap.data() : null;
            if (data?.settings) setSettings(prev => ({ ...prev, ...(data.settings as any) }));
          }
        } else {
          const raw = localStorage.getItem('app_settings');
          if (raw) setSettings(prev => ({ ...prev, ...(JSON.parse(raw)) }));
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings & Configuration</h1>
          <p className="page-description">Manage your business settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`btn-primary ${saveStatus === 'saved' ? 'btn-success' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '16px' }}>💾</span>
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved!'}
          {saveStatus === 'error' && 'Error'}
          {saveStatus === 'idle' && 'Save Changes'}
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tab Navigation */}
    <div className="tab-nav" style={{ display: 'flex' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '32px' }}>
          {activeTab === 'business' && (
            <motion.div key="business" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ maxWidth: '600px' }}>
              <h3 className="page-title--solid" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                Business Information
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    value={settings.business.businessName}
                    onChange={(e) => updateBusinessSettings('businessName', e.target.value)}
                    className="modern-input"
                    placeholder="Enter business name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input
                    type="text"
                    value={settings.business.gstNumber}
                    onChange={(e) => updateBusinessSettings('gstNumber', e.target.value)}
                    className="modern-input"
                    placeholder="29ABCDE1234F1Z5"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Business Address</label>
                <textarea
                  value={settings.business.address}
                  onChange={(e) => updateBusinessSettings('address', e.target.value)}
                  className="modern-input"
                  rows={3}
                  placeholder="Enter complete business address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={settings.business.phone}
                    onChange={(e) => updateBusinessSettings('phone', e.target.value)}
                    className="modern-input"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    value={settings.business.email}
                    onChange={(e) => updateBusinessSettings('email', e.target.value)}
                    className="modern-input"
                    placeholder="info@business.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Currency (Global Setting)</label>
                <select
                  value={currentCurrency.code}
                  onChange={(e) => {
                    const currency = AVAILABLE_CURRENCIES.find(c => c.code === e.target.value);
                    if (currency) setCurrency(currency);
                  }}
                  className="modern-select"
                >
                  {AVAILABLE_CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  This will change the currency display across all pages
                </p>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
                GST Settings
              </h4>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default GST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.business.taxSettings?.defaultGstRate || 18}
                    onChange={(e) => updateBusinessSettings('taxSettings', {
                      ...settings.business.taxSettings,
                      defaultGstRate: Number(e.target.value)
                    })}
                    className="modern-input"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CGST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.business.taxSettings?.cgstRate || 9}
                    onChange={(e) => updateBusinessSettings('taxSettings', {
                      ...settings.business.taxSettings,
                      cgstRate: Number(e.target.value)
                    })}
                    className="modern-input"
                    min="0"
                    max="25"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div key="preferences" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ maxWidth: '600px' }}>
              <h3 className="page-title--solid" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                Application Preferences
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      const selectedTheme = e.target.value as 'light' | 'dark';
                      setTheme(selectedTheme);
                      updatePreferences('theme', selectedTheme);
                    }}
                    className="modern-select"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => updatePreferences('language', e.target.value)}
                    className="modern-select"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select
                    value={settings.preferences.dateFormat}
                    onChange={(e) => updatePreferences('dateFormat', e.target.value)}
                    className="modern-select"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Number Format</label>
                  <select
                    value={settings.preferences.numberFormat}
                    onChange={(e) => updatePreferences('numberFormat', e.target.value)}
                    className="modern-select"
                  >
                    <option value="indian">Indian (1,23,45,678)</option>
                    <option value="international">International (12,345,678)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                <input
                  type="number"
                  value={settings.preferences.lowStockThreshold}
                  onChange={(e) => updatePreferences('lowStockThreshold', Number(e.target.value))}
                  className="modern-input"
                  min="1"
                  placeholder="10"
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Products with stock below this level will show as low stock alerts
                </small>
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.preferences.autoBackup}
                    onChange={(e) => updatePreferences('autoBackup', e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Enable Auto Backup</span>
                </label>
                <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '28px' }}>
                  Automatically backup data daily at midnight
                </small>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
                Features
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(settings.features).map(([key, value]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateFeatures(key as keyof AppSettings['features'], e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ maxWidth: '600px' }}>
              <h3 className="page-title--solid" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                Security Settings
              </h3>
              
              <div className="glass-card" style={{ padding: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
                  Password Policy
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px' }}>Require minimum 8 characters</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px' }}>Require uppercase and lowercase letters</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px' }}>Require at least one number</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px' }}>Require special characters</span>
                  </label>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px', background: 'var(--surface-2)', border: '1px solid var(--border)', marginTop: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
                  Session Management
                </h4>
                <div className="form-group">
                  <label className="form-label">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="modern-input"
                    min="5"
                    max="480"
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '12px' }}>
                  <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '14px' }}>Auto-logout on inactivity</span>
                </label>
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ maxWidth: '600px' }}>
              <h3 className="page-title--solid" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>
                Third-party Integrations
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Barcode Scanner</h4>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Configure
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Connect barcode scanners for quick product identification
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>GST Portal</h4>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Connect
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Sync GST data and generate compliance reports
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Email Notifications</h4>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setShowEmailModal(true)}>
                      Setup
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Configure SMTP settings for automated email alerts
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>

                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Load minimal demo data with 5 basic products for application demonstration
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Cloud Backup</h4>
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Connected
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    Automatic daily backups to secure cloud storage (Firebase)
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Email Notifications Modal */}
      {showEmailModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <motion.div initial={{ y: 12, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -6, opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="glass-card" style={{ width: '100%', maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Email Notifications Setup</h3>
              <button onClick={() => setShowEmailModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">SMTP Host</label>
                <input className="modern-input" value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Port</label>
                <input type="number" className="modern-input" value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} placeholder="587" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="modern-input" value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} placeholder="user@domain.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="modern-input" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} placeholder="App password" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">From Email</label>
                <input className="modern-input" value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} placeholder="no-reply@domain.com" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Secure (TLS/SSL)</label>
                <input type="checkbox" checked={smtp.secure} onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Send Test To</label>
                <input className="modern-input" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@domain.com" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => setShowEmailModal(false)}>Close</button>
              <button
                className="btn-primary"
                disabled={isTestingEmail}
                onClick={async () => {
                  // Persist to localStorage
                  localStorage.setItem('smtp_host', smtp.host);
                  localStorage.setItem('smtp_port', String(smtp.port));
                  localStorage.setItem('smtp_user', smtp.user);
                  localStorage.setItem('smtp_pass', smtp.pass);
                  localStorage.setItem('smtp_from', smtp.from);
                  localStorage.setItem('smtp_secure', String(smtp.secure));
                  localStorage.setItem('smtp_test_to', testEmail);
                  setIsTestingEmail(true);
                  try {
                    // Simulate API call to backend mailer; replace with real call
                    await new Promise(r => setTimeout(r, 800));
                    alert('Test email triggered. Please check your inbox.');
                  } catch (e) {
                    alert('Failed to send test email.');
                  } finally {
                    setIsTestingEmail(false);
                  }
                }}
              >
                {isTestingEmail ? 'Sending Test…' : 'Save & Send Test'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;
