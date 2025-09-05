import axios from 'axios';
import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CameraPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]);
  const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(true);
  
  const questionId = searchParams.get('questionId');
  const assessmentId = searchParams.get('assessmentId');
  const sectionId = searchParams.get('sectionId');
  const userAnswerId = searchParams.get('userAnswerId');

  const cameraInfo = JSON.parse(localStorage.getItem("cameraInfo") || "{}");
  const sectionNumber = cameraInfo.sectionNumber;
  const sectionHeading = cameraInfo.sectionHeading;
  const questionNumber = cameraInfo.questionNumber;

  // useEffect(() => {
  //   // Automatically start camera when component mounts
  //   startCamera();
  // }, []);

    useEffect(() => {
    startCamera();
    // Cleanup on unmount
    return () => stopCamera();
    // eslint-disable-next-line
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use rear camera
      });
      // setStream(mediaStream);
      // if (videoRef.current) {
      //   videoRef.current.srcObject = mediaStream;
      // }
       setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Cannot access camera: ' + err.message);
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImages(prev => [...prev, imageDataUrl]);
    }
  };

  // const stopCamera = () => {
  //   if (stream) {
  //     stream.getTracks().forEach(track => track.stop());
  //     setStream(null);
  //   }
  // };
    const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

    const handleAddMore = () => {
    // Camera stays open, just allow another capture
  };

    const handleCancel = () => {
    setCapturedImages([]);
    setError(null);
    setCameraActive(true);
    startCamera();
  };


  const uploadImages = async () => {
      const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MTkxMTI3NjcyNzYiLCJ0b2tlblZlcnNpb24iOjE3NTYzMTQyNzkxMTAxODk3LCJpYXQiOjE3NTY0ODk5MjgsImV4cCI6MzUxMzAxNzEwNX0.TgVE9qc5yztYw9g49mikqF2bueSi8-KdOT8f5AruKSY";

    // Implement upload logic to your server
    try {
      // Convert data URLs to Blobs for uploading
      const imageBlobs = await Promise.all(
        capturedImages.map(async (dataUrl) => {
          const response = await fetch(dataUrl);
          return await response.blob();
        })
      );
      
      // Create FormData for upload
      // const formData = new FormData();
      // formData.append('questionId', questionId);
      // formData.append('assessmentId', assessmentId);
      // formData.append('sectionId', sectionId);
      
      // imageBlobs.forEach((blob, index) => {
      //   formData.append('images', blob, `answer-${index}.jpg`);
      // });

        for (let blob of imageBlobs) {
      const formData = new FormData();
      formData.append("userAnswerId", userAnswerId); // <-- Pass userAnswerId
      formData.append("userAnswerImages", blob, "answer.jpg"); // <-- Pass image
      formData.append("userAnswerText", null); // <-- Pass null
      formData.append("answerUploadType", "ANSWER_IMAGE"); // <-- Pass type
        }

      console.log("Parameter Data", userAnswerId );
      console.log("form data", formData)
      // Upload to your server
     const res = await axios.post(
          "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      
      if (response.ok) {
        alert('Images uploaded successfully!');
        navigate('/'); // Return to home or review page
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading images: ' + err.message);
    }
  };

  const removeImage = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4">
        <h1 className="text-xl font-bold text-center mb-4">Capture Answer</h1>
        {/* <p className="text-center mb-4">Question ID: {questionId}</p> */}
        <p className="text-center mb-4">
          Section {sectionNumber}: {sectionHeading} <br />
          Question {questionNumber}
        </p>
        
        {error ? (
          <div className="p-4 bg-red-100 border border-red-200 rounded-lg mb-4">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={startCamera}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* <div className="camera-container mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-64 object-cover rounded-lg border"
              />
              <div className="flex justify-center mt-2 space-x-2">
                <button 
                  onClick={captureImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Capture
                </button>
                <button 
                  onClick={stopCamera}
                  className="px-4 py-2 bg-gray-600 text-white rounded"
                >
                  Stop Camera
                </button>
              </div>
            </div> */}
            {/* <> */}
            {cameraActive && (
              <div className="camera-container mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-[480px] object-cover rounded-lg border" // Increased height
                />
                <div className="flex justify-center mt-2 space-x-2">
                  <button
                    onClick={captureImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-gray-600 text-white rounded"
                  >
                    Stop Camera
                  </button>
                </div>
              </div>
            )}

            {capturedImages.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Captured Images ({capturedImages.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {capturedImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Capture ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  {/* <button
                    onClick={handleAddMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    disabled={!cameraActive}
                  >
                    Add More
                  </button> */}
                  <button
                    onClick={uploadImages}
                    className="px-4 py-2 bg-green-600 text-white rounded font-semibold"
                  >
                    Upload
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CameraPage;