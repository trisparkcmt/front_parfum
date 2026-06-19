'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/apiService';
import { User, UserRole } from '@/types';
import { LogOut, Edit2, Loader, AlertCircle, Grid } from 'lucide-react';

interface DashboardOption {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    id: 'client-orders',
    title: 'My Orders',
    description: 'Track and view your orders',
    href: '/dashboard/client/orders',
    icon: '📦',
    roles: ['client'],
  },
  {
    id: 'client-favorites',
    title: 'My Favorites',
    description: 'View your favorite products',
    href: '/dashboard/client/favorites',
    icon: '❤️',
    roles: ['client'],
  },
  {
    id: 'delivery-orders',
    title: 'My Deliveries',
    description: 'Manage assigned deliveries',
    href: '/dashboard/delivery/orders',
    icon: '🚗',
    roles: ['delivery'],
  },
  {
    id: 'admin-orders',
    title: 'Order Management',
    description: 'Validate and assign orders',
    href: '/dashboard/admin/order',
    icon: '✅',
    roles: ['superadmin', 'serveuse'],
  },
  {
    id: 'admin-catalog-perfume',
    title: 'Perfume Catalog',
    description: 'Manage perfume products',
    href: '/dashboard/admin/perfume',
    icon: '🌸',
    roles: ['superadmin', 'serveuse'],
  },
  {
    id: 'admin-catalog-accessories',
    title: 'Accessories Catalog',
    description: 'Manage accessory products',
    href: '/dashboard/admin/accessories',
    icon: '💎',
    roles: ['superadmin', 'serveuse'],
  },
  {
    id: 'admin-drivers',
    title: 'Drivers Fleet',
    description: 'Manage delivery drivers',
    href: '/dashboard/admin/delivery',
    icon: '👥',
    roles: ['superadmin'],
  },
  {
    id: 'admin-clients',
    title: 'Clients',
    description: 'Manage client accounts',
    href: '/dashboard/admin/clients',
    icon: '👤',
    roles: ['superadmin'],
  },
  {
    id: 'admin-revenue',
    title: 'Revenue & Analytics',
    description: 'View sales and statistics',
    href: '/dashboard/admin/revenue',
    icon: '📊',
    roles: ['superadmin'],
  },
  {
    id: 'serveuse-lab',
    title: 'Laboratory',
    description: 'Manage essences and ingredients',
    href: '/dashboard/serveuse/lab',
    icon: '🧪',
    roles: ['serveuse'],
  },
  {
    id: 'serveuse-orders',
    title: 'Orders',
    description: 'View and process orders',
    href: '/dashboard/serveuse/order',
    icon: '🛒',
    roles: ['serveuse'],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    telephone: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setError(null);
      const userData = await authService.getMe();
      setUser(userData);
      setEditForm({
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        telephone: userData.phone || '',
      });
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await authService.updateProfile({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        telephone: editForm.telephone,
      });
      setIsEditingProfile(false);
      fetchUserProfile();
    } catch (err: any) {
      setError('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await authService.logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      alert('Failed to logout');
    }
  };

  const getAccessibleDashboards = () => {
    if (!user) return [];

    // Fallback to 'client' role if roles array is empty or not available
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : ['client'];

    return DASHBOARD_OPTIONS.filter((dashboard) =>
      dashboard.roles.some((role) => userRoles.includes(role))
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <p className="text-gray-700">Unable to load profile</p>
        </div>
      </div>
    );
  }

  const accessibleDashboards = getAccessibleDashboards();

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-blue-100">{user.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {user.roles?.map((role) => (
                  <span
                    key={role}
                    className="inline-block px-3 py-1 bg-blue-500 text-sm rounded-full"
                  >
                    {role.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Edit2 size={18} />
              Edit
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.telephone}
                onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-lg font-semibold text-gray-900">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Available Dashboards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Grid size={28} />
          My Dashboards
        </h2>

        {accessibleDashboards.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No dashboards available for your role</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleDashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => router.push(dashboard.href)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left border border-gray-200 hover:border-blue-400"
              >
                <div className="text-4xl mb-3">{dashboard.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{dashboard.title}</h3>
                <p className="text-sm text-gray-600">{dashboard.description}</p>
                <div className="mt-4 text-blue-600 text-sm font-medium">
                  Go to Dashboard →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
