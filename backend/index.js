const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
  res.send("FNOL Backend is running ");
});

async function readFile(filePath) {
  if (filePath.endsWith(".pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }
  return fs.readFileSync(filePath, "utf8");
}

function extractFields(text) {
  const extract = (regex) => {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  return {
    "Policy Number": extract(/Policy Number\s*[:\-]?\s*(.+)/i),
    "Policyholder Name": extract(/Policyholder Name\s*[:\-]?\s*(.+)/i),
    "Effective Dates": extract(/Effective Dates?\s*[:\-]?\s*(.+)/i),
    "Incident Date": extract(/Incident Date\s*[:\-]?\s*(.+)/i),
    "Incident Time": extract(/Incident Time\s*[:\-]?\s*(.+)/i),
    "Location": extract(/Location\s*[:\-]?\s*(.+)/i),
    "Description": extract(/Description\s*[:\-]?\s*(.+)/i),
    "Claimant": extract(/Claimant\s*[:\-]?\s*(.+)/i),
    "Third Parties": extract(/Third Parties\s*[:\-]?\s*(.+)/i),
    "Contact Details": extract(/Contact Details\s*[:\-]?\s*(.+)/i),
    "Asset Type": extract(/Asset Type\s*[:\-]?\s*(.+)/i),
    "Asset ID": extract(/Asset ID\s*[:\-]?\s*(.+)/i),
    "Estimated Damage": extract(/Estimated Damage\s*[:\-]?\s*(.+)/i),
    "Claim Type": extract(/Claim Type\s*[:\-]?\s*(.+)/i),
    "Attachments": extract(/Attachments\s*[:\-]?\s*(.+)/i),
    "Initial Estimate": extract(/Initial Estimate\s*[:\-]?\s*(.+)/i)
  };
}

function findMissing(fields) {
  const mandatory = [
    "Policy Number",
    "Policyholder Name",
    "Incident Date",
    "Location",
    "Description",
    "Claim Type",
    "Attachments",
    "Initial Estimate"
  ];
  return mandatory.filter(f => !fields[f]);
}

function routeClaim(fields, missing) {
  if (missing.length) return "Manual Review";

  const desc = (fields["Description"] || "").toLowerCase();
  if (desc.includes("fraud") || desc.includes("staged") || desc.includes("inconsistent"))
    return "Investigation Flag";

  if ((fields["Claim Type"] || "").toLowerCase() === "injury")
    return "Specialist Queue";

  const damage = parseFloat((fields["Estimated Damage"] || "").replace(/[^\d.]/g, ""));
  if (!isNaN(damage) && damage < 25000) return "Fast-track";

  return "Standard Processing";
}

function buildReason(route, missing) {
  switch (route) {
    case "Manual Review":
      return `Missing mandatory fields: ${missing.join(", ")}`;
    case "Investigation Flag":
      return "Description contains suspicious keywords.";
    case "Specialist Queue":
      return "Claim type is injury-related.";
    case "Fast-track":
      return "Estimated damage is below ₹25,000.";
    default:
      return "Standard claim processing.";
  }
}

app.post("/process", upload.single("file"), async (req, res) => {
  const text = await readFile(req.file.path);
  console.log("---- FILE TEXT ----\n", text); // debug
  const extractedFields = extractFields(text);
  console.log("---- EXTRACTED ----\n", extractedFields); // debug

  const missingFields = findMissing(extractedFields);
  const recommendedRoute = routeClaim(extractedFields, missingFields);
  const reasoning = buildReason(recommendedRoute, missingFields);

  res.json({
    extractedFields,
    missingFields,
    recommendedRoute,
    reasoning
  });
});

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
