package com.labproject.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "is_shared")
    private Boolean isShared;

    @Column(name = "is_restricted")
    private Boolean isRestricted;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

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
