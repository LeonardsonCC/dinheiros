import { useEffect, useState } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import Loading from '../components/Loading';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

// Default empty chart data
const emptyChartData = { labels: [], datasets: [] };

export default function Statistics() {
  const [loading, setLoading] = useState(true);
  const [perDay, setPerDay] = useState<any>(emptyChartData);
  const [byMonth, setByMonth] = useState<any>(emptyChartData);
  const [byAccount, setByAccount] = useState<any>(emptyChartData);
  const [byCategory, setByCategory] = useState<any>(emptyChartData);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [perDayRes, byMonthRes, byAccountRes, byCategoryRes] = await Promise.all([
          api.get('/api/statistics/transactions-per-day'),
          api.get('/api/statistics/amount-by-month'),
          api.get('/api/statistics/amount-by-account'),
          api.get('/api/statistics/amount-by-category'),
        ]);
        setPerDay(perDayRes.data || emptyChartData);
        setByMonth(byMonthRes.data || emptyChartData);
        setByAccount(byAccountRes.data || emptyChartData);
        setByCategory(byCategoryRes.data || emptyChartData);
      } catch (e) {
        setPerDay(emptyChartData);
        setByMonth(emptyChartData);
        setByAccount(emptyChartData);
        setByCategory(emptyChartData);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <Loading message="Loading statistics..." />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Statistics & Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Transactions Per Day</h3>
          {perDay && perDay.labels && perDay.labels.length > 0 ? <Line data={perDay} /> : <div className="text-gray-400">No data</div>}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Amount Spent by Month</h3>
          {byMonth && byMonth.labels && byMonth.labels.length > 0 ? <Bar data={byMonth} /> : <div className="text-gray-400">No data</div>}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Amount Spent by Account</h3>
          {byAccount && byAccount.labels && byAccount.labels.length > 0 ? <Doughnut data={byAccount} /> : <div className="text-gray-400">No data</div>}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Amount Spent by Category</h3>
          {byCategory && byCategory.labels && byCategory.labels.length > 0 ? <Pie data={byCategory} /> : <div className="text-gray-400">No data</div>}
        </div>
      </div>
    </div>
  );
}
