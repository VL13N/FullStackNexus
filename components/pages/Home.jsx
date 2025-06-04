import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const Home = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to MyApp
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A full-stack JavaScript application built with React, Express, and Supabase.
          Get started building amazing web applications with modern technologies.
        </p>
        <div className="space-x-4">
          <Button size="lg">
            Get Started
          </Button>
          <Button variant="ghost" size="lg">
            Learn More
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="React Frontend" subtitle="Modern UI Development">
          <p className="text-gray-600">
            Built with React 18 and Tailwind CSS for a responsive, 
            modern user interface with component-based architecture.
          </p>
        </Card>

        <Card title="Express Backend" subtitle="Robust API Server">
          <p className="text-gray-600">
            RESTful API powered by Express.js with authentication, 
            middleware, and comprehensive error handling.
          </p>
        </Card>

        <Card title="Supabase Database" subtitle="PostgreSQL with Real-time">
          <p className="text-gray-600">
            Scalable PostgreSQL database with real-time subscriptions, 
            authentication, and edge functions.
          </p>
        </Card>
      </div>

      {/* Quick Start */}
      <Card title="Quick Start Guide">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div>
              <h4 className="font-medium">Set up environment variables</h4>
              <p className="text-gray-600 text-sm">Configure your Supabase connection and API keys</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <div>
              <h4 className="font-medium">Install dependencies</h4>
              <p className="text-gray-600 text-sm">Run npm install to set up all required packages</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">3</span>
            </div>
            <div>
              <h4 className="font-medium">Start development</h4>
              <p className="text-gray-600 text-sm">Run npm run dev to start both frontend and backend servers</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Home;