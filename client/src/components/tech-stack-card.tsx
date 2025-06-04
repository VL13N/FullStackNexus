import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TechStackCardProps {
  icon: string;
  iconBg: string;
  title: string;
  description: string;
  status: string;
  statusBg: string;
  statusText: string;
  specs: Array<{ label: string; value: string }>;
  hasInputs?: boolean;
  supabaseUrl?: string;
  supabaseKey?: string;
  onUpdateSupabase?: (url: string, key: string) => void;
}

export default function TechStackCard({
  icon,
  iconBg,
  title,
  description,
  status,
  statusBg,
  statusText,
  specs,
  hasInputs = false,
  supabaseUrl = "",
  supabaseKey = "",
  onUpdateSupabase
}: TechStackCardProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} text-white text-sm`}></i>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 ${statusBg} ${statusText} text-xs font-medium rounded`}>
          {status}
        </span>
      </div>
      
      {hasInputs ? (
        <div className="space-y-3">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1">
              Supabase Project URL
            </Label>
            <Input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => onUpdateSupabase?.(e.target.value, supabaseKey)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1">
              Supabase Anon Key
            </Label>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => onUpdateSupabase?.(supabaseUrl, e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {specs.map((spec, index) => (
            <div key={index}>
              <span className="font-medium text-slate-700">{spec.label}</span>
              <span className="text-slate-500 ml-1">{spec.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
