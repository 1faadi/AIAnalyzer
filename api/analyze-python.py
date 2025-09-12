# Vercel Python Runtime (Limited capabilities)
from http.server import BaseHTTPRequestHandler
import json
import cv2
import numpy as np
from ultralytics import YOLO
import requests
import os

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            video_url = data.get('videoUrl')
            job_id = data.get('jobId')
            
            # Download video from URL
            response = requests.get(video_url)
            video_path = f'/tmp/{job_id}.mp4'
            
            with open(video_path, 'wb') as f:
                f.write(response.content)
            
            # Process with lightweight model only
            results = process_video_lightweight(video_path, job_id)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(results).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

def process_video_lightweight(video_path: str, job_id: str):
    # Lightweight processing only - no full YOLO pipeline
    cap = cv2.VideoCapture(video_path)
    
    # Extract only 5-10 frames max
    frame_count = 0
    max_frames = 5
    
    frames = []
    while cap.read()[0] and frame_count < max_frames:
        ret, frame = cap.read()
        if frame_count % 30 == 0:  # Every 30th frame
            # Basic analysis only
            frames.append({
                'time': f'{frame_count//30:02d}:00',
                'analysis': 'Basic frame extracted'
            })
        frame_count += 1
    
    cap.release()
    
    return {
        'frames': frames,
        'analysis': 'Lightweight processing completed'
    }
