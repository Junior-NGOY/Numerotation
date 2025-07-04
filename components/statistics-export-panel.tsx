'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  TrendingUp,
  BarChart3,
  Info
} from 'lucide-react';
import { exportStatisticsToExcel, exportStatisticsToPDF, DashboardExportData } from '@/lib/export-utils';

interface StatisticsExportPanelProps {
  exportData: DashboardExportData;
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
  currentPeriod: 'day' | 'week' | 'month';
}

export default function StatisticsExportPanel({ 
  exportData, 
  onPeriodChange, 
  currentPeriod 
}: StatisticsExportPanelProps) {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);

  const handleExportExcel = async () => {
    setExportLoading(true);
    setExportType('excel');
    try {
      const result = await exportStatisticsToExcel(exportData);
      
      if (!result.success) {
        alert(result.error || 'Erreur lors de l\'export Excel');
      }
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setExportLoading(false);
      setExportType(null);
    }
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    setExportType('pdf');
    try {
      const result = await exportStatisticsToPDF(exportData);
      
      if (!result.success) {
        alert(result.error || 'Erreur lors de l\'export PDF');
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setExportLoading(false);
      setExportType(null);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day': return 'Journalier';
      case 'week': return 'Hebdomadaire';
      case 'month': return 'Mensuel';
      default: return 'Inconnu';
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'day': return <Calendar className="h-4 w-4" />;
      case 'week': return <BarChart3 className="h-4 w-4" />;
      case 'month': return <TrendingUp className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">Exporter les statistiques</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {getPeriodIcon(currentPeriod)}
            <span>{getPeriodLabel(currentPeriod)}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé des données à exporter */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Aperçu des données</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{exportData.stats.totalVehicules}</div>
              <div className="text-gray-600">Véhicules</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{exportData.stats.totalProprietaires}</div>
              <div className="text-gray-600">Propriétaires</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{exportData.vehicleStats.length}</div>
              <div className="text-gray-600">Catégories</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{exportData.revenueEvolution.length}</div>
              <div className="text-gray-600">Périodes</div>
            </div>
          </div>
        </div>

        {/* Contrôles d'export */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Période d'analyse
            </label>
            <Select 
              value={currentPeriod} 
              onValueChange={(value: 'day' | 'week' | 'month') => onPeriodChange(value)}
            >
              <SelectTrigger className="w-full bg-white border-blue-200 focus:border-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Journalier</span>
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Hebdomadaire</span>
                  </div>
                </SelectItem>
                <SelectItem value="month">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Mensuel</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleExportExcel}
              disabled={exportLoading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              size="lg"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {exportLoading && exportType === 'excel' ? 'Export...' : 'Excel'}
            </Button>
            
            <Button 
              onClick={handleExportPDF}
              disabled={exportLoading}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md transition-all duration-200 hover:shadow-lg"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              {exportLoading && exportType === 'pdf' ? 'Export...' : 'PDF'}
            </Button>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>💡 Conseil :</strong> L'export Excel contient plusieurs feuilles avec les données détaillées, 
            tandis que le PDF offre un rapport formaté pour l'impression.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
