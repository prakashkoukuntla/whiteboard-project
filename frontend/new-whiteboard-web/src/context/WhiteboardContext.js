import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Create context
const WhiteboardContext = createContext();

// Create a provider component
export const WhiteboardProvider = ({ children }) => {
  const [whiteboards, setWhiteboards] = useState([]);

  // Function to fetch whiteboards with user-specific annotation status
  const refreshWhiteboards = async () => {
    try {
      const whiteboardsRes = await axios.get(
        "https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards",
        {
          withCredentials: true,
        }
      );

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
      console.error("Error fetching whiteboards with annotations:", error);
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
