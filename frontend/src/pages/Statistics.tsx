import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Loading from '../components/Loading';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon
} from '@heroicons/react/24/outline';

interface ChartDataPoint {
  name: string;
  value: number;
  income?: number;
  expense?: number;
  date?: string;
}

interface StatsSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export default function Statistics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [perDay, setPerDay] = useState<ChartDataPoint[]>([]);
  const [byMonth, setByMonth] = useState<ChartDataPoint[]>([]);
  const [byAccount, setByAccount] = useState<ChartDataPoint[]>([]);
  const [byCategory, setByCategory] = useState<ChartDataPoint[]>([]);
  const [spentAndGainedByDay, setSpentAndGainedByDay] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<StatsSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    transactionCount: 0
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const transformChartData = (chartData: any): ChartDataPoint[] => {
    if (!chartData || !chartData.labels || !chartData.datasets) return [];
    
    return chartData.labels.map((label: string, index: number) => {
      const dataPoint: ChartDataPoint = { name: label, value: 0 };
      
      chartData.datasets.forEach((dataset: any, datasetIndex: number) => {
        const value = dataset.data[index] || 0;
        if (datasetIndex === 0) {
          dataPoint.value = value;
          if (dataset.label?.toLowerCase().includes('income')) {
            dataPoint.income = value;
          } else if (dataset.label?.toLowerCase().includes('expense')) {
            dataPoint.expense = value;
          }
        } else if (datasetIndex === 1) {
          if (dataset.label?.toLowerCase().includes('income')) {
            dataPoint.income = value;
          } else if (dataset.label?.toLowerCase().includes('expense')) {
            dataPoint.expense = value;
          }
        }
      });
      
      return dataPoint;
    });
  };

  const calculateSummary = (data: any[]): StatsSummary => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;

    data.forEach(item => {
      if (item.income) totalIncome += item.income;
      if (item.expense) totalExpenses += Math.abs(item.expense);
      if (item.value) transactionCount += item.value;
    });

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      transactionCount
    };
  };

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const [perDayRes, spentAndGainedByDayRes, byMonthRes, byAccountRes, byCategoryRes] = await Promise.all([
          api.get('/api/statistics/transactions-per-day', { params }),
          api.get('/api/statistics/amount-spent-and-gained-by-day', { params }),
          api.get('/api/statistics/amount-by-month', { params }),
          api.get('/api/statistics/amount-by-account', { params }),
          api.get('/api/statistics/amount-by-category', { params }),
        ]);
        
        const transformedPerDay = transformChartData(perDayRes.data);
        const transformedSpentAndGained = transformChartData(spentAndGainedByDayRes.data);
        const transformedByMonth = transformChartData(byMonthRes.data);
        const transformedByAccount = transformChartData(byAccountRes.data);
        const transformedByCategory = transformChartData(byCategoryRes.data);
        
        setPerDay(transformedPerDay);
        setSpentAndGainedByDay(transformedSpentAndGained);
        setByMonth(transformedByMonth);
        setByAccount(transformedByAccount);
        setByCategory(transformedByCategory);
        
        setSummary(calculateSummary(transformedSpentAndGained));
      } catch (e) {
        console.error('Error fetching statistics:', e);
        setPerDay([]);
        setSpentAndGainedByDay([]);
        setByMonth([]);
        setByAccount([]);
        setByCategory([]);
        setSummary({ totalIncome: 0, totalExpenses: 0, netAmount: 0, transactionCount: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loading message={t('statistics.loading')} fullScreen={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ChartBarIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">{t('statistics.title')}</h1>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t('statistics.dateRange')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('statistics.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('statistics.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button variant="outline" onClick={clearDates}>
              {t('statistics.clearDates')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.summary.totalIncome')}</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.summary.totalExpenses')}</CardTitle>
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.summary.netAmount')}</CardTitle>
            <ScaleIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netAmount)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('statistics.summary.transactionCount')}</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Transactions Per Day */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.charts.transactionsPerDay')}</CardTitle>
          </CardHeader>
          <CardContent>
            {perDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={perDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ChartBarIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('statistics.noData')}</p>
                <p className="text-sm">Try adjusting your date range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount Spent and Gained by Day */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.charts.amountSpentAndGained')}</CardTitle>
          </CardHeader>
          <CardContent>
            {spentAndGainedByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spentAndGainedByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ChartBarIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('statistics.noData')}</p>
                <p className="text-sm">Try adjusting your date range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount by Month */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.charts.amountByMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            {byMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ChartBarIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('statistics.noData')}</p>
                <p className="text-sm">Try adjusting your date range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Amount by Account */}
        <Card>
          <CardHeader>
            <CardTitle>{t('statistics.charts.amountByAccount')}</CardTitle>
          </CardHeader>
          <CardContent>
            {byAccount.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byAccount}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                  {byAccount.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <ChartBarIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('statistics.noData')}</p>
                <p className="text-sm">Try adjusting your date range</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Amount by Category - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>{t('statistics.charts.amountByCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={byCategory} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              {t('statistics.noData')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
