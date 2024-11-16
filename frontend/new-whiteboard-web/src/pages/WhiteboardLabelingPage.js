import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  IconButton,
  TextField,
  Paper,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Stage, Layer, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import axios from "axios"; // Import axios for HTTP requests

const confidenceColors = [
  "rgba(0, 255, 0, 0.5)", // High Confidence (Green)
  "rgba(255, 165, 0, 0.5)", // Medium Confidence (Orange)
  "rgba(255, 0, 0, 0.5)", // Low Confidence (Red)
];

function WhiteboardLabelingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [whiteboard, setWhiteboard] = useState(null);
  const [image] = useImage(whiteboard ? whiteboard.imageUrl : "");
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotation, setNewAnnotation] = useState(null);
  const [activeAnnotation, setActiveAnnotation] = useState(null);
  //const [transcription, setTranscription] = useState("");
  const [panelWidth, setPanelWidth] = useState(70);
  const transcriptionRef = useRef(null);
  const [pendingTranscription, setPendingTranscription] = useState("");

  // Load whiteboard data and annotations from backend
  useEffect(() => {
    const fetchWhiteboardData = async () => {
      try {
        const whiteboardRes = await axios.get(
          `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards/${id}`,
          { withCredentials: true }
        );
        setWhiteboard(whiteboardRes.data);

        // Fetch and set annotations
        const annotationsRes = await axios.get(
          `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards/${id}/annotations`,
          { withCredentials: true }
        );
        setAnnotations(annotationsRes.data);
        console.log(annotationsRes.data);
      } catch (error) {
        console.error("Error fetching whiteboard data:", error);
      }
    };

    fetchWhiteboardData();
  }, [id]);

  useEffect(() => {
    if (activeAnnotation !== null && transcriptionRef.current) {
      transcriptionRef.current.focus();
    }
  }, [activeAnnotation]);

  const handleMouseDown = (e) => {
    const { x, y } = e.target.getStage().getPointerPosition();
    setNewAnnotation({
      x,
      y,
      width: 0,
      height: 0,
      confidenceLevel: 0,
      transcription: "",
    });
  };

  const handleMouseMove = (e) => {
    if (!newAnnotation) return;
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    setNewAnnotation({
      ...newAnnotation,
      width: pointerPosition.x - newAnnotation.x,
      height: pointerPosition.y - newAnnotation.y,
    });
  };

  const handleMouseUp = () => {
    if (newAnnotation) {
      const annotationToSave = { ...newAnnotation }; // Copy current annotation

      setNewAnnotation(null); // Clear newAnnotation to prevent duplicates

      //setTranscription(annotationToSave.transcription); // Set transcription for the new annotation
      saveAnnotation(annotationToSave); // Save annotation to the backend
    }
  };

  // Function to save a new annotation to the backend
  const saveAnnotation = async (annotation) => {
    console.log(annotation);
    console.log(`/whiteboards/${id}/annotations`);
    try {
      const response = await axios.post(
        `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/whiteboards/${id}/annotations`,
        annotation,
        { withCredentials: true }
      );

      console.log("it got here");

      // Update the annotations state with the newly saved annotation, including its backend `_id`
      setAnnotations((prevAnnotations) => [
        ...prevAnnotations,
        { ...annotation, _id: response.data._id },
      ]);
    } catch (error) {
      console.error("Error saving annotation:", error);
    }
  };

  // Function to update an existing annotation in the backend and in the state
  const updateAnnotation = async (index, updatedFields) => {
    const annotation = annotations[index];

    try {
      const response = await axios.patch(
        `https://whiteboard-backend-062baa2e4c1a.herokuapp.com/annotations/${annotation._id}`,
        updatedFields,
        { withCredentials: true }
      );

      // Update the specific annotation in the state based on its index
      setAnnotations((prevAnnotations) =>
        prevAnnotations.map((a, i) => (i === index ? response.data : a))
      );
    } catch (error) {
      console.error("Error updating annotation:", error);
    }
  };

  const handleAnnotationClick = (index) => {
    // Save current transcription if there's an active annotation and it has changed
    if (activeAnnotation !== null) {
      saveTranscription();
    }

    // Cycle confidence level (color) of the clicked annotation
    const updatedAnnotations = [...annotations];
    const currentAnnotation = updatedAnnotations[index];
    const nextConfidenceLevel =
      (currentAnnotation.confidenceLevel + 1) % confidenceColors.length;

    updatedAnnotations[index] = {
      ...currentAnnotation,
      confidenceLevel: nextConfidenceLevel,
    };

    setAnnotations(updatedAnnotations);
    setActiveAnnotation(index);
    setPendingTranscription(currentAnnotation.transcription || "");

    // Update confidence level in the backend
    updateAnnotation(index, { confidenceLevel: nextConfidenceLevel });
  };

  const saveTranscription = () => {
    if (
      activeAnnotation !== null &&
      pendingTranscription !== annotations[activeAnnotation]?.transcription
    ) {
      updateAnnotation(activeAnnotation, {
        transcription: pendingTranscription,
      });
    }
  };

  const handleTranscriptionChange = (event) => {
    const updatedTranscription = event.target.value;
    setPendingTranscription(updatedTranscription);
  };

  // Set pending transcription when active annotation changes
  useEffect(() => {
    if (activeAnnotation !== null) {
      setPendingTranscription(
        annotations[activeAnnotation]?.transcription || ""
      );
    }
  }, [activeAnnotation, annotations]);

  const handleResize = (e) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    setPanelWidth(Math.max(30, Math.min(newWidth, 85)));
  };

  return (
    <Container
      maxWidth={false}
      style={{ height: "100vh", display: "flex", padding: 0 }}
    >
      <div
        style={{
          width: `${panelWidth}%`,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <IconButton
          onClick={async () => {
            try {
              await saveTranscription(); // Save transcription before navigating
              navigate("/whiteboards"); // Navigate only after save completes
            } catch (error) {
              console.error(
                "Failed to save transcription before navigating:",
                error
              );
            }
          }}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 1000,
          }}
        >
          <ArrowBack fontSize="large" />
        </IconButton>

        <Typography
          variant="h6"
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            opacity: 0.8,
            backgroundColor: "white",
            padding: "5px 15px",
            borderRadius: "4px",
          }}
        >
          Whiteboard ID: {id}
        </Typography>
        {whiteboard ? (
          <Stage
            width={1200}
            height={800}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ margin: "0 auto" }}
          >
            <Layer>
              <KonvaImage image={image} width={1200} height={800} />
              {annotations.map((rect, i) => (
                <Rect
                  key={i}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={confidenceColors[rect.confidenceLevel]}
                  onClick={() => handleAnnotationClick(i)}
                />
              ))}
              {newAnnotation && (
                <Rect
                  x={newAnnotation.x}
                  y={newAnnotation.y}
                  width={newAnnotation.width}
                  height={newAnnotation.height}
                  fill="rgba(0,0,255,0.5)"
                />
              )}
            </Layer>
          </Stage>
        ) : (
          <Typography color="error">Whiteboard not found</Typography>
        )}
      </div>

      {/* Divider for Resizing */}
      <div
        onMouseDown={(e) => {
          document.addEventListener("mousemove", handleResize);
          document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", handleResize);
          });
        }}
        style={{
          width: "5px",
          cursor: "col-resize",
          backgroundColor: "#ccc",
        }}
      />

      {/* Transcription Panel */}
      {activeAnnotation !== null && (
        <Paper
          style={{
            width: `${100 - panelWidth}%`,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
            overflowY: "auto",
          }}
          square
        >
          <Typography variant="h6" gutterBottom>
            Edit Transcription
          </Typography>
          <TextField
            fullWidth
            label="Transcription"
            value={pendingTranscription}
            onChange={handleTranscriptionChange}
            onBlur={saveTranscription}
            multiline
            rows={4}
            variant="outlined"
            inputRef={transcriptionRef}
            autoFocus
          />
        </Paper>
      )}
    </Container>
  );
}

export default WhiteboardLabelingPage;
