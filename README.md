# Machines-Diagnosis

A full-stack prototype for monitoring industrial machine condition data. The application manages machine records, accepts manually entered sensor readings, calculates a heuristic health score, and presents machine status, reading history, trends, and threshold-based alerts.

> **Current scope:** This repository implements machine management and manual condition-data monitoring. It does **not** currently implement trained machine-learning failure prediction, live IoT sensor ingestion, maintenance-request management, technician assignment, or notification delivery.

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Database configuration](#database-configuration)
- [Run the backend](#run-the-backend)
- [Run the frontend](#run-the-frontend)
- [API endpoints](#api-endpoints)
- [Health-score calculation](#health-score-calculation)
- [Design-pattern status](#design-pattern-status)
- [Testing](#testing)
- [Security](#security)
- [Limitations and future work](#limitations-and-future-work)

## Features

### Implemented in the current source

- Create, view, update, and delete machine records.
- Retrieve an individual machine by ID.
- Manually submit temperature, vibration, and operating-hour readings for a machine.
- Retrieve saved readings for a machine.
- Associate readings with machine and sensor records.
- Find or create a default `Temperature` sensor when the reading service does not find one for the machine.
- Calculate and store a heuristic health score for each submitted reading.
- Display machine information, health summaries, reading history, trend charts, and rule-based alerts in the frontend.

### Not implemented in the current source

- Live sensor/IoT connectivity or automatic data ingestion.
- A trained AI/ML model, validated failure prediction, or remaining-useful-life estimation.
- Maintenance request creation, tracking, or closure.
- Technician records, assignment, or work-order management.
- External email, SMS, push, or device notification delivery.

Threshold-based indicators are not validated failure probabilities or live device alarms.

## Technology stack

| Area | Technology |
|---|---|
| Frontend | React 19, React DOM, JavaScript, Vite 8, CSS |
| Backend | Java 21, Spring Boot 4.1.2, Spring MVC/Web |
| Persistence | Spring Data JPA, Hibernate |
| Database | MySQL |
| Validation | Spring Boot validation starter |
| Build tools | Maven (backend), npm (frontend) |

Versions reflect the dependency files inspected when this README was prepared.

## Architecture

The backend follows a layered structure:

1. **Controller layer** – exposes REST endpoints and receives HTTP requests.
2. **Service layer** – coordinates machine and sensor-reading operations and calculates the reading health score.
3. **Repository layer** – uses Spring Data JPA for database access.
4. **Entity layer** – maps `Machine`, `Sensor`, and `SensorReading` to persistent data.

The React/Vite frontend communicates with the Spring Boot backend over HTTP/JSON. The backend connects to MySQL.

## Repository structure

```text
Machines-Diagnosis/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/predictive/backend/
│       │   │   ├── controller/
│       │   │   │   ├── MachineController.java
│       │   │   │   └── SensorReadingController.java
│       │   │   ├── entity/
│       │   │   │   ├── Machine.java
│       │   │   │   ├── Sensor.java
│       │   │   │   └── SensorReading.java
│       │   │   ├── repository/
│       │   │   ├── service/
│       │   │   └── BackendApplication.java
│       │   └── resources/application.properties
│       └── test/
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        └── main.jsx
```

## Prerequisites

Install:

- Java Development Kit (JDK) 21
- Maven
- Node.js and npm (a current LTS release compatible with Vite 8)
- MySQL Server
- Git

Verify the installations:

```bash
java -version
mvn -version
node -v
npm -v
mysql --version
```

## Database configuration

1. Start MySQL.
2. Create the project database:

```sql
CREATE DATABASE predictive_maintenance;
```

3. Configure the backend datasource with environment variables.

**Windows PowerShell**

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/predictive_maintenance"
$env:SPRING_DATASOURCE_USERNAME="your_mysql_username"
$env:SPRING_DATASOURCE_PASSWORD="your_mysql_password"
```

**macOS / Linux**

```bash
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/predictive_maintenance"
export SPRING_DATASOURCE_USERNAME="your_mysql_username"
export SPRING_DATASOURCE_PASSWORD="your_mysql_password"
```

For safer configuration, update `backend/src/main/resources/application.properties` to use environment placeholders:

```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/predictive_maintenance}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
```

Do not commit real credentials.

> **Security action required:** The inspected repository configuration contained a database password in plaintext. Treat it as compromised: rotate the database password, remove the hard-coded value, and purge the exposed secret from Git history. Editing the latest file alone does not remove it from earlier commits. See [GitHub's sensitive-data removal guidance](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository). Use a least-privilege database account rather than the MySQL root account.

The current JPA configuration uses schema update behaviour. Review database migration and schema safety before production deployment.

## Run the backend

Open a terminal at the repository root:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The configured backend port is **8080**. If startup succeeds, the API base URL is:

```text
http://localhost:8080
```

Keep the backend terminal running.

## Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the app at:

```text
http://localhost:5173
```

Use the URL printed by Vite if it chooses another port. The backend controllers currently allow the development origin `http://localhost:5173`; update CORS configuration if the frontend uses a different origin.

Create a production frontend build with:

```bash
npm run build
```

## API endpoints

The following routes are defined by the current REST controllers.

### Machine endpoints

Base path: `/api/machines`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/machines` | Retrieve all machines |
| GET | `/api/machines/{id}` | Retrieve one machine |
| POST | `/api/machines` | Create a machine |
| PUT | `/api/machines/{id}` | Update a machine |
| DELETE | `/api/machines/{id}` | Delete a machine |

### Sensor-reading endpoints

Base path: `/api/machines/{machineId}/readings`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/machines/{machineId}/readings` | Retrieve readings for a machine |
| POST | `/api/machines/{machineId}/readings` | Submit a reading for a machine |

Request and response payloads follow the current `Machine` and `SensorReading` entity structures. Inspect those entity classes before constructing API requests; a separate DTO contract is not currently documented.

## Health-score calculation

When a reading is submitted, the backend calculates:

```text
temperatureScore = max(0, 100 - temperature)
vibrationScore  = max(0, 100 - (vibration * 10))
healthScore      = (temperatureScore + vibrationScore) / 2
```

The resulting score is saved with the reading. The frontend classifies scores as follows:

| Health score | Display status |
|---|---|
| 70 or above | Healthy |
| 40 to below 70 | Warning |
| Below 40 | Critical |

The interface also uses sample alert thresholds, including temperature at or above 70 and vibration at or above 5.

**Important:** This is a simple rule-based heuristic. It is not a trained predictive model, calibrated failure probability, or evidence of real-time sensor monitoring.

## Design-pattern status

The coursework design discusses Factory Method, Adapter, and Strategy. The inspected repository source does not show concrete implementations of these patterns. They should therefore be described as **proposed future design patterns**, not as implemented features.

| Pattern | Category | Current status | Possible future use |
|---|---|---|---|
| Factory Method | Creational | **Not implemented / proposed** | Centralize creation of different sensor types when multiple sensor implementations are introduced. |
| Adapter | Structural | **Not implemented / proposed** | Convert vendor- or protocol-specific device data into a common reading interface if hardware integration is added. |
| Strategy | Behavioral | **Not implemented / proposed** | Make alternative health/failure-analysis algorithms interchangeable if multiple algorithms, including a validated ML model, are developed. |

The current default `Temperature` sensor lookup/creation path and heuristic score calculation do not, by themselves, constitute implementations of these patterns.

## Testing

Backend tests are under `backend/src/test`. The inspected test source includes a Spring application context-load test. Run:

```bash
cd backend
mvn test
```

Frontend lint and build scripts are defined in `frontend/package.json`:

```bash
cd frontend
npm run lint
npm run build
```

These are instructions for running checks, not a claim that the commands have already passed. Record actual command output when reporting test results.

## Security

- Rotate any database password committed to this public repository.
- Remove hard-coded credentials from `application.properties`; use environment variables or a secret manager.
- Purge exposed credentials from Git history. Changing the current file alone is insufficient.
- Never commit `.env` files containing real credentials; add them to `.gitignore`.
- Use a least-privilege database account.
- Review CORS, SQL logging, schema-update settings, validation, and error handling before deployment.

## Limitations and future work

1. Replace manual data entry with secure device/IoT ingestion when hardware is available.
2. Collect representative, labelled operating data and train/evaluate a failure-prediction model.
3. Report model metrics such as precision, recall, F1-score, and false-alarm rate only after reproducible evaluation.
4. Add maintenance-request records, lifecycle states, technician assignment, and work-completion tracking.
5. Add a notification service if email, SMS, or push alerts are required.
6. Add DTOs, stronger input validation, structured exception handling, and service/API integration tests.
7. Add database migrations and deployment configuration for production.

## Contributing

For coursework or team contributions:

1. Create a feature branch.
2. Keep changes focused and add tests where practical.
3. Do not commit secrets or personal data.
4. Describe the change and verification steps in the pull request.

## License

No license file was present in the repository when this README was prepared. Unless a license is added, do not assume that the source is open for unrestricted reuse.
