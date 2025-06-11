'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Bus, 
  Truck, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
  Users,
  Building,
  FileText,
  RefreshCw
} from 'lucide-react';
import { 
  getDashboardStats, 
  getVehicleStatsByCategory, 
  getRevenueEvolution,
  getRecentActivity 
} from '@/actions/dashboard';
import { DashboardStats } from '@/types/api';
import { formatCurrency } from '@/lib/pricing-utils';

interface VehicleStats {
  category: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface RevenueData {
  date: string;
  total: number;
  Bus: number;
  'Mini Bus': number;
  Taxi: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [revenueEvolution, setRevenueEvolution] = useState<RevenueData[]>([]);
  const [recentActivity, setRecentActivity] = useState<any>(null);  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'day' | 'month'>('week');
  const [selectedDays, setSelectedDays] = useState(30);
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResult, vehicleStatsResult, revenueResult, activityResult] = await Promise.all([
        getDashboardStats(),
        getVehicleStatsByCategory(selectedPeriod),
        getRevenueEvolution(selectedDays),
        getRecentActivity(7)
      ]);

      if (!statsResult.error && statsResult.data) setStats(statsResult.data);
      if (!vehicleStatsResult.error && vehicleStatsResult.data?.stats) {
        // Transformer les données pour correspondre à l'interface VehicleStats
        const transformedStats = vehicleStatsResult.data.stats.map((stat: any) => ({
          category: stat.label,
          count: stat.count,
          revenue: stat.totalRevenue,
          percentage: vehicleStatsResult.data.totals.totalVehicles > 0 
            ? (stat.count / vehicleStatsResult.data.totals.totalVehicles) * 100 
            : 0
        }));
        setVehicleStats(transformedStats);
      }
      if (!revenueResult.error && revenueResult.data) {
        // Transformer les données pour correspondre à l'interface RevenueData
        const transformedRevenue = revenueResult.data.map((item: any) => ({
          date: item.date,
          total: item.total.revenue,
          Bus: item.BUS?.revenue || 0,
          'Mini Bus': item.MINI_BUS?.revenue || 0,
          Taxi: item.TAXI?.revenue || 0
        }));
        setRevenueEvolution(transformedRevenue);
      }
      if (!activityResult.error && activityResult.data) setRecentActivity(activityResult.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedDays]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bus': return <Bus className="h-8 w-8" />;
      case 'Mini Bus': return <Truck className="h-8 w-8" />;
      case 'Taxi': return <Car className="h-8 w-8" />;
      default: return <Car className="h-8 w-8" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bus': return 'text-blue-600 bg-blue-100';
      case 'Mini Bus': return 'text-green-600 bg-green-100';
      case 'Taxi': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">Chargement du tableau de bord...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des enregistrements de véhicules</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Véhicules</CardTitle>
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8" />
              <span className="text-2xl font-bold">{stats?.general?.totalVehicules || 0}</span>
            </div>
          </CardHeader>
        </Card>        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Revenus Total</CardTitle>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8" />
              <span className="text-2xl font-bold">{formatCurrency(stats?.general?.totalRevenue || 0)}</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Propriétaires</CardTitle>
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8" />
              <span className="text-2xl font-bold">{stats?.general?.totalProprietaires || 0}</span>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Utilisateurs</CardTitle>
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8" />
              <span className="text-2xl font-bold">{stats?.general?.totalUsers || 0}</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">Statistiques par Catégorie</TabsTrigger>
          <TabsTrigger value="revenue">Évolution des Revenus</TabsTrigger>
          <TabsTrigger value="activity">Activité Récente</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Enregistrements par Catégorie</h2>
            <Select value={selectedPeriod} onValueChange={(value: 'week' | 'day' | 'month') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicleStats.map((stat) => (
              <Card key={stat.category} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${getCategoryColor(stat.category)}`}>
                      {getCategoryIcon(stat.category)}
                    </div>
                    <div>
                      <span className="text-lg font-semibold">{stat.category}</span>
                      <p className="text-sm text-gray-500">{stat.count} véhicules</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenus générés</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(stat.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Part du total</span>
                      <span className="font-medium">{stat.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Évolution des Revenus</h2>
            <Select value={selectedDays.toString()} onValueChange={(v) => setSelectedDays(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="15">15 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Revenus par jour</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueEvolution.slice(-10).map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {new Date(data.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(data.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Bus: {formatCurrency(data.Bus)} | 
                        Mini Bus: {formatCurrency(data['Mini Bus'])} | 
                        Taxi: {formatCurrency(data.Taxi)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h2 className="text-xl font-semibold">Activité Récente (7 derniers jours)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Nouveaux enregistrements</span>
                </CardTitle>
              </CardHeader>              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.activiteRecente?.nouveauxVehicules || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  véhicules enregistrés récemment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Total Documents</span>
                </CardTitle>
              </CardHeader>              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats?.general?.totalDocuments || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  documents dans le système
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenus de la semaine par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentActivity?.revenueByCategory?.map((item: any) => (
                  <div key={item.category} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`inline-flex p-3 rounded-full mb-2 ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="font-semibold">{item.category}</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.count} véhicules
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
