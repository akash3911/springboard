package com.labproject.dto;

import java.util.Map;

public class AuthResponse {
    private String token;
    private Integer id;
    private String name;
    private String email;
    private String role;
    private Map<String, Object> department;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Map<String, Object> getDepartment() { return department; }
    public void setDepartment(Map<String, Object> department) { this.department = department; }
}
