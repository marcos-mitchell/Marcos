// D:\Projects\watchbase-web\backend\thomas\src\main\java\com\thomas\services\SerialService.java
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
        SerialPort comPort = SerialPort.getCommPort("COM7"); // Porta serial física
        comPort.setBaudRate(9600);
        comPort.setComPortTimeouts(SerialPort.TIMEOUT_READ_SEMI_BLOCKING, 0, 0);

        if(comPort.openPort()) {
            System.out.println("✅ Porta Serial COM7 aberta com sucesso!");
            System.out.println("📡 Aguardando dados do Arduino...");
        } else {
            System.out.println("❌ Falha ao abrir a porta serial COM7!");
            return;
        }

        new Thread(() -> {
            try {
                Scanner scanner = new Scanner(comPort.getInputStream());
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine().trim();
                    System.out.println("📨 Dados recebidos do Arduino: " + line);

                    // Parse da linha no formato: CAMERA:X;DISTANCE:Y;DESC:Z;TIME:W
                    try {
                        String[] parts = line.split(";");
                        if (parts.length >= 4) {
                            String camera = parts[0].split(":")[1].trim();
                            int distance = Integer.parseInt(parts[1].split(":")[1].trim());
                            String description = parts[2].split(":")[1].trim();
                            String time = parts[3].split(":")[1].trim();

                            Event event = new Event(camera, distance, description, time);
                            
                            System.out.println("🎯 Evento processado: " + event.getCamera() + 
                                             " - " + event.getDistance() + "cm - " + 
                                             event.getSeverity().toUpperCase());

                            // Enviar para WebSocket
                            messagingTemplate.convertAndSend("/topic/events", event);
                        }
                    } catch (Exception e) {
                        System.out.println("❌ Erro ao processar dados do Arduino: " + e.getMessage());
                    }
                }
                scanner.close();
            } catch (Exception e) {
                System.out.println("❌ Erro na leitura serial: " + e.getMessage());
            } finally {
                comPort.closePort();
            }
        }).start();
    }
}