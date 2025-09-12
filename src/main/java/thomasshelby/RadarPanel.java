package thomasshelby;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

public class RadarPanel extends JPanel implements ActionListener {
    private int angle = 0;                   // Ângulo atual do varredor
    private int distance = 1000;            // Ainda usado para cor do setor, se necessário
    private double anguloAlvo = -1;         // Ângulo real do alvo
    private double distanciaAlvo = -1;      // Distância real do alvo (cm)
    private final Timer timer;

    public RadarPanel() {
        this.setPreferredSize(new Dimension(600, 600));
        this.setBackground(Color.BLACK);
        timer = new Timer(40, this);
        timer.start();
    }

    
    public void setPosicaoAlvo(double angulo, double distancia) {
        this.anguloAlvo = angulo;
        this.distanciaAlvo = distancia;
        repaint();
    }

    
    public void limparAlvo() {
        this.anguloAlvo = -1;
        this.distanciaAlvo = -1;
        repaint();
    }

    public int getAnguloAtual() {
        return angle;
    }

    
    public void setDistance(int distance) {
        this.distance = distance;
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int width = getWidth();
        int height = getHeight();
        int radius = Math.min(width, height) / 2 - 20;
        int centerX = width / 2;
        int centerY = height / 2;
       
        Color backgroundSector;
        if (distanciaAlvo >= 0) {
            if (distanciaAlvo <= 80) backgroundSector = new Color(255, 0, 0, 80); // vermelho
            else if (distanciaAlvo <= 100) backgroundSector = new Color(255, 255, 0, 80); // amarelo
            else backgroundSector = new Color(0, 255, 0, 80); // verde
        } else {
            backgroundSector = new Color(0, 255, 0, 80); // verde padrão
        }

        
        g2d.setColor(backgroundSector);
        int arcAngle = 30;
        g2d.fillArc(centerX - radius, centerY - radius, radius * 2, radius * 2,
                -angle - arcAngle / 2, arcAngle);

        
        g2d.setColor(Color.GREEN);
        g2d.setStroke(new BasicStroke(2));

        for (int i = 1; i <= 4; i++) {
            int r = i * radius / 4;
            g2d.drawOval(centerX - r, centerY - r, r * 2, r * 2);
        }

        for (int i = 0; i < 360; i += 30) {
            double rad = Math.toRadians(i);
            int x = centerX + (int) (radius * Math.cos(rad));
            int y = centerY - (int) (radius * Math.sin(rad));
            g2d.drawLine(centerX, centerY, x, y);
        }

        
        double sweepRad = Math.toRadians(angle);
        int xSweep = centerX + (int) (radius * Math.cos(sweepRad));
        int ySweep = centerY - (int) (radius * Math.sin(sweepRad));
        g2d.setColor(new Color(0, 255, 0, 180));
        g2d.drawLine(centerX, centerY, xSweep, ySweep);

        
        if (anguloAlvo >= 0 && distanciaAlvo >= 0 && distanciaAlvo < 300) {
            double rad = Math.toRadians(anguloAlvo);
            int raioPx = (int) (distanciaAlvo * radius / 300.0);


            int xAlvo = centerX + (int) (raioPx * Math.cos(rad));
            int yAlvo = centerY - (int) (raioPx * Math.sin(rad));

            Color corAlvo = Color.CYAN;
            if (distanciaAlvo < 80) corAlvo = Color.RED;
            else if (distanciaAlvo > 80 && distanciaAlvo <= 100) corAlvo = Color.YELLOW;

            g2d.setColor(corAlvo);
            g2d.fillOval(xAlvo - 6, yAlvo - 6, 12, 12);
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        angle = (angle + 2) % 360;
        repaint();
    }

    
    public Point getUltimaCoordenadaAlvo() {
        if (anguloAlvo < 0 || distanciaAlvo < 0) return null;

        int w = getWidth();
        int h = getHeight();
        int raio = Math.min(w, h) / 2 - 20;
        int cx = w / 2;
        int cy = h / 2;

        int escala = raio / 300;
        int rPx = (int) (distanciaAlvo * escala);

        double rad = Math.toRadians(anguloAlvo);
        int x = (int) (cx + rPx * Math.cos(rad));
        int y = (int) (cy - rPx * Math.sin(rad));

        return new Point(x, y);
    }
}
