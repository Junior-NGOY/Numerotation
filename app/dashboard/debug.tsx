'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { 
  getDashboardStats, 
  getVehicleStatsByCategory, 
  getRevenueEvolution,
  getRecentActivity 
} from '@/actions/dashboard';

export default function DashboardDebugPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const testAPI = async (name: string, apiCall: () => Promise<any>) => {
    try {
      const start = Date.now();
      const result = await apiCall();
      const duration = Date.now() - start;
      
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: !result.error,
          data: result,
          duration,
          error: result.error
        }
      }));
    } catch (error) {
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          duration: 0
        }
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    
    await Promise.all([
      testAPI('getDashboardStats', () => getDashboardStats()),
      testAPI('getVehicleStatsByCategory', () => getVehicleStatsByCategory('week')),
      testAPI('getRevenueEvolution', () => getRevenueEvolution(30)),
      testAPI('getRecentActivity', () => getRecentActivity(7))
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test des APIs Dashboard</h1>
          <p className="text-gray-600 mt-1">Diagnostic des endpoints du tableau de bord</p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Tester à nouveau
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <Card key={name} className={result.success ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {name}
                <span className="text-sm font-normal text-gray-500">
                  ({result.duration}ms)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div>
                  <p className="text-green-600 font-medium mb-2">✅ Succès</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600">Voir les données</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p className="text-red-600 font-medium mb-2">❌ Erreur</p>
                  <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {result.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Test des APIs en cours...</span>
        </div>
      )}
    </div>
  );
}
