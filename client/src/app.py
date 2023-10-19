from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client
import re
from bs4 import BeautifulSoup

# Load environment variables from .env file
load_dotenv()

# Access the OPENAI_API_KEY and Tencent Cloud credentials
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TENCENT_SECRET_ID = os.getenv("TENCENT_SECRET_ID")
TENCENT_SECRET_KEY = os.getenv("TENCENT_SECRET_KEY")
REGION = os.getenv("TENCENT_REGION")
BUCKET = os.getenv("TENCENT_BUCKET_NAME")
BUCKET2 = os.getenv("TENCENT_BUCKET_NAME2")

app = Flask(__name__)
CORS(app, resources={
    r"/generate-rust": {
        "origins": ["https://beige-jolly-capybara.app.genez.io", "https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/upload-to-cos": {
        "origins": ["https://beige-jolly-capybara.app.genez.io", "https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["POST"],
        "allow_headers": ["Content-Type", "Authorization"]
    },
    r"/create-endpoints": {
        "origins": ["https://beige-jolly-capybara.app.genez.io", "https://beige-jolly-capybara.dev.app.genez.io", "http://localhost:3000"],
        "methods": ["POST"],
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
        prompt = f"Convert the following TypeScript description to Rust for a {contract_type} type, {shard_target} shard smart contract with the following functionalities: {requirements_str}. Description: {description}. Existing Rust code: {uploaded_rust_content}. Note: instead of elrond_wasm, it will be multiversx_sc."

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


@app.route('/upload-to-cos', methods=['POST'])
def upload_to_cos():
    try:
        # Initialize Tencent Cloud COS client
        config = CosConfig(
            Region=REGION, SecretId=TENCENT_SECRET_ID, SecretKey=TENCENT_SECRET_KEY)
        client = CosS3Client(config)

        # Extract file from the request
        file = request.files['file']
        file_bytes = file.read()

        # Upload to COS
        response = client.put_object(
            Bucket=BUCKET,
            Body=file_bytes,
            Key=file.filename,
            StorageClass='STANDARD'
        )

        return jsonify({"success": True, "message": "File uploaded successfully!"})

    except Exception as err:
        return jsonify({"success": False, "message": f"An error occurred: {err}"})


GITHUB_API_BASE = "https://api.github.com/repos/multiversx/mx-sdk-rs/contents"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


processed_dirs = set()


def get_all_rs_files(url):
    if url in processed_dirs:
        return []

    processed_dirs.add(url)

    headers = {
        "Accept": "application/vnd.github.v3+json"
    }

    rs_files = []
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        print(f"Failed to fetch {url}. Status code: {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    links = [link.get('href') for link in soup.select('.js-navigation-open')]

    for link in links:
        if link.endswith('.rs'):
            rs_files.append(link)
        elif '/tree/master/' in link:  # It's a directory
            rs_files.extend(get_all_rs_files(f"https://github.com{link}"))

    return rs_files


@app.route('/refresh-smart-contracts', methods=['POST'])
def refresh_smart_contracts():
    try:
        rs_links = []
        rs_links = get_all_rs_files("contracts")

        # Initialize Tencent Cloud COS client
        config = CosConfig(
            Region=REGION, SecretId=TENCENT_SECRET_ID, SecretKey=TENCENT_SECRET_KEY)
        client = CosS3Client(config)

        # Download and upload each smart contract
        for rs_url in rs_links:
            print(rs_url)
            contract_name = rs_url.split('/')[-1]
            contract_content = requests.get(rs_url).text

            # Upload to COS
            client.put_object(
                Bucket=BUCKET,
                Body=contract_content,
                Key=contract_name,
                StorageClass='STANDARD'
            )

        return jsonify({"success": True, "message": "Smart contracts refreshed successfully!"})

    except Exception as err:
        return jsonify({"success": False, "message": f"An error occurred: {err}"})


@app.route('/create-endpoints', methods=['POST'])
def create_endpoints():
    try:
        # Extract the endpoint names from the request
        endpoints = request.json.get('endpoints', [])

        # Initialize Tencent Cloud COS client
        config = CosConfig(
            Region=REGION, SecretId=TENCENT_SECRET_ID, SecretKey=TENCENT_SECRET_KEY)
        client = CosS3Client(config)

        # Save each endpoint name to the Tencent Cloud bucket
        for endpoint in endpoints:
            client.put_object(
                Bucket=BUCKET2,
                Body=endpoint,  # Content of the file
                Key=f"{endpoint}.txt",  # File name
                StorageClass='STANDARD'
            )

        return jsonify({"success": True, "message": "Endpoints created successfully!"})

    except Exception as err:
        return jsonify({"success": False, "message": f"An error occurred: {err}"})


if __name__ == '__main__':
    app.run(debug=True)
