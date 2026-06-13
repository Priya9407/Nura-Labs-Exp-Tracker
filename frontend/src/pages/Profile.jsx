import React, { useState } from 'react';
import { updateProfile, changePassword } from '../api/users';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/ui/AlertBanner';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/Modal';

// SVG Icons
const UserIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ShieldIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const EditIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const LockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const KeyIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const EyeIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const CheckCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await updateProfile({ name });
      if (response.success && response.user) {
        setUser(response.user);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Form input styles
  const formLabelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '8px',
  };

  const inputWrapStyles = {
    position: 'relative',
  };

  const inputStyles = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontSize: '15px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const inputWithIconStyles = {
    ...inputStyles,
    paddingRight: '48px',
  };

  const eyeBtnStyles = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  // Responsive styles
  const responsiveStyles = `
    .profile-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-top: 12px;
    }

    .profile-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .profile-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      margin: 0;
      line-height: 1.2;
    }

    .profile-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin: 2px 0 0;
    }

    .profile-card {
      background: var(--bg-surface);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 24px;
      box-shadow: var(--shadow-card);
    }

    @media (min-width: 640px) {
      .profile-card {
        padding: 32px;
      }
    }

    .profile-header-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      text-align: center;
    }

    @media (min-width: 640px) {
      .profile-header-section {
        flex-direction: row;
        text-align: left;
        align-items: flex-start;
      }
    }

    .profile-info {
      flex: 1;
    }

    .profile-name {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    @media (min-width: 640px) {
      .profile-name {
        font-size: 24px;
      }
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-badge.admin {
      background: var(--accent-coral-light);
      color: var(--accent-coral);
    }

    .role-badge.member {
      background: var(--bg-surface-alt);
      color: var(--text-secondary);
    }

    .info-list {
      display: flex;
      flex-direction: column;
    }

    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 0;
      border-bottom: 1px solid var(--border);
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .icon-container {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--bg-surface-alt);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .info-content {
      flex: 1;
      min-width: 0;
    }

    .info-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      word-break: break-word;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: var(--bg-surface-alt);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 15px;
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      border-color: var(--accent-coral);
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .edit-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 639px) {
      .actions button {
        flex: 1;
        justify-content: center;
      }
    }

    .security-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }

    .security-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account settings</p>
        </div>

        {/* Error/Success */}
        {error && (
          <AlertBanner variant="error" onClose={() => setError('')}>
            {error}
          </AlertBanner>
        )}
        {success && (
          <AlertBanner variant="success" onClose={() => setSuccess('')}>
            {success}
          </AlertBanner>
        )}

        {/* Profile Card */}
        <div className="profile-card">
          {/* Profile Header */}
          <div className="profile-header-section">
            <Avatar name={user?.name} size="xlarge" />
            <div className="profile-info">
              {isEditing ? (
                <div style={{ marginBottom: '12px' }}>
                  <label className="info-label" style={{ marginBottom: '8px', display: 'block' }}>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    placeholder="Your name"
                  />
                </div>
              ) : (
                <div className="profile-name">
                  {user?.name}
                </div>
              )}
              <span className={`role-badge ${user?.role === 'ADMIN' ? 'admin' : 'member'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Info List */}
          <div className="info-list">
            <div className="info-row">
              <div className="icon-container">
                <MailIcon style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
              </div>
              <div className="info-content">
                <div className="info-label">Email</div>
                <div className="info-value">{user?.email}</div>
              </div>
            </div>

            <div className="info-row">
              <div className="icon-container">
                <ShieldIcon style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
              </div>
              <div className="info-content">
                <div className="info-label">Role</div>
                <div className="info-value">
                  {user?.role === 'ADMIN' ? 'Administrator' : 'Team Member'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="actions">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setError('');
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} loading={loading}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)} className="edit-btn">
                  <EditIcon style={{ width: '16px', height: '16px' }} />
                  Edit Profile
                </Button>
              </>
            )}
          </div>

          {/* Security Section */}
          <div className="security-section">
            <h3 className="security-title">
              <LockIcon style={{ width: '20px', height: '20px', color: 'var(--accent-coral)' }} />
              Security
            </h3>
            <div className="info-row" style={{ paddingTop: '8px' }}>
              <div className="icon-container">
                <KeyIcon style={{ width: '20px', height: '20px', color: 'var(--text-muted)' }} />
              </div>
              <div className="info-content">
                <div className="info-label">Password</div>
                <div className="info-value">••••••••</div>
              </div>
              <Button variant="secondary" size="small" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Change Password"
        footer={
          <>
            <Button variant="ghost" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              loading={passwordLoading}
            >
              Change Password
            </Button>
          </>
        }
      >
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {passwordError && (
            <AlertBanner variant="error" onClose={() => setPasswordError('')}>
              {passwordError}
            </AlertBanner>
          )}
          {passwordSuccess && (
            <AlertBanner variant="success" onClose={() => setPasswordSuccess('')}>
              {passwordSuccess}
            </AlertBanner>
          )}

          <div>
            <label style={formLabelStyles}>
              Current Password <span style={{ color: 'var(--accent-coral)' }}>*</span>
            </label>
            <div style={inputWrapStyles}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={inputWithIconStyles}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={eyeBtnStyles}
              >
                {showCurrentPassword ? (
                  <EyeOffIcon style={{ width: '18px', height: '18px' }} />
                ) : (
                  <EyeIcon style={{ width: '18px', height: '18px' }} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label style={formLabelStyles}>
              New Password <span style={{ color: 'var(--accent-coral)' }}>*</span>
            </label>
            <div style={inputWrapStyles}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputWithIconStyles}
                placeholder="Enter your new password (min 8 chars)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={eyeBtnStyles}
              >
                {showNewPassword ? (
                  <EyeOffIcon style={{ width: '18px', height: '18px' }} />
                ) : (
                  <EyeIcon style={{ width: '18px', height: '18px' }} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label style={formLabelStyles}>
              Confirm New Password <span style={{ color: 'var(--accent-coral)' }}>*</span>
            </label>
            <div style={inputWrapStyles}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputWithIconStyles}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={eyeBtnStyles}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon style={{ width: '18px', height: '18px' }} />
                ) : (
                  <EyeIcon style={{ width: '18px', height: '18px' }} />
                )}
              </button>
            </div>
          </div>

          <div style={{
            padding: '16px',
            background: 'var(--info-light)',
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--info)',
          }}>
            <strong>Password Requirements:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>At least 8 characters long</li>
              <li>Include a mix of letters and numbers</li>
              <li>Cannot be the same as your current password</li>
            </ul>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ProfilePage;
