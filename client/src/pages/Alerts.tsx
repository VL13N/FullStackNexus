/**
 * Real-Time Alerts Dashboard
 * User interface for managing alert rules and viewing live notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Bell, BellOff, Plus, Trash2, Edit, CheckCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  enabled: boolean;
  created_at: string;
  triggered_count: number;
  last_triggered: string | null;
}

interface AlertCondition {
  field: string;
  operator: string;
  value: number | string;
}

interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  message: string;
  triggered_at: string;
  acknowledged: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertField {
  field: string;
  name: string;
  type: 'number' | 'string';
  description: string;
  operators: string[];
}

export default function Alerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditions: [{ field: '', operator: '', value: '' }] as AlertCondition[]
  });
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch alert rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/alerts/rules'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch alert fields
  const { data: fieldsData } = useQuery({
    queryKey: ['/api/alerts/fields']
  });

  // Fetch active alerts
  const { data: activeAlertsData } = useQuery({
    queryKey: ['/api/alerts/active'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Fetch alert statistics
  const { data: statisticsData } = useQuery({
    queryKey: ['/api/alerts/statistics'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (ruleData: any) => apiRequest('/api/alerts/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/rules'] });
      setNewRule({ name: '', description: '', conditions: [{ field: '', operator: '', value: '' }] });
      setIsCreating(false);
      toast({ title: 'Alert rule created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create alert rule',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, ...ruleData }: any) => apiRequest(`/api/alerts/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/rules'] });
      setEditingRule(null);
      toast({ title: 'Alert rule updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update alert rule',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alerts/rules/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/rules'] });
      toast({ title: 'Alert rule deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete alert rule',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/api/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      toast({ title: 'Alert acknowledged' });
    }
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/alerts`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Alerts WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_alerts') {
          setActiveAlerts(prev => [...data.alerts, ...prev]);
          
          // Show toast notification for new alerts
          data.alerts.forEach((alert: Alert) => {
            toast({
              title: `🚨 ${alert.rule_name}`,
              description: alert.message,
              variant: alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'default'
            });
          });
        } else if (data.type === 'active_alerts') {
          setActiveAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Alerts WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic would go here
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('Alerts WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [toast]);

  // Update active alerts from API data
  useEffect(() => {
    if (activeAlertsData?.success) {
      setActiveAlerts(activeAlertsData.alerts);
    }
  }, [activeAlertsData]);

  const rules = rulesData?.success ? rulesData.rules : [];
  const fields = fieldsData?.success ? fieldsData.fields : [];
  const statistics = statisticsData?.success ? statisticsData.statistics : {};

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: keyof AlertCondition, value: any) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const handleCreateRule = () => {
    if (!newRule.name.trim()) {
      toast({ title: 'Rule name is required', variant: 'destructive' });
      return;
    }

    if (newRule.conditions.some(c => !c.field || !c.operator || c.value === '')) {
      toast({ title: 'All condition fields are required', variant: 'destructive' });
      return;
    }

    // Convert string values to numbers where appropriate
    const processedConditions = newRule.conditions.map(condition => {
      const field = fields.find((f: AlertField) => f.field === condition.field);
      return {
        ...condition,
        value: field?.type === 'number' ? parseFloat(condition.value as string) : condition.value
      };
    });

    createRuleMutation.mutate({
      ...newRule,
      conditions: processedConditions
    });
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;

    updateRuleMutation.mutate({
      id: editingRule.id,
      name: editingRule.name,
      description: editingRule.description,
      conditions: editingRule.conditions,
      enabled: editingRule.enabled
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this alert rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Alerts</h1>
          <p className="text-muted-foreground">
            Manage alert rules and monitor live notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-3 w-3" />
            {activeAlerts.length} Active
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {statistics.enabled_rules || 0} Rules
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.active_alerts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_rules || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.enabled_rules || 0} enabled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">24h Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.alerts_24h || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">7d Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.alerts_7d || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="create">Create Rule</TabsTrigger>
        </TabsList>

        {/* Live Alerts Tab */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                Real-time notifications when your conditions are met
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                  <p className="text-sm">Create alert rules to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} ${
                        alert.acknowledged ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{alert.rule_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {alert.severity.toUpperCase()}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="secondary" className="text-xs">
                                ACKNOWLEDGED
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(alert.triggered_at)}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                            disabled={acknowledgeAlertMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Rules</CardTitle>
              <CardDescription>
                Manage your alert conditions and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="text-center py-8">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alert rules configured</p>
                  <p className="text-sm">Create your first rule to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule: AlertRule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(enabled) => 
                                updateRuleMutation.mutate({ id: rule.id, enabled })
                              }
                            />
                            <Badge variant={rule.enabled ? "default" : "secondary"}>
                              {rule.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {rule.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Created: {formatDateTime(rule.created_at)}</p>
                            <p>Triggered: {rule.triggered_count} times</p>
                            {rule.last_triggered && (
                              <p>Last triggered: {formatDateTime(rule.last_triggered)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={deleteRuleMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show conditions */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Conditions:</p>
                        <div className="space-y-1">
                          {rule.conditions.map((condition, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {fields.find((f: AlertField) => f.field === condition.field)?.name || condition.field} {condition.operator} {condition.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Rule Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Alert Rule</CardTitle>
              <CardDescription>
                Define conditions that will trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    placeholder="e.g., High Bullish Signal"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rule-description">Description (Optional)</Label>
                  <Input
                    id="rule-description"
                    placeholder="Brief description of the rule"
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Conditions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCondition}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                {newRule.conditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field: AlertField) => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                      disabled={!condition.field}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {condition.field && fields.find((f: AlertField) => f.field === condition.field)?.operators.map((op: string) => (
                          <SelectItem key={op} value={op}>
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      type={fields.find((f: AlertField) => f.field === condition.field)?.type === 'number' ? 'number' : 'text'}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      disabled={newRule.conditions.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewRule({ name: '', description: '', conditions: [{ field: '', operator: '', value: '' }] });
                    setIsCreating(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRule}
                  disabled={createRuleMutation.isPending}
                >
                  Create Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Rule Modal - Simple implementation */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Alert Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={editingRule.name}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingRule.description}
                  onChange={(e) => setEditingRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingRule.enabled}
                  onCheckedChange={(enabled) => setEditingRule(prev => prev ? { ...prev, enabled } : null)}
                />
                <Label>Enabled</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRule}
                  disabled={updateRuleMutation.isPending}
                >
                  Update Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}