export interface ProjectConfig {
  name: string;
  description: string;
  nodeVersion: string;
  packageManager: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export function createDefaultConfig(): ProjectConfig {
  return {
    name: "my-fullstack-app",
    description: "",
    nodeVersion: "18.x",
    packageManager: "npm",
    supabaseUrl: "",
    supabaseKey: ""
  };
}

export function createDefaultEnvVariables(): EnvVariable[] {
  return [
    {
      id: "var_1",
      key: "SUPABASE_URL",
      value: "",
      isSecret: false
    },
    {
      id: "var_2", 
      key: "SUPABASE_ANON_KEY",
      value: "",
      isSecret: true
    },
    {
      id: "var_3",
      key: "PORT",
      value: "3001",
      isSecret: false
    }
  ];
}
