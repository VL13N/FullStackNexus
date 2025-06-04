import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnvVariable } from "@/lib/project-config";

interface EnvVariablesProps {
  envVariables: EnvVariable[];
  onAddVariable: () => void;
  onRemoveVariable: (id: string) => void;
  onUpdateVariable: (id: string, updates: Partial<EnvVariable>) => void;
}

export default function EnvVariables({
  envVariables,
  onAddVariable,
  onRemoveVariable,
  onUpdateVariable
}: EnvVariablesProps) {
  return (
    <Card className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Environment Variables</h2>
      
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-900">.env Configuration</h3>
            <Button
              variant="ghost"
              onClick={onAddVariable}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium p-0"
            >
              <i className="fas fa-plus mr-1"></i>Add Variable
            </Button>
          </div>
          
          <div className="space-y-2">
            {envVariables.map((variable) => (
              <div key={variable.id} className="flex items-center space-x-3 bg-white rounded-lg p-3 border">
                <Input
                  type="text"
                  value={variable.key}
                  onChange={(e) => onUpdateVariable(variable.id, { key: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border-0 focus:ring-0 font-mono bg-transparent"
                  placeholder="VARIABLE_NAME"
                />
                <span className="text-slate-400">=</span>
                <Input
                  type={variable.isSecret ? "password" : "text"}
                  value={variable.value}
                  onChange={(e) => onUpdateVariable(variable.id, { value: e.target.value })}
                  className="flex-2 px-2 py-1 text-sm border-0 focus:ring-0 font-mono bg-transparent"
                  placeholder="value"
                />
                <Button
                  variant="ghost"
                  onClick={() => onRemoveVariable(variable.id)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ))}
            
            {envVariables.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No environment variables configured. Click "Add Variable" to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
