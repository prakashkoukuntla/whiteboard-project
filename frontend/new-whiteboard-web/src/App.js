// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WhiteboardProvider } from "./context/WhiteboardContext"; // Import the provider
import LoginPage from "./pages/LoginPage";
import WhiteboardSelectionPage from "./pages/WhiteboardSelectionPage";
import WhiteboardLabelingPage from "./pages/WhiteboardLabelingPage";

function App() {
  return (
    <WhiteboardProvider>
      {" "}
      {/* Wrap your app in the provider */}
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/whiteboards" element={<WhiteboardSelectionPage />} />
          <Route path="/label/:id" element={<WhiteboardLabelingPage />} />
        </Routes>
      </Router>
    </WhiteboardProvider>
  );
}

export default App;
