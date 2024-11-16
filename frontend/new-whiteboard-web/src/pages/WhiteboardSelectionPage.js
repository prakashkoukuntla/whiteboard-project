import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  Typography,
  CardMedia,
  Button,
  Box,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import DownloadIcon from "@mui/icons-material/Download";
import { useWhiteboard } from "../context/WhiteboardContext"; // Import the context hook
import Papa from "papaparse";
import axios from "axios";

// Function to fetch annotations and generate CSV
const handleDownloadData = async () => {
  try {
    // Fetch all whiteboards and their annotations
    const whiteboardsRes = await axios.get(
      "https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards",
      { withCredentials: true }
    );

    // Collect annotation data for each whiteboard
    const whiteboardChunks = await Promise.all(
      whiteboardsRes.data.map(async (whiteboard) => {
        const annotationsRes = await axios.get(
          `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards/${whiteboard.id}/annotations`,
          { withCredentials: true }
        );

        // Map each annotation to the desired CSV format
        return annotationsRes.data.map((chunk) => ({
          whiteboard_id: whiteboard.id,
          image_url: whiteboard.imageUrl,
          x: chunk.x,
          y: chunk.y,
          width: chunk.width,
          height: chunk.height,
          transcription: chunk.transcription,
          confidence_level: chunk.confidenceLevel,
        }));
      })
    );

    // Flatten the array of arrays into a single array
    const allChunks = whiteboardChunks.flat();

    // Convert data to CSV format
    const csv = Papa.unparse(allChunks);

    // Create a blob from the CSV and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "labeled_whiteboards.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading data:", error);
  }
};

function WhiteboardSelectionPage() {
  const navigate = useNavigate();
  const { whiteboards, refreshWhiteboards } = useWhiteboard();

  useEffect(() => {
    refreshWhiteboards();
  }, [refreshWhiteboards]);

  const handleCardClick = (id) => {
    navigate(`/label/${id}`);
  };

  return (
    <Container
      maxWidth="md"
      style={{ marginTop: "20px", position: "relative" }}
    >
      {/* Flex container to align title and button */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h4" gutterBottom>
          Select a Whiteboard
        </Typography>

        {/* Download Data Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadData}
        >
          Download Data
        </Button>
      </Box>

      <Grid2 container spacing={4}>
        {whiteboards.map((whiteboard) => (
          <Grid2 xs={12} sm={6} md={4} key={whiteboard.id}>
            <Card
              onClick={() => handleCardClick(whiteboard.id)}
              style={{ cursor: "pointer", maxWidth: 250 }}
            >
              <CardMedia
                component="img"
                height="100"
                image={whiteboard.imageUrl}
                alt={`Whiteboard ${whiteboard.id}`}
              />
              <CardContent>
                <Typography variant="h6">{`Whiteboard ID: ${whiteboard.id}`}</Typography>
                <Typography
                  color={whiteboard.annotated ? "primary" : "textSecondary"}
                >
                  {whiteboard.annotated ? "Annotated" : "Not Annotated"}
                </Typography>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>
    </Container>
  );
}

export default WhiteboardSelectionPage;
