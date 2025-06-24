import { useEffect, useState } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import api from '../services/api';
import Loading from '../components/Loading';
import DatePicker from '../components/DatePicker';
import type { ChartData as ChartJSData } from 'chart.js';

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

  if (loading) return <Loading message="Loading statistics..." />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Statistics & Analytics</h2>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
        <DatePicker label="End Date" value={endDate} onChange={setEndDate} />
        <button onClick={() => { setStartDate(""); setEndDate(""); }} className="ml-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">Clear</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">Transactions Per Day</h3>
          {perDay && perDay.labels && perDay.labels.length > 0 ? <Line data={perDay} /> : <div className="text-gray-400">No data</div>}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Amount Spent and Gained by Day</h3>
          {spentAndGainedByDay && spentAndGainedByDay.labels && spentAndGainedByDay.labels.length > 0 ? (
            <Bar data={spentAndGainedByDay} />
          ) : (
            <div className="text-gray-400">No data</div>
          )}
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
