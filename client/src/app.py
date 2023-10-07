from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Access the OPENAI_API_KEY
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, resources={
    r"/generate-rust": {
        "origins": ["https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/generate-rust', methods=['POST'])
def generate_rust():
    try:
        description = request.json.get('description')

        # Call GPT-4 to generate Rust code
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        data = {
            "messages": [
                {"role": "user", "content": f"Convert the following TypeScript description to Rust: {description}"}
            ],
            "model": "gpt-4-0314"
        }
        response = requests.post('https://api.openai.com/v1/chat/completions', headers=headers, json=data)

        if response.status_code == 200:
            rust_code = response.json().get('choices')[0].get('message', {}).get('content')
            if rust_code:
                return jsonify({'rustCode': rust_code.strip()})
            else:
                return jsonify({'error': 'No Rust code generated.'}), 500
        else:
            print(f"OpenAI API Error: {response.text}")  # Print the error message from OpenAI API
            return jsonify({'error': 'Error generating Rust code.'}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
