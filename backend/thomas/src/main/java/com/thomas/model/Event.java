package com.thomas.model;

public class Event {
    private String camera;
    private int distance;
    private String description;
    private String time;

    public Event(String camera, int distance, String description, String time) {
        this.camera = camera;
        this.distance = distance;
        this.description = description;
        this.time = time;
    }

    // Getters e Setters
    public String getCamera() { return camera; }
    public int getDistance() { return distance; }
    public String getDescription() { return description; }
    public String getTime() { return time; }
}

