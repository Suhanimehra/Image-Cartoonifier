import cv2
import numpy as np
import os
from flask import Flask, request, send_file, render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder='templates')

# Configuring directories
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['CARTOON_FOLDER'] = 'cartoonized_images'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB file size limit

# Function to check file extension
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# OpenCV cartoonization function with improved parameters
def cartoonize_image(image, k=8):
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply median blur to the grayscale image
        gray = cv2.medianBlur(gray, 5)
        
        # Detect edges using adaptive thresholding
        edges = cv2.adaptiveThreshold(gray, 255, 
                                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                    cv2.THRESH_BINARY, 9, 8)

        # Apply bilateral filter to reduce noise while keeping edges sharp
        color = cv2.bilateralFilter(image, 9, 300, 300)

        # K-means clustering for color quantization
        data = np.float32(color).reshape((-1, 3))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
        _, label, center = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        center = np.uint8(center)
        result = center[label.flatten()]
        result = result.reshape(color.shape)

        # Combine the edges with the color-quantized image
        cartoon = cv2.bitwise_and(result, result, mask=edges)

        return cartoon
    except Exception as e:
        print(f"Error in cartoonization: {str(e)}")
        return None

# Route to render the HTML page
@app.route('/')
def home():
    return render_template('index.html')

# Route to handle image upload and cartoonization
@app.route('/cartoonify', methods=['POST'])
def cartoonify():
    if 'image' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            os.makedirs(app.config['CARTOON_FOLDER'], exist_ok=True)
            
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Load the uploaded image
            img = cv2.imread(filepath)
            if img is None:
                return jsonify({"error": "Invalid image file"}), 400

            # Apply cartoonization
            cartoon_img = cartoonize_image(img)
            if cartoon_img is None:
                return jsonify({"error": "Failed to process image"}), 500

            # Save the cartoonized image
            cartoon_filename = f"cartoon_{filename}"
            cartoon_filepath = os.path.join(app.config['CARTOON_FOLDER'], cartoon_filename)
            cv2.imwrite(cartoon_filepath, cartoon_img)

            # Return the cartoonized image URL
            return jsonify({
                "success": True,
                "cartoon_url": f"/cartoonized_images/{cartoon_filename}"
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)

    return jsonify({"error": "Invalid file type. Allowed types: png, jpg, jpeg"}), 400

@app.route('/cartoonized_images/<filename>')
def send_cartoonized_image(filename):
    try:
        return send_from_directory(app.config['CARTOON_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404

if __name__ == '__main__':
    # Ensure the upload and cartoonized folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['CARTOON_FOLDER'], exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=10000)
