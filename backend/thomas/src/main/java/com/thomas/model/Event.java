// D:\Projects\watchbase-web\backend\thomas\src\main\java\com\thomas\model\Event.java
package com.thomas.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Event {
    private String camera;
    private int distance;
    private String description;
    private String time;
    private String severity;

    public Event() {}

    public Event(String camera, int distance, String description, String time) {
        this.camera = camera;
        this.distance = distance;
        this.description = description;
        this.time = time;
        this.severity = calculateSeverity(distance);
    }

    private String calculateSeverity(int distance) {
        if (distance <= 80) return "high";
        if (distance <= 100) return "medium";
        return "low";
    }

    // Getters e Setters
    public String getCamera() { return camera; }
    public void setCamera(String camera) { this.camera = camera; }
    
    public int getDistance() { return distance; }
    public void setDistance(int distance) { 
        this.distance = distance; 
        this.severity = calculateSeverity(distance);
    }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}