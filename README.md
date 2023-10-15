# MultiversX Smart Contract Generator
This project provides a user-friendly interface to generate Rust-based smart contracts for the MultiversX blockchain (formerly known as Elrond). It leverages the power of GPT-4 to convert TypeScript descriptions into Rust code, and also provides features to upload and manage smart contracts on Tencent COS.

## Features
1. Address & Balance Query: Check the balance of a given MultiversX address.
2. TypeScript to Rust Converter: Convert TypeScript descriptions into Rust code for smart contract development.
Upload to COS: Upload Rust smart contract files to Tencent COS for storage and management.
Roadmap
3. AI Training on Smart Contracts: We aim to train an AI algorithm on the smart contracts stored in Tencent COS. This will enhance the accuracy and efficiency of our TypeScript to Rust conversion process.
4. Enhanced Smart Contract Management: Future updates will provide more advanced features for managing and deploying smart contracts directly from the interface.

## Getting Started
### Prerequisites
1. Python 3.x
2. Node.js and npm
3. Tencent Cloud account with COS enabled
4. OpenAI API key

### Setup & Deployment
1. Server Deployment:
* Navigate to the server folder.
* Execute the command:
* `genezio deploy`
2. Running the Backend Locally:
* Navigate to the client/src folder.
* Execute the command:
* `python app.py`

### Usage
1. Address & Balance:
* Enter a MultiversX address to check its balance.
2. TypeScript to Rust Converter:
* Choose the type of smart contract you want (e.g., DeFi, NFT, etc.).
* Enter a TypeScript description.
Click on "Generate Rust Code" to get the corresponding Rust code.
3. Upload to COS:
* Choose a Rust file (.rs) from your system.
* Click on "Upload" to store the smart contract on Tencent COS.

## Contributing
Feel free to fork this repository, make changes, and submit pull requests. Any contributions, whether big or small, are greatly appreciated!

## License
This project is licensed under the GPL-3.0 License.
