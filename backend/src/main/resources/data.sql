-- Institutions
INSERT INTO institutions (id, name, address, email, phone) VALUES
(1, 'MIT', '77 Massachusetts Ave, Cambridge, MA', 'contact@mit.edu', '617-253-1000'),
(2, 'IIT', 'IIT Delhi, Hauz Khas, New Delhi', 'contact@iit.edu', '011-2659-1000'),
(3, 'VIT', 'Vellore Institute of Technology, Vellore, TN', 'contact@vit.edu', '0416-224-3091')
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (id, institution_id, name) VALUES
-- MIT (1)
(1, 1, 'Computer Science'),
(2, 1, 'Physics'),
-- IIT (2)
(3, 2, 'Biology'),
-- VIT (3)
(4, 3, 'Chemistry')
ON CONFLICT DO NOTHING;

-- Users (password = 'password', pre-hashed with BCrypt)
INSERT INTO users (id, department_id, institution_id, name, email, password, role) VALUES
-- Global Admin
(1, NULL, 1, 'System Admin', 'admin@system.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'SYSTEM_ADMIN'),

-- MIT (Institution 1)
(2, NULL, 1, 'MIT Student', 'student@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(3, 1, 1, 'MIT Researcher', 'researcher@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'RESEARCHER'),
(4, 1, 1, 'MIT Technician', 'tech@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_TECHNICIAN'),
(5, 1, 1, 'MIT Manager', 'manager@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_MANAGER'),
(6, 1, 1, 'MIT Dept Head', 'depthead@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'DEPARTMENT_HEAD'),
(7, 1, 1, 'MIT Inst Head', 'head@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(14, NULL, 1, 'MIT Student 1', 'student1@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(15, NULL, 1, 'MIT Student 2', 'student2@mit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),

-- IIT (Institution 2)
(8, NULL, 2, 'IIT Student', 'student@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(9, 3, 2, 'IIT Manager', 'manager@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_MANAGER'),
(10, 3, 2, 'IIT Technician', 'tech@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'LAB_TECHNICIAN'),
(11, 3, 2, 'IIT Inst Head', 'head@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(16, NULL, 2, 'IIT Student 1', 'student1@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(17, NULL, 2, 'IIT Student 2', 'student2@iit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),

-- VIT (Institution 3)
(12, NULL, 3, 'VIT Student', 'student@vit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(13, 4, 3, 'VIT Inst Head', 'head@vit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'INSTITUTION_HEAD'),
(18, NULL, 3, 'VIT Student 1', 'student1@vit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT'),
(19, NULL, 3, 'VIT Student 2', 'student2@vit.edu', '$2a$10$o4G5MQQcAFYLBF49T05bCOLy2wQSv.e20az4lv6.QFL39wta4qEO.', 'STUDENT')
ON CONFLICT DO NOTHING;

-- Equipment
INSERT INTO equipment (id, department_id, name, category, manufacturer, model, serial_number, status, purchase_date, is_shared, is_restricted, room_number, contact_email, image_url, specifications, description) VALUES
-- MIT CS (Dept 1)
(1, 1, '3D Printer', 'Fabrication', 'Prusa', 'MK4', 'SN-3DP-001', 'BOOKING_PENDING', '2024-01-15', FALSE, FALSE, 'Room 101', 'manager@mit.edu', 'https://m.media-amazon.com/images/I/71vNIMGijcL._AC_UF1000,1000_QL80_.jpg', 'Build volume: 250x210x220mm', 'High-quality FDM 3D printer for prototyping'),
(2, 1, 'VR Headset', 'Imaging', 'Meta', 'Quest 3', 'SN-VR-002', 'AVAILABLE', '2024-02-10', FALSE, FALSE, 'Room 102', 'manager@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuZIVqFPTISq5TN9SlA8DKQm0bAMXgidlGuwi4Bvbxuw&s=10', '128GB Storage, 4K Display', 'Virtual reality headset for visualization studies'),
-- MIT Physics (Dept 2)
(3, 2, 'Laser Interferometer', 'Optics', 'Thorlabs', 'INT-500', 'SN-LAS-003', 'AVAILABLE', '2023-08-20', FALSE, TRUE, 'Room 201', 'depthead@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT3Ljq8smXKkQD0lSB9dx-MBTeNS0ZeqjQ3W8cUPSB2g&s=10', 'Wavelength: 632.8nm, Class 3B', 'Advanced restricted laser interferometer'),
(4, 2, 'Cryostat', 'Cryogenics', 'Oxford Instruments', 'Optistat', 'SN-CRY-004', 'BOOKED', '2023-11-05', TRUE, FALSE, 'Room 202', 'depthead@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLwj_gg2ROBPgzAhlbpTyFnv3exbgPR4hN_GJeuwH_Bw&s=10', 'Temperature range: 1.5K - 300K', 'Helium cryostat for low-temperature measurements'),
-- IIT Biology (Dept 3)
(5, 3, 'PCR Thermal Cycler', 'Biology', 'Bio-Rad', 'T100', 'SN-PCR-005', 'AVAILABLE', '2024-03-01', FALSE, FALSE, 'Room 301', 'manager@iit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5f0NkoWleFx76pZMIapxSEQOvey5YHpbMgx2tfWiOKA&s=10', '96-well, gradient capable', 'Thermal cycler for DNA amplification'),
(6, 3, 'Fluorescence Microscope', 'Imaging', 'Nikon', 'Eclipse', 'SN-MIC-006', 'UNDER_MAINTENANCE', '2023-05-18', FALSE, FALSE, 'Room 302', 'manager@iit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdNwRS1jCFObhZTGWrPFjqVMMx9Fwc5DXjxKfw2_5NqQ&s=10', 'Magnification: 1000x', 'Fluorescence inverted microscope'),
(7, 3, 'Centrifuge', 'Biology', 'Eppendorf', '5424R', 'SN-CEN-007', 'BOOKED', '2023-09-12', TRUE, FALSE, 'Room 303', 'manager@iit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmyPBYW6b2nZpTtG3l8jJDo2hFrDV2P1AEFj26qOGbwQ&s', 'Max speed: 15000 rpm', 'High-speed refrigerated centrifuge'),
-- VIT Chemistry (Dept 4)
(8, 4, 'DNA Sequencer', 'Genetics', 'Illumina', 'MiSeq', 'SN-SEQ-008', 'AVAILABLE', '2024-04-10', TRUE, TRUE, 'Room 401', 'head@vit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFhmHwpo2dXh3u4iFXJCwe35FZieMjLVoCCtD2xwSA-A&s=10', 'Output: Up to 15 Gb', 'Restricted and shared high-throughput DNA sequencer'),
(9, 4, 'Autoclave', 'Sterilization', 'Tuttnauer', '3870M', 'SN-AUT-009', 'AVAILABLE', '2024-05-15', FALSE, FALSE, 'Room 402', 'head@vit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDpOjVldgtPgmETvqlPQF3FFptkC5ZZkAWGcqDs0fTMg&s', 'Volume: 85 Liters', 'Steam sterilizer for biology lab prep'),
-- New MIT CS / Physics Equipments to showcase all booking scenarios
(10, 1, 'High-Performance GPU Cluster', 'Computation', 'NVIDIA', 'DGX H100', 'SN-GPU-010', 'BOOKED', '2024-05-20', TRUE, FALSE, 'Room 103', 'manager@mit.edu', 'https://resource.naddod.com/images/blog/2024-11-07/gpu-tray-components-010386.webp', '8x NVIDIA H100 GPUs, 640GB VRAM, Dual AMD EPYC 9654', 'Ultra-fast GPU cluster for deep learning and large language model training.'),
(11, 1, 'Digital Oscilloscope', 'Electronics', 'Tektronix', 'MSO64B', 'SN-OSC-011', 'BOOKING_PENDING', '2024-06-12', FALSE, FALSE, 'Room 104', 'manager@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDhx_cc2tTRPu7h56WL8fuhh3QO2DEhrqKvNWRVrscjw&s', 'Bandwidth: 2 GHz, 4 Channels, 10 GS/s sample rate', 'High-bandwidth digital oscilloscope for signal analysis and testing.'),
(12, 1, 'CNC Router Machine', 'Fabrication', 'ShopBot', 'PRSalpha', 'SN-CNC-012', 'AVAILABLE', '2024-03-10', TRUE, FALSE, 'Room 105', 'manager@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqVWW7TElpLCT983WX-q-bpBnSp0Wy1aLRZwgrazRACQ&s=10', 'Work Area: 2440x1220mm, Spindle: 2.2kW HSD', 'High-speed computer-controlled cutting machine for wood, plastic, and soft metals.'),
(13, 2, 'Chemical Fume Hood', 'Safety', 'Labconco', 'Protector Echo', 'SN-FUM-013', 'UNDER_MAINTENANCE', '2023-09-05', FALSE, FALSE, 'Room 203', 'depthead@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSvWxuGajyeS3zqCff02ldTw1Vxcube13HarYyueLXiA&s=10', 'Width: 6 feet, By-pass airflow design', 'Restricted fume hood for ventilation and safety during hazardous chemistry experiments.'),
(14, 2, 'Sputter Coater', 'Material Science', 'Cressington', '108Auto', 'SN-COA-014', 'BOOKED', '2023-12-15', TRUE, FALSE, 'Room 204', 'depthead@mit.edu', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtxmW3_zHITAnAmzk9Qx0_32qXPVj_6tdtAHN3QLhDXA&s=10', 'Target: Gold/Palladium, Automatic thickness controller', 'High-resolution sputter coater for SEM sample preparation.')
ON CONFLICT DO NOTHING;

-- Bookings
INSERT INTO bookings (id, equipment_id, user_id, start_time, end_time, purpose, status) VALUES
(1, 1, 2, '2026-07-24 09:00:00', '2026-07-24 12:00:00', 'Print prototypes for robotics class', 'PENDING'),
(2, 7, 8, '2026-07-24 10:00:00', '2026-07-24 13:00:00', 'DNA sequencing prep extraction', 'APPROVED'),
(3, 10, 3, '2026-07-23 09:00:00', '2026-07-25 18:00:00', 'Train LLM on high-performance GPUs', 'APPROVED'),
(4, 11, 14, '2026-07-24 10:00:00', '2026-07-24 14:00:00', 'Test frequency response of filter circuits', 'PENDING'),
(5, 14, 15, '2026-07-23 10:00:00', '2026-07-25 15:00:00', 'Coat SEM samples with gold palladium', 'APPROVED'),
(6, 14, 2, '2026-07-26 09:00:00', '2026-07-26 12:00:00', 'Coat specimens for materials course project', 'PENDING'),
(7, 4, 3, '2026-07-24 13:00:00', '2026-07-24 17:00:00', 'Measure low-temperature physics characteristics', 'APPROVED')
ON CONFLICT DO NOTHING;

-- Maintenance
INSERT INTO maintenance (id, equipment_id, maintenance_date, description, status, next_due_date, technician_id) VALUES
(1, 6, '2026-07-15', 'Light source replacement and mirror alignment', 'PENDING', '2026-10-15', 10),
(2, 1, '2026-07-01', 'Extruder nozzle cleaning', 'COMPLETED', '2026-10-01', 4)
ON CONFLICT DO NOTHING;

-- Utilization
INSERT INTO utilization (id, equipment_id, usage_hours, utilization_percentage, recorded_date) VALUES
(1, 1, 95.50, 59.70, '2026-07-01'),
(2, 3, 40.25, 25.15, '2026-07-01'),
(3, 5, 120.00, 75.00, '2026-07-01'),
(4, 7, 45.50, 45.50, '2026-07-01'),
(5, 8, 140.40, 87.75, '2026-07-01')
ON CONFLICT DO NOTHING;

-- Waitlist
INSERT INTO waitlist (id, equipment_id, user_id, request_time, status) VALUES
(1, 4, 2, '2026-07-16 10:00:00', 'PENDING'),
(2, 10, 2, '2026-07-17 11:30:00', 'PENDING')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, user_id, message, type, is_read, created_at) VALUES
(1, 2, 'Your booking for 3D Printer is pending approval', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(2, 5, 'New booking request for 3D Printer from MIT CS Student', 'BOOKING', FALSE, '2026-07-16 09:00:00'),
(3, 10, 'Maintenance scheduled for Fluorescence Microscope', 'MAINTENANCE', FALSE, '2026-07-14 10:00:00')
ON CONFLICT DO NOTHING;

-- Reset Sequence Generators for Postgres
SELECT setval('institutions_id_seq', COALESCE((SELECT MAX(id) FROM institutions), 1));
SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM departments), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('equipment_id_seq', COALESCE((SELECT MAX(id) FROM equipment), 1));
SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 1));
SELECT setval('maintenance_id_seq', COALESCE((SELECT MAX(id) FROM maintenance), 1));
SELECT setval('utilization_id_seq', COALESCE((SELECT MAX(id) FROM utilization), 1));
SELECT setval('waitlist_id_seq', COALESCE((SELECT MAX(id) FROM waitlist), 1));
SELECT setval('notifications_id_seq', COALESCE((SELECT MAX(id) FROM notifications), 1));

-- Populate documentation details for existing equipment

-- 1: 3D Printer
UPDATE equipment SET 
operating_instructions = 'Ensure the spring steel print sheet is completely clean (wipe with 90%+ Isopropyl Alcohol).
Insert the USB drive containing the G-code sliced via PrusaSlicer.
Select the file on the Nextruder screen and press the control dial to start.
Verify the automatic load-cell first layer calibration executes successfully.
After printing is done, wait for the heatbed to cool below 40°C before removing the print.',
safety_guidelines = 'Extreme Heat Hazard: Nozzle reaches up to 290°C and build plate up to 120°C. Never touch these parts during or immediately after printing.
Moving Axes: Keep hair, loose clothing, and fingers away from active belts and rods.
Ventilation: Print in a well-ventilated space. ABS and ASA filaments produce fumes and require a filtration enclosure.',
maintenance_guide = 'Clean smooth rods with a paper towel and apply a thin layer of linear grease weekly.
Inspect belt tension on X and Y axes regularly using the Prusa belt tuning app.
Clean dust from cooling fans and verify extruder nozzle tightness.'
WHERE id = 1;

-- 2: VR Headset
UPDATE equipment SET 
operating_instructions = 'Power on the headset by pressing and holding the side button for 2 seconds.
Adjust the headset straps and the interpupillary distance (IPD) dial for a sharp image.
Define your boundary (stationary boundary or roomscale boundary of at least 2m x 2m).
Connect to the local Wi-Fi and launch the visualization/simulation application.
Power off the headset and plug in the USB-C charger when battery is below 20%.',
safety_guidelines = 'Sunlight Damage Warning: Never expose the optical lenses to direct sunlight. Doing so will permanently burn the LCD screen.
Physical Environment: Ensure your activity area is clear of furniture, sharp edges, cables, children, or pets.
Discomfort & Fatigue: Stop using the headset immediately if you experience eye strain, dizziness, or nausea. Take a 15-minute break every 30 minutes.',
maintenance_guide = 'Clean the lenses with a dry microfiber optical cloth. Do not use liquids or paper towels.
Wipe down the silicone or fabric face pad with non-abrasive sanitizing wipes after use.
Store in a dark, dust-free case when not in use.'
WHERE id = 2;

-- 3: Laser Interferometer
UPDATE equipment SET 
operating_instructions = 'Turn on the laser controller key and allow 15 minutes for stabilization.
Align the reference and target mirrors slowly until reflection spots merge.
Optimize tilt stage controls to fine-tune fringe contrast.
Deploy photodetector and digital interface to log phase differences.',
safety_guidelines = 'Radiation Danger: Class 3B Laser. Avoid direct skin or eye contact with the beam.
Eye Protection: Certified laser safety goggles for 633nm must be worn at all times.
Reflection Blocks: Set up black matte cardboard shields at beam termination points.',
maintenance_guide = 'Keep the system covered inside a low-dust optics enclosure when inactive.
Clean mirror elements only using high-purity methanol and lint-free lens paper.
Do not touch coated optical surfaces directly.'
WHERE id = 3;

-- 4: Cryostat
UPDATE equipment SET 
operating_instructions = 'Pump down the outer vacuum chamber using a turbo molecular pump system.
Attach vacuum-insulated transfer siphon to cryogen dewar.
Slowly start the cryogen flow, regulating needle valve manually.
Connect ITC503 controller to monitor temperature sensors and heaters.',
safety_guidelines = 'Extreme Cold: Liquid helium (-269°C) will cause immediate severe frostbite. Always wear cryogenic gloves and face shields.
Pressure Risk: Ensure pressure safety relief valves are fully operational.
Asphyxiation Hazard: Run system in a room equipped with calibrated oxygen depletion alarms.',
maintenance_guide = 'Inspect vacuum flange O-rings and seals before every pump-down.
Check transfer siphon vacuum insulation layer annually.
Blow dry nitrogen gas through valves to purge residual moisture and ice.'
WHERE id = 4;

-- 5: PCR Thermal Cycler
UPDATE equipment SET 
operating_instructions = 'Turn on the T100 system power switch.
Load PCR plates or tubes symmetrically into the heating block.
Close the heated lid and spin the dial clock-wise to latch.
Select desired thermocycling program on the touch screen interface.
Press the Start button to run amplification cycle.',
safety_guidelines = 'Burn Hazard: Heated lid operates at 105°C. Avoid contact with inner lid surfaces.
Biohazard containment: Wear nitrile gloves and safety glasses during sample handling.
Chemical Contamination: Keep PCR plate surfaces dry.',
maintenance_guide = 'Clean reaction wells with a cotton swab dipped in 70% ethanol to remove dirt.
Perform thermal calibration validation checks every 6 months.
Verify cooling exhaust fan is free of dust build-up.'
WHERE id = 5;

-- 6: Fluorescence Microscope
UPDATE equipment SET 
operating_instructions = 'Power on the main microscope and the fluorescence light source controller.
Mount specimen slide onto stage (inverted orientation).
Focus specimen using brightfield path before switching to fluorescence.
Rotate cube turret to appropriate wavelength filter.
Open light path shutter and capture image using digital software.',
safety_guidelines = 'UV Eye Hazard: Do not view UV excitation light path directly. Use protective shield.
Lamp Explosion Risk: Track mercury lamp hours; replace before limit (typically 300 hrs).
Laser safety: If paired with confocal, comply with class 3B laser regulations.',
maintenance_guide = 'Clean objective and ocular lenses strictly using optical lens paper and specialized solvent.
Apply protective dust cover after the lamp and system cool completely.
Align arc lamp light path quarterly to ensure even field illumination.'
WHERE id = 6;

-- 7: Centrifuge
UPDATE equipment SET 
operating_instructions = 'Power on centrifuge and open the safety lid.
Load sample tubes symmetrically. Tubes MUST match in weight to avoid imbalance.
Screw the rotor lid on tightly until clicked.
Close centrifuge lid, configure speed (RPM/RCF) and time, and click Start.
Wait for rotor to come to a complete stop before attempting to open lid.',
safety_guidelines = 'High Rotational Force: Never start a run with unbalanced sample loads.
Lid Safety Interlock: Do not attempt to bypass the mechanical lid safety latch.
Abrupt Termination: If unit begins shaking or makes loud noises, hit Stop immediately.',
maintenance_guide = 'Clean rotor chamber weekly with mild soap and dry with a lint-free cloth.
Regularly inspect rotor anodized coating for scratches or chemical corrosion.
Apply a drop of centrifuge rotor grease on the spindle threads monthly.'
WHERE id = 7;

-- 8: DNA Sequencer
UPDATE equipment SET 
operating_instructions = 'Thaw reagent cartridge in a room-temperature water bath.
Clean flow cell glass using water and optical lens paper.
Insert flow cell and load thawed reagents into the reagent tray.
Input library parameters and run sheet details into system console.
Run the pre-sequencing diagnostic checklist and press Start.',
safety_guidelines = 'Chemical Hazards: Sequencer reagents contain formamide. Wear nitrile gloves and eyewear.
Biohazard Sample Disposal: Treat flow cell and reagents as biohazardous waste.
Laser Hazard: Internal laser barcode reader: Do not disassemble case components.',
maintenance_guide = 'Initiate automated post-run wash sequence immediately following every run.
Execute system maintenance wash using diluted bleach weekly.
Wipe down flow cell stage and microfluidics gaskets with alcohol wipes.'
WHERE id = 8;

-- 9: Autoclave
UPDATE equipment SET 
operating_instructions = 'Check reservoir water levels and replenish with distilled water if needed.
Arrange trays ensuring adequate space for steam penetration.
Close the door and turn the lock handle clockwise until sealed.
Select program temperature (e.g. 121°C for 30 minutes) and press Start.
Wait for pressure gauge to reach zero before opening lock handle.',
safety_guidelines = 'Steam Burn Hazard: Escaping steam causes severe burns. Always wear insulated heat-resistant gloves.
Door Lock: Never override mechanical interlocks or force door open under pressure.
Liquid Explosions: Do not sterilize sealed containers. Let liquids cool before moving.',
maintenance_guide = 'Drain reservoir and wipe interior chamber walls clean weekly.
Inspect silicone door gasket for cracks or steam leaks monthly.
Clean steam exhaust filter inside chamber daily.'
WHERE id = 9;

-- 10: GPU Cluster
UPDATE equipment SET 
operating_instructions = 'Connect via SSH client or web cluster portal.
Check GPU usage metrics using the command `nvidia-smi`.
Submit jobs using the local workload manager (e.g. Slurm file).
Ensure script points to NVLink-optimized CUDA containers for performance.
Wipe container environment files after run completes.',
safety_guidelines = 'Extreme Power Danger: High-voltage rack power distribution unit (PDU) inside.
Thermal Danger: Massive airflow exits back of chassis. Keep clearance zones empty.
Noise Exposure: Server room decibel levels are high; wear ear plugs.',
maintenance_guide = 'Clean server front bezel intake filters quarterly.
Monitor GPU temperature logs to identify potential heatsink issues.
Perform firmware and CUDA platform updates during scheduled downtimes.'
WHERE id = 10;

-- 11: Digital Oscilloscope
UPDATE equipment SET 
operating_instructions = 'Turn on scope power and attach probes to corresponding channels.
Connect ground lead clip to circuit ground.
Place probe tip on target test node.
Click the ''Autoset'' button to capture wave signals.
Manually tune scale, timebase, and triggering options for details.',
safety_guidelines = 'Overvoltage Shock: Do not exceed maximum probe input threshold voltages.
Ground loop hazards: Ensure probe grounds are not connected to hot lines.
Chassis grounding: Always plug into a properly grounded mains outlet.',
maintenance_guide = 'Run Signal Path Compensation (SPC) calibration utility monthly.
Wipe touch screen display with dry static-safe cloth.
Ensure cooling fan filters are clear of dust build-up.'
WHERE id = 11;

-- 12: CNC Router
UPDATE equipment SET 
operating_instructions = 'Clamp workpiece securely onto vacuum hold-down bed.
Fit correct router bit diameter in gantry spindle.
Calibrate workpiece zero coordinates using touch plate.
Activate the dust collector and vacuum hold-down pump system.
Load program file in ShopBot SB3 console and click Start.',
safety_guidelines = 'Cutting Hazard: Keep fingers far from rotating spindle zone. Wear safety goggles.
Hearing Protection: Spindle and dust collector noise exceeds 85dB; wear ear protectors.
E-Stop: Ensure emergency stop switch path is clear.',
maintenance_guide = 'Vacuum wood sawdust and shavings from gantry tracks and gears daily.
Lubricate gantry rails and ball screw bearings weekly.
Inspect collet and spindle shaft for wear monthly.'
WHERE id = 12;

-- 13: Fume Hood
UPDATE equipment SET 
operating_instructions = 'Switch exhaust fan and fume hood lights on.
Check airflow monitor display showing stable face velocity (Green status).
Raise sash to marked working level (never higher).
Place chemical setup at least 6 inches back from sash window.
Keep sash fully closed when experiment is unattended.',
safety_guidelines = 'Inhalation Hazard: Working with sash above marked height compromises chemical containment.
Explosion protection: Do not use perchloric acid or radioactive materials in this hood.
Obstruction danger: Avoid storing boxes or bottles that block lower baffles.',
maintenance_guide = 'Calibrate face velocity sensors annually with hot-wire anemometer.
Test emergency sash drop mechanism functionality weekly.
Replace carbon filtration panels when saturation alert is triggered.'
WHERE id = 13;

-- 14: Sputter Coater
UPDATE equipment SET 
operating_instructions = 'Load specimen stubs on stage and close glass chamber chamber.
Switch on backing pump to start evacuating chamber.
Wait for vacuum to read < 0.05 mbar.
Purge argon gas through fine needle valve until pressure stabilizes.
Set current and process time, and click Sputter to initiate plasma.',
safety_guidelines = 'Electrical Risk: Operates at up to 2.5 kV DC plasma current. Do not open casing.
Vacuum Chamber Risk: Ensure glass chamber is completely free of surface scratches to avoid implosion.
Gas safety: Close Argon supply cylinder main valve after work.',
maintenance_guide = 'Clean glass chamber interior and apply light vacuum grease to sealing gaskets monthly.
Check rotary pump oil level and color monthly; change oil yearly.
Replace sputter targets when copper backing layer is visible.'
WHERE id = 14;

-- Seed Hourly Rates, Calibration Dates, and Certificate Details
UPDATE equipment SET hourly_rate = 50.00, last_calibration_date = '2026-03-15', next_calibration_date = '2026-09-15', calibration_status = 'VALID', certificate_number = 'CAL-2026-0101', certificate_agency = 'Prusa Metrology Services', certificate_type = '3D Printer Accuracy & Bed Leveling' WHERE id = 1;
UPDATE equipment SET hourly_rate = 35.00, last_calibration_date = '2026-04-10', next_calibration_date = '2026-10-10', calibration_status = 'VALID', certificate_number = 'CERT-VR-8820', certificate_agency = 'Meta Optical Labs', certificate_type = 'Display Optics & Inertial Sensor Cert' WHERE id = 2;
UPDATE equipment SET hourly_rate = 75.00, last_calibration_date = '2026-07-01', next_calibration_date = '2026-08-15', calibration_status = 'DUE_SOON', certificate_number = 'LAS-CERT-4412', certificate_agency = 'Thorlabs Precision Metrology', certificate_type = 'Class 3B Laser Safety & Wavelength' WHERE id = 3;
UPDATE equipment SET hourly_rate = 90.00, last_calibration_date = '2026-01-20', next_calibration_date = '2026-07-20', calibration_status = 'EXPIRED', certificate_number = 'CRY-NIST-2026', certificate_agency = 'Oxford Cryo Standards', certificate_type = 'Thermal Sensor & Pressure Compliance' WHERE id = 4;
UPDATE equipment SET hourly_rate = 40.00, last_calibration_date = '2026-05-15', next_calibration_date = '2026-11-15', calibration_status = 'VALID', certificate_number = 'PCR-BIO-7721', certificate_agency = 'Bio-Rad Global Certification', certificate_type = 'Thermal Cycler Ramp Rate & Uniformity' WHERE id = 5;
UPDATE equipment SET hourly_rate = 65.00, last_calibration_date = '2025-12-01', next_calibration_date = '2026-06-01', calibration_status = 'EXPIRED', certificate_number = 'MIC-OPT-9923', certificate_agency = 'Nikon Metrology Bureau', certificate_type = 'Optical Alignment & Resolution Cert' WHERE id = 6;
UPDATE equipment SET hourly_rate = 45.00, last_calibration_date = '2026-06-10', next_calibration_date = '2026-12-10', calibration_status = 'VALID', certificate_number = 'CEN-EPP-3341', certificate_agency = 'Eppendorf Service Inc', certificate_type = 'Rotor Speed & Temperature Calibration' WHERE id = 7;
UPDATE equipment SET hourly_rate = 120.00, last_calibration_date = '2026-07-05', next_calibration_date = '2026-08-05', calibration_status = 'DUE_SOON', certificate_number = 'SEQ-ILL-1002', certificate_agency = 'Illumina Field Engineering', certificate_type = 'ISO 17025 Genetic Sequencer Cert' WHERE id = 8;
UPDATE equipment SET hourly_rate = 30.00, last_calibration_date = '2026-02-14', next_calibration_date = '2026-08-14', calibration_status = 'VALID', certificate_number = 'AUT-TUT-8890', certificate_agency = 'National Safety Board', certificate_type = 'Pressure Vessel & Sterilization Cert' WHERE id = 9;
UPDATE equipment SET hourly_rate = 150.00, last_calibration_date = '2026-06-01', next_calibration_date = '2026-12-01', calibration_status = 'VALID', certificate_number = 'GPU-NVD-5510', certificate_agency = 'NVIDIA Enterprise Services', certificate_type = 'Thermal & Compute Benchmark Cert' WHERE id = 10;
UPDATE equipment SET hourly_rate = 55.00, last_calibration_date = '2026-04-20', next_calibration_date = '2026-10-20', calibration_status = 'VALID', certificate_number = 'OSC-TEK-9002', certificate_agency = 'Tektronix Calibration Lab', certificate_type = 'NIST Traceable Signal Accuracy' WHERE id = 11;
UPDATE equipment SET hourly_rate = 60.00, last_calibration_date = '2026-05-01', next_calibration_date = '2026-11-01', calibration_status = 'VALID', certificate_number = 'CNC-SHP-1234', certificate_agency = 'ShopBot Industrial Metrology', certificate_type = 'Axis Alignment & Emergency Stop Cert' WHERE id = 12;
UPDATE equipment SET hourly_rate = 25.00, last_calibration_date = '2026-01-10', next_calibration_date = '2026-07-10', calibration_status = 'EXPIRED', certificate_number = 'FUM-LAB-6654', certificate_agency = 'OSHA Environmental Safety', certificate_type = 'Face Velocity & Containment Safety Cert' WHERE id = 13;
UPDATE equipment SET hourly_rate = 80.00, last_calibration_date = '2026-07-02', next_calibration_date = '2026-08-20', calibration_status = 'DUE_SOON', certificate_number = 'COA-CRE-7711', certificate_agency = 'Cressington Scientific', certificate_type = 'Thickness Monitor & Vacuum Pressure Cert' WHERE id = 14;

-- Seed Booking Costs & Cross-Institution Flags
UPDATE bookings SET total_cost = 150.00, is_cross_institution = FALSE, billing_status = 'PENDING' WHERE id = 1;
UPDATE bookings SET total_cost = 135.00, is_cross_institution = TRUE, billing_status = 'BILLED' WHERE id = 2;
UPDATE bookings SET total_cost = 850.00, is_cross_institution = FALSE, billing_status = 'PAID' WHERE id = 3;
UPDATE bookings SET total_cost = 220.00, is_cross_institution = FALSE, billing_status = 'PENDING' WHERE id = 4;
UPDATE bookings SET total_cost = 400.00, is_cross_institution = TRUE, billing_status = 'PENDING' WHERE id = 5;
UPDATE bookings SET total_cost = 240.00, is_cross_institution = FALSE, billing_status = 'PENDING' WHERE id = 6;
UPDATE bookings SET total_cost = 360.00, is_cross_institution = FALSE, billing_status = 'PAID' WHERE id = 7;

-- Seed Maintenance Costs & Work Orders
UPDATE maintenance SET cost = 320.00, maintenance_type = 'CALIBRATION', work_order_number = 'WO-1001' WHERE id = 1;
UPDATE maintenance SET cost = 150.00, maintenance_type = 'PREVENTIVE', work_order_number = 'WO-1002' WHERE id = 2;


