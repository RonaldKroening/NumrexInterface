import React, { useState, useEffect } from 'react';
import '../styles/DatasetPage.css';

const DatasetPage = ({ setDataset, setFN, advance }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileSelect = (e) => {
    const files = e.target.files;
    setSelectedFiles(files);
    if (files.length > 0) {
      setFileName(files[0].name);
      setFN(files[0].name);

    }
  };

  useEffect(() => {
    console.log("setting new file name");
    if (selectedFiles.length > 0) {
      setFileName(selectedFiles[0].name);
      setFN(selectedFiles[0].name);
    }
  }, [selectedFiles]);

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    setSelectedFiles(files);
    if (files.length > 0) {
      setFileName(files[0].name);
      setFN(files[0].name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const sendFile = async () => {
    if (selectedFiles.length === 0) {
      alert("No file selected.");
      return;
    }

    const dataset = await upload_file(selectedFiles[0]);

    if (dataset) {
      console.log(dataset);
      setDataset(dataset.data);
      advance(1);
    } else {
      alert("File not valid.");
    }
  };

  const upload_file = async (file) => {
    try {
        if (!file) {
            throw new Error("No file selected");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("http://127.0.0.1:8000/upload", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {

            let errorMsg = "Upload failed";
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorMsg;
            } catch (e) {
                errorMsg = await response.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }


        const data = await response.json();
        
        console.log(data);
        return data;

    } catch (error) {
        console.error("Error during upload:", error);
        throw error; 
    }
};

  return (
    <div className="dataset-page">
      <h2>Select or Drag & Drop Files</h2>

      <div className="drop-zone" onDrop={handleDrop} onDragOver={handleDragOver}>
        <p>Drag files here</p>
      </div>

      <div className="file-input-container">
        <input type="file" id="fileInput" multiple onChange={handleFileSelect} />
        <label className="dp-lbl" htmlFor="fileInput">Select Files</label>
      </div>

      {selectedFiles.length > 0 ? (
        <h1>Selected File: {fileName}</h1>
      ) : (
        <h1>No file selected</h1>
      )}

      <button className="dp-btn" onClick={sendFile}>Set File</button>
    </div>
  );
};

export default DatasetPage;