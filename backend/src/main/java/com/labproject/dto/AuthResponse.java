package com.labproject.dto;

import lombok.Data;
import java.util.Map;

@Data
public class AuthResponse {
    private String token;
    private Integer id;
    private String name;
    private String email;
    private String role;
    private Map<String, Object> department;
}
