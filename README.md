# 🚛 FleetFlow: Enterprise Logistics & Fleet Management System

FleetFlow is a comprehensive, full-stack B2B internal tool designed to streamline logistics operations. It bridges the gap between daily dispatching and high-level financial oversight by providing real-time asset tracking, strict compliance validation, and dynamic operational analytics.

Built with a sleek, minimalistic dark-mode UI, FleetFlow ensures that Managers and Dispatchers have the exact tools they need, secured by Role-Based Access Control (RBAC).

## ✨ Key Features

* **🔒 Role-Based Access Control (RBAC):** Secure JWT authentication tailored for two distinct roles. **Managers** have full access to financial analytics and maintenance logs, while **Dispatchers** are streamlined into a focused dashboard for daily trip assignments.
* **🧠 Intelligent Dispatch Validation Engine:** The backend actively prevents logistical failures. Trips are blocked if the cargo weight exceeds the vehicle's maximum capacity, or if a driver's license is expired.
* **🔄 Automated State Management:** Assigning a trip automatically toggles vehicles and drivers to "On Trip". Logging maintenance switches vehicles to "In Shop", instantly hiding them from the dispatch pool to prevent errors.
* **📊 Real-time Operational Analytics:** A live dashboard calculating Fleet ROI, Utilization Rates, and Fuel Efficiency (km/L) using complex PostgreSQL aggregation queries.
* **📄 One-Click Reporting:** Instant generation of beautifully formatted PDF audit reports and CSV data exports directly from the browser.

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* React Router DOM (Navigation & Route Protection)
* Axios (API Communication)
* Recharts (Data Visualization)
* jsPDF & jsPDF-AutoTable (Client-side PDF Generation)

**Backend:**
* Node.js & Express.js (RESTful API)
* PostgreSQL (Relational Database)
* node-postgres (`pg`)
* Bcrypt (Password Hashing)
* JSON Web Tokens (JWT Authentication)

---

## 🚀 Getting Started (Local Development)

Follow these steps to run FleetFlow on your local machine.

### 1. Prerequisites
* [Node.js](https://nodejs.org/) installed
* [PostgreSQL](https://www.postgresql.org/) installed and running locally

### 2. Database Setup
Open your PostgreSQL terminal (psql) and create the database and tables:

```sql
CREATE DATABASE fleetflow;
\c fleetflow

CREATE TABLE users (
    id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, license_plate VARCHAR(50) UNIQUE NOT NULL, max_capacity_kg DECIMAL NOT NULL, odometer DECIMAL DEFAULT 0, acquisition_cost DECIMAL DEFAULT 50000, status VARCHAR(50) DEFAULT 'Available'
);

CREATE TABLE drivers (
    id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, license_expiry DATE NOT NULL, safety_score INT DEFAULT 100, status VARCHAR(50) DEFAULT 'On Duty'
);

CREATE TABLE trips (
    id SERIAL PRIMARY KEY, vehicle_id INT REFERENCES vehicles(id), driver_id INT REFERENCES drivers(id), cargo_weight DECIMAL NOT NULL, revenue DECIMAL DEFAULT 500, status VARCHAR(50) DEFAULT 'Dispatched', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY, vehicle_id INT REFERENCES vehicles(id), service_type VARCHAR(100), cost DECIMAL NOT NULL, service_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY, vehicle_id INT REFERENCES vehicles(id), liters DECIMAL NOT NULL, cost DECIMAL NOT NULL, log_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
### 3. Backend Setup
Navigate to the backend directory, install dependencies, and start the server:
cd backend
npm install
# Create a .env file (see Environment Variables section below)
npm run dev

### 4. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the Vite dev server:
cd frontend
npm install
npm run dev

The app will be running at http://localhost:5173.
