import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [equipmentData, setEquipmentData] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load equipment utilization data
      const equipRes = await api.get('/equipment');
      const equipment = equipRes.data;

      // Load bookings for utilization calculation
      let bookings = [];
      try {
        const bookRes = await api.get('/bookings');
        bookings = bookRes.data;
      } catch {
        // ignore
      }

      // Calculate utilization per equipment (% of approved bookings)
      const utilizationMap = {};
      bookings.forEach((b) => {
        const eqName = b.equipment?.name || b.equipmentName || 'Unknown';
        if (!utilizationMap[eqName]) utilizationMap[eqName] = { total: 0, approved: 0 };
        utilizationMap[eqName].total++;
        if (b.status === 'APPROVED') utilizationMap[eqName].approved++;
      });

      const utilData = Object.entries(utilizationMap)
        .map(([name, data]) => ({
          name: name.length > 15 ? name.substring(0, 15) + '...' : name,
          utilization: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
        }))
        .slice(0, 10);

      setEquipmentData(utilData);

      // Booking status distribution
      const statusCounts = {};
      bookings.forEach((b) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }));

      setBookingStatusData(statusData);
    } catch (err) {
      toast.error('Failed to load analytics data');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Utilization */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Equipment Utilization (%)
          </h3>
          {equipmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={equipmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">
              No utilization data available
            </p>
          )}
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Booking Status Distribution
          </h3>
          {bookingStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {bookingStatusData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">
              No booking data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
