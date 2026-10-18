# 🏥 Aayush Smart Healthcare

> **Unified Electronic Triage, Grassroots Community Health & Telemedicine Platform**

---

## 🌟 Overview

**Aayush Smart Healthcare** is an integrated digital healthcare ecosystem designed to bridge the gap between primary healthcare centres (PHCs), sub-centres, tertiary hospitals, certified medical practitioners, and patients across India.

The platform provides a 4-tier role-based portal:
1. **🧑‍⚕️ Patient Portal (`/`):** Specialist doctor discovery, smart slot booking, encrypted medical history, lab reports, digital prescriptions, real-time notifications, WebRTC tele-consultations, and Gemini-powered clinical triage.
2. **🩺 Doctor Portal (`/doctor-dashboard`):** Real-time appointment queue management, digital consultations, schedule uploads, dynamic slot configuration, patient prescription generation, and diagnostic lab report issuance.
3. **🛡️ Admin Command Hub (`/admin-dashboard`):** Hospital directory management, verified doctor credentialing, system-wide analytics, and district-level operational oversight.
4. **🏥 PHC Centers Platform (`/phc-centers/dashboard`):** Grassroots village household surveillance, maternal ANC tracking, under-5 child immunization records, and high-risk tele-referral escalation to district medical specialists.

---

## 🏗️ Repository Structure

```text
AAYUSH-SMART-HEALTHCARE/
├── BACKEND/                    # Spring Boot 4 / Java 21 Virtual Threads Platform
│   ├── src/main/java/          # Controllers, Entities, Repositories, DTOs, Services
│   ├── src/main/resources/     # application.properties, seed_mock_data.sql
│   ├── pom.xml                 # Maven configuration and dependencies
│   └── mvnw, mvnw.cmd          # Maven wrapper executables
├── FRONTEND/                   # React 18 + Vite Modern Web Application
│   ├── src/
│   │   ├── admin/              # Doctor, Admin, and PHC management pages & components
│   │   ├── patient/            # Patient workflows, appointments, tele-consultation
│   │   ├── components/         # Shared widgets (AiChatWidget, LanguageSelector, Notifications)
│   │   ├── context/            # Language, Auth, and App state providers
│   │   └── utils/              # Timezone-safe date utils, translation dictionaries
│   ├── package.json            # Node.js dependencies & scripts
│   └── vite.config.js          # Vite build pipeline
├── images/                     # System architecture diagrams and technical documentation
├── .env.example                # Environment variables template (No secrets committed)
├── .gitignore                  # Production Git ignore rules
└── README.md                   # Project documentation
```

---

## 🛠️ Technology Stack

### **Backend**
* **Framework:** Spring Boot 4.0.2 / Java 21 (Project Loom Virtual Threads)
* **Database:** MySQL 8+ with Hibernate JPA
* **Security:** JWT (JSON Web Tokens), BCrypt encryption, Spring Security 6
* **Real-Time Communication:** WebSockets & WebRTC Signaling
* **AI Engine:** Google Gemini AI Studio API
* **Mailing:** Spring Mail via TLS/SMTP

### **Frontend**
* **Framework:** React 18 (SPA)
* **Build Tool:** Vite 5
* **Routing:** React Router DOM v6
* **Multilingual Engine:** 8 Indian languages (Telugu, Hindi, Kannada, Tamil, Marathi, Bengali, Gujarati, English)
* **Styling:** Vanilla CSS & Bootstrap 5

---

## 🚀 Getting Started

### 1. Prerequisites
* **Java:** JDK 21+
* **Node.js:** v18+ & npm
* **Database:** MySQL 8+

### 2. Environment Setup
Copy the template configuration file to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your local database credentials and API keys:
```properties
DB_URL=jdbc:mysql://localhost:3306/healthcare_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_password
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Initialization
Create the database and optionally populate mock records:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS healthcare_db;"
mysql -u root -p healthcare_db < BACKEND/src/main/resources/seed_mock_data.sql
```

### 4. Running the Backend
```bash
cd BACKEND
./mvnw spring-boot:run
```
*Backend runs on:* `http://localhost:8080`

### 5. Running the Frontend
```bash
cd FRONTEND
npm install
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🔒 Security Best Practices
* **No Secrets Committed:** Passwords, API keys, and sensitive tokens are decoupled using `.env` and excluded via `.gitignore`.
* **RBAC Enforcement:** Strict role-based URL matchers ensure patients, doctors, admins, and PHC operators cannot access unauthorized endpoints.
* **Audit Triggers:** Automated MySQL triggers safeguard user deletion cascades and maintain referential integrity.

---

## 📜 License
All rights reserved.