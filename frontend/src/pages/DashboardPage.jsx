import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        dashboardAPI.getStats(),
        ordersAPI.getAll({ ordering: '-order_placed', limit: 5 })
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.results || ordersRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'primary',
      link: '/customers'
    },
    {
      label: 'Total Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'accent',
      link: '/products'
    },
    {
      label: 'Total Orders',
      value: stats?.total_orders || 0,
      icon: ShoppingCart,
      color: 'emerald',
      link: '/orders'
    },
    {
      label: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: Clock,
      color: 'amber',
      link: '/orders?status=pending'
    }
  ];

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      preparing: 'badge-primary',
      ready: 'badge-success',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return styles[status] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.first_name || user?.username || 'User'}! 👋
          </h1>
          <p className="page-subtitle">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="text-right text-sm text-surface-500">
          <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card-hover p-6 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-surface-900 mt-2">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>View details</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-surface-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-surface-900">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-surface-500">
                      {order.customer_name || 'Unknown Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-surface-900">
                      £{parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <span className={getStatusBadge(order.status)}>
                      {order.status_display || order.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-surface-500">
                No orders yet
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="px-6 py-4 border-b border-surface-100">
            <h2 className="font-display font-semibold text-surface-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              to="/customers/new"
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <Users className="w-8 h-8 text-surface-400 group-hover:text-primary-600 mb-2" />
              <span className="text-sm font-medium text-surface-600 group-hover:text-primary-700">
                Add Customer
              </span>
            </Link>
            <Link
              to="/products/new"
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <Package className="w-8 h-8 text-surface-400 group-hover:text-primary-600 mb-2" />
              <span className="text-sm font-medium text-surface-600 group-hover:text-primary-700">
                Add Product
              </span>
            </Link>
            <Link
              to="/orders/new"
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <ShoppingCart className="w-8 h-8 text-surface-400 group-hover:text-primary-600 mb-2" />
              <span className="text-sm font-medium text-surface-600 group-hover:text-primary-700">
                New Order
              </span>
            </Link>
            <Link
              to="/allergens"
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <TrendingUp className="w-8 h-8 text-surface-400 group-hover:text-primary-600 mb-2" />
              <span className="text-sm font-medium text-surface-600 group-hover:text-primary-700">
                View Allergens
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
