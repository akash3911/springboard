package com.labproject.service;

import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.entity.User;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import com.labproject.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    public MaintenanceService(MaintenanceRepository maintenanceRepository,
                              EquipmentRepository equipmentRepository,
                              UserRepository userRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.equipmentRepository = equipmentRepository;
        this.userRepository = userRepository;
    }

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
        
        LocalDate date = request.getMaintenanceDate() != null ? request.getMaintenanceDate() : request.getScheduledDate();
        if (date == null) {
            date = LocalDate.now();
        }
        maintenance.setMaintenanceDate(date);
        maintenance.setDescription(request.getDescription());
        maintenance.setStatus("PENDING");
        maintenance.setNextDueDate(request.getNextDueDate() != null ? request.getNextDueDate() : date.plusMonths(3));

        if (request.getTechnicianId() != null) {
            User technician = userRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new RuntimeException("Technician not found"));
            maintenance.setTechnician(technician);
        }

        return maintenanceRepository.save(maintenance);
    }

    public Maintenance complete(Integer id) {
        Maintenance maintenance = findById(id);
        maintenance.setStatus("COMPLETED");

        // Set equipment back to AVAILABLE
        Equipment equipment = maintenance.getEquipment();
        equipment.setStatus("AVAILABLE");
        equipmentRepository.save(equipment);

        return maintenanceRepository.save(maintenance);
    }
}
