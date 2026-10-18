import React, { useState } from 'react';
import { ADMIN_MESSAGES, showError, showSuccess } from '../../utils/adminToast';
import { BACKENDURL } from '../../../lib';
import './AddDoctor.css';

const initialFormState = {
  name: '',
  email: '',
  password: 'phc123',
  contactNumber: '',
  village: '',
  mandalBlock: '',
  district: '',
  state: 'Andhra Pradesh',
  pincode: '',
  operatingStatus: 'ACTIVE',
  emergencyAvailability: true,
  address: ''
};

const AddPhcCenter = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.district.trim() || !formData.state.trim() || !formData.contactNumber.trim() || !formData.pincode.trim()) {
      showError(ADMIN_MESSAGES.allFieldsAreRequired);
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      showError('Please enter a valid email address');
      return false;
    }

    const phoneDigits = formData.contactNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      showError('Contact phone must have at least 10 digits');
      return false;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode.trim())) {
      showError('Pincode must be exactly 6 digits');
      return false;
    }

    return true;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const aToken = localStorage.getItem('aToken');
      const res = await fetch(`${BACKENDURL}admin/phc-centers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aToken}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to add PHC Centre');
      }

      showSuccess('Primary Health Centre Registered Successfully!');
      setFormData(initialFormState);
    } catch (err) {
      showError(err.message || 'Failed to add PHC Centre');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequiredLabel = (label, id) => (
    <label htmlFor={id} className="doctor-form-label">
      {label} <span>*</span>
    </label>
  );

  return (
    <form onSubmit={onSubmitHandler} className="add-doctor-form">
      <h2 className="add-doctor-title">🏥 Add Primary Health Centre (PHC)</h2>

      <div className="add-doctor-grid">
        <div className="doctor-form-fields">
          {/* PHC Facility Name */}
          <div className="doctor-form-group">
            {renderRequiredLabel('PHC Name', 'phc-name')}
            <input
              id="phc-name"
              name="name"
              type="text"
              className="doctor-form-input"
              placeholder="e.g. Rampachodavaram Primary Health Centre"
              value={formData.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>

          {/* Login Email */}
          <div className="doctor-form-group">
            {renderRequiredLabel('Login Email', 'phc-email')}
            <input
              id="phc-email"
              name="email"
              type="email"
              className="doctor-form-input"
              placeholder="phc.facility@gmail.com"
              value={formData.email}
              onChange={(e) => setField('email', e.target.value)}
              required
            />
          </div>

          {/* Contact Phone */}
          <div className="doctor-form-group">
            {renderRequiredLabel('Contact Phone', 'phc-phone')}
            <input
              id="phc-phone"
              name="contactNumber"
              type="tel"
              className="doctor-form-input"
              placeholder="10-digit emergency contact phone"
              value={formData.contactNumber}
              onChange={(e) => setField('contactNumber', e.target.value)}
              required
            />
          </div>

          {/* Initial Password */}
          <div className="doctor-form-group">
            {renderRequiredLabel('Login Password', 'phc-password')}
            <input
              id="phc-password"
              name="password"
              type="text"
              className="doctor-form-input"
              placeholder="Initial staff login password"
              value={formData.password}
              onChange={(e) => setField('password', e.target.value)}
              required
            />
          </div>

          {/* Village / Town */}
          <div className="doctor-form-group">
            <label className="doctor-form-label">Village / Town</label>
            <input
              name="village"
              type="text"
              className="doctor-form-input"
              placeholder="e.g. Maredumilli"
              value={formData.village}
              onChange={(e) => setField('village', e.target.value)}
            />
          </div>

          {/* Mandal / Block */}
          <div className="doctor-form-group">
            <label className="doctor-form-label">Mandal / Block</label>
            <input
              name="mandalBlock"
              type="text"
              className="doctor-form-input"
              placeholder="e.g. Rampachodavaram"
              value={formData.mandalBlock}
              onChange={(e) => setField('mandalBlock', e.target.value)}
            />
          </div>

          {/* District */}
          <div className="doctor-form-group">
            {renderRequiredLabel('District', 'phc-district')}
            <input
              id="phc-district"
              name="district"
              type="text"
              className="doctor-form-input"
              placeholder="e.g. Alluri Sitharama Raju"
              value={formData.district}
              onChange={(e) => setField('district', e.target.value)}
              required
            />
          </div>

          {/* State */}
          <div className="doctor-form-group">
            {renderRequiredLabel('State', 'phc-state')}
            <input
              id="phc-state"
              name="state"
              type="text"
              className="doctor-form-input"
              placeholder="e.g. Andhra Pradesh"
              value={formData.state}
              onChange={(e) => setField('state', e.target.value)}
              required
            />
          </div>

          {/* Pincode */}
          <div className="doctor-form-group">
            {renderRequiredLabel('Pincode', 'phc-pincode')}
            <input
              id="phc-pincode"
              name="pincode"
              type="text"
              className="doctor-form-input"
              placeholder="6-digit postal pincode"
              value={formData.pincode}
              onChange={(e) => setField('pincode', e.target.value)}
              pattern="^\d{6}$"
              required
            />
          </div>

          {/* Operating Status */}
          <div className="doctor-form-group">
            <label className="doctor-form-label">Facility Status</label>
            <select
              name="operatingStatus"
              className="doctor-form-select"
              value={formData.operatingStatus}
              onChange={(e) => setField('operatingStatus', e.target.value)}
            >
              <option value="ACTIVE">ACTIVE (Fully Operational)</option>
              <option value="INACTIVE">INACTIVE (Under Maintenance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complete Address */}
      <div className="doctor-about-section">
        <label className="doctor-form-label">Complete Facility Address & Landmark</label>
        <textarea
          name="address"
          rows={3}
          className="doctor-form-textarea"
          placeholder="Main Road, Near Bus Stand, Rampachodavaram"
          value={formData.address}
          onChange={(e) => setField('address', e.target.value)}
        />
      </div>

      <div className="add-doctor-button-section">
        <button type="submit" className="add-doctor-submit-btn" disabled={submitting}>
          {submitting ? 'Registering PHC...' : 'Add PHC Center'}
        </button>
      </div>
    </form>
  );
};

export default AddPhcCenter;
