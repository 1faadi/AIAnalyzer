import cv2
import base64
import json
import sys
import os
import tempfile
import numpy as np
from pathlib import Path

# Try to import scikit-image, fallback to basic similarity if not available
try:
    from skimage.metrics import structural_similarity as ssim
    HAS_SCIKIT_IMAGE = True
except ImportError:
    print("Warning: scikit-image not available, using basic similarity detection", file=sys.stderr)
    HAS_SCIKIT_IMAGE = False

def calculate_frame_similarity(frame1, frame2, threshold=0.85):
    """
    Calculate similarity between two frames using multiple methods
    Returns True if frames are similar (above threshold)
    """
    try:
        if frame1 is None or frame2 is None:
            return False
        
        # Convert to grayscale for comparison
        gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY) if len(frame1.shape) == 3 else frame1
        gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY) if len(frame2.shape) == 3 else frame2
        
        # Resize to standard size for faster comparison
        target_size = (160, 120)
        gray1_resized = cv2.resize(gray1, target_size)
        gray2_resized = cv2.resize(gray2, target_size)
        
        similarity_scores = []
        
        if HAS_SCIKIT_IMAGE:
            # Use SSIM for structural similarity
            ssim_score = ssim(gray1_resized, gray2_resized)
            similarity_scores.append(ssim_score)
        
        # Use histogram comparison
        hist1 = cv2.calcHist([gray1_resized], [0], None, [256], [0, 256])
        hist2 = cv2.calcHist([gray2_resized], [0], None, [256], [0, 256])
        hist_score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
        similarity_scores.append(hist_score)
        
        # Use template matching
        try:
            result = cv2.matchTemplate(gray1_resized, gray2_resized, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(result)
            similarity_scores.append(max_val)
        except:
            pass
        
        # Use the maximum similarity score
        if similarity_scores:
            max_similarity = max(similarity_scores)
            return max_similarity > threshold
        
        return False
        
    except Exception as e:
        print(f"Error calculating frame similarity: {e}", file=sys.stderr)
        return False

def extract_frames_with_opencv(video_path, output_dir, frame_interval=1, similarity_threshold=0.80):
    """
    Extract frames from video using OpenCV with real-time similarity checking
    """
    try:
        # Open video with OpenCV
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        # Video info logged to stderr to avoid JSON parsing issues
        print(f"Video info: {fps} FPS, {total_frames} total frames, {duration:.2f}s duration", file=sys.stderr)
        print(f"Similarity threshold: {similarity_threshold}", file=sys.stderr)
        
        extracted_frames = []
        frame_count = 0
        last_saved_frame = None
        skipped_frames = 0
        
        # Extract frames every frame_interval seconds with similarity checking
        current_time = 0
        while current_time < duration:
            # Calculate frame number for this time
            frame_number = int(current_time * fps)
            
            # Set video position to specific frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            
            # Read frame
            ret, frame = cap.read()
            if not ret:
                print(f"Could not read frame at {current_time:.1f}s", file=sys.stderr)
                current_time += frame_interval
                continue
            
            # Resize frame to standard size
            frame = cv2.resize(frame, (640, 480))
            
            # Check similarity with last saved frame
            should_save = True
            if last_saved_frame is not None:
                is_similar = calculate_frame_similarity(last_saved_frame, frame, similarity_threshold)
                if is_similar:
                    should_save = False
                    skipped_frames += 1
                    print(f"Frame at {current_time:.1f}s is similar to previous - skipping (total skipped: {skipped_frames})", file=sys.stderr)
            
            if should_save:
                # Create filename
                minutes = int(current_time // 60)
                seconds = int(current_time % 60)
                timestamp = f"{minutes:02d}m{seconds:02d}s"
                filename = f"frame_{frame_count}_{timestamp}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # Save frame as image
                success = cv2.imwrite(filepath, frame)
                if success:
                    # Convert to base64 for compatibility
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    extracted_frames.append({
                        "time": f"{minutes:02d}:{seconds:02d}",
                        "frame_number": frame_count,
                        "filename": filename,
                        "filepath": filepath,
                        "image_base64": frame_base64,
                        "imageUrl": f"/temp/{filename}"
                    })
                    
                    # Update last saved frame for next comparison
                    last_saved_frame = frame.copy()
                    
                    print(f"Extracted unique frame {frame_count + 1}: {filename} at {minutes:02d}:{seconds:02d}", file=sys.stderr)
                    frame_count += 1
                else:
                    print(f"Failed to save frame at {current_time:.1f}s", file=sys.stderr)
            
            # Move to next interval
            current_time += frame_interval
        
        # Clean up
        cap.release()
        
        print(f"Extraction complete: {frame_count} unique frames saved, {skipped_frames} similar frames skipped", file=sys.stderr)
        
        return {
            "success": True,
            "frames": extracted_frames,
            "total_frames_extracted": frame_count,
            "frames_skipped": skipped_frames,
            "similarity_threshold": similarity_threshold,
            "video_info": {
                "duration": duration,
                "fps": fps,
                "total_frames": total_frames,
                "frame_interval": frame_interval,
                "method": "opencv_with_similarity"
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "frames": []
        }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python extract_frames_opencv.py <video_file_path> <output_directory> [similarity_threshold]"}))
        sys.exit(1)
    
    video_path = sys.argv[1]
    output_dir = sys.argv[2]
    similarity_threshold = float(sys.argv[3]) if len(sys.argv) > 3 else 0.80
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    result = extract_frames_with_opencv(video_path, output_dir, similarity_threshold=similarity_threshold)
    print(json.dumps(result))
