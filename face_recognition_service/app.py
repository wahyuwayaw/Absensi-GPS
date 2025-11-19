from flask import Flask, request, jsonify
import face_recognition
import numpy as np
import base64
import cv2
import os

app = Flask(__name__)

def load_image_from_base64(base64_string):
    """Decodes base64 string to an OpenCV image (numpy array)."""
    try:
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        
        nparr = np.frombuffer(base64.b64decode(base64_string), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Could not decode image from base64.")
        return img
    except Exception as e:
        app.logger.error(f"Error decoding base64 image: {e}")
        return None

def get_face_encoding_from_image(image):
    """Detects faces and returns the first face encoding found."""
    rgb_image = image[:, :, ::-1] # Convert BGR (OpenCV) to RGB (face_recognition)
    face_locations = face_recognition.face_locations(rgb_image)
    if not face_locations:
        return None, "No face found in the image."
    
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    if not face_encodings:
        return None, "Could not get face encoding."
    
    return face_encodings[0].tolist(), None # Convert numpy array to list for JSON serialization

@app.route('/get_encoding', methods=['POST'])
def get_encoding():
    data = request.get_json()
    image_b64 = data.get('image')

    if not image_b64:
        return jsonify({"status": False, "message": "Image data is required."}), 400

    image = load_image_from_base64(image_b64)
    if image is None:
        return jsonify({"status": False, "message": "Invalid image data."}), 400

    face_encoding, error = get_face_encoding_from_image(image)
    if face_encoding is None:
        return jsonify({"status": False, "message": error}), 400
    
    return jsonify({"status": True, "encoding": face_encoding})

@app.route('/compare_encodings', methods=['POST'])
def compare_encodings():
    data = request.get_json()
    known_encoding = data.get('known_encoding')
    unknown_encoding = data.get('unknown_encoding')
    tolerance = data.get('tolerance', 0.6) # Default tolerance

    if not known_encoding or not unknown_encoding:
        return jsonify({"status": False, "message": "Both known and unknown encodings are required."}), 400
    
    try:
        known_encoding_np = np.array(known_encoding)
        unknown_encoding_np = np.array(unknown_encoding)
    except Exception as e:
        return jsonify({"status": False, "message": f"Invalid encoding format: {e}"}), 400

    # Compare faces
    matches = face_recognition.compare_faces([known_encoding_np], unknown_encoding_np, tolerance=tolerance)
    face_distances = face_recognition.face_distance([known_encoding_np], unknown_encoding_np)

    if matches[0]:
        return jsonify({"status": True, "match": True, "distance": face_distances[0]})
    else:
        return jsonify({"status": True, "match": False, "distance": face_distances[0]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
