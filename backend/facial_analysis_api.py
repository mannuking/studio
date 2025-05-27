from flask import Flask, request, jsonify
from PIL import Image
import io
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def basic_emotion_analysis(image):
    gray = image.convert('L')
    avg_brightness = sum(gray.getdata()) / (gray.width * gray.height)
    emotions = {
        'happy': min(1.0, avg_brightness / 255),
        'sad': max(0.0, 1 - avg_brightness / 255),
        'angry': 0.1,
        'surprised': 0.1,
        'neutral': 0.5,
        'confused': 0.1
    }
    return emotions

@app.route('/api/facial-analysis', methods=['POST'])
def facial_analysis():
    data = request.json
    image_data = data['image'].split(',')[1]
    image = Image.open(io.BytesIO(base64.b64decode(image_data)))
    emotions = basic_emotion_analysis(image)
    result = {
        'emotions': {k: round(v, 2) for k, v in emotions.items()},
        'engagement': 50,
        'attention': 50,
        'timestamp': 'now'
    }
    return jsonify({'facial': result})

if __name__ == '__main__':
    app.run(debug=True) 
