# Quality KPI Workbook Analysis

## Overview

This Excel workbook is a **Quality Control and KPI tracking system** for a manufacturing environment.

The workbook contains:

1. Quality Control Dashboard
2. Production QC Records (Hall 1, Hall 2, Hall 3)
3. Deviation Records (Hall 1, Hall 2, Hall 3)
4. CAPA (Corrective and Preventive Actions)
5. Customer Complaint Tracking

The overall workflow appears to be:

Production Data → Quality Deviations → KPI Dashboard → CAPA Actions

---

# Functional Analysis

## 1. QC Record Production Hall

Sheets:

- QC Record Production Hall 1
- QC Record Production Hall 2
- QC Record Production Hall 3

Purpose:

Capture production quality measurements for each machine.

Examples of fields:

- Product Name
- Batch Number
- Day
- Date
- Shift
- Ice Weight
- Sauce Weight
- Biscuit Weight
- Minimum Weight
- Actual Weight
- Maximum Weight

Machines are repeated horizontally across the sheet.

### Observation

The same structure is duplicated many times for different machines.

This creates:

- Large spreadsheets
- Difficult maintenance
- Difficult reporting
- High risk of data entry errors

---

## 2. QC Deviation Record

Sheets:

- QC Deviation Record Hall 1
- QC Deviation Record Hall 2
- QC Deviation Record Hall 3

Purpose:

Track quality defects and deviations.

Examples:

- AD01 – Additives concentrated in one area
- AD02 – Excess wet/broken additives
- AD03 – Wrong additive type
- AD04 – Missing additive / blocked nozzles

For each machine:

- Daily deviation counts
- Weekly totals
- Defect Average Rate %

### Observation

The workbook contains many formulas calculating:

- Weekly totals
- Defect percentages
- Defect averages

Most of these calculations could be generated automatically by a database query.

---

## 3. Quality Control Dashboard

Purpose:

Management reporting.

Likely summarizes:

- Production quantities
- Defect counts
- Defect percentages
- Weekly KPI performance

The dashboard depends on data entered in the QC sheets.

---

## 4. CAPA (Corrective and Preventive Action)

Purpose:

Track quality incidents and actions.

Fields include:

- Machine
- Day
- Date
- Shift
- Time
- Batch Number
- Product
- Quantity
- Defect Code
- Probable Cause
- Immediate Correction
- Corrective Action
- Preventive Action
- Closure Status
- Responsible Department

This is effectively a ticketing system for quality issues.

---

## 5. Customer Complaint Tracking

Included inside the CAPA sheet.

Fields include:

- Customer Name
- Complaint Summary
- Complaint Date
- Complaint Number
- Responsible Department
- Responsible Person
- Corrective / Preventive Actions
- Complaint Resolution
- Customer Notification Status

This is a second process mixed into the CAPA sheet.

---

# Suggested Database Schema

A simple database structure could replace most spreadsheet complexity.

## halls

| Field |
|---------|
| id |
| name |

Examples:

- Hall 1
- Hall 2
- Hall 3

---

## machines

| Field |
|---------|
| id |
| hall_id |
| machine_code |
| machine_name |

Relationship:

Hall → Many Machines

---

## products

| Field |
|---------|
| id |
| product_name |

---

## production_records

| Field |
|---------|
| id |
| machine_id |
| product_id |
| batch_no |
| production_date |
| shift |
| ice_weight |
| sauce_weight |
| biscuit_weight |
| min_weight |
| actual_weight |
| max_weight |

Relationship:

Machine → Many Production Records

Product → Many Production Records

---

## defect_categories

| Field |
|---------|
| id |
| defect_code |
| defect_name |

Examples:

- AD01
- AD02
- AD03
- AD04

---

## deviations

| Field |
|---------|
| id |
| machine_id |
| product_id |
| defect_category_id |
| date |
| quantity |

Relationship:

Machine → Many Deviations

Defect Category → Many Deviations

---

## capa_cases

| Field |
|---------|
| id |
| deviation_id |
| probable_cause |
| correction_action |
| corrective_action |
| preventive_action |
| status |
| assigned_department |

Relationship:

Deviation → Zero or Many CAPA Cases

---

## customer_complaints

| Field |
|---------|
| id |
| customer_name |
| complaint_number |
| complaint_date |
| complaint_summary |
| assigned_to |
| resolution |
| status |

---

# ERD (Simplified)

Hall
└── Machines
    ├── Production Records
    └── Deviations
            └── CAPA Cases

Products
├── Production Records
└── Deviations

Customer Complaints
(independent module)

---

# How To Simplify

## Option 1 (Recommended)

Keep Excel but normalize data.

Instead of one block per machine:

Store data vertically:

| Date | Hall | Machine | Product | Shift | Weight |
|--------|--------|--------|--------|--------|--------|

Advantages:

- Smaller workbook
- Easier reporting
- Easier formulas
- Easier Power BI integration

---

## Option 2 (Best Long-Term Solution)

Build a simple web application.

### Suggested Stack

- Laravel
- PostgreSQL or MySQL
- Livewire
- Bootstrap or Tailwind

Modules:

1. Production Entry
2. Deviation Entry
3. CAPA Management
4. Customer Complaints
5. KPI Dashboard

Benefits:

- Multi-user access
- Audit trail
- Role permissions
- Automatic KPI calculations
- Historical reporting
- Mobile/tablet usage on production floor

---

# Do Not Over-Engineer

The current process does NOT require ERP-level complexity.

A small application with:

- 8–10 tables
- CRUD screens
- KPI dashboard
- Export to Excel

would cover most requirements.

Recommendation:

Start with a simple Laravel web application and migrate data entry from Excel gradually. Keep KPI calculations inside the database and generate dashboards automatically.
