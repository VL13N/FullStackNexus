import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    tasks: 0,
    messages: 0
  });

  const [recentActivity] = useState([
    { id: 1, action: 'User registration', time: '2 minutes ago', type: 'user' },
    { id: 2, action: 'New project created', time: '15 minutes ago', type: 'project' },
    { id: 3, action: 'Task completed', time: '1 hour ago', type: 'task' },
    { id: 4, action: 'Message received', time: '2 hours ago', type: 'message' }
  ]);

  useEffect(() => {
    // Simulate loading stats from API
    const timer = setTimeout(() => {
      setStats({
        users: 1247,
        projects: 89,
        tasks: 342,
        messages: 156
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return '👤';
      case 'project': return '📁';
      case 'task': return '✅';
      case 'message': return '💬';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your application.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+12%</span>
            <span className="text-gray-600 text-sm"> from last month</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+8%</span>
            <span className="text-gray-600 text-sm"> from last month</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
            </div>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600">📋</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+15%</span>
            <span className="text-gray-600 text-sm"> from last month</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">💬</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-red-600 text-sm font-medium">-3%</span>
            <span className="text-gray-600 text-sm"> from last month</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="ghost" className="w-full">
              View All Activity
            </Button>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="space-y-4">
            <Button className="w-full justify-start">
              <span className="mr-2">➕</span>
              Create New Project
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-2">👤</span>
              Add New User
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-2">📊</span>
              Generate Report
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <span className="mr-2">⚙️</span>
              System Settings
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Search</h4>
            <Input 
              placeholder="Search users, projects, tasks..."
              className="w-full"
            />
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card title="System Status">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <h4 className="font-medium text-gray-900">API Server</h4>
            <p className="text-sm text-green-600">Operational</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">🗄️</span>
            </div>
            <h4 className="font-medium text-gray-900">Database</h4>
            <p className="text-sm text-green-600">Connected</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 text-xl">🌐</span>
            </div>
            <h4 className="font-medium text-gray-900">Frontend</h4>
            <p className="text-sm text-green-600">Online</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;