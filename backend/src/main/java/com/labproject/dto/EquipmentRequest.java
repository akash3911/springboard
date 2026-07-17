package com.labproject.dto;

import java.time.LocalDate;

public class EquipmentRequest {
    private Integer departmentId;
    private String name;
    private String category;
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String status;
    private LocalDate purchaseDate;
    private Boolean isShared;
    private Boolean isRestricted;
    private String roomNumber;
    private String contactEmail;
    private String specifications;
    private String description;

    public Integer getDepartmentId() { return departmentId; }
    public void setDepartmentId(Integer departmentId) { this.departmentId = departmentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public Boolean getIsShared() { return isShared; }
    public void setIsShared(Boolean isShared) { this.isShared = isShared; }

    public Boolean getIsRestricted() { return isRestricted; }
    public void setIsRestricted(Boolean isRestricted) { this.isRestricted = isRestricted; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getSpecifications() { return specifications; }
    public void setSpecifications(String specifications) { this.specifications = specifications; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
