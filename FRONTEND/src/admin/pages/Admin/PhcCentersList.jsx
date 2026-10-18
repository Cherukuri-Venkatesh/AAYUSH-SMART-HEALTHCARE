import React, { useState, useEffect, useMemo } from 'react';
import { BACKENDURL } from '../../../lib';
import { showError, showSuccess, showInfo } from '../../utils/adminToast';
import './AllAppointments.css';

const PAGE_SIZE = 8;

const PhcCentersList = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmPhcId, setConfirmPhcId] = useState(null);

  useEffect(() => {
    fetchPhcCenters();
  }, []);

  const fetchPhcCenters = async () => {
    try {
      setLoading(true);
      const aToken = localStorage.getItem('aToken');
      const res = await fetch(`${BACKENDURL}admin/phc-centers/all`, {
        headers: {
          'Authorization': `Bearer ${aToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCenters(data);
      }
    } catch (err) {
      showError("Failed to load Primary Health Centres");
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = centers.filter((c) => {
      if (!query) return true;
      return [
        c.id,
        c.phcCode,
        c.name,
        c.district,
        c.mandalBlock,
        c.village,
        c.contactNumber,
        c.email,
        c.operatingStatus
      ].join(' ').toLowerCase().includes(query);
    });

    return rows.sort((left, right) => {
      const leftValue = String(left[sortConfig.key] ?? '').toLowerCase();
      const rightValue = String(right[sortConfig.key] ?? '').toLowerCase();
      if (leftValue === rightValue) return 0;
      const compareValue = leftValue > rightValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? compareValue : -compareValue;
    });
  }, [centers, searchQuery, sortConfig.direction, sortConfig.key]);

  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCenters.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredCenters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleSort = (key) => {
    setSortConfig((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const onDeleteConfirmed = async () => {
    if (!confirmPhcId) return;
    try {
      const aToken = localStorage.getItem('aToken');
      const res = await fetch(`${BACKENDURL}admin/phc-centers/delete/${confirmPhcId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${aToken}`
        }
      });
      if (res.ok) {
        showSuccess("PHC Centre deleted successfully");
        setCenters(prev => prev.filter(c => c.id !== confirmPhcId));
      } else {
        showError("Failed to delete PHC Centre");
      }
    } catch (err) {
      showError("Error deleting PHC Centre");
    } finally {
      setConfirmPhcId(null);
    }
  };

  return (
    <div className="admin-patients-page">
      <header className="admin-patients-header">
        <h1>PHC Centres Management</h1>
        <p>Registered Primary Health Centres across districts with quick search, status filtering, and controlled deletion</p>
      </header>

      <section className="admin-patients-panel">
        <div className="admin-patients-filters">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Quick filter by ID, PHC name, district, village, or email"
          />
          <button type="button" onClick={() => showInfo("Select a PHC Centre to securely deactivate or delete from network")}>
            Delete Help
          </button>
        </div>

        <div className="admin-patients-table-wrap">
          <table className="admin-patients-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => toggleSort('id')}>ID</button></th>
                <th><button type="button" onClick={() => toggleSort('name')}>PHC Name</button></th>
                <th><button type="button" onClick={() => toggleSort('district')}>District / Mandal</button></th>
                <th><button type="button" onClick={() => toggleSort('village')}>Village / Town</button></th>
                <th><button type="button" onClick={() => toggleSort('contactNumber')}>Contact Phone</button></th>
                <th><button type="button" onClick={() => toggleSort('email')}>Login Email</button></th>
                <th><button type="button" onClick={() => toggleSort('operatingStatus')}>Status</button></th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="admin-patients-empty">Loading PHC Centres...</td>
                </tr>
              ) : pageRows.map((c) => (
                <tr key={c.id}>
                  <td><strong>#{c.id}</strong></td>
                  <td style={{ fontWeight: '600', color: '#0f3d61' }}>{c.name}</td>
                  <td>{c.district} {c.mandalBlock ? `(${c.mandalBlock})` : ''}</td>
                  <td>{c.village || '—'}</td>
                  <td>{c.contactNumber || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: c.operatingStatus === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                      color: c.operatingStatus === 'ACTIVE' ? '#15803d' : '#64748b'
                    }}>
                      {c.operatingStatus || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-patient-delete-btn"
                      onClick={() => setConfirmPhcId(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !pageRows.length && (
                <tr>
                  <td colSpan="8" className="admin-patients-empty">No PHC Centres found for current search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-patients-footer">
          <span>Page {currentPage} of {totalPages} ({filteredCenters.length} Total Facilities)</span>
          <div>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {confirmPhcId && (
        <div className="admin-patient-confirm-overlay" role="dialog" aria-modal="true">
          <div className="admin-patient-confirm-card">
            <p>Are you sure you want to delete this Primary Health Centre from the network?</p>
            <div>
              <button type="button" onClick={() => setConfirmPhcId(null)}>Cancel</button>
              <button type="button" onClick={onDeleteConfirmed}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhcCentersList;
