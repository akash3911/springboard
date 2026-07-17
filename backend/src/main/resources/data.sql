-- Institutions
INSERT INTO institutions (id, name, address, email, phone) VALUES
(1, 'MIT', '77 Massachusetts Ave, Cambridge, MA', 'contact@mit.edu', '617-253-1000'),
(2, 'Stanford', '450 Serra Mall, Stanford, CA', 'contact@stanford.edu', '650-723-2300')
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (id, institution_id, name) VALUES
(1, 1, 'Computer Science'),
(2, 1, 'Physics'),
(3, 2, 'Biology'),
(4, 2, 'Chemistry')
ON CONFLICT DO NOTHING;

-- Users (password = 'password')
INSERT INTO users (id, department_id, name, email, password, role) VALUES
(1, 1, 'Admin User', 'admin@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'SYSTEM_ADMIN'),
(2, 1, 'Inst Head', 'insthead@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(3, 1, 'Dept Head', 'depthead@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'DEPARTMENT_HEAD'),
(4, 1, 'Lab Manager', 'labmgr@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_MANAGER'),
(5, 1, 'Tech User', 'tech@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_TECHNICIAN'),
(6, 1, 'Researcher User', 'researcher@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'RESEARCHER'),
(7, 1, 'Student User', 'student@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(8, 3, 'Stan Student', 'student2@stanford.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT')
ON CONFLICT DO NOTHING;

-- Equipment
INSERT INTO equipment (id, department_id, name, category, manufacturer, model, serial_number, status, purchase_date, is_shared, is_restricted, room_number, contact_email, specifications, description) VALUES
(1, 1, '3D Printer', 'Fabrication', 'Prusa', 'MK4', 'SN-3DP-001', 'AVAILABLE', '2024-01-15', FALSE, FALSE, 'Lab 101', 'labmgr@mit.edu', 'Build volume: 250x210x220mm', 'High-quality FDM 3D printer for prototyping'),
(2, 1, 'Oscilloscope', 'Electronics', 'Keysight', 'DSOX1204G', 'SN-OSC-002', 'AVAILABLE', '2024-03-10', FALSE, FALSE, 'Lab 102', 'labmgr@mit.edu', '4 channels, 200MHz bandwidth', 'Digital storage oscilloscope for signal analysis'),
(3, 2, 'Electron Microscope', 'Imaging', 'JEOL', 'JSM-7800F', 'SN-EM-003', 'AVAILABLE', '2023-06-20', FALSE, TRUE, 'Lab 201', 'labmgr@mit.edu', 'Resolution: 0.7nm', 'Field emission scanning electron microscope'),
(4, 3, 'PCR Machine', 'Biology', 'Bio-Rad', 'T100', 'SN-PCR-004', 'AVAILABLE', '2024-02-28', TRUE, FALSE, 'Lab 301', 'labmgr@mit.edu', '96-well, gradient capable', 'Thermal cycler for DNA amplification'),
(5, 3, 'Centrifuge', 'Biology', 'Eppendorf', '5424R', 'SN-CFG-005', 'UNDER_MAINTENANCE', '2023-11-05', FALSE, FALSE, 'Lab 302', 'labmgr@mit.edu', 'Max speed: 21130 x g', 'Refrigerated microcentrifuge'),
(6, 4, 'Spectrometer', 'Chemistry', 'Shimadzu', 'UV-1900i', 'SN-SPEC-006', 'AVAILABLE', '2024-04-12', TRUE, FALSE, 'Lab 401', 'labmgr@mit.edu', 'Wavelength range: 190-1100nm', 'UV-Vis spectrophotometer for chemical analysis')
ON CONFLICT DO NOTHING;

-- Bookings
INSERT INTO bookings (id, equipment_id, user_id, start_time, end_time, purpose, status) VALUES
(1, 1, 7, '2026-07-20 09:00:00', '2026-07-20 12:00:00', 'Print prototype for capstone project', 'PENDING'),
(2, 2, 6, '2026-07-18 14:00:00', '2026-07-18 17:00:00', 'Signal analysis for research paper', 'APPROVED'),
(3, 4, 7, '2026-07-21 10:00:00', '2026-07-21 13:00:00', 'DNA amplification experiment', 'PENDING')
ON CONFLICT DO NOTHING;

-- Maintenance
INSERT INTO maintenance (id, equipment_id, maintenance_date, description, status, next_due_date, technician_id) VALUES
(1, 5, '2026-07-15', 'Routine calibration and bearing check', 'PENDING', '2026-10-15', 5),
(2, 1, '2026-07-01', 'Nozzle replacement and bed leveling', 'COMPLETED', '2026-10-01', 5)
ON CONFLICT DO NOTHING;

-- Utilization
INSERT INTO utilization (id, equipment_id, usage_hours, utilization_percentage, recorded_date) VALUES
(1, 1, 120.50, 75.30, '2026-07-01'),
(2, 2, 85.00, 53.10, '2026-07-01'),
(3, 3, 40.25, 25.20, '2026-07-01'),
(4, 4, 150.75, 94.20, '2026-07-01'),
(5, 6, 95.00, 59.40, '2026-07-01')
ON CONFLICT DO NOTHING;

-- Waitlist
INSERT INTO waitlist (id, equipment_id, user_id, request_time, status) VALUES
(1, 3, 7, '2026-07-16 10:00:00', 'PENDING')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, message, type, is_read, created_at) VALUES
(1, 7, 'Your booking for 3D Printer is pending approval', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(2, 4, 'New booking request for 3D Printer from Student User', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(3, 6, 'Your booking for Oscilloscope has been approved', 'BOOKING', TRUE, '2026-07-15 14:00:00'),
(4, 5, 'Maintenance scheduled for Centrifuge', 'MAINTENANCE', FALSE, '2026-07-14 10:00:00')
ON CONFLICT DO NOTHING;

-- Reset sequences
SELECT setval('institutions_id_seq', COALESCE((SELECT MAX(id) FROM institutions), 1));
SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM departments), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('equipment_id_seq', COALESCE((SELECT MAX(id) FROM equipment), 1));
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 1));
SELECT setval('maintenance_id_seq', COALESCE((SELECT MAX(id) FROM maintenance), 1));
SELECT setval('utilization_id_seq', COALESCE((SELECT MAX(id) FROM utilization), 1));
SELECT setval('waitlist_id_seq', COALESCE((SELECT MAX(id) FROM waitlist), 1));
SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));
