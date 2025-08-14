import React, { useState } from 'react';

// The following is assumed to be available for styling:
// import 'tailwindcss/tailwind.css';

// The following is a custom icon using a simple SVG.
const ClipboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// Main application component
const App = () => {
  // State for managing the uploaded image data
  const [image, setImage] = useState(null);
  // State for storing the generated alt text
  const [altText, setAltText] = useState('');
  // State to track loading status during API calls
  const [isLoading, setIsLoading] = useState(false);
  // State to manage the drag-and-drop area's hover effect
  const [isDragging, setIsDragging] = useState(false);
  // State for a message box to provide user feedback
  const [message, setMessage] = useState('');

  // Function to handle the drag-and-drop logic
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please drop a valid image file.');
        return;
      }
      handleFile(file);
    }
  };

  // Function to handle file input from clicking
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  // Common function to process the file and generate alt text
  const handleFile = (file) => {
    setAltText('');
    setMessage('');
    const reader = new FileReader();
    reader.onloadend = () => {
      // FileReader provides the file as a Base64 string
      const base64Data = reader.result.split(',')[1];
      setImage(reader.result);
      generateAltText(base64Data, file.type);
    };
    reader.onerror = () => {
      setMessage('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Function to call the Gemini API for image understanding
  const generateAltText = async (base64Data, mimeType) => {
    setIsLoading(true);
    setMessage('Analyzing image...');

    try {
      let chatHistory = [];
      const prompt = "Describe this image in a concise and detailed manner for alt text purposes. Focus on key visual elements, colors, and the subject matter. Start directly with the description without any introductory phrases like 'The image shows...'";

      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
      };

      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

      let response = null;
      let delay = 1000;
      const maxRetries = 5;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.status === 429) {
            // Exponential backoff for rate limiting
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            retries++;
            continue;
          }

          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
          break; // Exit loop on successful response
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }

      if (!response) {
        throw new Error('Failed to fetch from API after multiple retries.');
      }

      const result = await response.json();
      const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        setAltText(generatedText);
        setMessage('Alt text generated successfully!');
      } else {
        setMessage('Could not generate alt text. Please try a different image.');
      }
    } catch (error) {
      console.error('Error generating alt text:', error);
      setMessage('An error occurred. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to copy the alt text to the clipboard
  const copyToClipboard = () => {
    if (altText) {
      // Use a temporary input element to copy text
      const tempInput = document.createElement('input');
      tempInput.value = altText;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setMessage('Alt text copied to clipboard!');
    }
  };

  // Function to reset the application state
  const handleReset = () => {
    setImage(null);
    setAltText('');
    setMessage('');
    setIsDragging(false);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#5E0009] flex flex-col items-center p-4 font-sans text-gray-100">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://marvel-b1-cdn.bc0a.com/f00000000271534/brand.missouristate.edu/_Files/logos-m.png"
            alt="Missouri State University Bear Head logo and wordmark"
            className="mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#5E0009] text-center">
            Missouri State Alt Text Generator
          </h1>
        </div>
        <p className="text-center text-gray-600 mb-8">
          Drag and drop an image or click to upload. The app will automatically
          generate descriptive alt text for accessibility.
        </p>
        
        {/* Drag and Drop Area */}
        <div
          className={`flex flex-col items-center justify-center p-8 rounded-xl transition-all duration-300 ease-in-out cursor-pointer text-gray-500
            ${isDragging ? 'bg-[#D6C2C2] border-[#5E0009] border-4' : 'bg-gray-50 border-gray-300 border-2 border-dashed hover:bg-gray-100'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {image ? (
            <img src={image} alt="Uploaded preview" className="max-h-64 rounded-lg shadow-md" />
          ) : (
            <>
              <p className="text-lg font-medium">Drag and drop an image here</p>
              <p className="text-sm mt-1">- or -</p>
              <p className="text-lg font-medium mt-1 text-[#5E0009]">Click to upload</p>
            </>
          )}
        </div>

        {/* Status and Output Section */}
        <div className="mt-8">
          {isLoading && (
            <div className="flex items-center justify-center text-lg text-white font-semibold space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating alt text...</span>
            </div>
          )}

          {message && !isLoading && (
            <div className="bg-[#F3E5E6] text-[#5E0009] p-3 rounded-lg shadow-inner text-sm font-medium">
              {message}
            </div>
          )}

          {altText && !isLoading && (
            <div className="mt-4">
              <div className="relative p-5 bg-[#F3E5E6] rounded-xl shadow-lg border-l-4 border-[#5E0009]">
                <p className="text-xl font-bold text-[#5E0009] mb-2">Generated Alt Text:</p>
                <p className="text-gray-700 text-base leading-relaxed break-words">{altText}</p>
                <button
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[#5E0009] text-white hover:bg-[#4E0008] transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-[#5E0009] focus:ring-opacity-75"
                  title="Copy to Clipboard"
                >
                  <ClipboardIcon />
                </button>
              </div>
            </div>
          )}

          {/* Reset button to clear the application state */}
          {(image || altText) && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-[#5E0009] text-white font-bold rounded-full shadow-lg hover:bg-[#4E0008] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5E0009] focus:ring-opacity-75"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
