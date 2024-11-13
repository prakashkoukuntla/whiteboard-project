const fs = require("fs");
const Papa = require("papaparse");

const loadWhiteboardsFromCSV = () => {
  const file = fs.readFileSync("./whiteboards.csv", "utf8");
  const { data } = Papa.parse(file, { header: true });

  data.forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row); // Debugging output for each row
  });

  return data.map((row) => ({
    id: row.id || "default_id",
    imageUrl: row.image_url || "default_url",
    annotated: false,
  }));
};

module.exports = loadWhiteboardsFromCSV;
