"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);    

    try {
      const response = await fetch(' http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });
      console.log("response", response);
      if (!response.ok) {
        throw new Error('File upload failed.');
      }

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
      setError(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file.');
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit}>
      <input type="file" accept=".sql" onChange={handleFileChange} />
      <button type="submit">Upload</button>
    </form>
    {error && <p style={{ color: 'red' }}>{error}</p>}
    {response && (
      <div>
        <h3>Server Response:</h3>
        <pre>{response}</pre>
      </div>
    )}
  </div>
  );
}
