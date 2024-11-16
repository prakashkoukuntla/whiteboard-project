import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create context
const WhiteboardContext = createContext();

// Create a provider component
export const WhiteboardProvider = ({ children }) => {
  const [whiteboards, setWhiteboards] = useState([]);

  // Function to fetch whiteboards with user-specific annotation status
  const refreshWhiteboards = async () => {
    console.log("refreshWhiteboards called!");
    try {
      const whiteboardsRes = await axios.get(
        "https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards",
        {
          withCredentials: true,
        }
      );

      console.log("Request Headers:", whiteboardsRes.config.headers); // Log request headers
      console.log("Response Data:", whiteboardsRes.data); // Log response data

      const whiteboardsWithStatus = await Promise.all(
        whiteboardsRes.data
          .filter((whiteboard) => whiteboard.id !== "default_id")
          .map(async (whiteboard) => {
            const annotationsRes = await axios.get(
              `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards/${whiteboard.id}/annotations`,
              { withCredentials: true }
            );
            return {
              ...whiteboard,
              annotated: annotationsRes.data.length > 0,
            };
          })
      );

      setWhiteboards(whiteboardsWithStatus);
    } catch (error) {
      if (error.response) {
        console.error("Error Response:", error.response);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      } else {
        console.error("Error Message:", error.message);
      }
      console.error("Error Config:", error.config);
    }
  };

  // Fetch whiteboards initially on context load
  useEffect(() => {
    refreshWhiteboards();
  }, []);

  return (
    <WhiteboardContext.Provider value={{ whiteboards, refreshWhiteboards }}>
      {children}
    </WhiteboardContext.Provider>
  );
};

// Custom hook to use the whiteboard context
export const useWhiteboard = () => {
  return useContext(WhiteboardContext);
};
