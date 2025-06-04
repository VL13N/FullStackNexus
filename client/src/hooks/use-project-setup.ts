import { useState, useCallback } from "react";
import { ProjectConfig, EnvVariable, createDefaultConfig, createDefaultEnvVariables } from "@/lib/project-config";

export function useProjectSetup() {
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(createDefaultConfig());
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>(createDefaultEnvVariables());
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(50);

  const updateProjectConfig = useCallback((updates: Partial<ProjectConfig>) => {
    setProjectConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addEnvVariable = useCallback(() => {
    const newVariable: EnvVariable = {
      id: `var_${Date.now()}`,
      key: "",
      value: "",
      isSecret: false
    };
    setEnvVariables(prev => [...prev, newVariable]);
  }, []);

  const removeEnvVariable = useCallback((id: string) => {
    setEnvVariables(prev => prev.filter(variable => variable.id !== id));
  }, []);

  const updateEnvVariable = useCallback((id: string, updates: Partial<EnvVariable>) => {
    setEnvVariables(prev => 
      prev.map(variable => 
        variable.id === id ? { ...variable, ...updates } : variable
      )
    );
  }, []);

  const initializeProject = useCallback(async () => {
    setIsInitializing(true);
    
    // Simulate project initialization steps
    setProgress(60);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProgress(75);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProgress(90);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProgress(100);
    setIsInitializing(false);
    setIsInitialized(true);
  }, []);

  return {
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
  };
}
