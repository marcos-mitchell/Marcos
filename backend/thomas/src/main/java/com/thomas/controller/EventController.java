package com.thomas.controller; 

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final SimpMessagingTemplate messagingTemplate;

    public EventController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public Map<String, String> sendEvent(@RequestBody Map<String, String> event) {
        // envia evento para todos os clients conectados
        messagingTemplate.convertAndSend("/topic/alerts", event);
        return event;
    }
}
