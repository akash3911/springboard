package com.labproject.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private Integer departmentId;
    private Integer institutionId;
}
