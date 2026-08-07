package com.labproject.service;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Department;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final DepartmentRepository departmentRepository;
    private final BookingRepository bookingRepository;
    private final MaintenanceRepository maintenanceRepository;

    public List<Equipment> findAll() {
        return equipmentRepository.findAll().stream()
                .map(this::syncEquipmentStatus)
                .toList();
    }

    public Equipment findById(Integer id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));
        return syncEquipmentStatus(equipment);
    }

    public List<Equipment> findByDepartmentId(Integer departmentId) {
        return equipmentRepository.findByDepartmentId(departmentId).stream()
                .map(this::syncEquipmentStatus)
                .toList();
    }

    public List<Equipment> findByInstitutionId(Integer institutionId) {
        return equipmentRepository.findByDepartmentInstitutionId(institutionId).stream()
                .map(this::syncEquipmentStatus)
                .toList();
    }

    public List<Equipment> findByStatus(String status) {
        return findAll().stream()
                .filter(e -> e.getStatus().equalsIgnoreCase(status))
                .toList();
    }

    public Equipment create(EquipmentRequest request) {
        Equipment equipment = new Equipment();
        mapRequestToEntity(request, equipment);
        return equipmentRepository.save(equipment);
    }

    public Equipment update(Integer id, EquipmentRequest request) {
        Equipment equipment = findById(id);
        mapRequestToEntity(request, equipment);
        return equipmentRepository.save(equipment);
    }

    public Equipment recordCalibration(Integer id, EquipmentRequest request) {
        Equipment equipment = findById(id);
        
        LocalDate lastCal = request.getLastCalibrationDate() != null ? request.getLastCalibrationDate() : LocalDate.now();
        LocalDate nextCal = request.getNextCalibrationDate() != null ? request.getNextCalibrationDate() : lastCal.plusMonths(6);
        String calStatus = request.getCalibrationStatus() != null ? request.getCalibrationStatus() : "VALID";

        equipment.setLastCalibrationDate(lastCal);
        equipment.setNextCalibrationDate(nextCal);
        equipment.setCalibrationStatus(calStatus);
        
        if (request.getCertificateNumber() != null) equipment.setCertificateNumber(request.getCertificateNumber());
        if (request.getCertificateAgency() != null) equipment.setCertificateAgency(request.getCertificateAgency());
        if (request.getCertificateType() != null) equipment.setCertificateType(request.getCertificateType());
        if (request.getCertificateUrl() != null) equipment.setCertificateUrl(request.getCertificateUrl());

        // Restore equipment status to AVAILABLE if it was under maintenance
        if ("UNDER_MAINTENANCE".equalsIgnoreCase(equipment.getStatus())) {
            equipment.setStatus("AVAILABLE");
        }

        Equipment saved = equipmentRepository.save(equipment);

        // Also create a completed Maintenance audit log for this calibration event
        try {
            Maintenance m = new Maintenance();
            m.setEquipment(saved);
            m.setMaintenanceDate(lastCal);
            m.setNextDueDate(nextCal);
            m.setMaintenanceType("CALIBRATION");
            m.setStatus("COMPLETED");
            m.setCost(request.getCost() != null ? request.getCost() : 250.0);
            m.setWorkOrderNumber("CAL-" + System.currentTimeMillis() % 100000);
            
            String desc = "Calibration & Certificate Renewal: " + 
                          (request.getCertificateNumber() != null ? request.getCertificateNumber() : "Certified") + 
                          (request.getNotes() != null ? " - " + request.getNotes() : "");
            m.setDescription(desc.substring(0, Math.min(desc.length(), 250)));
            maintenanceRepository.save(m);
        } catch (Exception ignored) {}

        return saved;
    }

    public void delete(Integer id) {
        equipmentRepository.deleteById(id);
    }

    private Equipment syncEquipmentStatus(Equipment equipment) {
        if (equipment == null) return null;
        if ("UNDER_MAINTENANCE".equals(equipment.getStatus()) || "OUT_OF_SERVICE".equals(equipment.getStatus())) {
            return equipment;
        }

        List<Booking> bookings = bookingRepository.findByEquipmentId(equipment.getId());

        boolean hasApproved = bookings.stream()
                .anyMatch(b -> "APPROVED".equals(b.getStatus()));

        boolean hasPending = bookings.stream()
                .anyMatch(b -> "PENDING".equals(b.getStatus()));

        if (hasApproved && !"BOOKED".equals(equipment.getStatus())) {
            equipment.setStatus("BOOKED");
            return equipmentRepository.save(equipment);
        } else if (!hasApproved && hasPending && !"BOOKING_PENDING".equals(equipment.getStatus())) {
            equipment.setStatus("BOOKING_PENDING");
            return equipmentRepository.save(equipment);
        } else if (!hasApproved && !hasPending && ("BOOKED".equals(equipment.getStatus()) || "BOOKING_PENDING".equals(equipment.getStatus()))) {
            equipment.setStatus("AVAILABLE");
            return equipmentRepository.save(equipment);
        }

        return equipment;
    }

    private void mapRequestToEntity(EquipmentRequest request, Equipment equipment) {
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            equipment.setDepartment(dept);
        }
        if (request.getName() != null) equipment.setName(request.getName());
        if (request.getCategory() != null) equipment.setCategory(request.getCategory());
        if (request.getManufacturer() != null) equipment.setManufacturer(request.getManufacturer());
        if (request.getModel() != null) equipment.setModel(request.getModel());
        if (request.getSerialNumber() != null) equipment.setSerialNumber(request.getSerialNumber());
        if (request.getStatus() != null) equipment.setStatus(request.getStatus());
        if (request.getPurchaseDate() != null) equipment.setPurchaseDate(request.getPurchaseDate());
        if (request.getIsShared() != null) equipment.setIsShared(request.getIsShared());
        if (request.getIsRestricted() != null) equipment.setIsRestricted(request.getIsRestricted());
        if (request.getRoomNumber() != null) equipment.setRoomNumber(request.getRoomNumber());
        if (request.getContactEmail() != null) equipment.setContactEmail(request.getContactEmail());
        if (request.getImageUrl() != null) equipment.setImageUrl(request.getImageUrl());
        if (request.getSpecifications() != null) equipment.setSpecifications(request.getSpecifications());
        if (request.getDescription() != null) equipment.setDescription(request.getDescription());
        if (request.getOperatingInstructions() != null) equipment.setOperatingInstructions(request.getOperatingInstructions());
        if (request.getSafetyGuidelines() != null) equipment.setSafetyGuidelines(request.getSafetyGuidelines());
        if (request.getMaintenanceGuide() != null) equipment.setMaintenanceGuide(request.getMaintenanceGuide());
        if (request.getHourlyRate() != null) equipment.setHourlyRate(request.getHourlyRate());
        if (request.getLastCalibrationDate() != null) equipment.setLastCalibrationDate(request.getLastCalibrationDate());
        if (request.getNextCalibrationDate() != null) equipment.setNextCalibrationDate(request.getNextCalibrationDate());
        if (request.getCalibrationStatus() != null) equipment.setCalibrationStatus(request.getCalibrationStatus());
        if (request.getCertificateNumber() != null) equipment.setCertificateNumber(request.getCertificateNumber());
        if (request.getCertificateAgency() != null) equipment.setCertificateAgency(request.getCertificateAgency());
        if (request.getCertificateType() != null) equipment.setCertificateType(request.getCertificateType());
        if (request.getCertificateUrl() != null) equipment.setCertificateUrl(request.getCertificateUrl());
    }
}
