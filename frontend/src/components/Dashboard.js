
import React, { useState } from "react";

function Dashboard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    if (!file) return alert("Please select a file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/process", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>FNOL Claims Processor</h1>
      <p>Upload a PDF/TXT FNOL file and get routing output</p>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={uploadFile} style={styles.button}>Process Claim</button>

      {loading && <p>Processing...</p>}

      {result && (
        <div style={styles.box}>
          <h3>Routing Decision</h3>
          <p><b>Route:</b> {result.recommendedRoute}</p>
          <p><b>Reason:</b> {result.reasoning}</p>

          <h4>Extracted Fields</h4>
          <pre>{JSON.stringify(result.extractedFields, null, 2)}</pre>

          <h4>Missing Fields</h4>
          <pre>{JSON.stringify(result.missingFields, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    fontFamily: "Arial",
    maxWidth: "700px",
    margin: "auto"
  },
  box: {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "#f9f9f9"
  },
  button: {
  backgroundColor: "#1976d2",
  color: "white",
  padding: "10px 18px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "15px"
}

};

export default Dashboard;
