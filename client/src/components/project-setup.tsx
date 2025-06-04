import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import TechStackCard from "./tech-stack-card";
import EnvVariables from "./env-variables";
import { ProjectConfig, EnvVariable } from "@/lib/project-config";

interface ProjectSetupProps {
  projectConfig: ProjectConfig;
  onUpdateConfig: (updates: Partial<ProjectConfig>) => void;
  envVariables: EnvVariable[];
  onAddEnvVariable: () => void;
  onRemoveEnvVariable: (id: string) => void;
  onUpdateEnvVariable: (id: string, updates: Partial<EnvVariable>) => void;
  onInitialize: () => void;
  isInitializing: boolean;
  isInitialized: boolean;
}

export default function ProjectSetup({
  projectConfig,
  onUpdateConfig,
  envVariables,
  onAddEnvVariable,
  onRemoveEnvVariable,
  onUpdateEnvVariable,
  onInitialize,
  isInitializing,
  isInitialized
}: ProjectSetupProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Project Configuration Card */}
      <Card className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Project Configuration</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            Step 1 of 4
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">Project Name</Label>
            <Input
              type="text"
              value={projectConfig.name}
              onChange={(e) => onUpdateConfig({ name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-2">Description</Label>
            <Textarea
              rows={3}
              value={projectConfig.description}
              onChange={(e) => onUpdateConfig({ description: e.target.value })}
              placeholder="A full-stack JavaScript application with React, Express, and Supabase"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Node.js Version</Label>
              <Select
                value={projectConfig.nodeVersion}
                onValueChange={(value) => onUpdateConfig({ nodeVersion: value })}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18.x">18.x (LTS)</SelectItem>
                  <SelectItem value="20.x">20.x (Latest)</SelectItem>
                  <SelectItem value="16.x">16.x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-slate-700 mb-2">Package Manager</Label>
              <Select
                value={projectConfig.packageManager}
                onValueChange={(value) => onUpdateConfig({ packageManager: value })}
              >
                <SelectTrigger className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="npm">npm</SelectItem>
                  <SelectItem value="yarn">yarn</SelectItem>
                  <SelectItem value="pnpm">pnpm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tech Stack Configuration */}
      <Card className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Technology Stack</h2>
        
        <div className="space-y-6">
          <TechStackCard
            icon="fab fa-react"
            iconBg="bg-blue-500"
            title="Frontend"
            description="React.js with Tailwind CSS"
            status="Configured"
            statusBg="bg-emerald-100"
            statusText="text-emerald-700"
            specs={[
              { label: "React:", value: "18.2.0" },
              { label: "Tailwind CSS:", value: "3.3.0" },
              { label: "Vite:", value: "4.4.0" },
              { label: "TypeScript:", value: "Optional" }
            ]}
          />

          <TechStackCard
            icon="fab fa-node-js"
            iconBg="bg-green-600"
            title="Backend"
            description="Node.js with Express"
            status="Configured"
            statusBg="bg-emerald-100"
            statusText="text-emerald-700"
            specs={[
              { label: "Express:", value: "4.18.0" },
              { label: "CORS:", value: "Enabled" },
              { label: "Morgan:", value: "Logging" },
              { label: "Helmet:", value: "Security" }
            ]}
          />

          <TechStackCard
            icon="fas fa-database"
            iconBg="bg-emerald-600"
            title="Database"
            description="Supabase PostgreSQL"
            status="Setup Required"
            statusBg="bg-amber-100"
            statusText="text-amber-700"
            specs={[]}
            hasInputs={true}
            supabaseUrl={projectConfig.supabaseUrl}
            supabaseKey={projectConfig.supabaseKey}
            onUpdateSupabase={(url, key) => onUpdateConfig({ supabaseUrl: url, supabaseKey: key })}
          />
        </div>
      </Card>

      {/* Environment Variables */}
      <EnvVariables
        envVariables={envVariables}
        onAddVariable={onAddEnvVariable}
        onRemoveVariable={onRemoveEnvVariable}
        onUpdateVariable={onUpdateEnvVariable}
      />

      {/* Initialize Button */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" className="px-4 py-2 text-slate-600 hover:text-slate-700 font-medium">
          <i className="fas fa-arrow-left mr-2"></i>Previous
        </Button>
        <Button
          onClick={onInitialize}
          disabled={isInitializing}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-75"
        >
          {isInitializing ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Initializing...
            </>
          ) : isInitialized ? (
            <>
              <i className="fas fa-check mr-2"></i>
              Project Initialized!
            </>
          ) : (
            <>
              Initialize Project
              <i className="fas fa-rocket ml-2"></i>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
