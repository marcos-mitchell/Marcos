package thomasshelby;

import com.fazecast.jSerialComm.SerialPort;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.io.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.TreeMap;

public class WatchBaseV_1 {

    private static int alertCount = 0;
    private static JLabel coordenadasAlvo;
    private static final List<IntrusionEvent> eventosRegistrados = new ArrayList<>();
    private static YoloTinyDetectorV_1 yoloTinyDetector = new YoloTinyDetectorV_1();
    private static volatile boolean pessoaDetectada = false;

    public static void main(String[] args) {
        System.load("C:\\opencv\\build\\java\\x64\\opencv_java455.dll");
        SwingUtilities.invokeLater(() -> criarInterface("COM7"));
    }

    public static void criarInterface(String porta) {
        JFrame frame = new JFrame("📡 WatchBase - Sistema de Monitoramento");
        frame.setSize(900, 600);
        frame.setLayout(new BorderLayout(10, 10));
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.getContentPane().setBackground(new Color(30, 30, 30));

        RadarPanel radarPanel = new RadarPanel();
        radarPanel.setPreferredSize(new Dimension(600, 600));

        JPanel sidePanel = new JPanel();
        sidePanel.setLayout(new BoxLayout(sidePanel, BoxLayout.Y_AXIS));
        sidePanel.setBackground(new Color(45, 45, 45));
        sidePanel.setBorder(BorderFactory.createTitledBorder(BorderFactory.createLineBorder(Color.LIGHT_GRAY), "🎛 Controlo", 0, 0, new Font("SansSerif", Font.BOLD, 14), Color.WHITE));
        sidePanel.setPreferredSize(new Dimension(250, 600));

        JLabel pirStatus = criarLabel("PIR: -", Color.WHITE);
        JLabel distStatus = criarLabel("Distância: - cm", Color.WHITE);
        JLabel nivelAlerta = criarLabel("Nível: -", Color.LIGHT_GRAY);
        JLabel contadorAlertas = criarLabel("Alertas: 0", Color.ORANGE);
        coordenadasAlvo = criarLabel("Coordenadas: -", Color.CYAN);

        JButton resetButton = criarBotao("🔄 Resetar alertas", new Color(70, 130, 180));
        JButton exportButton = criarBotao("💾 Exportar eventos", new Color(60, 179, 113));
        JButton graficoButton = criarBotao("📊 Ver Gráfico", new Color(123, 104, 238));

        sidePanel.add(Box.createRigidArea(new Dimension(0, 10)));
        sidePanel.add(pirStatus);
        sidePanel.add(distStatus);
        sidePanel.add(nivelAlerta);
        sidePanel.add(contadorAlertas);
        sidePanel.add(coordenadasAlvo);
        sidePanel.add(Box.createVerticalStrut(20));
        sidePanel.add(resetButton);
        sidePanel.add(Box.createVerticalStrut(10));
        sidePanel.add(exportButton);
        sidePanel.add(Box.createVerticalStrut(10));
        sidePanel.add(graficoButton);

        frame.add(radarPanel, BorderLayout.CENTER);
        frame.add(sidePanel, BorderLayout.EAST);
        frame.setVisible(true);

        SerialPort serialPort = SerialPort.getCommPort(porta);
        serialPort.setComPortParameters(9600, 8, 1, 0);
        serialPort.setComPortTimeouts(SerialPort.TIMEOUT_SCANNER, 0, 0);

        if (serialPort.openPort()) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(serialPort.getInputStream()));

            new Thread(() -> {
                String linha;
                try {
                    while ((linha = reader.readLine()) != null) {
                        String finalLinha = linha.trim();
                        SwingUtilities.invokeLater(() -> {
                            processarLinha(finalLinha, pirStatus, distStatus, nivelAlerta, contadorAlertas, radarPanel);
                        });
                    }
                } catch (IOException ex) {
                    JOptionPane.showMessageDialog(frame, "[ERRO] Falha na leitura: " + ex.getMessage());
                }
            }).start();

            exportButton.addActionListener(ev -> {
                JFileChooser fileChooser = new JFileChooser();
                if (fileChooser.showSaveDialog(frame) == JFileChooser.APPROVE_OPTION) {
                    try (FileWriter writer = new FileWriter(fileChooser.getSelectedFile())) {
                        writer.write("[Exportação indisponível nesta versão com radar]");
                        JOptionPane.showMessageDialog(frame, "✅ Exportado com sucesso!");
                    } catch (IOException ex) {
                        JOptionPane.showMessageDialog(frame, "Erro ao exportar: " + ex.getMessage());
                    }
                }
            });

            resetButton.addActionListener((ActionEvent e) -> {
                alertCount = 0;
                contadorAlertas.setText("Alertas: 0");
            });

            graficoButton.addActionListener(e -> {
                JFrame statsFrame = new JFrame("📊 Estatísticas de Intrusões");
                statsFrame.setSize(700, 500);
                statsFrame.setLocationRelativeTo(frame);
                statsFrame.setContentPane(new StatisticsPanel(eventosRegistrados));
                statsFrame.setVisible(true);
            });
        }
    }

    private static void processarLinha(String linha, JLabel pirStatus, JLabel distStatus,
                                     JLabel nivelAlerta, JLabel contadorAlertas, RadarPanel radarPanel) {
        if (linha.contains("PIR:") || linha.contains("ESTADO DO PIR")) {
            pirStatus.setText("PIR: 1");
        }

        if (linha.toLowerCase().contains("dist") || linha.contains("cm")) {
            String dist = linha.replaceAll("[^0-9]", "").trim();
            if (!dist.isEmpty()) {
                distStatus.setText("Distância: " + dist + " cm");
                try {
                    int d = Integer.parseInt(dist);
                    radarPanel.setDistance(d);

                    int angulo = radarPanel.getAnguloAtual();
                    if (d > 0 && d < 300) {
                        radarPanel.setPosicaoAlvo(angulo, d);
                    } else {
                        radarPanel.limparAlvo();
                    }

                    if (d <= 80) {
                        yoloTinyDetector.startYoloDetection(1, result -> {
                            pessoaDetectada = result;
                            SwingUtilities.invokeLater(() -> {
                                if (pessoaDetectada) {
                                    ativarAlertaCritico(d, angulo, nivelAlerta, contadorAlertas, coordenadasAlvo, radarPanel);
                                } else {
                                    nivelAlerta.setText("Nível: ⚠ Objecto Detectado");
                                    nivelAlerta.setForeground(Color.ORANGE);
                                }
                            });
                        });
                    } else if (d > 80 && d <= 100) {
                        nivelAlerta.setText("Nível: ⚠ Médio");
                        nivelAlerta.setForeground(Color.ORANGE);
                        registrarEvento("Alerta médio - Distância: " + d + " cm", "Eventos_medios.txt");
                        eventosRegistrados.add(new IntrusionEvent(LocalDateTime.now(), "Médio"));
                    } else {
                        nivelAlerta.setText("Nível: ✅ Seguro");
                        nivelAlerta.setForeground(new Color(0, 255, 127));
                        coordenadasAlvo.setText("Coordenadas: -");
                        radarPanel.limparAlvo();
                        pessoaDetectada = false;
                    }
                    contadorAlertas.setText("Alertas: " + alertCount);
                } catch (NumberFormatException ignored) {}
            }
        }
    }

    private static void ativarAlertaCritico(int distancia, int angulo, JLabel nivelAlerta, 
                                          JLabel contadorAlertas, JLabel coordenadasAlvo, 
                                          RadarPanel radarPanel) {
        nivelAlerta.setText("Especie: 🚨 Pessoa Detectada!");
        nivelAlerta.setForeground(Color.RED);
        alertCount++;
        
        double xReal = distancia * Math.cos(Math.toRadians(angulo));
        double yReal = distancia * Math.sin(Math.toRadians(angulo));

        String nomeQuadrante = determinarQuadrante(xReal, yReal);
        String textoCoord = String.format("X=%.1f cm, Y=%.1f cm", xReal, yReal);

        coordenadasAlvo.setText("<html>Coordenadas: " + textoCoord + "<br>📌 Localização: " + nomeQuadrante + "</html>");

        String mensagem = String.format(
            "Pessoa detectada - Distância: %d cm - Coordenadas: X=%.1f cm, Y=%.1f cm - Localização: %s",
            distancia, xReal, yReal, nomeQuadrante
        );

        registrarEvento(mensagem, "Eventos_de_Intrusao.txt");
        eventosRegistrados.add(new IntrusionEvent(LocalDateTime.now(), "Crítico"));
        
        acionarBuzzer();
    }

    private static String determinarQuadrante(double x, double y) {
        if (x < 0 && y > 0) return "🧱 Z. Centro de Exames Medicos";
        if (x > 0 && y > 0) return "🚪 Portão Principal";
        if (x > 0 && y < 0) return "📦 Zona da FAUMIL";
        if (x < 0 && y < 0) return "🅿 Área de Estacionamento";
        return "Centro ou eixo";
    }

    private static void acionarBuzzer() {
        System.out.println("BUZZER: Acionado para pessoa detectada!");
    }

    private static JButton criarBotao(String texto, Color cor) {
        JButton botao = new JButton(texto);
        botao.setFocusPainted(false);
        botao.setBackground(cor);
        botao.setForeground(Color.WHITE);
        botao.setFont(new Font("SansSerif", Font.BOLD, 13));
        botao.setAlignmentX(Component.LEFT_ALIGNMENT);
        botao.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return botao;
    }

    private static void registrarEvento(String mensagem, String nomeFicheiro) {
        try (FileWriter writer = new FileWriter(nomeFicheiro, true)) {
            String timestamp = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
            writer.write("[" + timestamp + "] " + mensagem + "\n");
        } catch (IOException e) {
            System.err.println("Erro ao gravar evento: " + e.getMessage());
        }
    }

    private static JLabel criarLabel(String texto, Color cor) {
        JLabel label = new JLabel(texto);
        label.setForeground(cor);
        label.setFont(new Font("SansSerif", Font.BOLD, 14));
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        return label;
    }
}

class IntrusionEvent {
    private LocalDateTime timestamp;
    private String type;

    public IntrusionEvent(LocalDateTime timestamp, String type) {
        this.timestamp = timestamp;
        this.type = type;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public String getType() {
        return type;
    }
}

class IntrusionStatsService {
    public Map<String, Map<String, Integer>> countByHourAndType(List<IntrusionEvent> eventos) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:00");
        Map<String, Map<String, Integer>> mapa = new TreeMap<>();

        for (IntrusionEvent ev : eventos) {
            String hora = ev.getTimestamp().format(formatter);
            String tipo = ev.getType();

            mapa.putIfAbsent(hora, new HashMap<>());
            Map<String, Integer> innerMap = mapa.get(hora);
            innerMap.put(tipo, innerMap.getOrDefault(tipo, 0) + 1);
        }

        return mapa;
    }
}

class StatisticsPanel extends JPanel {
    public StatisticsPanel(List<IntrusionEvent> eventos) {
        setLayout(new BorderLayout());

        IntrusionStatsService service = new IntrusionStatsService();
        Map<String, Map<String, Integer>> dados = service.countByHourAndType(eventos);

        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        for (Map.Entry<String, Map<String, Integer>> entry : dados.entrySet()) {
            String hora = entry.getKey();
            for (Map.Entry<String, Integer> tipoEntry : entry.getValue().entrySet()) {
                dataset.addValue(tipoEntry.getValue(), tipoEntry.getKey(), hora);
            }
        }

        JFreeChart grafico = ChartFactory.createBarChart(
            "Intrusões por Hora",
            "Hora",
            "Quantidade",
            dataset
        );

        CategoryPlot plot = grafico.getCategoryPlot();
        BarRenderer renderer = (BarRenderer) plot.getRenderer();

        renderer.setSeriesPaint(0, Color.RED);     // série 0 = "Crítico"
        renderer.setSeriesPaint(1, Color.YELLOW);  // série 1 = "Médio" 

        ChartPanel chartPanel = new ChartPanel(grafico);
        add(chartPanel, BorderLayout.CENTER);
    }
}