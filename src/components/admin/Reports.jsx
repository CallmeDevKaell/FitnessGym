import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Reports = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [bestSelling, setBestSelling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('weekly');

  useEffect(() => {
    fetchReports();
  }, [reportType]);

  const fetchReports = async () => {
    setLoading(true);
    
    try {
      // Get all approved payments
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          member:member_id(
            membership_plan:membership_plan_id(name)
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Process data based on report type
      if (reportType === 'weekly') {
        processWeeklyData(payments);
      } else if (reportType === 'monthly') {
        processMonthlyData(payments);
      } else if (reportType === 'best') {
        processBestSelling(payments);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (payments) => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyPayments = payments.filter(p => 
      new Date(p.created_at) >= weekAgo
    );

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sales = days.map(() => 0);

    weeklyPayments.forEach(payment => {
      const day = new Date(payment.created_at).getDay();
      const adjustedDay = day === 0 ? 6 : day - 1;
      sales[adjustedDay] += payment.amount;
    });

    setWeeklyData({
      labels: days,
      values: sales,
      total: weeklyPayments.reduce((sum, p) => sum + p.amount, 0),
      count: weeklyPayments.length
    });
  };

  const processMonthlyData = (payments) => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const monthlyPayments = payments.filter(p => 
      new Date(p.created_at) >= monthAgo
    );

    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const sales = [0, 0, 0, 0];

    monthlyPayments.forEach(payment => {
      const daysDiff = Math.floor((now - new Date(payment.created_at)) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(Math.floor(daysDiff / 7), 3);
      sales[weekIndex] += payment.amount;
    });

    setMonthlyData({
      labels: weeks,
      values: sales,
      total: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthlyPayments.length
    });
  };

  const processBestSelling = (payments) => {
    const planSales = {};

    payments.forEach(payment => {
      const planName = payment.member?.membership_plan?.name || 'Unknown';
      if (!planSales[planName]) {
        planSales[planName] = 0;
      }
      planSales[planName] += 1;
    });

    const sorted = Object.entries(planSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setBestSelling({
      labels: sorted.map(([name]) => name),
      values: sorted.map(([, count]) => count),
      total: sorted.reduce((sum, [, count]) => sum + count, 0)
    });
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const getChartData = (data) => {
    if (!data) return null;
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'];
    return {
      labels: data.labels,
      datasets: [{
        data: data.values,
        backgroundColor: colors.slice(0, data.labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📊 Sales Reports</h2>
      
      <div className="flex space-x-2 mb-6 flex-wrap">
        <button
          onClick={() => setReportType('weekly')}
          className={`px-4 py-2 rounded transition ${
            reportType === 'weekly' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          📅 Weekly Sales
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-4 py-2 rounded transition ${
            reportType === 'monthly' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          📅 Monthly Sales
        </button>
        <button
          onClick={() => setReportType('best')}
          className={`px-4 py-2 rounded transition ${
            reportType === 'best' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          🏆 Best Selling Plans
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-center mb-4">
              {reportType === 'weekly' && '📅 Weekly Sales Distribution'}
              {reportType === 'monthly' && '📅 Monthly Sales Distribution'}
              {reportType === 'best' && '🏆 Best Selling Membership Plans'}
            </h3>
            {reportType === 'weekly' && weeklyData && (
              <>
                <Pie data={getChartData(weeklyData)} options={chartOptions} />
                <div className="text-center mt-4">
                  <p className="font-semibold text-green-600">
                    Total: ₱{weeklyData.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {weeklyData.count} transaction{weeklyData.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
            {reportType === 'monthly' && monthlyData && (
              <>
                <Pie data={getChartData(monthlyData)} options={chartOptions} />
                <div className="text-center mt-4">
                  <p className="font-semibold text-green-600">
                    Total: ₱{monthlyData.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {monthlyData.count} transaction{monthlyData.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
            {reportType === 'best' && bestSelling && (
              <>
                <Pie data={getChartData(bestSelling)} options={chartOptions} />
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Total: {bestSelling.total} plan{bestSelling.total !== 1 ? 's' : ''} sold
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Summary Table */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-center mb-4">📋 Summary</h3>
            
            {reportType === 'weekly' && weeklyData && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Week of {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date().toLocaleDateString()}
                </p>
                <div className="space-y-2">
                  {weeklyData.labels.map((day, i) => (
                    <div key={day} className="flex justify-between text-sm border-b pb-1">
                      <span>{day}</span>
                      <span className="font-medium">₱{weeklyData.values[i].toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'monthly' && monthlyData && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Last 30 days
                </p>
                <div className="space-y-2">
                  {monthlyData.labels.map((week, i) => (
                    <div key={week} className="flex justify-between text-sm border-b pb-1">
                      <span>{week}</span>
                      <span className="font-medium">₱{monthlyData.values[i].toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportType === 'best' && bestSelling && (
              <div>
                <div className="space-y-2">
                  {bestSelling.labels.map((plan, i) => (
                    <div key={plan} className="flex justify-between text-sm border-b pb-1">
                      <span>{i + 1}. {plan}</span>
                      <span className="font-medium">{bestSelling.values[i]} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!weeklyData && !monthlyData && !bestSelling && (
              <div className="text-center py-8 text-gray-500">
                No data available yet. Start processing payments to see reports!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;