import { useEffect, useState, useContext } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import Loading from '../components/Loading';
import DatePicker from '../components/DatePicker';
import type { ChartData as ChartJSData, ChartOptions } from 'chart.js';
import { useTheme } from '../contexts/ThemeContext';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

type ChartDataLine = ChartJSData<"line", (number | null)[], string>;
type ChartDataBar = ChartJSData<"bar", (number | [number, number] | null)[], string>;
type ChartDataDoughnut = ChartJSData<"doughnut", number[], string>;
type ChartDataPie = ChartJSData<"pie", number[], string>;

const emptyChartDataLine: ChartDataLine = { labels: [], datasets: [] };
const emptyChartDataBar: ChartDataBar = { labels: [], datasets: [] };
const emptyChartDataDoughnut: ChartDataDoughnut = { labels: [], datasets: [] };
const emptyChartDataPie: ChartDataPie = { labels: [], datasets: [] };

export default function Statistics() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [perDay, setPerDay] = useState<ChartDataLine>(emptyChartDataLine);
  const [byMonth, setByMonth] = useState<ChartDataBar>(emptyChartDataBar);
  const [byAccount, setByAccount] = useState<ChartDataDoughnut>(emptyChartDataDoughnut);
  const [byCategory, setByCategory] = useState<ChartDataPie>(emptyChartDataPie);
  const [spentAndGainedByDay, setSpentAndGainedByDay] = useState<ChartDataBar>(emptyChartDataBar);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
        setPerDay(perDayRes.data || emptyChartDataLine);
        setSpentAndGainedByDay(spentAndGainedByDayRes.data || emptyChartDataBar);
        setByMonth(byMonthRes.data || emptyChartDataBar);
        setByAccount(byAccountRes.data || emptyChartDataDoughnut);
        setByCategory(byCategoryRes.data || emptyChartDataPie);
      } catch (e) {
        setPerDay(emptyChartDataLine);
        setSpentAndGainedByDay(emptyChartDataBar);
        setByMonth(emptyChartDataBar);
        setByAccount(emptyChartDataDoughnut);
        setByCategory(emptyChartDataPie);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [startDate, endDate]);

  const getChartOptions = (title: string): ChartOptions<any> => {
    const isDark = theme === 'dark';
    return {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: isDark ? '#d1d5db' : '#374151', // text-gray-300 dark:text-gray-600
          },
        },
        title: {
          display: true,
          text: title,
          color: isDark ? '#f9fafb' : '#111827', // text-gray-50 dark:text-gray-900
        },
      },
      scales: {
        x: {
          ticks: {
            color: isDark ? '#d1d5db' : '#374151',
          },
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        },
        y: {
          ticks: {
            color: isDark ? '#d1d5db' : '#374151',
          },
          grid: {
            color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        },
      },
    };
  };

  if (loading) return <Loading message="Loading statistics..." />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Statistics & Analytics</h2>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
        <DatePicker label="End Date" value={endDate} onChange={setEndDate} />
        <button onClick={() => { setStartDate(""); setEndDate(""); }} className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">Clear</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {perDay && perDay.labels && perDay.labels.length > 0 ? <Line options={getChartOptions('Transactions Per Day')} data={perDay} /> : <div className="text-center text-gray-500 dark:text-gray-400">No data for Transactions Per Day</div>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {spentAndGainedByDay && spentAndGainedByDay.labels && spentAndGainedByDay.labels.length > 0 ? (
            <Bar options={getChartOptions('Amount Spent and Gained by Day')} data={spentAndGainedByDay} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">No data for Amount Spent and Gained by Day</div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {byMonth && byMonth.labels && byMonth.labels.length > 0 ? <Bar options={getChartOptions('Amount Spent by Month')} data={byMonth} /> : <div className="text-center text-gray-500 dark:text-gray-400">No data for Amount Spent by Month</div>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {byAccount && byAccount.labels && byAccount.labels.length > 0 ? <Doughnut options={getChartOptions('Amount Spent by Account')} data={byAccount} /> : <div className="text-center text-gray-500 dark:text-gray-400">No data for Amount Spent by Account</div>}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          {byCategory && byCategory.labels && byCategory.labels.length > 0 ? <Pie options={getChartOptions('Amount Spent by Category')} data={byCategory} /> : <div className="text-center text-gray-500 dark:text-gray-400">No data for Amount Spent by Category</div>}
        </div>
      </div>
    </div>
  );
}
