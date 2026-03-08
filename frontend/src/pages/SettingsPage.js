import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'USD' });
  const [password, setPassword] = useState({ current: '', newPass: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setSaving(true);
    try {
      await updateProfile(profile);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (password.newPass !== password.confirm) { setPwErr('Passwords do not match'); return; }
    if (password.newPass.length < 6) { setPwErr('Password must be at least 6 characters'); return; }
    setChangingPw(true);
    try {
      await api.put('/auth/password', { currentPassword: password.current, newPassword: password.newPass });
      setPwMsg('Password changed successfully!');
      setPassword({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPwErr(err.response?.data?.message || 'Failed to change password');
    }
    setChangingPw(false);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile */}
        <div className="card settings-card">
          <h3 className="settings-section-title">Profile</h3>
          <div className="settings-avatar">
            <div className="settings-avatar-img">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="settings-user-name">{user?.name}</div>
              <div className="settings-user-email">{user?.email}</div>
            </div>
          </div>
          {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
          {profileErr && <div className="alert alert-error">{profileErr}</div>}
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={profile.currency} onChange={e => setProfile({ ...profile, currency: e.target.value })}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="INR">INR — Indian Rupee</option>
                <option value="JPY">JPY — Japanese Yen</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="CHF">CHF — Swiss Franc</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card settings-card">
          <h3 className="settings-section-title">Change Password</h3>
          {pwMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{pwMsg}</div>}
          {pwErr && <div className="alert alert-error" style={{ marginBottom: 16 }}>{pwErr}</div>}
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={password.current} onChange={e => setPassword({ ...password, current: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={password.newPass} onChange={e => setPassword({ ...password, newPass: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={password.confirm} onChange={e => setPassword({ ...password, confirm: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPw}>
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* About */}
        <div className="card settings-card about-card">
          <h3 className="settings-section-title">About BudgetBuddy</h3>
          <div className="about-info">
            <div className="about-logo">₿</div>
            <div className="about-text">
              <div className="about-name">BudgetBuddy</div>
              <div className="about-version">Version 1.0.0</div>
              <p className="about-desc">A personal finance manager to help you track income, expenses, and achieve your financial goals.</p>
            </div>
          </div>
          <div className="about-stack">
            <div className="stack-item">React.js</div>
            <div className="stack-item">Node.js</div>
            <div className="stack-item">Express</div>
            <div className="stack-item">MongoDB</div>
            <div className="stack-item">Chart.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}
