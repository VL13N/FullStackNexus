import { useState } from "react";
import ProjectSetup from "@/components/project-setup";
import ProjectStructure from "@/components/project-structure";
import { useProjectSetup } from "@/hooks/use-project-setup";

export default function ProjectInitializer() {
  const {
    projectConfig,
    updateProjectConfig,
    envVariables,
    addEnvVariable,
    removeEnvVariable,
    updateEnvVariable,
    initializeProject,
    isInitializing,
    isInitialized,
    progress
  } = useProjectSetup();

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-code text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Project Initializer</h1>
              <p className="text-sm text-slate-500">Full-Stack JavaScript Setup</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">Connected to Replit</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ProjectSetup
            projectConfig={projectConfig}
            onUpdateConfig={updateProjectConfig}
            envVariables={envVariables}
            onAddEnvVariable={addEnvVariable}
            onRemoveEnvVariable={removeEnvVariable}
            onUpdateEnvVariable={updateEnvVariable}
            onInitialize={initializeProject}
            isInitializing={isInitializing}
            isInitialized={isInitialized}
          />
          
          <ProjectStructure
            projectName={projectConfig.name}
            progress={progress}
            isInitialized={isInitialized}
          />
        </div>
      </div>
    </div>
  );
}
