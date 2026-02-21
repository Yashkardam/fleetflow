import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OperationalAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/analytics/roi'),
          axios.get('http://localhost:5000/api/vehicles')
        ]);
        setAnalytics(analyticsRes.data);
        setVehicles(vehiclesRes.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    fetchData();
  }, []);

  // --- CALCULATIONS ---
  const totalRevenue = analytics.reduce((sum, v) => sum + Number(v.total_revenue), 0);
  const totalMaintenance = analytics.reduce((sum, v) => sum + (Number(v.total_operational_cost) - Number(v.total_fuel || 0)), 0);
  const totalFuelCost = analytics.reduce((sum, v) => sum + (Number(v.total_operational_cost) - Number(totalMaintenance)), 0);
  const netProfit = totalRevenue - totalFuelCost - totalMaintenance;
  
  const totalAcquisition = analytics.reduce((sum, v) => sum + Number(v.acquisition_cost || 0), 0);
  const fleetROI = totalAcquisition > 0 ? ((netProfit / totalAcquisition) * 100).toFixed(1) : 0;

  const activeVehicles = vehicles.filter(v => v.status === 'On Trip' || v.status === 'In Shop').length;
  const totalActiveFleet = vehicles.filter(v => v.status !== 'Retired').length;
  const utilizationRate = totalActiveFleet > 0 ? Math.round((activeVehicles / totalActiveFleet) * 100) : 0;

  // --- CHART DATA PREPARATION ---
  const costliestVehicles = [...analytics].sort((a, b) => b.total_operational_cost - a.total_operational_cost).slice(0, 5)
    .map(v => ({ name: v.name, cost: v.total_operational_cost }));
  const efficiencyData = analytics.map(v => ({ name: v.name, kmL: Number(v.fuel_efficiency_km_l) }));

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================

  // 1. Export to CSV
  const exportToCSV = () => {
    // Create the CSV Headers
    let csvContent = "Vehicle ID,Name,Total Revenue,Total Fuel,Total Maintenance,Net Profit,Cost Per Km,Fuel Efficiency (km/L)\n";
    
    // Add the data rows
    analytics.forEach(v => {
      const fuel = Number(v.total_fuel || 0);
      const maintenance = Number(v.total_operational_cost) - fuel;
      const profit = Number(v.total_revenue) - Number(v.total_operational_cost);
      
      csvContent += `${v.vehicle_id},${v.name},${v.total_revenue},${fuel},${maintenance},${profit},${v.cost_per_km},${v.fuel_efficiency_km_l}\n`;
    });

    // Create a downloadable Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "FleetFlow_Financial_Report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

// 2. Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("FleetFlow Operational Analytics Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Prepare table data
    const tableColumn = ["Vehicle ID", "Name", "Revenue ($)", "Op Cost ($)", "Cost/km ($)", "Efficiency (km/L)"];
    const tableRows = [];

    analytics.forEach(v => {
      const rowData = [
        v.vehicle_id,
        v.name,
        v.total_revenue,
        v.total_operational_cost,
        v.cost_per_km,
        v.fuel_efficiency_km_l
      ];
      tableRows.push(rowData);
    });

    // Draw the table (UPDATED SYNTAX HERE)
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 119, 182] } // Our app's blue theme
    });

    doc.save("FleetFlow_Audit_Report.pdf");
  };

  // --- REUSABLE STYLES ---
  const cardStyle = { flex: 1, border: '1px solid #1b4965', borderRadius: '8px', padding: '24px', background: '#0a111c', textAlign: 'center' };
  const valueStyle = { fontSize: '2rem', margin: 0, color: '#e0e1dd', fontWeight: 'bold' };
  const labelStyle = { color: '#00a8e8', margin: '0 0 10px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' };
  const exportBtnStyle = { background: 'transparent', color: '#00a8e8', border: '1px solid #00a8e8', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#e0e1dd', margin: 0, fontWeight: '400' }}>Fleet Overview</h2>
        
        {/* EXPORT BUTTONS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportToCSV} style={exportBtnStyle}>
            &#11123; Export CSV
          </button>
          <button onClick={exportToPDF} style={{ ...exportBtnStyle, borderColor: '#ef4444', color: '#ef4444' }}>
            &#11123; Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}><h4 style={labelStyle}>Total Fuel Cost</h4><p style={valueStyle}>${totalFuelCost.toFixed(2)}</p></div>
        <div style={cardStyle}><h4 style={labelStyle}>Fleet ROI</h4><p style={valueStyle}>{fleetROI > 0 ? '+' : ''}{fleetROI}%</p></div>
        <div style={cardStyle}><h4 style={labelStyle}>Utilization Rate</h4><p style={valueStyle}>{utilizationRate}%</p></div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, background: '#0a111c', border: '1px solid #1b4965', padding: '20px', borderRadius: '8px' }}>
          <h4 style={{ ...labelStyle, textAlign: 'center' }}>Fuel Efficiency (km/L) by Vehicle</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b4965" vertical={false} />
              <XAxis dataKey="name" stroke="#8d99ae" />
              <YAxis stroke="#8d99ae" />
              <Tooltip contentStyle={{ backgroundColor: '#050b14', border: '1px solid #00a8e8' }} />
              <Bar dataKey="kmL" fill="#00a8e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, background: '#0a111c', border: '1px solid #1b4965', padding: '20px', borderRadius: '8px' }}>
          <h4 style={{ ...labelStyle, textAlign: 'center' }}>Top Costliest Vehicles</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costliestVehicles}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b4965" vertical={false} />
              <XAxis dataKey="name" stroke="#8d99ae" />
              <YAxis stroke="#8d99ae" />
              <Tooltip contentStyle={{ backgroundColor: '#050b14', border: '1px solid #00a8e8' }} />
              <Bar dataKey="cost" fill="#0077b6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#0a111c', border: '1px solid #1b4965', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#023e8a', color: '#fff' }}>
              <th style={{ padding: '16px' }}>Metric</th>
              <th>Total Revenue</th>
              <th>Total Fuel</th>
              <th>Total Maintenance</th>
              <th>Net Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px', borderBottom: '1px solid #1b4965' }}>All Time Aggregated</td>
              <td style={{ borderBottom: '1px solid #1b4965' }}>${totalRevenue.toFixed(2)}</td>
              <td style={{ borderBottom: '1px solid #1b4965' }}>${totalFuelCost.toFixed(2)}</td>
              <td style={{ borderBottom: '1px solid #1b4965' }}>${totalMaintenance.toFixed(2)}</td>
              <td style={{ borderBottom: '1px solid #1b4965', color: netProfit >= 0 ? '#00a8e8' : '#e63946' }}>${netProfit.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}