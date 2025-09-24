package com.thomas.services;

import com.fazecast.jSerialComm.SerialPort;
import com.thomas.model.Event;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Scanner;

@Service
@ConditionalOnProperty(name="serial.enabled", havingValue="true", matchIfMissing=false)
public class SerialService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostConstruct
    public void startReading() {
        SerialPort comPort = SerialPort.getCommPort("COM7"); // ajustar porta
        comPort.setBaudRate(9600);

        if(comPort.openPort()) {
            System.out.println("Porta Serial aberta com sucesso!");
        } else {
            System.out.println("Falha ao abrir a porta serial!");
            return;
        }

        new Thread(() -> {
            Scanner scanner = new Scanner(comPort.getInputStream());
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                System.out.println("Evento recebido: " + line);

                // Parse da linha
                String[] parts = line.split(";");
                String camera = parts[0].split(":")[1];
                int distance = Integer.parseInt(parts[1].split(":")[1]);
                String description = parts[2].split(":")[1];
                String time = parts[3].split(":")[1];

                Event event = new Event(camera, distance, description, time);

                // Enviar para WebSocket
                messagingTemplate.convertAndSend("/topic/events", event);
            }
            scanner.close();
            comPort.closePort();
        }).start();
    }
}
