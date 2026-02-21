import { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OperationalAnalytics() {
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  
  // Data States
  const [monthlyData, setMonthlyData] = useState([]);
  const [vehicleCostData, setVehicleCostData] = useState([]);
  const [kpis, setKpis] = useState({ fuel: 0, roi: 0, utilization: 0 });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [vRes, eRes, mRes] = await Promise.all([
          axios.get('http://localhost:5000/api/vehicles'),
          axios.get('http://localhost:5000/api/expenses'),
          axios.get('http://localhost:5000/api/maintenance')
        ]);
        
        setVehicles(vRes.data);
        setExpenses(eRes.data);
        setMaintenance(mRes.data);

        processAnalytics(vRes.data, eRes.data, mRes.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };
    fetchAllData();
  }, []);

  const processAnalytics = (vData, eData, mData) => {
    // 1. UTILIZATION RATE
    const activeFleet = vData.filter(v => v.status === 'On Trip').length;
    const totalFleet = vData.filter(v => v.status !== 'Retired').length;
    const utilization = totalFleet > 0 ? Math.round((activeFleet / totalFleet) * 100) : 0;

    // 2. PROCESS MONTHLY DATA (For Table & Line Chart)
    const monthMap = {};
    const getMonth = (dateString) => new Date(dateString).toLocaleString('default', { month: 'short' });

    // Tally Expenses (Fuel, Misc, Distance)
    eData.forEach(exp => {
      const m = getMonth(exp.logged_at);
      if (!monthMap[m]) monthMap[m] = { name: m, revenue: 0, fuelCost: 0, maintenance: 0, distance: 0 };
      
      monthMap[m].fuelCost += Number(exp.fuel_cost);
      monthMap[m].distance += Number(exp.distance_km);
      // SIMULATED REVENUE: Rs. 50 per km driven
      monthMap[m].revenue += Number(exp.distance_km) * 50; 
    });

    // Tally Maintenance
    mData.forEach(log => {
      const m = getMonth(log.service_date);
      if (!monthMap[m]) monthMap[m] = { name: m, revenue: 0, fuelCost: 0, maintenance: 0, distance: 0 };
      monthMap[m].maintenance += Number(log.cost);
    });

    let totalFuel = 0;
    let totalRevenue = 0;
    let totalMaintenance = 0;

    // Calculate Profit & Efficiency per month
    const processedMonths = Object.values(monthMap).map(data => {
      totalFuel += data.fuelCost;
      totalRevenue += data.revenue;
      totalMaintenance += data.maintenance;

      // Assuming Rs 100 per Liter of fuel for efficiency math
      const litersUsed = data.fuelCost / 100; 
      
      return {
        ...data,
        netProfit: data.revenue - data.fuelCost - data.maintenance,
        efficiency: litersUsed > 0 ? Number((data.distance / litersUsed).toFixed(1)) : 0
      };
    });

    // 3. PROCESS VEHICLE COSTS (For Bar Chart)
    const vCostMap = {};
    vData.forEach(v => { vCostMap[v.id] = { name: v.name, cost: 0 }; });
    
    eData.forEach(e => { if(vCostMap[e.vehicle_id]) vCostMap[e.vehicle_id].cost += Number(e.fuel_cost) + Number(e.misc_cost); });
    mData.forEach(m => { if(vCostMap[m.vehicle_id]) vCostMap[m.vehicle_id].cost += Number(m.cost); });

    const topCostliest = Object.values(vCostMap)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5); // Get top 5

    // 4. OVERALL ROI
    const totalCosts = totalFuel + totalMaintenance;
    const netProfit = totalRevenue - totalCosts;
    const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(1) : 0;

    // Update States
    setMonthlyData(processedMonths);
    setVehicleCostData(topCostliest);
    setKpis({ fuel: totalFuel, roi: roi, utilization: utilization });
  };

  // Helper to format currency to "L" (Lakhs) or "k" (Thousands)
  const formatCurrency = (val) => {
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `Rs. ${(val / 1000).toFixed(1)}k`;
    return `Rs. ${val}`;
  };

  // --- EXPORT LOGIC ---
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FleetFlow: Financial Summary Report", 14, 22);
    
    const tableColumn = ["Month", "Revenue", "Fuel Cost", "Maintenance", "Net Profit"];
    const tableRows = monthlyData.map(data => [
      data.name,
      formatCurrency(data.revenue),
      formatCurrency(data.fuelCost),
      formatCurrency(data.maintenance),
      formatCurrency(data.netProfit)
    ]);
    
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40, theme: 'grid' });
    doc.save("FleetFlow_Financial_Report.pdf");
  };

  const exportToCSV = () => {
    let csv = "Month,Revenue,Fuel Cost,Maintenance,Net Profit\n";
    monthlyData.forEach(data => { 
      // Using raw numbers for CSV so it can be easily summed in Excel
      csv += `${data.name},${data.revenue},${data.fuelCost},${data.maintenance},${data.netProfit}\n`; 
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FleetFlow_Financial_Report.csv";
    link.click();
  };

  const cardStyle = { flex: 1, border: '2px solid #10b981', borderRadius: '12px', padding: '24px', background: '#0a111c', textAlign: 'center' };
  const chartCardStyle = { flex: 1, background: '#e0e1dd', padding: '20px', borderRadius: '4px', color: '#050b14' };
  const exportBtnStyle = { padding: '10px 15px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold' };

  return (
    <div style={{ color: '#e0e1dd' }}>
      
      {/* HEADER WITH EXPORT BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#00a8e8', margin: 0, fontWeight: '400' }}>8. Operational Analytics & Financial Reports</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={{ ...exportBtnStyle, background: '#0077b6', color: '#fff' }}>Export CSV</button>
          <button onClick={exportToPDF} style={{ ...exportBtnStyle, background: '#ef4444', color: '#fff' }}>Export PDF</button>
        </div>
      </div>

      {/* --- TOP KPIs (Green Outline) --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#10b981', marginTop: 0, fontWeight: '400' }}>Total Fuel Cost</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0 0', fontWeight: 'bold' }}>{formatCurrency(kpis.fuel)}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: '#10b981', marginTop: 0, fontWeight: '400' }}>Fleet ROI</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0 0', fontWeight: 'bold' }}>{kpis.roi > 0 ? '+' : ''}{kpis.roi}%</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: '#10b981', marginTop: 0, fontWeight: '400' }}>Utilization Rate</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0 0', fontWeight: 'bold' }}>{kpis.utilization}%</p>
        </div>
      </div>

      {/* --- MIDDLE CHARTS --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', height: '300px' }}>
        
        {/* Left Chart: Efficiency Trend */}
        <div style={chartCardStyle}>
          <h4 style={{ marginTop: 0, textAlign: 'center' }}>Fuel Efficiency Trend (kmL)</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip />
              <Line type="monotone" dataKey="efficiency" stroke="#333" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Right Chart: Top 5 Costliest */}
        <div style={chartCardStyle}>
          <h4 style={{ marginTop: 0, textAlign: 'center' }}>Top 5 Costliest Vehicles</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={vehicleCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="cost" fill="#444" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- BOTTOM TABLE --- */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h3 style={{ display: 'inline-block', border: '2px solid #00a8e8', color: '#00a8e8', padding: '8px 24px', borderRadius: '8px', margin: 0 }}>
          Financial Summary of Month
        </h3>
      </div>
      
      <div style={{ borderTop: '2px solid #fff', borderBottom: '2px solid #fff', padding: '10px 0' }}>
        <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#ff758f', fontSize: '18px' }}>
              <th style={{ padding: '12px' }}>Month</th>
              <th>Revenue</th>
              <th>Fuel Cost</th>
              <th>Maintenance</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.length > 0 ? monthlyData.map((data, index) => (
              <tr key={index} style={{ borderTop: '1px solid #1b4965' }}>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>{data.name}</td>
                <td>{formatCurrency(data.revenue)}</td>
                <td>{formatCurrency(data.fuelCost)}</td>
                <td>{formatCurrency(data.maintenance)}</td>
                <td style={{ color: data.netProfit >= 0 ? '#e0e1dd' : '#ef4444' }}>
                  {formatCurrency(data.netProfit)}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ padding: '20px', color: '#8d99ae' }}>No financial data logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}