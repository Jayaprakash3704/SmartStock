import React, { useState, useEffect } from 'react';
import { EnhancedUser, UserRole } from '../types';
import { usersAPI, authAPI } from '../services/api';
import { getDbInstance } from '../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const USER_ROLES: UserRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access and user management',
    permissions: [
      'products:read', 'products:write', 'products:delete', 'products:export',
      'inventory:read', 'inventory:write', 'inventory:delete', 'inventory:export',
      'sales:read', 'sales:write', 'sales:delete', 'sales:export',
      'reports:read', 'reports:write', 'reports:delete', 'reports:export',
      'settings:read', 'settings:write', 'settings:delete', 'settings:export',
      'users:read', 'users:write', 'users:delete', 'users:export'
    ]
  },
  {
    id: 'manager',
    name: 'Store Manager',
    description: 'Manage store operations and sales',
    permissions: [
      'products:read', 'products:write', 'products:export',
      'inventory:read', 'inventory:write', 'inventory:export',
      'sales:read', 'sales:write', 'sales:export',
      'reports:read', 'reports:export',
      'settings:read',
      'users:read'
    ]
  },
  {
    id: 'staff',
    name: 'General Staff',
    description: 'Basic inventory operations only',
    permissions: [
      'products:read',
      'inventory:read', 'inventory:write',
      'reports:read'
    ]
  }
];

// Get current user ID for Firebase operations
const getCurrentUserId = (): string => {
  return localStorage.getItem('currentUserId') || 'system';
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<EnhancedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load users from Firebase on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const db = getDbInstance();
      if (db) {
        // Load from Firebase
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        const firebaseUsers = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            username: data.username || '',
            email: data.email || '',
            role: data.role || 'staff',
            isActive: data.isActive !== false,
            permissions: data.permissions || [],
            profile: data.profile || {
              firstName: '',
              lastName: '',
              phone: '',
              department: ''
            },
            settings: data.settings || {
              notifications: { email: true, push: false, sms: false },
              dashboard: { showRecentActivities: true, showQuickStats: true }
            },
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin || Date.now())
          } as EnhancedUser;
        });
        
        setUsers(firebaseUsers);
        
        // If no users exist, create default admin user
        if (firebaseUsers.length === 0) {
          await createDefaultAdminUser();
        }
      } else {
        // Fallback: Use API or create default user
        const res = await usersAPI.getAll();
        if (res.success && res.data.length > 0) {
          setUsers(res.data as EnhancedUser[]);
        } else {
          await createDefaultAdminUser();
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Create default admin user if error occurs
      await createDefaultAdminUser();
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultAdminUser = async () => {
    const defaultAdmin = {
      username: 'admin',
      email: 'admin@smartstock.com',
      role: 'admin',
      isActive: true,
      permissions: ['all'],
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+91 98765 43210',
        department: 'Management'
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
      }
    };

    try {
      const db = getDbInstance();
      if (db) {
        const usersCollection = collection(db, 'users');
        const docRef = await addDoc(usersCollection, {
          ...defaultAdmin,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now()
        });
        
        const newUser: EnhancedUser = {
          id: docRef.id,
          ...defaultAdmin,
          createdAt: new Date(),
          lastLogin: new Date()
        } as EnhancedUser;
        
        setUsers([newUser]);
      } else {
        // Fallback to API
        const res = await usersAPI.create(defaultAdmin);
        if (res.success) {
          setUsers([res.data]);
        }
      }
    } catch (error) {
      console.error('Error creating default admin user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: EnhancedUser) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setIsSaving(true);
      const db = getDbInstance();
      if (db) {
        await deleteDoc(doc(db, 'users', id));
      } else {
        await usersAPI.delete(id);
      }
      
      setUsers(users.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async (userData: Partial<EnhancedUser>) => {
    try {
      setIsSaving(true);
      const db = getDbInstance();
      
      if (editingUser) {
        // Update existing user
        if (db) {
          await updateDoc(doc(db, 'users', editingUser.id), {
            ...userData,
            updatedAt: Timestamp.now()
          });
        } else {
          await usersAPI.update(editingUser.id, userData);
        }
        
        const updatedUser = { ...editingUser, ...userData };
        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
      } else {
        // Create new user
        const newUserData = {
          ...userData,
          createdAt: Timestamp.now(),
          lastLogin: Timestamp.now()
        };
        
        if (db) {
          const docRef = await addDoc(collection(db, 'users'), newUserData);
          const newUser: EnhancedUser = {
            id: docRef.id,
            ...userData,
            createdAt: new Date(),
            lastLogin: new Date()
          } as EnhancedUser;
          setUsers([...users, newUser]);
        } else {
          const res = await usersAPI.create(userData);
          if (res.success) {
            setUsers([...users, res.data]);
          }
        }
      }
      
      setShowUserForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-96">
          <div className="loading-spinner"></div>
          <span className="ml-4">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">
            Manage team members and their access permissions
          </p>
        </div>
        <button 
          onClick={handleCreateUser}
          className="btn-primary"
          disabled={isSaving}
        >
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search Users</label>
            <input
              type="text"
              className="modern-input"
              placeholder="Search by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Filter by Role</label>
            <select
              className="modern-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              {USER_ROLES.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Filter by Status</label>
            <select
              className="modern-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="table-header text-left">User</th>
                <th className="table-header text-left">Role</th>
                <th className="table-header text-left">Department</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Last Login</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-surface-2">
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-text">
                        {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                      </div>
                      <div className="text-sm text-muted">
                        @{user.username} • {user.email}
                      </div>
                      {user.profile?.phone && (
                        <div className="text-xs text-muted">{user.profile.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-info' :
                      user.role === 'manager' ? 'badge-success' :
                      'badge-secondary'
                    }`}>
                      {USER_ROLES.find(r => r.id === user.role)?.name || user.role}
                    </span>
                  </td>
                  <td className="p-4 text-muted">
                    {user.profile?.department || 'Not specified'}
                  </td>
                  <td className="p-4">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="btn-icon"
                        title="Edit User"
                      >
                        ✏️
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn-icon btn-danger"
                          title="Delete User"
                          disabled={isSaving}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted">
                {searchTerm || filterRole || filterStatus 
                  ? 'No users match your search criteria.' 
                  : 'No users found. Create your first user to get started.'
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserFormModal
          user={editingUser}
          roles={USER_ROLES}
          onSave={handleSaveUser}
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

// User Form Modal Component
interface UserFormModalProps {
  user: EnhancedUser | null;
  roles: UserRole[];
  onSave: (userData: Partial<EnhancedUser>) => void;
  onClose: () => void;
  isSaving: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, roles, onSave, onClose, isSaving }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'staff',
    isActive: user?.isActive !== false,
    profile: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      phone: user?.profile?.phone || '',
      department: user?.profile?.department || ''
    },
    settings: {
      notifications: {
        email: user?.settings?.notifications?.email !== false,
        push: user?.settings?.notifications?.push || false,
        sms: user?.settings?.notifications?.sms || false
      },
      dashboard: {
        showRecentActivities: user?.settings?.dashboard?.showRecentActivities !== false,
        showQuickStats: user?.settings?.dashboard?.showQuickStats !== false
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      alert('Username and email are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {user ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-row">
              <div>
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="modern-input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.profile.firstName}
                  onChange={(e) => setFormData({
                    ...formData, 
                    profile: {...formData.profile, firstName: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.profile.lastName}
                  onChange={(e) => setFormData({
                    ...formData, 
                    profile: {...formData.profile, lastName: e.target.value}
                  })}
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">Role</label>
                <select
                  className="modern-select"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.profile.department}
                  onChange={(e) => setFormData({
                    ...formData, 
                    profile: {...formData.profile, department: e.target.value}
                  })}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="modern-input"
                value={formData.profile.phone}
                onChange={(e) => setFormData({
                  ...formData, 
                  profile: {...formData.profile, phone: e.target.value}
                })}
              />
            </div>

            <div>
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2"
                />
                Active User
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;
