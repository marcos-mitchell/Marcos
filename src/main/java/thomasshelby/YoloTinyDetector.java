package thomasshelby;

import org.opencv.core.*;
import org.opencv.dnn.*;
import org.opencv.videoio.VideoCapture;
import org.opencv.videoio.Videoio;
import org.opencv.imgproc.Imgproc;
import org.opencv.highgui.HighGui;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

public class YoloTinyDetector {
    static {
        System.load("C:\\opencv\\build\\java\\x64\\opencv_java455.dll");
    }

    public  void startYoloDetection(int cameraIndex) {
        new Thread(() -> {
            try {
                // Caminhos dos arquivos
                String basePath = "C:\\Projects\\watchbase\\YOLOv5\\";
                String namesPath = basePath + "coco.names";
                String cfgPath = basePath + "yolov3.cfg";
                String weightsPath = basePath + "yolov3.weights";

                // Verifica se os arquivos existem
                if (!Files.exists(Paths.get(namesPath))) {
                    System.err.println("Arquivo de nomes não encontrado: " + namesPath);
                    return;
                }
                if (!Files.exists(Paths.get(cfgPath))) {
                    System.err.println("Arquivo de configuração não encontrado: " + cfgPath);
                    return;
                }
                if (!Files.exists(Paths.get(weightsPath))) {
                    System.err.println("Arquivo de pesos não encontrado: " + weightsPath);
                    return;
                }

                // Lê os nomes das classes
                List<String> classNames = Files.readAllLines(Paths.get(namesPath));

                // Gera cores para as classes
                Scalar[] colors = new Scalar[classNames.size()];
                Random rng = new Random();
                for (int i = 0; i < classNames.size(); i++) {
                    colors[i] = new Scalar(rng.nextInt(255), rng.nextInt(255), rng.nextInt(255));
                }

                // Carrega rede
                Net net = Dnn.readNetFromDarknet(cfgPath, weightsPath);
                net.setPreferableBackend(Dnn.DNN_BACKEND_OPENCV);
                net.setPreferableTarget(Dnn.DNN_TARGET_CPU);

                // Pega os nomes das camadas de saída
                List<String> layerNames = net.getLayerNames();
                List<String> outputLayers = net.getUnconnectedOutLayers().toList().stream()
                        .map(i -> layerNames.get(i - 1))
                        .collect(Collectors.toList());

                VideoCapture cap = new VideoCapture(cameraIndex);
                if (!cap.isOpened()) {
                    System.out.println("Erro ao abrir a câmera.");
                    return;
                }

                // Configurações otimizadas
                final double SCALE_FACTOR = 0.8;  // Aumentado de 0.6 para 0.8
                //int frameSkip = 1;  // Processa todos os frames (antes era 2)
                
                // Configura resolução da câmera
                cap.set(Videoio.CAP_PROP_FRAME_WIDTH, 640);
                cap.set(Videoio.CAP_PROP_FRAME_HEIGHT, 480);

                Mat frame = new Mat();
                Size targetSize = new Size();
               // int frameCount = 0;

                while (true) {
                    if (!cap.read(frame)) break;

                    // Pré-processamento melhorado
                    if (frame.channels() > 1) {
                        Mat grayFrame = new Mat();
                        Imgproc.cvtColor(frame, grayFrame, Imgproc.COLOR_BGR2GRAY);
                        Imgproc.equalizeHist(grayFrame, grayFrame);
                        Imgproc.cvtColor(grayFrame, frame, Imgproc.COLOR_GRAY2BGR);
                        grayFrame.release();
                    }

                    // Redimensiona o frame para processamento
                    Mat resizedFrame = new Mat();
                    Size originalSize = new Size(frame.width(), frame.height());
                    targetSize.width = originalSize.width * SCALE_FACTOR;
                    targetSize.height = originalSize.height * SCALE_FACTOR;
                    
                    Imgproc.resize(frame, resizedFrame, targetSize, 0, 0, Imgproc.INTER_LINEAR);

                    // Blob a partir do frame redimensionado
                    Mat blob = Dnn.blobFromImage(resizedFrame, 1 / 255.0, new Size(416, 416), new Scalar(0), true, false);
                    net.setInput(blob);

                    // Forward
                    List<Mat> outs = new ArrayList<>();
                    net.forward(outs, outputLayers);

                    List<Integer> classIds = new ArrayList<>();
                    List<Float> confidences = new ArrayList<>();
                    List<Rect2d> boxes = new ArrayList<>();

                    for (Mat out : outs) {
                        for (int i = 0; i < out.rows(); i++) {
                            Mat row = out.row(i);
                            float[] data = new float[(int) row.total()];
                            row.get(0, 0, data);

                            float confidence = data[4];
                            // Limiar de confiança reduzido para 0.3 (antes 0.4)
                            if (confidence > 0.3) {
                                float[] scores = Arrays.copyOfRange(data, 5, data.length);
                                int classId = maxIndex(scores);
                                float classConfidence = scores[classId];

                                // Limiar de confiança da classe reduzido para 0.3
                                if (classConfidence > 0.3) {
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

                    // NMS com parâmetros ajustados
                    MatOfRect2d boxesMat = new MatOfRect2d();
                    boxesMat.fromList(boxes);
                    MatOfFloat confidencesMat = new MatOfFloat(toFloatArray(confidences));
                    MatOfInt indices = new MatOfInt();

                    // Parâmetros NMS ajustados (mais permissivos)
                    Dnn.NMSBoxes(boxesMat, confidencesMat, 0.3f, 0.4f, indices);

                    // Verifique se há índices válidos
                    int[] indicesArray = {};
                    if (indices.total() > 0) {
                        indicesArray = indices.toArray();
                    }

                    for (int i : indicesArray) {
                        Rect2d box = boxes.get(i);
                        // Ajusta as coordenadas para o tamanho original
                        box.x = box.x / SCALE_FACTOR;
                        box.y = box.y / SCALE_FACTOR;
                        box.width = box.width / SCALE_FACTOR;
                        box.height = box.height / SCALE_FACTOR;
                        
                        int id = classIds.get(i);
                        String label = classNames.get(id) + ": " + String.format("%.2f", confidences.get(i));
                        Scalar color = colors[id];

                        Imgproc.rectangle(frame, box.tl(), box.br(), color, 2);
                        Imgproc.putText(frame, label, new Point(box.x, box.y - 5),
                                Imgproc.FONT_HERSHEY_SIMPLEX, 0.5, color, 2);
                    }

                    HighGui.imshow("Deteccao Facial", frame);
                    if (HighGui.waitKey(1) == 27) break; // ESC para sair
                    
                    // Libera os recursos
                    resizedFrame.release();
                    blob.release();
                    for (Mat out : outs) {
                        out.release();
                    }
                }

                cap.release();
                HighGui.destroyAllWindows();

            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private static float[] toFloatArray(List<Float> list) {
        float[] arr = new float[list.size()];
        for (int i = 0; i < list.size(); i++) arr[i] = list.get(i);
        return arr;
    }

    private static int maxIndex(float[] arr) {
        int maxIdx = 0;
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > arr[maxIdx]) maxIdx = i;
        }
        return maxIdx;
    }

    public static void main(String[] args) {
        //YoloTinyDetector yolo = new YoloTinyDetector();
        //yolo.startYoloDetection(0, Videoio.CAP_ANY);
    }
}