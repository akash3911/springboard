package com.labproject.service;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Department;
import com.labproject.entity.Equipment;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final DepartmentRepository departmentRepository;
    private final BookingRepository bookingRepository;

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
        equipment.setName(request.getName());
        equipment.setCategory(request.getCategory());
        equipment.setManufacturer(request.getManufacturer());
        equipment.setModel(request.getModel());
        equipment.setSerialNumber(request.getSerialNumber());
        equipment.setStatus(request.getStatus() != null ? request.getStatus() : "AVAILABLE");
        equipment.setPurchaseDate(request.getPurchaseDate());
        equipment.setIsShared(request.getIsShared() != null ? request.getIsShared() : false);
        equipment.setIsRestricted(request.getIsRestricted() != null ? request.getIsRestricted() : false);
        equipment.setRoomNumber(request.getRoomNumber());
        equipment.setContactEmail(request.getContactEmail());
        equipment.setImageUrl(request.getImageUrl());
        equipment.setSpecifications(request.getSpecifications());
        equipment.setDescription(request.getDescription());
        equipment.setOperatingInstructions(request.getOperatingInstructions());
        equipment.setSafetyGuidelines(request.getSafetyGuidelines());
        equipment.setMaintenanceGuide(request.getMaintenanceGuide());
    }
}
