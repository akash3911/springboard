package com.labproject.service;

import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.entity.User;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import com.labproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<Maintenance> findAll() {
        return maintenanceRepository.findAll();
    }

    public Maintenance findById(Integer id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Maintenance record not found"));
    }

    public List<Maintenance> findByTechnicianId(Integer technicianId) {
        return maintenanceRepository.findByTechnicianId(technicianId);
    }

    public List<Maintenance> findByEquipmentId(Integer equipmentId) {
        return maintenanceRepository.findByEquipmentId(equipmentId);
    }

    public List<Maintenance> findByDepartmentId(Integer departmentId) {
        return maintenanceRepository.findByEquipmentDepartmentId(departmentId);
    }

    public Maintenance create(MaintenanceRequest request) {
        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        // Set equipment status to UNDER_MAINTENANCE
        equipment.setStatus("UNDER_MAINTENANCE");
        equipmentRepository.save(equipment);

        Maintenance maintenance = new Maintenance();
        maintenance.setEquipment(equipment);
        maintenance.setMaintenanceDate(request.getMaintenanceDate() != null ? request.getMaintenanceDate() : LocalDate.now());
        maintenance.setDescription(request.getDescription());
        maintenance.setStatus("PENDING");
        maintenance.setNextDueDate(request.getNextDueDate());
        maintenance.setCost(request.getCost() != null ? request.getCost() : 150.0);
        maintenance.setMaintenanceType(request.getMaintenanceType() != null ? request.getMaintenanceType() : "REPAIR");
        
        String woNum = request.getWorkOrderNumber() != null ? request.getWorkOrderNumber() :
                      "WO-" + (System.currentTimeMillis() % 100000);
        maintenance.setWorkOrderNumber(woNum);

        if (request.getTechnicianId() != null) {
            User technician = userRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new RuntimeException("Technician not found"));
            maintenance.setTechnician(technician);
            
            try {
                notificationService.create(technician.getId(), 
                    "New Work Order Assigned: " + woNum + " for " + equipment.getName(), 
                    "MAINTENANCE");
            } catch (Exception ignored) {}
        }

        return maintenanceRepository.save(maintenance);
    }

    public Maintenance complete(Integer id) {
        Maintenance maintenance = findById(id);
        maintenance.setStatus("COMPLETED");

        // Set equipment back to AVAILABLE
        Equipment equipment = maintenance.getEquipment();
        equipment.setStatus("AVAILABLE");

        if ("CALIBRATION".equalsIgnoreCase(maintenance.getMaintenanceType())) {
            equipment.setLastCalibrationDate(LocalDate.now());
            equipment.setNextCalibrationDate(LocalDate.now().plusMonths(6));
            equipment.setCalibrationStatus("VALID");
        }

        equipmentRepository.save(equipment);

        if (maintenance.getTechnician() != null) {
            try {
                notificationService.create(maintenance.getTechnician().getId(), 
                    "Work Order " + maintenance.getWorkOrderNumber() + " marked as COMPLETED.", 
                    "MAINTENANCE");
            } catch (Exception ignored) {}
        }

        return maintenanceRepository.save(maintenance);
    }
}

