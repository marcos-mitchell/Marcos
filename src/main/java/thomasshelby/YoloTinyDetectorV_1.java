package thomasshelby;

import org.opencv.core.*;
import org.opencv.dnn.*;
import org.opencv.videoio.VideoCapture;
import org.opencv.videoio.Videoio;
import org.opencv.imgproc.Imgproc;
import org.opencv.highgui.HighGui;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class YoloTinyDetectorV_1 {
    static {
        System.load("C:\\opencv\\build\\java\\x64\\opencv_java455.dll");
    }

    private Net net;
    private List<String> classNames;
    private volatile boolean detectionRunning = false;
    private Scalar[] colors;
    private Consumer<Boolean> detectionCallback;
    private volatile boolean pessoaDetectada;
    private VideoCapture cap;
    private HighGuiWindowManager windowManager;

    public YoloTinyDetectorV_1() {
        String basePath = "C:\\Projects\\watchbase\\YOLO\\";
        String namesPath = basePath + "coco.names";
        String cfgPath = basePath + "yolov3-tiny.cfg";
        String weightsPath = basePath + "yolov3-tiny.weights";

        try {
            classNames = Files.readAllLines(Paths.get(namesPath));
            colors = new Scalar[classNames.size()];
            Random rng = new Random();
            for (int i = 0; i < classNames.size(); i++) {
                colors[i] = new Scalar(rng.nextInt(255), rng.nextInt(255), rng.nextInt(255));
            }
            
            net = Dnn.readNetFromDarknet(cfgPath, weightsPath);
            net.setPreferableBackend(Dnn.DNN_BACKEND_OPENCV);
            net.setPreferableTarget(Dnn.DNN_TARGET_CPU);
            
            windowManager = new HighGuiWindowManager();
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to initialize YOLO detector", e);
        }
    }

    public void startYoloDetection(int cameraIndex) {
        startYoloDetection(cameraIndex, null);
    }

    public void startYoloDetection(int cameraIndex, Consumer<Boolean> callback) {
        if (detectionRunning) {
            System.out.println("Detection is already running");
            return;
        }
        
        this.detectionCallback = callback;
        this.detectionRunning = true;
        this.pessoaDetectada = false;

        new Thread(() -> {
            try {
                cap = new VideoCapture(cameraIndex);
                if (!cap.isOpened()) {
                    System.err.println("Error: Could not open camera");
                    notifyCallback(false);
                    return;
                }

                // Configurações da câmera
                cap.set(Videoio.CAP_PROP_FRAME_WIDTH, 640);
                cap.set(Videoio.CAP_PROP_FRAME_HEIGHT, 480);
                final double SCALE_FACTOR = 0.8;

                Mat frame = new Mat();
                long startTime = System.currentTimeMillis();
                int frameCount = 0;

                while (detectionRunning && (System.currentTimeMillis() - startTime < 5000)) {
                    if (!cap.read(frame) || frame.empty()) {
                        System.err.println("Error: Could not read frame");
                        break;
                    }

                    // Processamento do frame
                    processFrame(frame, SCALE_FACTOR);
                    
                    // Exibir resultado
                    windowManager.showFrame("Detection - System!", frame);
                    
                    // Verificar tecla ESC para sair
                    if (windowManager.waitKey(1) == 27) {
                        break;
                    }
                    
                    frameCount++;
                }

                // Estatísticas de desempenho
                double fps = frameCount / ((System.currentTimeMillis() - startTime) / 1000.0);
                System.out.printf("Processed %d frames (%.2f fps)%n", frameCount, fps);

            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                cleanupResources();
                notifyCallback(pessoaDetectada);
            }
        }).start();
    }

    private void processFrame(Mat frame, double scaleFactor) {
        // Pré-processamento
        Mat processedFrame = preprocessFrame(frame);
        
        // Redimensionamento
        Mat resizedFrame = new Mat();
        Size targetSize = new Size(frame.width() * scaleFactor, frame.height() * scaleFactor);
        Imgproc.resize(processedFrame, resizedFrame, targetSize, 0, 0, Imgproc.INTER_LINEAR);

        // Detecção de objetos
        Mat blob = Dnn.blobFromImage(resizedFrame, 1/255.0, new Size(416, 416), new Scalar(0), true, false);
        net.setInput(blob);

        List<Mat> outs = new ArrayList<>();
        net.forward(outs, getOutputLayerNames());
        
        // Processar resultados
        processarDetecoes(outs, targetSize, frame, scaleFactor);

        // Liberar recursos
        resizedFrame.release();
        blob.release();
        outs.forEach(Mat::release);
        processedFrame.release();
    }

    private List<String> getOutputLayerNames() {
        List<String> layerNames = net.getLayerNames();
        return net.getUnconnectedOutLayers().toList().stream()
                .map(i -> layerNames.get(i - 1))
                .collect(Collectors.toList());
    }

    private Mat preprocessFrame(Mat frame) {
        if (frame.channels() > 1) {
            Mat grayFrame = new Mat();
            Imgproc.cvtColor(frame, grayFrame, Imgproc.COLOR_BGR2GRAY);
            Imgproc.equalizeHist(grayFrame, grayFrame);
            Imgproc.cvtColor(grayFrame, frame, Imgproc.COLOR_GRAY2BGR);
            grayFrame.release();
        }
        return frame;
    }

    private void processarDetecoes(List<Mat> outs, Size targetSize, Mat frame, double scaleFactor) {
        List<Integer> classIds = new ArrayList<>();
        List<Float> confidences = new ArrayList<>();
        List<Rect2d> boxes = new ArrayList<>();

        for (Mat out : outs) {
            for (int i = 0; i < out.rows(); i++) {
                Mat row = out.row(i);
                float[] data = new float[(int) row.total()];
                row.get(0, 0, data);

                float confidence = data[4];
                if (confidence > 0.3) {
                    float[] scores = Arrays.copyOfRange(data, 5, data.length);
                    int classId = argMax(scores);
                    float classConfidence = scores[classId];

                    if (classConfidence > 0.3) {
                        if (classId == 0) {  // ID 0 = pessoa no COCO
                            pessoaDetectada = true;
                        }

                        int centerX = (int) (data[0] * targetSize.width);
                        int centerY = (int) (data[1] * targetSize.height);
                        int w = (int) (data[2] * targetSize.width);
                        int h = (int) (data[3] * targetSize.height);
                        int x = centerX - w / 2;
                        int y = centerY - h / 2;

                        boxes.add(new Rect2d(x, y, w, h));
                        confidences.add(classConfidence);
                        classIds.add(classId);
                    }
                }
            }
        }

        // Aplicar Non-Maximum Suppression
        if (!boxes.isEmpty()) {
            MatOfRect2d boxesMat = new MatOfRect2d();
            boxesMat.fromList(boxes);
            MatOfFloat confidencesMat = new MatOfFloat(toFloatArray(confidences));
            MatOfInt indices = new MatOfInt();
            Dnn.NMSBoxes(boxesMat, confidencesMat, 0.3f, 0.4f, indices);

            // Desenhar caixas
            int[] indicesArray = indices.toArray();
            for (int i : indicesArray) {
                Rect2d box = boxes.get(i);
                box.x /= scaleFactor;
                box.y /= scaleFactor;
                box.width /= scaleFactor;
                box.height /= scaleFactor;
                
                int id = classIds.get(i);
                String label = classNames.get(id) + ": " + String.format("%.2f", confidences.get(i));
                Scalar color = colors[id];

                Imgproc.rectangle(frame, box.tl(), box.br(), color, 2);
                Imgproc.putText(frame, label, new Point(box.x, box.y - 5),
                        Imgproc.FONT_HERSHEY_SIMPLEX, 0.5, color, 2);
            }
        }
    }

    private int argMax(float[] array) {
        int maxIndex = 0;
        for (int i = 1; i < array.length; i++) {
            if (array[i] > array[maxIndex]) {
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    private float[] toFloatArray(List<Float> list) {
        float[] arr = new float[list.size()];
        for (int i = 0; i < list.size(); i++) {
            arr[i] = list.get(i);
        }
        return arr;
    }

    private void cleanupResources() {
        detectionRunning = false;
        
        if (cap != null && cap.isOpened()) {
            try {
                Thread.sleep(200);  // Delay para operações assíncronas
                cap.release();
            } catch (Exception e) {
                System.err.println("Error releasing camera: " + e.getMessage());
            }
        }
        
        windowManager.destroyAllWindows();
    }

    private void notifyCallback(boolean result) {
        if (detectionCallback != null) {
            try {
                detectionCallback.accept(result);
            } catch (Exception e) {
                System.err.println("Error in detection callback: " + e.getMessage());
            }
        }
    }

    private static class HighGuiWindowManager {
        private final Set<String> openWindows = new HashSet<>();

        public void showFrame(String windowName, Mat frame) {
            if (!openWindows.contains(windowName)) {
                HighGui.namedWindow(windowName, HighGui.WINDOW_AUTOSIZE);
                openWindows.add(windowName);
            }
            HighGui.imshow(windowName, frame);
        }

        public int waitKey(int delay) {
            return HighGui.waitKey(delay);
        }

        public void destroyAllWindows() {
            openWindows.forEach(HighGui::destroyWindow);
            openWindows.clear();
            try {
                Thread.sleep(300);  // Delay para fechamento das janelas
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}