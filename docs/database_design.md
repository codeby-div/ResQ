# Database Design

## Table: Users

| Column Name | Data Type | Description                         |
| ----------- | --------- | ----------------------------------- |
| id          | Integer   | Primary Key                         |
| name        | String    | User Name                           |
| phone       | String    | Contact Number                      |
| role        | String    | Patient, Hospital, Ambulance, Admin |

---

## Table: Hospitals

| Column Name | Data Type | Description        |
| ----------- | --------- | ------------------ |
| id          | Integer   | Primary Key        |
| name        | String    | Hospital Name      |
| latitude    | Float     | Location Latitude  |
| longitude   | Float     | Location Longitude |
| beds        | Integer   | Available Beds     |
| icu_beds    | Integer   | Available ICU Beds |

---

## Table: Ambulances

| Column Name    | Data Type | Description       |
| -------------- | --------- | ----------------- |
| id             | Integer   | Primary Key       |
| vehicle_number | String    | Ambulance Number  |
| latitude       | Float     | Current Latitude  |
| longitude      | Float     | Current Longitude |
| status         | String    | Available / Busy  |

---

## Table: EmergencyRequests

| Column Name    | Data Type | Description                   |
| -------------- | --------- | ----------------------------- |
| id             | Integer   | Primary Key                   |
| patient_name   | String    | Patient Name                  |
| emergency_type | String    | Accident, Cardiac, Fire, etc. |
| latitude       | Float     | Incident Latitude             |
| longitude      | Float     | Incident Longitude            |
| status         | String    | Pending, Assigned, Completed  |
| hospital_id    | Integer   | Assigned Hospital             |
| ambulance_id   | Integer   | Assigned Ambulance            |
