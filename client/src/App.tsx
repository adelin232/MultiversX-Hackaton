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

export default function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  const [rustCode, setRustCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOption, setActiveOption] = useState("option1");

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
    </div>
  );
}
