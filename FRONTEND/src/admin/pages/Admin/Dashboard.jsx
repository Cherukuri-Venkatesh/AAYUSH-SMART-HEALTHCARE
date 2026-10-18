import React, { useContext, useEffect, useMemo } from 'react';
import { assets } from '../../assets/assets';
import { AdminContext } from '../../context/AdminContext';
import { useLanguage } from '../../../context/LanguageContext';
import './Dashboard.css';

const buildLinePath = (data = []) => {
  if (!data || data.length === 0) return "0,100 100,100";
  const max = Math.max(...data.map((item) => item.value), 1);
  return data
    .map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - (item.value / max) * 88;
      return `${x},${y}`;
    })
    .join(' ');
};

const PieChart = ({ completed = 0, cancelled = 0, total = 0, t }) => {
  const active = Math.max(total - completed - cancelled, 0);
  const values = [
    { label: t('Completed'), value: completed, color: '#22c55e' },
    { label: t('Cancelled'), value: cancelled, color: '#ef4444' },
    { label: t('Pending'), value: active, color: '#3b82f6' },
  ];
  const safeTotal = values.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;

  return (
    <div className="admin-pie-wrap">
      <svg viewBox="0 0 42 42" className="admin-pie-chart" aria-label="Appointment status ratio">
        {values.map((item) => {
          const percent = (item.value / safeTotal) * 100;
          const dashArray = `${percent} ${100 - percent}`;
          const dashOffset = 25 - start;
          start += percent;
          return (
            <circle
              key={item.label}
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke={item.color}
              strokeWidth="7"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>

      <div className="admin-pie-legend">
        {values.map((item) => (
          <div key={item.label} className="admin-pie-legend-row">
            <span className="admin-pie-dot" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { aToken, getDashData, dashData } = useContext(AdminContext);
  const { t } = useLanguage();

  useEffect(() => {
    if (aToken) getDashData();
  }, [aToken]);

  const summaryCards = useMemo(() => {
    if (!dashData) return [];

    return [
      { label: t('Total Patients'), value: dashData.totalPatients || 0, icon: assets.patients_icon, gradient: 'card-blue' },
      { label: t('Hospitals'), value: dashData.totalHospitals || 0, icon: assets.home_icon, gradient: 'card-violet' },
      { label: t('Total Doctors'), value: dashData.totalDoctors || 0, icon: assets.people_icon, gradient: 'card-amber' },
      {
        label: t('Total Revenue'),
        value: `₹${(dashData.totalRevenueEarnedByDoctors || 0).toLocaleString()}`,
        icon: assets.earning_icon,
        gradient: 'card-emerald',
      },
      {
        label: t('Total Appointments'),
        value: dashData.totalAppointmentsFromDayOne || 0,
        icon: assets.appointments_icon,
        gradient: 'card-indigo',
      },
      {
        label: t('Completed'),
        value: dashData.totalCompletedAppointments || 0,
        icon: assets.tick_icon,
        gradient: 'card-cyan',
      },
      {
        label: t('Cancelled'),
        value: dashData.totalCancelledAppointments || 0,
        icon: assets.cancel_icon,
        gradient: 'card-red',
      },
    ];
  }, [dashData, t]);

  if (!dashData) {
    return (
      <div className="admin-dashboard-wrapper">
        <p className="admin-empty-state">Loading analytics dashboard...</p>
      </div>
    );
  }

  const appGrowth = Array.isArray(dashData.applicationGrowth) ? dashData.applicationGrowth : [];
  const revGrowth = Array.isArray(dashData.revenueGrowth) ? dashData.revenueGrowth : [];

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">{t('Dashboard')} — Administration Intelligence</h1>
        <p className="admin-dashboard-subtitle">Enterprise-grade system analytics for patients, hospitals, doctors, appointments and revenue</p>
      </header>

      <section className="admin-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className={`admin-summary-card ${card.gradient}`}>
            <div>
              <p className="admin-summary-label">{card.label}</p>
              <h3 className="admin-summary-value">{card.value}</h3>
            </div>
            <img src={card.icon} alt="" className="admin-summary-icon" />
          </article>
        ))}
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-card">
          <h3>{t('Appointment Status Distribution')}</h3>
          <PieChart
            total={dashData.totalAppointmentsFromDayOne || 0}
            completed={dashData.totalCompletedAppointments || 0}
            cancelled={dashData.totalCancelledAppointments || 0}
            t={t}
          />
        </article>

        <article className="admin-analytics-card">
          <h3>Application Growth (Bar)</h3>
          <div className="admin-bar-grid">
            {appGrowth.length > 0 ? (
              appGrowth.map((item) => (
                <div key={item.label} className="admin-bar-col">
                  <div className="admin-bar-track">
                    <span className="admin-bar-fill" style={{ height: `${Math.min(item.value, 100)}%` }} />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px', padding: '20px' }}>No growth history recorded yet</p>
            )}
          </div>
        </article>

        <article className="admin-analytics-card admin-analytics-card-wide">
          <h3>{t('Revenue Trend Chart')}</h3>
          <svg viewBox="0 0 100 100" className="admin-line-chart" role="img" aria-label="Revenue trend chart">
            <polyline points={buildLinePath(revGrowth)} fill="none" stroke="#0ea5e9" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
          <div className="admin-line-labels">
            {revGrowth.map((item) => (
              <span key={item.label}>{item.label}</span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
