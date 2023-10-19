import "bootstrap/dist/css/bootstrap.min.css";
import {
  Button,
  Input,
  FormGroup,
  Label,
  Container,
  Row,
  Col,
  Alert,
  Navbar,
  Nav,
  NavItem,
  NavLink,
} from "reactstrap";
import { MultiversXService, Response } from "./sdk/multiversXService.sdk";
import { useState, useEffect } from "react";
import "./App.css"; // Import custom CSS for styling
// import { Buffer } from 'buffer';

export default function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  const [rustCode, setRustCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOption, setActiveOption] = useState("option1");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [contractType, setContractType] = useState<string>("default");
  const [shardTarget, setShardTarget] = useState<string>("single");
  const [functionalRequirements, setFunctionalRequirements] = useState<string[]>([]);
  const [uploadedRustContent, setUploadedRustContent] = useState<string | null>(null);

  useEffect(() => {
    if (address && address.length > 0) {
      MultiversXService.queryAddress(address).then((res: Response) => {
        setBalance(res.balance.toString() + " EGLD");
      });
    } else {
      setBalance("");
    }
  }, [address]);

  const generateRustCode = async () => {
    try {
      const response = await fetch("http://localhost:5000/generate-rust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description, contractType, shardTarget, functionalRequirements, uploadedRustContent }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setRustCode(null);
      } else {
        setRustCode(data.rustCode);
        setError(null);
      }
    } catch (err) {
      setError("Error generating Rust code.");
    }
  };

  const uploadFileToCOS = async () => {
    if (!selectedFile) {
      setUploadStatus("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch("http://localhost:5000/upload-to-cos", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setUploadStatus(`Error uploading: ${data.error}`);
      } else {
        setUploadStatus('Upload success!');
      }
    } catch (err) {
      setUploadStatus("Error uploading file.");
    }
  };

  const handleRustFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedRustContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="App">
      <Navbar color="dark" dark className="mb-5 custom-navbar">
        <Nav vertical>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option1"}
              onClick={() => setActiveOption("option1")}
            >
              Address & Balance
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option2"}
              onClick={() => setActiveOption("option2")}
            >
              TypeScript to Rust Converter
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option3"}
              onClick={() => setActiveOption("option3")}
            >
              Upload to COS
            </NavLink>
          </NavItem>
        </Nav>
      </Navbar>

      {activeOption === "option1" && (
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <h1 className="text-center mb-4 upper-text">Genezio MultiversX Demo</h1>
              <FormGroup>
                <Label for="addressInput">Address</Label>
                <Input
                  id="addressInput"
                  placeholder="Enter Address"
                  value={address}
                  onChange={(e: any) => setAddress(e.target.value)}
                />
              </FormGroup>
              <div className="text-center mb-4">Balance: {balance}</div>
            </Col>
          </Row>
        </Container>
      )}

      {activeOption === "option2" && (
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <h1 className="text-center mb-4 upper-text">TypeScript to Rust Converter</h1>
              <FormGroup>
                <Label for="contractTypeSelect">Select Smart Contract Type</Label>
                <Input type="select" id="contractTypeSelect" value={contractType} onChange={(e) => setContractType(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="defi">DeFi (Decentralized Finance)</option>
                  <option value="nft">NFT (Non-Fungible Tokens)</option>
                  <option value="dao">DAO (Decentralized Autonomous Organization)</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="votingsystem">Voting System</option>
                  <option value="crowfunding">Crowdfunding / ICO</option>
                  <option value="supplychain">Supply Chain</option>
                  <option value="identitymanagement">Identity Management</option>
                  <option value="dapp">dApp</option>
                  <option value="gaming">Gaming</option>
                </Input>
              </FormGroup>
              <FormGroup>
                <Label for="shardTargetSelect">Shard Targeting</Label>
                <Input type="select" id="shardTargetSelect" value={shardTarget} onChange={(e) => setShardTarget(e.target.value)}>
                  <option value="single">Single Shard</option>
                  <option value="multi">Multiple Shards (Cross-shard communication)</option>
                </Input>
              </FormGroup>
              <FormGroup>
                <Label>Functional Requirements</Label>
                {['Token minting', 'Token burning', 'P2P transfers', 'Staking', 'Lending and borrowing', 'Automated market-making', 'Auctions', 'Escrow services'].map(req => (
                  <div key={req}>
                    <Input type="checkbox" value={req} onChange={(e) => {
                      if (e.target.checked) {
                        setFunctionalRequirements(prev => [...prev, req]);
                      } else {
                        setFunctionalRequirements(prev => prev.filter(r => r !== req));
                      }
                    }} /> {req}
                  </div>
                ))}
              </FormGroup>
              <FormGroup>
                <Label for="rustFileInput">Upload Rust (.rs) File</Label>
                <Input type="file" id="rustFileInput" accept=".rs" onChange={handleRustFileUpload} />
              </FormGroup>
              <FormGroup>
                <Label for="descriptionTextarea">Enter TypeScript description</Label>
                <Input
                  type="textarea"
                  id="descriptionTextarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FormGroup>
              <Button color="primary" onClick={generateRustCode} className="mb-3">
                Generate Rust Code
              </Button>

              {error && <Alert color="danger" className="mt-3">{error}</Alert>}
              {rustCode && (
                <div className="mt-3 bg-light p-3 custom-code-block">
                  <pre style={{ whiteSpace: "pre-wrap" }}>{rustCode}</pre>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      )}

      {activeOption === "option3" && (
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <h1 className="text-center mb-4 upper-text">Upload Files to COS</h1>
              <FormGroup>
                <Label for="fileInput">Select File</Label>
                <Input
                  type="file"
                  id="fileInput"
                  onChange={(e: any) => setSelectedFile(e.target.files[0])}
                />
              </FormGroup>
              <Button color="primary" onClick={uploadFileToCOS} className="mb-3">
                Upload
              </Button>
              {uploadStatus && <Alert color={uploadStatus.includes("Error") ? "danger" : "success"} className="mt-3">{uploadStatus}</Alert>}
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}
