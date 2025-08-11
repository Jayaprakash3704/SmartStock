import React, { useState, useEffect } from 'react';
import { EnhancedUser, UserRole } from '../types';
import { usersAPI } from '../services/api';

const USER_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and management',
    permissions: [
      'products:read', 'products:write', 'products:delete', 'products:export',
      'inventory:read', 'inventory:write', 'inventory:delete', 'inventory:export',
      'reports:read', 'reports:write', 'reports:delete', 'reports:export',
      'settings:read', 'settings:write', 'settings:delete', 'settings:export',
      'users:read', 'users:write', 'users:delete', 'users:export'
    ]
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manage inventory and view reports',
    permissions: [
      'products:read', 'products:write', 'products:export',
      'inventory:read', 'inventory:write', 'inventory:export',
      'reports:read', 'reports:export',
      'settings:read',
      'users:read'
    ]
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Basic inventory operations',
    permissions: [
      'products:read',
      'inventory:read', 'inventory:write',
      'reports:read'
    ]
  }
];

// Mock users data
const mockUsers: EnhancedUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@smartstock.com',
    role: 'admin',
    isActive: true,
    permissions: ['all'],
    profile: {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 98765 43210',
      department: 'Management',
      avatar: undefined
    },
    settings: {
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      dashboard: {
        showRecentActivities: true,
        showQuickStats: true
      }
    },
    lastLogin: new Date('2024-11-20T09:30:00')
  },
  {
    id: '2',
    username: 'manager1',
    email: 'priya@smartstock.com',
    role: 'manager',
    isActive: true,
    permissions: ['products.read', 'inventory.manage', 'reports.view'],
    profile: {
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+91 87654 32109',
      department: 'Operations',
    },
    settings: {
      notifications: {
        email: true,
        push: false,
        sms: true
      },
      dashboard: {
        showRecentActivities: true,
        showQuickStats: true
      }
    },
    lastLogin: new Date('2024-11-20T11:15:00')
  },
  {
    id: '3',
    username: 'staff1',
    email: 'amit@smartstock.com',
    role: 'staff',
    isActive: true,
    permissions: ['inventory.update', 'products.view'],
    profile: {
      firstName: 'Amit',
      lastName: 'Patel',
      phone: '+91 76543 21098',
      department: 'Warehouse',
    },
    settings: {
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      dashboard: {
        showRecentActivities: false,
        showQuickStats: true
      }
    },
    lastLogin: new Date('2024-11-19T16:45:00')
  }
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<EnhancedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await usersAPI.getAll();
        if (res.success) {
          setUsers(res.data as any);
        } else {
          setUsers(mockUsers);
        }
      } catch {
        setUsers(mockUsers);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    isActive: true,
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'staff',
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      isActive: true,
    });
    setShowUserForm(true);
  };

  const handleEditUser = (user: EnhancedUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      phone: user.profile.phone || '',
      department: user.profile.department || '',
      isActive: user.isActive,
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      if (editingUser) {
        const updated: EnhancedUser = {
          ...editingUser,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          profile: {
            ...editingUser.profile,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            department: formData.department,
          }
        };
        await usersAPI.update(editingUser.id, updated);
        setUsers(users.map(u => (u.id === editingUser.id ? updated : u)));
      } else {
        const newUser: EnhancedUser = {
          id: Date.now().toString(),
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          permissions: [],
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            department: formData.department,
          },
          settings: {
            notifications: { email: true, push: false, sms: false },
            dashboard: { showRecentActivities: false, showQuickStats: true }
          }
        };
        const res = await usersAPI.create(newUser);
        const created = (res.success && res.data) ? (res.data as any) : newUser;
        setUsers([...users, created]);
      }
      setShowUserForm(false);
    } catch (err) {
      alert('Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive }
        : user
    ));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc2626';
      case 'manager': return '#f59e0b';
      case 'staff': return '#059669';
      default: return '#6b7280';
    }
  };

  return (
    <div className="page-container">
      {isLoading && (
        <div className="glass-card" style={{ marginBottom: '16px' }}>
          <div className="loading-spinner"></div>
          <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Loading users...</span>
        </div>
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">Manage users, roles, and permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '16px' }}>➕</span>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Users</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, or email..."
                className="modern-input"
                style={{ paddingLeft: '40px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#6b7280' }}>🔍</span>
            </div>
          </div>
          
          <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
            <label className="form-label">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="modern-select"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
            <label className="form-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="modern-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button className="btn-secondary" style={{ height: '44px' }}>
            Filter 🔽
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="modern-table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {user.profile.firstName[0]}{user.profile.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {user.profile.firstName} {user.profile.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          @{user.username} • {user.email}
                        </div>
                        {user.profile.phone && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {user.profile.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      style={{ 
                        backgroundColor: getRoleColor(user.role),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      {user.profile.department || '-'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: user.isActive ? 'var(--success)' : 'var(--danger)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="btn-icon"
                        title="Edit User"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-icon btn-danger"
                        title="Delete User"
                        disabled={user.role === 'admin'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div style={{
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
          <div className="glass-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={() => setShowUserForm(false)}
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

            <form onSubmit={handleSubmitUser}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="modern-input"
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="modern-input"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                    className="modern-input"
                    placeholder="Enter username"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="modern-input"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      className="modern-input"
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="modern-input"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    required
                    className="modern-select"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="modern-input"
                    placeholder="Enter department"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="modern-input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Active User</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
