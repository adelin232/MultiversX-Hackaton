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
        body: JSON.stringify({ description }),
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
        method: "PUT",  // Change to PUT as per your request
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

  // const fileToBuffer = (file: File): Promise<Buffer> => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsArrayBuffer(file);
  //     reader.onload = () => {
  //       resolve(Buffer.from(reader.result as ArrayBuffer));
  //     };
  //     reader.onerror = reject;
  //   });
  // };

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
                  <pre>{rustCode}</pre>
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
              <h1 className="text-center mb-4">Upload Files to COS</h1>
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
