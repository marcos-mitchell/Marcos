// D:\Projects\watchbase-web\backend\thomas\src\main\java\com\thomas\controller\SerialSimulationController.java
package com.thomas.controller;

import com.thomas.model.Event;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/serial")
public class SerialSimulationController {

    private final SimpMessagingTemplate messagingTemplate;

    public SerialSimulationController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Endpoint para simular dados do Arduino (para testes sem hardware)
    @PostMapping("/simulate")
    public String simulateArduinoData(@RequestBody ArduinoSimulationRequest request) {
        try {
            String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
            
            // Criar evento simulado
            Event event = new Event(
                request.getCamera(), 
                request.getDistance(), 
                request.getDescription(), 
                time
            );
            
            System.out.println("🎮 Evento simulado: " + event.getCamera() + " - " + 
                             event.getDistance() + "cm");
            
            // Enviar via WebSocket como se viesse do Arduino
            messagingTemplate.convertAndSend("/topic/events", event);
            
            return "Evento simulado enviado: " + event.getDescription();
        } catch (Exception e) {
            return "Erro ao simular evento: " + e.getMessage();
        }
    }

    // Classe interna para o request
    public static class ArduinoSimulationRequest {
        private String camera;
        private int distance;
        private String description;

        // Getters e Setters
        public String getCamera() { return camera; }
        public void setCamera(String camera) { this.camera = camera; }
        public int getDistance() { return distance; }
        public void setDistance(int distance) { this.distance = distance; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}