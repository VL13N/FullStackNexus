import React from 'react';
import Card from '../ui/Card';

const About = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">About MyApp</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          MyApp is a modern full-stack JavaScript application template designed to help developers 
          quickly bootstrap production-ready web applications with best practices built in.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Technology Stack">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">Frontend</h4>
              <ul className="text-gray-600 list-disc list-inside">
                <li>React 18 with modern hooks</li>
                <li>Tailwind CSS for styling</li>
                <li>Vite for fast development</li>
                <li>React Router for navigation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Backend</h4>
              <ul className="text-gray-600 list-disc list-inside">
                <li>Node.js runtime</li>
                <li>Express.js framework</li>
                <li>Authentication middleware</li>
                <li>Security best practices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Database</h4>
              <ul className="text-gray-600 list-disc list-inside">
                <li>Supabase PostgreSQL</li>
                <li>Real-time capabilities</li>
                <li>Row-level security</li>
                <li>Built-in authentication</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="Features">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Responsive design</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>RESTful API architecture</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Authentication & authorization</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Environment configuration</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Error handling</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Security middleware</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Development tools</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Production-ready deployment</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Getting Started">
        <div className="prose max-w-none">
          <p className="text-gray-600">
            This project is structured to provide a solid foundation for building scalable web applications. 
            The codebase follows modern JavaScript best practices and includes everything you need to get started:
          </p>
          <ul className="text-gray-600">
            <li>Organized directory structure with clear separation of concerns</li>
            <li>Reusable UI components built with Tailwind CSS</li>
            <li>API routes with proper error handling and validation</li>
            <li>Database integration with Supabase for rapid development</li>
            <li>Environment configuration for different deployment stages</li>
            <li>Comprehensive documentation and examples</li>
          </ul>
          <p className="text-gray-600">
            Whether you're building a simple web app or a complex application, this template provides 
            the tools and structure you need to develop efficiently and maintainably.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default About;