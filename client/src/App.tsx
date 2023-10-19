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
import "./App.css";

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
  const [endpoints, setEndpoints] = useState<string[]>(['']);
  const [contractTemplate, setContractTemplate] = useState<string | null>(null);
  const [contractName, setContractName] = useState<string>("");
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);

  const EMPTY_CONTRACT_TEMPLATE = `#![no_std]

  multiversx_sc::imports!();

  /// An empty contract. To be used as a template when starting a new contract from scratch.
  #[multiversx_sc::contract]
  pub trait EmptyContract {
      #[init]
      fn init(&self) {}
  }`;

  const EMPTY_CONTRACT_TEMPLATE_MOCK = `#![no_std]

  multiversx_sc::imports!();
  
  #[multiversx_sc::contract]
  pub trait Factorial {
      #[init]
      fn init(&self) {}
  
      #[endpoint]
      fn factorial(&self, value: BigUint) -> BigUint {
          let one = BigUint::from(1u32);
          if value == 0 {
              return one;
          }
  
          let mut result = BigUint::from(1u32);
          let mut x = BigUint::from(1u32);
          while x <= value {
              result *= &x;
              x += &one;
          }
  
          result
      }
  }`;


  useEffect(() => {
    if (address && address.length > 0) {
      MultiversXService.queryAddress(address).then((res: Response) => {
        setBalance(res.balance.toString() + " EGLD");
      });
    } else {
      setBalance("");
    }
  }, [address]);

  // useEffect(() => {
  //   if (activeOption === "option4" && contractName) {
  //     setContractTemplate(EMPTY_CONTRACT_TEMPLATE.replace(/{CONTRACT_NAME}/g, contractName));
  //   }
  // }, [activeOption, contractName]);

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

  const refreshSmartContracts = async () => {
    try {
      const response = await fetch("http://localhost:5000/refresh-smart-contracts", {
        method: "POST",
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setUploadStatus('Smart contracts refreshed successfully!');
      }
    } catch (err) {
      setError("Error refreshing smart contracts.");
    }
  };

  const handleEndpointChange = (index: number, value: string) => {
    const newEndpoints = [...endpoints];
    newEndpoints[index] = value;
    setEndpoints(newEndpoints);
  };

  const addMoreEndpoints = () => {
    setEndpoints([...endpoints, '']);
  };

  const removeEndpoint = (indexToRemove: number) => {
    const newEndpoints = endpoints.filter((_, index) => index !== indexToRemove);
    setEndpoints(newEndpoints);
  };

  const submitEndpoints = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-endpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoints }),
      });

      const data = await response.json();

      if (data.success) {
        // Handle success, maybe reset the form or show a success message
      } else {
        // Handle error, maybe show an error message to the user
      }
    } catch (err) {
      // Handle error, maybe show an error message to the user
    }
  };

  const handleGenerateContract = () => {
    if (contractName) {
      const contract = EMPTY_CONTRACT_TEMPLATE_MOCK.replace(/{CONTRACT_NAME}/g, contractName);
      setGeneratedContract(contract);
    } else {
      alert("Please provide a contract name.");
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
              MultiversX Address & Balance
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option2"}
              onClick={() => setActiveOption("option2")}
            >
              {/* Rust Code Generator */}
              MultiversX Smart Contract AI Gen
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option3"}
              onClick={() => setActiveOption("option3")}
            >
              Upload MultiversX SCs to Tencent COS
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#"
              active={activeOption === "option4"}
              onClick={() => setActiveOption("option4")}
            >
              Create MultiversX Smart Contract
            </NavLink>
          </NavItem>

        </Nav>
      </Navbar>

      {activeOption === "option1" && (
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <h2 className="text-center mb-4 upper-text">Check Address & Balance on MultiversX</h2>
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
              {/* <h2 className="text-center mb-4 upper-text">Rust Code Generator using GPT4</h2> */}
              <h2 className="text-center mb-4 upper-text">MultiversX Smart Contract AI Gen</h2>
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
                <Label for="descriptionTextarea">Enter description</Label>
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
              <h2 className="text-center mb-4 upper-text">Upload MultiversX SCs to Tencent COS</h2>
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
              {uploadStatus && <Alert color={uploadStatus.includes("Error") ? "danger" : "success"} className="mb-3">{uploadStatus}</Alert>}
              <div className="mb-3"></div>
              <Button color="secondary" onClick={refreshSmartContracts} className="mb-3">
                Refresh MultiversX Smart Contracts
              </Button>
            </Col>
          </Row>
        </Container>
      )}

      {activeOption === "option4" && (
        <Container>
          <Row className="justify-content-center">
            <Col md={6}>
              <h2 className="text-center mb-4 upper-text">Create MultiversX Smart Contract</h2>
              <FormGroup>
                <Label for="contractNameInput">Contract Name</Label>
                <Input
                  id="contractNameInput"
                  placeholder="Enter Contract Name"
                  value={contractName}
                  onChange={(e: any) => setContractName(e.target.value)}
                />
              </FormGroup>
              <h1 className="mb-4">Add Endpoint Names</h1>
              {endpoints.map((endpoint, index) => (
                <FormGroup key={index}>
                  <Label for={`endpointInput${index}`}>Endpoint Name {index + 1}</Label>
                  <Row>
                    <Col md={10}>
                      <Input
                        id={`endpointInput${index}`}
                        value={endpoint}
                        onChange={(e) => handleEndpointChange(index, e.target.value)}
                      />
                    </Col>
                    <Col md={2}>
                      <Button color="danger" onClick={() => removeEndpoint(index)}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                </FormGroup>
              ))}
              <Button color="primary" onClick={addMoreEndpoints} className="mb-3">
                Add More
              </Button>
              <div className="mb-3"></div>
              {/* <Button color="success" onClick={submitEndpoints} className="mb-3">
                Submit
              </Button> */}
              <Button color="success" onClick={handleGenerateContract} className="mb-3">
                Submit
              </Button>
              {/* {contractTemplate && (
                <div className="mt-3 bg-light p-3 custom-code-block">
                  <pre style={{ whiteSpace: "pre-wrap" }}>{contractTemplate}</pre>
                </div>
              )} */}
              {generatedContract && (
                <div className="mt-3 bg-light p-3 custom-code-block">
                  <pre style={{ whiteSpace: "pre-wrap" }}>{generatedContract}</pre>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
}
