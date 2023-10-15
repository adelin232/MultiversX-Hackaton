from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.common.common_client import CommonClient
import re

# Load environment variables from .env file
load_dotenv()

# Access the OPENAI_API_KEY and Tencent Cloud credentials
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TENCENT_SECRET_ID = os.getenv("TENCENT_SECRET_ID")
TENCENT_SECRET_KEY = os.getenv("TENCENT_SECRET_KEY")

app = Flask(__name__)
CORS(app, resources={
    r"/generate-rust": {
        "origins": ["https://beige-jolly-capybara.app.genez.io", "https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/upload-to-cos": {
        "origins": ["https://beige-jolly-capybara.app.genez.io", "https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["PUT"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


@app.route('/generate-rust', methods=['POST'])
def generate_rust():
    try:
        description = request.json.get('description')
        contract_type = request.json.get('contractType', 'generic')
        shard_target = request.json.get('shardTarget', 'single')
        functional_requirements = request.json.get(
            'functionalRequirements', [])
        uploaded_rust_content = request.json.get('uploadedRustContent', '')

        # Convert the list of functional requirements into a string
        requirements_str = ', '.join(functional_requirements)

        # Modify the prompt based on contract type, shard targeting, functional requirements, and uploaded Rust content
        prompt = f"Convert the following TypeScript description to Rust for a {contract_type} type, {shard_target} shard smart contract with the following functionalities: {requirements_str}. Description: {description}. Existing Rust code: {uploaded_rust_content}"

        # Call GPT-4 to generate Rust code
        headers = {
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        }
        data = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "model": "gpt-4-0314"
        }
        response = requests.post(
            'https://api.openai.com/v1/chat/completions', headers=headers, json=data)

        if response.status_code == 200:
            full_response = response.json().get('choices')[0].get(
                'message', {}).get('content', '')

            # Extract only Rust code using a regular expression
            rust_code_match = re.search(r'```rust([\s\S]*?)```', full_response)
            rust_code = rust_code_match.group(
                1).strip() if rust_code_match else None

            if rust_code:
                return jsonify({'rustCode': rust_code})
            else:
                return jsonify({'error': 'No Rust code generated.'}), 500
        else:
            # Print the error message from OpenAI API
            print(f"OpenAI API Error: {response.text}")
            return jsonify({'error': 'Error generating Rust code.'}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500


@app.route('/upload-to-cos', methods=['PUT'])
def upload_to_cos():
    try:
        # Load credentials and region from .env
        SECRET_ID = os.getenv("TENCENT_SECRET_ID")
        SECRET_KEY = os.getenv("TENCENT_SECRET_KEY")
        REGION = os.getenv("TENCENT_REGION")
        BUCKET = os.getenv("TENCENT_BUCKET_NAME")

        # Initialize Tencent Cloud COS client
        cred = credential.Credential(SECRET_ID, SECRET_KEY)
        httpProfile = HttpProfile()
        httpProfile.endpoint = f"{BUCKET}.cos.{REGION}.myqcloud.com"

        clientProfile = ClientProfile(httpProfile=httpProfile)
        client = CommonClient(service="cos", region=REGION,
                              credential=cred, version="2018-06-06")

        # Extract file from the request
        file = request.files['file']
        file_bytes = file.read()

        # Upload to COS
        params = {
            "Bucket": BUCKET,
            "Key": file.filename,
            "Body": file_bytes
        }
        resp = client.call("PutObject", params)

        return jsonify({"success": True, "message": "File uploaded successfully!"})

    except TencentCloudSDKException as err:
        return jsonify({"success": False, "message": f"An error occurred: {err}"})


if __name__ == '__main__':
    app.run(debug=True)
