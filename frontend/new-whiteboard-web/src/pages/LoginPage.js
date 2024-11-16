// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography } from "@mui/material";
import axios from "axios";
import { useWhiteboard } from "../context/WhiteboardContext"; // Import context

function LoginPage() {
  const [username, setUsername] = useState("");
  const { refreshWhiteboards } = useWhiteboard(); // Access the setWhiteboards function from context
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (username.trim() === "") {
      alert("Please enter a username");
      return;
    }

    try {
      const response = await axios.post(
        "https://whiteboard-backend-062baa2e4c1a.herokuapp.com/login",
        {
          name: username,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        console.log(response.data.message);
        const whiteboards = response.data.whiteboards;
        await refreshWhiteboards(whiteboards); // Store whiteboards in context

        navigate("/whiteboards");
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed, please try again.");
    }
  };

  return (
    <Container
      maxWidth="sm"
      style={{ marginTop: "100px", textAlign: "center" }}
    >
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      <TextField
        label="Username"
        variant="outlined"
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: "20px" }}
      />
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Login
      </Button>
    </Container>
  );
}

export default LoginPage;
