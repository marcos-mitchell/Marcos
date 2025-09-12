# yolo_detect.py
import sys
import torch

model = torch.hub.load('ultralytics/yolov5', 'custom', path='yolov5n-seg.pt', force_reload=False)

image_path = sys.argv[1]

results = model(image_path)

# Mostrar resultados no console
for *box, conf, cls in results.xyxy[0]:
    print(f"{model.names[int(cls)]} {conf:.2f}")
