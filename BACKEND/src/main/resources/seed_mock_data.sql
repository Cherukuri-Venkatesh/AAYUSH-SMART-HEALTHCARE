-- =========================================================================
-- AYUSH SMART HEALTHCARE - Comprehensive Production-Grade Mock Data Seeder
-- Strictly complies with all validation rules, constraints, and schemas:
-- 1. All emails strictly match: ^[a-zA-Z0-9]+@gmail\.com$
-- 2. All phone numbers are exactly 10 digits
-- 3. All pincodes are exactly 6 digits
-- 4. All passwords are at least 6 characters ('123456')
-- 5. Foreign keys and unique constraints referentially intact
-- =========================================================================

USE healthcare_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. HOSPITALS (5 records)
DELETE FROM hospitals WHERE id > 0;
ALTER TABLE hospitals AUTO_INCREMENT = 1;

INSERT INTO hospitals (id, name, address, city, state, pincode, phone, email, description) VALUES
(1, 'AIIMS New Delhi', 'Sri Aurobindo Marg, Ansari Nagar', 'New Delhi', 'Delhi', '110029', '9112658850', 'aiimsdelhi@gmail.com', 'Premier national apex healthcare and medical research institute providing world-class tertiary care and AYUSH integrated clinics.'),
(2, 'Apollo Hospitals Jubilee Hills', 'Road No 72, Film Nagar, Jubilee Hills', 'Hyderabad', 'Telangana', '500033', '9140236077', 'apollojubilee@gmail.com', 'JCI-accredited quaternary care super-speciality hospital with robotic surgery and dedicated digital telemedicine suites.'),
(3, 'Manipal Hospital Old Airport Road', '98 HAL Old Airport Rd, Kodihalli', 'Bengaluru', 'Karnataka', '560017', '9180250244', 'manipalblr@gmail.com', 'Renowned multi-speciality tertiary medical center with advanced diagnostic labs and comprehensive outpatient consultation.'),
(4, 'Fortis Memorial Research Institute', 'Sector 44, Opposite HUDA City Centre', 'Gurugram', 'Haryana', '122002', '9112449622', 'fortisgurugram@gmail.com', 'Next-generation quaternary healthcare campus with integrated multi-organ centers of clinical excellence.'),
(5, 'Government General Hospital (GGH) Vijayawada', 'Hanumanpet, Near Railway Station', 'Vijayawada', 'Andhra Pradesh', '520003', '9186625744', 'gghvijayawada@gmail.com', 'Premier public tertiary care teaching hospital and regional clinical referral command hub for primary healthcare centers.');

-- 2. DOCTORS (5 records)
DELETE FROM doctors WHERE id > 0;
ALTER TABLE doctors AUTO_INCREMENT = 1;

INSERT INTO doctors (id, name, specialization, degree, experience, consulting_fees, hospital_id, hospital_name, email, whatsapp_number, address_line1, about_doctor, password, role) VALUES
(1, 'Dr. Rajesh Sharma', 'General physician', 'MBBS, MD (Internal Medicine)', '14 Years', 500, 1, 'AIIMS New Delhi', 'rajeshsharma@gmail.com', '9811223344', 'Ansari Nagar, New Delhi', 'Senior Consultant Physician specializing in preventive healthcare, infectious diseases, chronic lifestyle disease management and evidence-based AYUSH integrative care.', '123456', 'DOCTOR'),
(2, 'Dr. Ananya Iyer', 'Cardiologist', 'MBBS, MD, DM (Cardiology)', '11 Years', 800, 2, 'Apollo Hospitals Jubilee Hills', 'ananyaiyer@gmail.com', '9822334455', 'Jubilee Hills, Hyderabad', 'Interventional Cardiologist with extensive clinical expertise in coronary interventions, preventive cardiac screening, heart failure management and lipid disorders.', '123456', 'DOCTOR'),
(3, 'Dr. Suresh Varma', 'Dermatologist', 'MBBS, MD (Dermatology & Venereology)', '9 Years', 600, 3, 'Manipal Hospital Old Airport Road', 'sureshvarma@gmail.com', '9833445566', 'Indiranagar, Bengaluru', 'Consultant Dermatologist focusing on clinical dermatology, pediatric skin conditions, allergic dermatitis, auto-immune skin disorders and tele-dermatology consultations.', '123456', 'DOCTOR'),
(4, 'Dr. Priya Nair', 'Gynecologist', 'MBBS, MS (Obstetrics & Gynaecology)', '12 Years', 700, 4, 'Fortis Memorial Research Institute', 'priyanair@gmail.com', '9844556677', 'DLF Phase 4, Gurugram', 'Senior Obstetrician and Gynecologist specialized in high-risk maternal healthcare, prenatal screening, fertility counseling and minimally invasive gynecological care.', '123456', 'DOCTOR'),
(5, 'Dr. Arvind Kulkarni', 'Neurologist', 'MBBS, MD, DM (Neurology)', '16 Years', 900, 5, 'Government General Hospital (GGH) Vijayawada', 'arvindkulkarni@gmail.com', '9855667788', 'Governorpet, Vijayawada', 'Chief Neurologist with over 16 years of clinical excellence in acute stroke management, epilepsy management, neuromuscular disorders and tele-neurology triage.', '123456', 'DOCTOR');

-- 3. PATIENTS (5 records)
DELETE FROM patients WHERE id > 0;
ALTER TABLE patients AUTO_INCREMENT = 1;

INSERT INTO patients (id, name, email, phone, age, gender, address_line1, address_line2, password, role) VALUES
(1, 'venkatesh', 'venkatesh@gmail.com', '9494331988', 33, 'Male', 'Flat 402, Sri Sai Residency, Benz Circle', 'Vijayawada, Andhra Pradesh', '123456', 'PATIENT'),
(2, 'Sunita Rao', 'sunita@gmail.com', '9848022334', 28, 'Female', 'Plot 12, Road No 10, Banjara Hills', 'Hyderabad, Telangana', '123456', 'PATIENT'),
(3, 'Mohammad Arshad', 'arshad@gmail.com', '9876501234', 45, 'Male', '78 2nd Cross, Indira Nagar 1st Stage', 'Bengaluru, Karnataka', '123456', 'PATIENT'),
(4, 'Lakshmi Devi', 'lakshmidevi@gmail.com', '9988776655', 52, 'Female', 'Door No 14-8-22, MG Road', 'Vijayawada, Andhra Pradesh', '123456', 'PATIENT'),
(5, 'Amit Patel', 'amitpatel@gmail.com', '9123456780', 39, 'Male', 'A-34 Barakhamba Road, Connaught Place', 'New Delhi, Delhi', '123456', 'PATIENT');

-- 4. LOGIN_USERS (Synchronized unique alphanumeric@gmail.com auth credentials)
DELETE FROM login_users WHERE id > 0;

INSERT INTO login_users (id, role, email, name, password) VALUES
(1, 'ADMIN', 'aayushhealthcare2026@gmail.com', 'Aayush Admin', '123456'),
(2, 'ADMIN', 'admin@gmail.com', 'System Admin', '123456'),
(1, 'DOCTOR', 'rajeshsharma@gmail.com', 'Dr. Rajesh Sharma', '123456'),
(2, 'DOCTOR', 'ananyaiyer@gmail.com', 'Dr. Ananya Iyer', '123456'),
(3, 'DOCTOR', 'sureshvarma@gmail.com', 'Dr. Suresh Varma', '123456'),
(4, 'DOCTOR', 'priyanair@gmail.com', 'Dr. Priya Nair', '123456'),
(5, 'DOCTOR', 'arvindkulkarni@gmail.com', 'Dr. Arvind Kulkarni', '123456'),
(1, 'PATIENT', 'venkatesh@gmail.com', 'venkatesh', '123456'),
(2, 'PATIENT', 'sunita@gmail.com', 'Sunita Rao', '123456'),
(3, 'PATIENT', 'arshad@gmail.com', 'Mohammad Arshad', '123456'),
(4, 'PATIENT', 'lakshmidevi@gmail.com', 'Lakshmi Devi', '123456'),
(5, 'PATIENT', 'amitpatel@gmail.com', 'Amit Patel', '123456'),
(1, 'PHC_CENTER', 'phcbenzcircle@gmail.com', 'Urban PHC Benz Circle', '123456'),
(2, 'PHC_CENTER', 'phcrampa@gmail.com', 'Alluri Tribal PHC Rampachodavaram', '123456'),
(3, 'PHC_CENTER', 'phcchandragiri@gmail.com', 'Model PHC Chandragiri', '123456'),
(4, 'PHC_CENTER', 'phcdevikapuram@gmail.com', 'Primary Health Centre Devikapuram', '123456'),
(5, 'PHC_CENTER', 'phcchannapatna@gmail.com', 'Sub-District PHC Channapatna', '123456');

-- 5. PHC_CENTERS (5 records)
DELETE FROM phc_centers WHERE id > 0;
ALTER TABLE phc_centers AUTO_INCREMENT = 1;

INSERT INTO phc_centers (id, name, phc_code, email, contact_number, emergency_availability, latitude, longitude, address, village, mandal_block, district, state, pincode, operating_status, password, role) VALUES
(1, 'Urban PHC Benz Circle', 'PHC556677', 'phcbenzcircle@gmail.com', '9944883377', 1, 16.5062, 80.6480, 'Opposite Sub-Registrar Office, Benz Circle', 'Benz Circle Urban', 'Vijayawada Urban', 'NTR District', 'Andhra Pradesh', '520010', 'ACTIVE', '123456', 'PHC_CENTER'),
(2, 'Alluri Tribal PHC Rampachodavaram', 'PHCAP0102', 'phcrampa@gmail.com', '9440112233', 1, 17.4475, 81.7778, 'Agency Main Road, Tribal Health Zone', 'Rampachodavaram', 'Rampachodavaram', 'Alluri Sitharama Raju', 'Andhra Pradesh', '533288', 'ACTIVE', '123456', 'PHC_CENTER'),
(3, 'Model PHC Chandragiri', 'PHCAP0103', 'phcchandragiri@gmail.com', '9440223344', 1, 13.5855, 79.3142, 'Fort Road, Near Bus Stand', 'Chandragiri', 'Chandragiri', 'Tirupati', 'Andhra Pradesh', '517101', 'ACTIVE', '123456', 'PHC_CENTER'),
(4, 'Primary Health Centre Devikapuram', 'PHCTN0204', 'phcdevikapuram@gmail.com', '9440334455', 1, 12.4411, 79.2814, 'Sub-Centre Junction, Polur Highway', 'Devikapuram', 'Arani', 'Tiruvannamalai', 'Tamil Nadu', '606907', 'ACTIVE', '123456', 'PHC_CENTER'),
(5, 'Sub-District PHC Channapatna', 'PHCKA0305', 'phcchannapatna@gmail.com', '9440445566', 1, 12.6518, 77.2089, 'BM Road, Toy Town Health Cluster', 'Channapatna', 'Channapatna', 'Ramanagara', 'Karnataka', '562160', 'ACTIVE', '123456', 'PHC_CENTER');

-- 6. HOUSEHOLDS (5 records)
DELETE FROM households WHERE id > 0;
ALTER TABLE households AUTO_INCREMENT = 1;

INSERT INTO households (id, head_name, phone, address, village, mandal_block, district, total_members, pregnant_women, children_under_five, elderly_members, ration_card_type, water_source, sanitation_facility, registered_at, phc_center_id) VALUES
(1, 'Ramesh Kumar', '9876543210', 'House No 4-21, Tribal Settlement', 'Rampachodavaram', 'Rampachodavaram', 'Alluri Sitharama Raju', 5, 1, 2, 1, 'BPL_RICE', 'COMMUNITY_WELL', 'INDIVIDUAL_LATRINE', '2026-08-25 09:30:00.000000', 2),
(2, 'Venkata Subbaiah', '9848123456', 'Door No 2-88, Temple Street', 'Chandragiri', 'Chandragiri', 'Tirupati', 4, 0, 1, 2, 'WHITE_CARD', 'PIPED_WATER', 'INDIVIDUAL_LATRINE', '2026-08-26 11:15:00.000000', 3),
(3, 'Fatima Begum', '9876543211', 'House 56, Weaver Colony', 'Devikapuram', 'Arani', 'Tiruvannamalai', 6, 1, 3, 1, 'BPL_ANTYODAYA', 'PUBLIC_TAP', 'COMMUNITY_TOILET', '2026-08-27 10:00:00.000000', 4),
(4, 'Manjunath Gowda', '9988112233', 'Gram Panchayat Cross 7', 'Channapatna', 'Channapatna', 'Ramanagara', 5, 0, 0, 2, 'BPL_RICE', 'BOREWELL', 'INDIVIDUAL_LATRINE', '2026-08-28 14:20:00.000000', 5),
(5, 'Appala Swamy', '9701234567', 'Flat 102, Municipal Colony, Benz Circle', 'Benz Circle Urban', 'Vijayawada Urban', 'NTR District', 7, 1, 2, 1, 'BPL_RICE', 'MUNICIPAL_SUPPLY', 'INDIVIDUAL_LATRINE', '2026-08-29 16:45:00.000000', 1);

-- 7. HOUSEHOLD_VISITS (5 records)
DELETE FROM household_visits WHERE id > 0;
ALTER TABLE household_visits AUTO_INCREMENT = 1;

INSERT INTO household_visits (id, household_id, worker_id, worker_name, worker_role, visit_purpose, findings_summary, referral_created, referral_reason, village, visit_date) VALUES
(1, 1, 101, 'Kavitha Devi', 'ASHA_WORKER', 'Maternal Health & ANC Follow-up', 'Second trimester antenatal checkup. Hemoglobin estimated at 9.4 g/dL. Prescribed iron-folic acid supplement compliance verified.', 1, 'Second trimester ultrasound and nutritional counsel at PHC', 'Rampachodavaram', '2026-08-28 10:30:00.000000'),
(2, 2, 102, 'Shantha Kumari', 'ANM_WORKER', 'NCD Hypertension Screening', 'Elderly member blood pressure 148/92 mmHg. Routine medication refill needed. Advised dietary sodium restriction.', 1, 'Physician evaluation for anti-hypertensive dosage adjustment', 'Chandragiri', '2026-08-28 11:45:00.000000'),
(3, 3, 103, 'Selvi Murugan', 'ASHA_WORKER', 'Childhood Immunization & Nutrition', 'Recorded Pentavalent-3 and Rotavirus vaccine follow-up. Infant growth parameters tracking normal on WHO percentile chart.', 0, NULL, 'Devikapuram', '2026-08-29 09:15:00.000000'),
(4, 4, 104, 'Girija Gowda', 'ANM_WORKER', 'Geriatric Chronic Care Visit', 'Both elderly residents checked for fasting blood glucose (132 mg/dL & 144 mg/dL). Vitals stable.', 0, NULL, 'Channapatna', '2026-08-29 14:00:00.000000'),
(5, 5, 105, 'Padma Vathi', 'PHC_STAFF', 'Postnatal Care & Vitals Triage', 'Mother and neonate vitals recorded. Neonatal reflex and breastfeeding attachment satisfactory.', 0, NULL, 'Benz Circle Urban', '2026-08-29 17:10:00.000000');

-- 8. COMMUNITY_SURVEYS (5 records)
DELETE FROM community_surveys WHERE id > 0;
ALTER TABLE community_surveys AUTO_INCREMENT = 1;

INSERT INTO community_surveys (id, household_id, worker_id, worker_role, total_surveyed_persons, has_pregnant_woman, is_anc_up_to_date, has_hypertension_suspect, has_diabetes_suspect, has_communicable_symptoms, has_immunization_pending, referral_recommended, worker_remarks, village, mandal_block, district, surveyed_at) VALUES
(1, 1, 101, 'ASHA_WORKER', 5, 1, 1, 0, 0, 0, 0, 1, 'Pregnant mother in good overall health; recommended tertiary institutional delivery referral.', 'Rampachodavaram', 'Rampachodavaram', 'Alluri Sitharama Raju', '2026-08-28 10:45:00.000000'),
(2, 2, 102, 'ANM_WORKER', 4, 0, 0, 1, 1, 0, 0, 1, 'Senior citizen flagged for elevated systolic BP (150 mmHg) and borderline fasting glucose.', 'Chandragiri', 'Chandragiri', 'Tirupati', '2026-08-28 12:00:00.000000'),
(3, 3, 103, 'ASHA_WORKER', 6, 1, 1, 0, 0, 0, 0, 0, 'All children up-to-date with national immunization schedule. Sanitary hygiene verified.', 'Devikapuram', 'Arani', 'Tiruvannamalai', '2026-08-29 09:40:00.000000'),
(4, 4, 104, 'ANM_WORKER', 5, 0, 0, 1, 0, 0, 0, 0, 'Routine geriatric survey completed. Chronic arthritis noted in one elder.', 'Channapatna', 'Channapatna', 'Ramanagara', '2026-08-29 14:30:00.000000'),
(5, 5, 105, 'PHC_STAFF', 7, 1, 1, 0, 0, 0, 0, 0, 'Urban household survey completed with complete vital documentation.', 'Benz Circle Urban', 'Vijayawada Urban', 'NTR District', '2026-08-29 17:30:00.000000');

-- 9. PATIENT_ASSISTANCE_RECORDS (5 records)
DELETE FROM patient_assistance_records WHERE id > 0;
ALTER TABLE patient_assistance_records AUTO_INCREMENT = 1;

INSERT INTO patient_assistance_records (id, patient_id, phc_center_id, worker_id, worker_name, worker_role, assistance_type, notes, assisted_at) VALUES
(1, 1, 1, 101, 'Kavitha Devi', 'ASHA_WORKER', 'VITALS_TRIAGE', 'Recorded baseline vitals: BP 120/80 mmHg, SpO2 99%, Pulse 74 bpm, Weight 72 kg.', '2026-08-28 09:00:00.000000'),
(2, 2, 2, 102, 'Shantha Kumari', 'ANM_WORKER', 'TELE_CONSULTATION_SETUP', 'Assisted patient in connecting to live WebRTC video consultation room with Dr. Ananya Iyer.', '2026-08-28 14:30:00.000000'),
(3, 3, 3, 103, 'Selvi Murugan', 'ASHA_WORKER', 'LAB_SAMPLE_COLLECTION', 'Assisted in venous blood collection for HbA1c and Complete Blood Count (CBC) analysis.', '2026-08-29 10:15:00.000000'),
(4, 4, 4, 104, 'Girija Gowda', 'ANM_WORKER', 'PRESCRIPTION_DISPENSING', 'Dispensed Iron-Folic Acid tablets and calcium supplements with dosage counseling.', '2026-08-29 11:45:00.000000'),
(5, 5, 5, 105, 'Padma Vathi', 'PHC_STAFF', 'SPECIALIST_REFERRAL', 'Generated digital referral slip to AIIMS New Delhi for tertiary neurological review.', '2026-08-29 16:00:00.000000');

-- 10. DOCTOR_SCHEDULE (5 records for current & upcoming days)
DELETE FROM doctor_schedule WHERE id > 0;
ALTER TABLE doctor_schedule AUTO_INCREMENT = 1;

INSERT INTO doctor_schedule (id, doctor_id, schedule_date, start_time, end_time, slot_duration, consultation_mode, is_active, uploaded_at) VALUES
(1, 1, CURRENT_DATE(), '09:00:00', '13:00:00', 30, 'BOTH', 1, NOW()),
(2, 2, CURRENT_DATE(), '10:00:00', '15:00:00', 30, 'ONLINE', 1, NOW()),
(3, 3, CURRENT_DATE() + INTERVAL 1 DAY, '09:30:00', '14:30:00', 30, 'PHYSICAL', 1, NOW()),
(4, 4, CURRENT_DATE() + INTERVAL 1 DAY, '11:00:00', '16:00:00', 30, 'ONLINE', 1, NOW()),
(5, 5, CURRENT_DATE() + INTERVAL 2 DAY, '09:00:00', '13:00:00', 30, 'BOTH', 1, NOW());

-- 11. APPOINTMENTS (5 records with physical & WebRTC video consultation)
DELETE FROM appointments WHERE id > 0;
ALTER TABLE appointments AUTO_INCREMENT = 1;

INSERT INTO appointments (id, patient_id, doctor_id, appointment_type, appointment_date, appointment_time, consulting_fees, issue, age, weight, payment_type, status, room_id, consultation_duration, consultation_started_at, consultation_ended_at, reschedule_count, created_at, updated_at) VALUES
(1, 1, 1, 'ONLINE', CURRENT_DATE(), '09:30:00', 500, 'High fever for 3 days accompanied by severe body aches, chills, fatigue and mild throat irritation.', 33, 72.5, 'ONLINE', 'IN_PROGRESS', 'ROOM-AYUSH-10001', 480, NOW() - INTERVAL 8 MINUTE, NULL, 0, NOW() - INTERVAL 1 HOUR, NOW()),
(2, 2, 2, 'ONLINE', CURRENT_DATE() - INTERVAL 1 DAY, '11:00:00', 800, 'Recurrent exertional palpitations, lightheadedness and mild chest discomfort following moderate cardio.', 28, 58.0, 'ONLINE', 'COMPLETED', 'ROOM-AYUSH-10002', 960, NOW() - INTERVAL 25 HOUR, NOW() - INTERVAL 24 HOUR, 0, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),
(3, 3, 3, 'PHYSICAL', CURRENT_DATE() + INTERVAL 1 DAY, '10:00:00', 600, 'Chronic itchy red erythematous plaques on bilateral forearms and elbows with scaling.', 45, 81.0, 'CASH', 'BOOKED', NULL, NULL, NULL, NULL, 0, NOW() - INTERVAL 5 HOUR, NOW()),
(4, 4, 4, 'ONLINE', CURRENT_DATE() + INTERVAL 1 DAY, '11:30:00', 700, 'Second trimester antenatal follow-up, anomaly scan review and gestational nutrition guidance.', 52, 65.0, 'ONLINE', 'BOOKED', 'ROOM-AYUSH-10004', NULL, NULL, NULL, 0, NOW() - INTERVAL 4 HOUR, NOW()),
(5, 5, 5, 'PHYSICAL', CURRENT_DATE() - INTERVAL 2 DAY, '09:00:00', 900, 'Throbbing unilateral migraine episodes accompanied by photophobia, nausea and visual scintillating scotoma.', 39, 76.0, 'ONLINE', 'COMPLETED', NULL, 1200, NOW() - INTERVAL 49 HOUR, NOW() - INTERVAL 48 HOUR, 0, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY);

-- 12. CONSULTATION_ROOMS (5 records)
DELETE FROM consultation_rooms WHERE id > 0;
ALTER TABLE consultation_rooms AUTO_INCREMENT = 1;

INSERT INTO consultation_rooms (id, room_id, appointment_id, doctor_id, patient_id, status, doctor_joined, patient_joined, doctor_joined_at, patient_joined_at, started_at, ended_at, duration_seconds, created_at, updated_at) VALUES
(1, 'ROOM-AYUSH-10001', 1, 1, 1, 'IN_PROGRESS', 1, 1, NOW() - INTERVAL 8 MINUTE, NOW() - INTERVAL 7 MINUTE, NOW() - INTERVAL 7 MINUTE, NULL, 480, NOW() - INTERVAL 1 HOUR, NOW()),
(2, 'ROOM-AYUSH-10002', 2, 2, 2, 'COMPLETED', 1, 1, NOW() - INTERVAL 25 HOUR, NOW() - INTERVAL 25 HOUR, NOW() - INTERVAL 25 HOUR, NOW() - INTERVAL 24 HOUR, 960, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY),
(3, 'ROOM-AYUSH-10004', 4, 4, 4, 'CREATED', 0, 0, NULL, NULL, NULL, NULL, 0, NOW() - INTERVAL 4 HOUR, NOW()),
(4, 'ROOM-AYUSH-10005', NULL, 5, 5, 'COMPLETED', 1, 1, NOW() - INTERVAL 49 HOUR, NOW() - INTERVAL 49 HOUR, NOW() - INTERVAL 49 HOUR, NOW() - INTERVAL 48 HOUR, 1200, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY),
(5, 'ROOM-AYUSH-DEMO-001', NULL, 1, 3, 'CREATED', 0, 0, NULL, NULL, NULL, NULL, 0, NOW(), NOW());

-- 13. PRESCRIPTIONS (5 records)
DELETE FROM prescriptions WHERE id > 0;
ALTER TABLE prescriptions AUTO_INCREMENT = 1;

INSERT INTO prescriptions (id, appointment_id, doctor_id, patient_id, file_path, uploaded_at) VALUES
(1, 1, 1, 1, '/uploads/prescriptions/rx_appt1_paracetamol_azithral.pdf', NOW() - INTERVAL 5 MINUTE),
(2, 2, 2, 2, '/uploads/prescriptions/rx_appt2_metoprolol_atorvastatin.pdf', NOW() - INTERVAL 24 HOUR),
(3, 5, 5, 5, '/uploads/prescriptions/rx_appt5_sumatriptan_propranolol.pdf', NOW() - INTERVAL 48 HOUR),
(4, NULL, 3, 3, '/uploads/prescriptions/rx_general_clobetasol_cetirizine.pdf', NOW() - INTERVAL 3 DAY),
(5, NULL, 4, 4, '/uploads/prescriptions/rx_maternal_folicacid_calcium_d3.pdf', NOW() - INTERVAL 4 DAY);

-- 14. LAB_REPORTS (5 records)
DELETE FROM lab_reports WHERE id > 0;
ALTER TABLE lab_reports AUTO_INCREMENT = 1;

INSERT INTO lab_reports (id, appointment_id, doctor_id, patient_id, report_path, uploaded_at) VALUES
(1, 1, 1, 1, '/uploads/labreports/lab_appt1_complete_blood_count_dengue_ns1.pdf', NOW() - INTERVAL 10 MINUTE),
(2, 2, 2, 2, '/uploads/labreports/lab_appt2_lipid_profile_hs_crp_ecg.pdf', NOW() - INTERVAL 24 HOUR),
(3, 5, 5, 5, '/uploads/labreports/lab_appt5_brain_mri_eeg_report.pdf', NOW() - INTERVAL 48 HOUR),
(4, NULL, 3, 3, '/uploads/labreports/lab_general_skin_biopsy_ige_serum.pdf', NOW() - INTERVAL 3 DAY),
(5, NULL, 4, 4, '/uploads/labreports/lab_prenatal_double_marker_ultrasound.pdf', NOW() - INTERVAL 4 DAY);

-- 15. NOTIFICATIONS (5 records)
DELETE FROM notifications WHERE id > 0;
ALTER TABLE notifications AUTO_INCREMENT = 1;

INSERT INTO notifications (id, recipient_id, recipient_type, title, message, type, room_id, appointment_id, is_read, created_at) VALUES
(1, 1, 'PATIENT', 'Online Video Consultation Started', 'Dr. Rajesh Sharma has entered your video consultation room (ROOM-AYUSH-10001). Click to join now.', 'CONSULTATION_READY', 'ROOM-AYUSH-10001', 1, 0, NOW() - INTERVAL 7 MINUTE),
(2, 1, 'DOCTOR', 'Patient Waiting in Consultation Room', 'Patient venkatesh is waiting in video consultation room ROOM-AYUSH-10001 for fever evaluation.', 'PATIENT_WAITING', 'ROOM-AYUSH-10001', 1, 0, NOW() - INTERVAL 8 MINUTE),
(3, 2, 'PATIENT', 'Digital Prescription Uploaded', 'Dr. Ananya Iyer has finalized and uploaded your official digital prescription for appointment #2.', 'PRESCRIPTION_READY', NULL, 2, 1, NOW() - INTERVAL 24 HOUR),
(4, 4, 'PATIENT', 'Upcoming Video Consultation Tomorrow', 'Your prenatal online video consultation with Dr. Priya Nair is confirmed for tomorrow at 11:30 AM.', 'APPOINTMENT_REMINDER', 'ROOM-AYUSH-10004', 4, 0, NOW() - INTERVAL 4 HOUR),
(5, 1, 'PATIENT', 'Lab Investigation Report Available', 'Your Complete Blood Count (CBC) and Dengue Serology results are uploaded and ready to download.', 'LAB_REPORT_READY', NULL, 1, 0, NOW() - INTERVAL 10 MINUTE);

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- End of Mock Data Script
-- =========================================================================
