# DBASC IT Support System

DBASC IT Support is a college IT service and asset management system designed to help the institution manage technology-related requests, track equipment, coordinate maintenance, and improve overall IT operations.

## Project Overview

The system is built for a college environment where staff members may face hardware, software, internet, printer, network, or general IT issues. Instead of managing requests through informal communication, the application provides a structured way to record, monitor, and resolve support tickets and related IT activities.

It also helps the administration keep track of institutional IT assets, service records, lab event requirements, purchase documentation, and operational reporting.

## Main Purpose

The project supports the following business goals:

- Provide secure staff login and registration using college email accounts
- Track and resolve IT complaints from staff members
- Maintain a centralized inventory of all IT assets
- Record maintenance and repair history for each asset
- Manage lab event requests and approval workflows
- Record purchase bills and related documentation
- Generate operational reports for departments and administration
- Maintain logs of user actions and system activity
- Notify relevant users about new complaints, maintenance, and updates

## Target Users

The system is intended for:

- Staff members who need IT support
- IT administrators who resolve support requests and manage assets
- Principals or management who need dashboard visibility and reports
- Department coordinators who request lab facilities and IT support

## Key Features

### 1. Staff Login and Registration
- Staff can create an account using their college email
- Only valid college email addresses are accepted
- Users have different roles and permissions depending on their access level

### 2. IT Complaint Management
- Staff can submit complaints with subject, category, priority, and description
- Complaints can include supporting images or attachments
- Each complaint gets a unique ticket number
- Admins can review complaints, update status, and send replies
- Department-wise reporting is supported through complaint records

### 3. IT Asset Tracking
- Assets such as desktops, laptops, printers, routers, switches, projectors, and other devices can be recorded
- Each asset has details including:
  - asset code
  - name
  - category
  - brand
  - model
  - serial number
  - department
  - room or location
  - assigned user
  - current condition/status
- Assets can be listed, filtered, and exported for administrative use

### 4. Asset Maintenance History
- Maintenance activities can be logged for each asset
- Records include the date of service, issue, solution, vendor, technician, cost, and remarks
- This helps maintain long-term tracking of repairs and servicing

### 5. Lab Event Request Workflow
- Staff can request lab facilities for academic or departmental events
- Requests include event name, department, coordinator, contact, lab name, date, time, purpose, and IT requirements
- The system checks for scheduling conflicts and prevents duplicate bookings in the same time slot
- Admins can approve, reject, or update the status of event requests

### 6. Purchase Bill Management
- Admin can enter supplier and purchase information for IT equipment and services
- Purchase documents can be attached as PDFs
- Details include invoice number, supplier, contact, GST number, purchase category, date, amount, warranty, and remarks
- This keeps purchase records organized and auditable

### 7. Dashboard and Reporting
- Administrators can view summary statistics such as:
  - total staff
  - total complaints
  - pending requests
  - resolved requests
  - total assets
  - maintenance-related counts
- Reports are generated for complaints, assets, maintenance, lab events, purchase bills, and visitor logs

### 8. Activity and Visitor Logging
- System activity is tracked to understand who performed which action
- Visitor and login activity is recorded for accountability and audit purposes
- These records help in reviewing system usage and support history

### 9. Notifications
- Important updates such as new complaints, maintenance actions, and asset changes can be notified to users
- This keeps the IT team informed about critical operational events

## Role-Based Access

The system supports different levels of access:

- Staff: submit complaints, request lab events, access personal support activity
- Admin: manage assets, resolve complaints, review maintenance, process lab requests, add purchase bills, and view reports
- Principal or management: access high-level dashboards and institutional summary reports

## Data Managed by the System

The application stores and organizes information related to:

- staff profiles and departments
- IT support tickets
- asset inventory
- service and maintenance records
- lab bookings
- purchase and supplier records
- notifications and system logs
- visitor and activity tracking

## Business Value

This project provides a centralized digital workflow for college IT management. It reduces dependency on manual tracking, improves response time for technical issues, gives better visibility into asset health and utilization, and helps administrators make informed decisions based on real operational data.

## Accounts

Users can create staff accounts from the registration link on the sign-in page and select their department. Public registration always assigns the staff role; admin and principal accounts must be provisioned by an administrator. Configure Supabase Auth email confirmation and the required Vercel environment variables before deployment.

## Project Structure

The project includes the following main areas:

- User and account management
- Complaint handling
- Asset inventory management
- Maintenance tracking
- Lab event coordination
- Purchase document tracking
- Reports and dashboards
- Notifications and audit logs

## Summary

DBASC IT Support is a practical college support management system that brings operational control to IT support processes. It helps staff raise problems easily, enables IT teams to resolve them efficiently, and provides administrators with clear visibility into assets, requests, maintenance, and service performance.
