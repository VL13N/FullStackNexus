import { Card } from "@/components/ui/card";

interface ProjectStructureProps {
  projectName: string;
  progress: number;
  isInitialized: boolean;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'complete' | 'pending' | 'waiting';
}

export default function ProjectStructure({ projectName, progress, isInitialized }: ProjectStructureProps) {
  const steps: ProgressStep[] = [
    { id: '1', label: 'Project Configuration', status: 'complete' },
    { id: '2', label: 'Directory Structure', status: 'complete' },
    { id: '3', label: 'Database Connection', status: progress >= 75 ? 'complete' : 'pending' },
    { id: '4', label: 'Final Setup', status: isInitialized ? 'complete' : 'waiting' }
  ];

  return (
    <div className="space-y-6">
      {/* Directory Structure Preview */}
      <Card className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Project Structure</h2>
        
        <div className="space-y-1 text-sm font-mono">
          <div className="flex items-center space-x-2 text-slate-700">
            <i className="fas fa-folder text-blue-500"></i>
            <span>{projectName || 'my-fullstack-app'}/</span>
          </div>
          <div className="ml-4 space-y-1">
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-folder text-blue-400"></i>
              <span>api/</span>
            </div>
            <div className="ml-4 space-y-1 text-slate-500">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>index.js</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-folder"></i>
                <span>routes/</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-folder"></i>
                <span>middleware/</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-folder text-blue-400"></i>
              <span>components/</span>
            </div>
            <div className="ml-4 space-y-1 text-slate-500">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>App.jsx</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-folder"></i>
                <span>ui/</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-folder"></i>
                <span>layout/</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-folder text-blue-400"></i>
              <span>services/</span>
            </div>
            <div className="ml-4 space-y-1 text-slate-500">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>supabase.js</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>api.js</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-folder text-blue-400"></i>
              <span>utils/</span>
            </div>
            <div className="ml-4 space-y-1 text-slate-500">
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>helpers.js</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-file-code"></i>
                <span>constants.js</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-file-alt text-green-500"></i>
              <span>.env</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-file-code text-orange-500"></i>
              <span>package.json</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600">
              <i className="fas fa-file-alt text-purple-500"></i>
              <span>README.md</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Setup Progress */}
      <Card className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Setup Progress</h2>
        
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.status === 'complete' 
                    ? 'bg-emerald-500' 
                    : step.status === 'pending'
                    ? 'bg-amber-500'
                    : 'bg-slate-300'
                }`}>
                  {step.status === 'complete' ? (
                    <i className="fas fa-check text-white text-xs"></i>
                  ) : step.status === 'pending' ? (
                    <i className="fas fa-clock text-white text-xs"></i>
                  ) : (
                    <span className="text-slate-600 text-xs font-bold">{step.id}</span>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  step.status === 'waiting' ? 'text-slate-500' : 'text-slate-900'
                }`}>
                  {step.label}
                </span>
              </div>
              <span className={`text-xs font-medium ${
                step.status === 'complete'
                  ? 'text-emerald-600'
                  : step.status === 'pending'
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}>
                {step.status === 'complete' ? 'Complete' : step.status === 'pending' ? 'Pending' : 'Waiting'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Overall Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Quick Commands */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Commands</h2>
        
        <div className="space-y-3 text-sm font-mono">
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-slate-400 mb-1"># Install dependencies</div>
            <div className="text-slate-100">npm install</div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-slate-400 mb-1"># Start development server</div>
            <div className="text-slate-100">npm run dev</div>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-slate-400 mb-1"># Start backend API</div>
            <div className="text-slate-100">npm run server</div>
          </div>
        </div>
      </div>
    </div>
  );
}
