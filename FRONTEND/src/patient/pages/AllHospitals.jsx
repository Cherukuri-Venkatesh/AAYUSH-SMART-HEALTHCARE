import React, { useEffect, useMemo, useState } from 'react'
import { fetchHospitalsForPatient } from '../utils/hospitalApi'
import { showError, MESSAGES } from '../utils/toastService'
import { useLanguage } from '../../context/LanguageContext'
import '../styles/hospitals.css'

const AllHospitals = () => {
  const { t } = useLanguage()
  const [hospitals, setHospitals] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('')

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await fetchHospitalsForPatient()
        setHospitals(data)
      } catch (error) {
        setHospitals([])
        showError(MESSAGES.genericError)
      }
    }

    loadHospitals()
  }, [])

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const matchesSearch =
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesState = filterState === '' || hospital.state === filterState

      return matchesSearch && matchesState
    })
  }, [hospitals, searchTerm, filterState])

  const uniqueStates = [...new Set(hospitals.map((h) => h.state).filter(Boolean))].sort()

  return (
    <div className="py-4">
      {/* Header */}
      <div className="hospitals-page-header">
        <div className="container">
          <h1>{t('Our Hospital Network')}</h1>
          <p>{t('Find trusted healthcare facilities across the UK and beyond')}</p>
        </div>
      </div>

      <div className="container hospitals-grid-container">
        {/* Filter Section */}
        <div className="hospitals-filter-section">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder={t('Search by hospital name, city or address...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <select
                className="form-select"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              >
                <option value="">{t('All States')}</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hospitals Grid */}
        {filteredHospitals.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <h5>{t('No hospitals found')}</h5>
            <p className="mb-0">{t('Try adjusting your search or filter criteria')}</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredHospitals.map((hospital) => (
              <div className="col-12 col-md-6 col-lg-6 col-xl-3" key={hospital.id}>
                <div className="hospital-card card-premium card-hover h-100 hospital-card-enhanced">
                  <div className="card-body p-4">
                    <div className="hospital-header mb-3">
                      <h3 className="h6 fw-bold mb-2" style={{ color: '#2d3dbf' }}>
                        {hospital.name}
                      </h3>
                      <span className="badge bg-light text-primary">
                        #{hospital.id}
                      </span>
                    </div>

                    <div className="hospital-info">
                      <div className="info-item mb-2">
                        <span className="text-secondary">{t('Location')}</span>
                        <p className="mb-0 fw-semibold text-dark">{hospital.city}, {hospital.state}</p>
                      </div>

                      <div className="info-item mb-2">
                        <span className="text-secondary">{t('Contact')}</span>
                        <p className="mb-0 fw-semibold text-dark">{hospital.phone || hospital.email || 'N/A'}</p>
                      </div>

                      <div className="info-item">
                        <span className="text-secondary">{t('Address')}</span>
                        <p className="mb-0 fw-semibold text-dark">{hospital.address || 'N/A'}</p>
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-primary w-100 mt-3"
                    >
                      {t('Learn More')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllHospitals
