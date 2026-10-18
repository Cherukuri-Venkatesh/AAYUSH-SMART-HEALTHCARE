import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { showSuccess, showError, MESSAGES } from '../utils/toastService'
import { patientApiDownload, patientApiGet } from '../utils/api'
import { useLanguage } from '../../context/LanguageContext'

const MyPrescriptions = () => {
    const { token } = useContext(AppContext)
    const { t } = useLanguage()
    const [prescriptions, setPrescriptions] = useState([])

    useEffect(() => {
        const loadPrescriptions = async () => {
            const response = await patientApiGet('patient/prescriptions');
            if (!response || !response.success) {
                showError(response?.error || MESSAGES.genericError)
                setPrescriptions([])
                return
            }

            const normalized = (response.data || []).map((item) => ({
                _id: item.id,
                doctorName: item.doctorName || item.doctorId,
                appointmentId: item.appointmentId,
                uploadedDate: item.uploadedAt || '-',
            }))

            setPrescriptions(normalized)
        }

        if (token) loadPrescriptions()
    }, [token])

    const downloadPrescription = async (prescription) => {
        try {
            const blob = await patientApiDownload(`patient/download-prescription/${prescription._id}`)
            if (!blob) return

            const url = window.URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `prescription-${prescription._id}.pdf`
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            window.URL.revokeObjectURL(url)
            showSuccess(MESSAGES.prescriptionDownloaded)
        } catch (error) {
            showError(MESSAGES.genericError)
        }
    }

    return (
        <div className="py-5">
            <h2 className="h4 fw-bold mb-4">{t('Prescriptions')}</h2>

            {prescriptions.length === 0 ? (
                <div className="alert alert-info text-center" role="alert">
                    <p className="mb-0">{t('No prescriptions found')}</p>
                </div>
            ) : (
                <div>
                    {/* Mobile View */}
                    <div className="d-md-none">
                        {prescriptions.map((presc) => (
                            <div key={presc._id} className="card mb-3 shadow-sm">
                                <div className="card-body">
                                    <h6 className="card-title fw-bold mb-2">{presc.medicine}</h6>
                                    <small className="text-muted d-block">{t('Doctor')}: {presc.doctorName}</small>
                                    <small className="text-muted d-block">{t('Appointment ID')}: {presc.appointmentId}</small>
                                    <small className="text-muted d-block mb-2">{t('Date')}: {presc.uploadedDate}</small>
                                    {presc.notes && <p className="text-muted mb-2"><small>{presc.notes}</small></p>}
                                    <button
                                        onClick={() => downloadPrescription(presc)}
                                        className="btn btn-sm btn-primary w-100"
                                    >
                                        <i className="bi bi-download"></i> {t('Download')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="table-responsive d-none d-md-block">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>{t('Doctor')}</th>
                                    <th>{t('Appointment ID')}</th>
                                    <th>{t('Date')}</th>
                                    <th>{t('Action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prescriptions.map((presc) => (
                                    <tr key={presc._id}>
                                        <td>{presc.doctorName}</td>
                                        <td>{presc.appointmentId}</td>
                                        <td>{presc.uploadedDate}</td>
                                        <td>
                                            <button
                                                onClick={() => downloadPrescription(presc)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                <i className="bi bi-download"></i> {t('Download')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyPrescriptions
