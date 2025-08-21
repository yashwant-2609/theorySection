import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { fadeIn } from './animations';
import { QRCodeSVG } from 'qrcode.react';

const uploadOptions = [
  { label: "Upload from Device", value: "device" },
  { label: "Use Camera", value: "camera" },
  { label: "Scan QR", value: "qr" },
];

const ReviewAnswers = () => {
  const { state } = useLocation();
  const { answers, questionPaperData } = state || {};
  const [uploadModal, setUploadModal] = useState({ open: false, qid: null, section: null });
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({});
  const [matchAnswers, setMatchAnswers] = useState({});
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [tfAnswers, setTfAnswers] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [qrData, setQrData] = useState(null);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Initialize state from existing answers
  useEffect(() => {
    if (answers) {
      // Initialize MCQ answers
      const mcqState = {};
      // Initialize True/False answers
      const tfState = {};
      // Initialize Match answers
      const matchState = {};
      // Initialize uploaded images
      const imagesState = {};
      
      questionPaperData.section_data?.forEach(section => {
        section.question_data.forEach(q => {
          if (q.question_type_name === "MCQ" && answers[q.question_id] !== undefined) {
            mcqState[q.question_id] = answers[q.question_id];
          } else if (q.question_type_name === "True/False" && answers[q.question_id] !== undefined) {
            tfState[q.question_id] = answers[q.question_id];
          } else if (q.question_type_name === "Match the Following") {
            q.match_pairs.forEach((_, i) => {
              const key = `${q.question_id}_${i}`;
              if (answers[key] !== undefined) {
                matchState[key] = answers[key];
              }
            });
          } else if (answers[q.question_id] && typeof answers[q.question_id] === 'object') {
            // Handle uploaded images
            imagesState[q.question_id] = answers[q.question_id];
          }
        });
      });
      
      setMcqAnswers(mcqState);
      setTfAnswers(tfState);
      setMatchAnswers(matchState);
      setUploadedImages(imagesState);
    }
  }, [answers, questionPaperData]);

  if (!answers || !questionPaperData) {
    return <div className="p-8 text-center text-red-600">No answers to review.</div>;
  }

  // Handle MCQ answer change
  const handleMcqChange = (qid, value) => {
    setMcqAnswers(prev => ({ ...prev, [qid]: value }));
  };

  // Handle True/False answer change
  const handleTfChange = (qid, value) => {
    setTfAnswers(prev => ({ ...prev, [qid]: value === "true" }));
  };

  // Handle Match answer change
  const handleMatchChange = (key, value) => {
    setMatchAnswers(prev => ({ ...prev, [key]: value }));
  };

  // Camera capture logic
  const handleCapture = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && uploadModal.qid) {
      const newImages = files.map(file => URL.createObjectURL(file));
      
      setUploadedImages(prev => ({
        ...prev,
        [uploadModal.qid]: [...(prev[uploadModal.qid] || []), ...newImages]
      }));
      
      // After selecting images, show the Done button
      setUploadComplete(true);
    }
  };

  // Remove uploaded image
  const removeImage = (qid, index) => {
    setUploadedImages(prev => {
      const updated = [...prev[qid]];
      updated.splice(index, 1);
      return { ...prev, [qid]: updated };
    });
  };

  // // Generate QR data for a specific question
  // const generateQRData = (question) => {
  //   // Create a unique identifier for this question
  //   const qrData = {
  //     questionId: question.question_id,
  //     examId: questionPaperData.exam_details?.exam_id || "unknown",
  //     sectionId: question.section?.assessment_section_id || "unknown",
  //     timestamp: Date.now(),
  //     // This URL would be handled by your mobile app to open the camera
  //     action: "capture-answer"
  //   };
    
  //   return JSON.stringify(qrData);
  // };

  // Generate QR data for a specific question
const generateQRData = (question) => {
  // Create a URL that points to your camera instruction page
  const cameraUrl = `${window.location.origin}/camera-instructions?questionId=${question.question_id}&examId=${questionPaperData.exam_details?.exam_id || "unknown"}&sectionId=${question.section?.assessment_section_id || "unknown"}`;
  
  return cameraUrl;
};

  // Handle QR option selection
  const handleQROption = (question) => {
    const data = generateQRData(question);
    setQrData(data);
    setShowQR(true);
  };

  const getAnswerDisplay = (q, idx) => {
    if (q.question_type_name === "MCQ") {
      const options = [
        q.option1_latex,
        q.option2_latex,
        q.option3_latex,
        q.option4_latex,
        q.option5_latex,
      ].filter(opt => opt !== null && opt !== undefined);
      
      return (
        <div className="flex flex-col gap-2 mt-2">
          {options.map((opt, optIdx) => (
            <label key={optIdx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`mcq-${q.question_id}`}
                value={optIdx}
                checked={mcqAnswers[q.question_id] === optIdx}
                onChange={() => handleMcqChange(q.question_id, optIdx)}
                className="h-4 w-4 text-blue-600"
              />
              <span>{String.fromCharCode(65 + optIdx)}) {opt}</span>
            </label>
          ))}
        </div>
      );
    }
    
    if (q.question_type_name === "True/False") {
      return (
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`tf-${q.question_id}`}
              value="true"
              checked={tfAnswers[q.question_id] === true}
              onChange={() => handleTfChange(q.question_id, "true")}
              className="h-4 w-4 text-blue-600"
            />
            True
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`tf-${q.question_id}`}
              value="false"
              checked={tfAnswers[q.question_id] === false}
              onChange={() => handleTfChange(q.question_id, "false")}
              className="h-4 w-4 text-blue-600"
            />
            False
          </label>
        </div>
      );
    }
    
    if (q.question_type_name === "Match the Following") {
      const getAlphabetPrefix = (idx) => String.fromCharCode(65 + idx);
      const rightItems = q.shuffle_options
        ? [...q.match_pairs]
            .sort(() => Math.random() - 0.5)
            .map((pair) => pair.right)
        : q.match_pairs.map((pair) => pair.right);

      return (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-center bg-gray-100 py-2">Column A</h4>
              <ul className="space-y-2">
                {q.match_pairs.map((pair, idx) => (
                  <li key={`left-${idx}`} className="p-2 border rounded flex items-center">
                    <span className="mr-2 font-medium">{idx + 1}.</span>
                    {pair.left}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-center bg-gray-100 py-2">Column B</h4>
              <ul className="space-y-2">
                {rightItems.map((item, idx) => (
                  <li key={`right-${idx}`} className="p-2 border rounded flex items-center">
                    <span className="mr-2 font-medium">{getAlphabetPrefix(idx)}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Input boxes for matching at the bottom */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Your Answers:</h4>
            <div className="grid grid-cols-2 gap-2">
              {q.match_pairs.map((pair, idx) => (
                <div key={`input-${idx}`} className="flex items-center">
                  <span className="mr-2 font-semibold">{idx + 1} →</span>
                  <input
                    type="text"
                    placeholder="Enter letter"
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={matchAnswers[`${q.question_id}_${idx}`] || ""}
                    onChange={(e) => handleMatchChange(`${q.question_id}_${idx}`, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // For theory or other types
    return (
      <div className="mt-2">
        <button
          className="px-4 py-1 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded shadow hover:scale-105 transition"
          onClick={() => setUploadModal({ open: true, qid: q.question_id, section: q.section })}
        >
          Upload Answer
        </button>
        
        {/* Show uploaded images preview */}
        {uploadedImages[q.question_id] && uploadedImages[q.question_id].length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {uploadedImages[q.question_id].map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt={`Upload ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                <button
                  onClick={() => removeImage(q.question_id, idx)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleFinalSubmit = () => {
    // Combine all answers
    const finalAnswers = {
      ...mcqAnswers,
      ...tfAnswers,
      ...matchAnswers,
      ...uploadedImages
    };
    
    // Here you would typically send the answers to your backend
    console.log("Final answers:", finalAnswers);
    alert("Answers submitted successfully!");
    navigate("/");
  };

  const closeUploadModal = () => {
    setUploadModal({ open: false, qid: null, section: null });
    setShowCamera(false);
    setShowQR(false);
    setCapturedImage(null);
    setUploadComplete(false);
    setQrData(null);
  };

  // Handle option selection in the upload modal
  const handleUploadOption = (option, question) => {
    if (option.value === "device") {
      fileInputRef.current.click();
    } else if (option.value === "camera") {
      setShowCamera(true);
    } else if (option.value === "qr") {
      handleQROption(question);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8 flex flex-col items-center font-inter text-gray-800"
    >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-white p-6 sm:p-10 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-200 mb-4 hover:shadow-blue-100 transition-all duration-300"
      >
        {/* Header section with enhanced styling */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8 pb-4 border-b border-gray-200"
        >
          <p className="font-bold text-lg sm:text-xl md:text-2xl mb-1 text-gray-900 hover:text-blue-700 transition-colors">
            {questionPaperData.exam_details.board.replace(/\\/g, '')}
          </p>
          <p className="font-bold text-base sm:text-lg md:text-xl mb-1 text-gray-800">
            {questionPaperData.exam_details.examination}
          </p>
          <p className="font-bold text-sm sm:text-base md:text-lg mb-4 text-gray-700">
            {questionPaperData.exam_details.class}
          </p>
          <div className="flex justify-between items-center text-sm sm:text-base mb-8 px-4">
            <p className="text-gray-600">Time: {questionPaperData.exam_details.time_allowed}</p>
            <p className="text-gray-600">Max. Marks: {questionPaperData.exam_details.max_marks}</p>
          </div>
          <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl tracking-wide text-blue-700 uppercase">
            Review Your Answers
          </h1>
        </motion.div>

        <div className="space-y-10">
          {questionPaperData.section_data?.map((section, sIdx) => (
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ delay: sIdx * 0.1 }}
              key={section.assessment_section_id}
              className="hover:shadow-lg transition-shadow duration-300 rounded-xl p-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-indigo-700">
                  Section {section.section_number}: {section.section_heading}
                </h3>
              </div>
              <div className="space-y-6">
                {section.question_data.map((q, idx) => (
                  <div
                    key={q.question_id}
                    className="p-4 rounded-lg border shadow-sm bg-gradient-to-r from-white to-blue-50"
                  >
                    <div className="font-semibold text-black text-left">Q{idx + 1}: {q.question_latex}</div>
                    {getAnswerDisplay({ ...q, section }, idx)}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="w-full py-4 flex justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFinalSubmit}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-bold text-lg transition-all duration-300"
        >
          Submit All Answers
        </motion.button>
      </motion.div>

      {/* Upload Modal */}
      {uploadModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-red-600"
              onClick={closeUploadModal}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4 text-blue-700">
              Upload Answer for Section {uploadModal.section?.section_number}: {uploadModal.section?.section_heading}
            </h3>
            
            {/* Show already uploaded images */}
            {uploadedImages[uploadModal.qid] && uploadedImages[uploadModal.qid].length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Uploaded Images:</h4>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages[uploadModal.qid].map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Upload ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                      <button
                        onClick={() => removeImage(uploadModal.qid, idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {/* QR Code Display */}
              {/* {showQR && qrData && (
                <div className="flex flex-col items-center space-y-4">
                  <h4 className="font-medium text-center">Scan this QR code with your phone to open the camera</h4>
                  <QRCodeSVG
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="border border-gray-200 p-2 rounded"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    Scan this code with your mobile phone to open the camera and capture answer images
                  </p>
                  <button
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:scale-105 transition"
                    onClick={closeUploadModal}
                  >
                    Done
                  </button>
                </div>
              )} */}
             {showQR && qrData && (
  <div className="flex flex-col items-center space-y-4">
    <h4 className="font-medium text-center">Scan this QR code with your phone</h4>
    <QRCodeSVG
      value={qrData}
      size={200}
      level="H"
      includeMargin={true}
      className="border border-gray-200 p-2 rounded"
    />
    <div className="text-sm text-gray-600 text-center">
      <p>1. Open your phone's camera app</p>
      <p>2. Point it at this QR code</p>
      <p>3. Tap the link that appears</p>
      <p>4. Follow the instructions to capture your answer</p>
    </div>
    <button
      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:scale-105 transition"
      onClick={closeUploadModal}
    >
      Done
    </button>
  </div>
)}

              {/* Camera View */}
              {showCamera && !uploadComplete && (
                <div className="flex flex-col items-center space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleCapture}
                    multiple
                  />
                  {!capturedImage ? (
                    <>
                      <p className="text-sm text-gray-600 text-center">
                        Click the button below to open your device's camera
                      </p>
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded shadow"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Open Camera
                      </button>
                    </>
                  ) : (
                    <>
                      <img src={capturedImage} alt="Captured" className="w-40 h-40 object-contain rounded shadow" />
                      <button
                        className="px-4 py-2 bg-green-500 text-white rounded shadow"
                        onClick={() => {
                          // Add the captured image to uploaded images
                          if (uploadModal.qid) {
                            setUploadedImages(prev => ({
                              ...prev,
                              [uploadModal.qid]: [...(prev[uploadModal.qid] || []), capturedImage]
                            }));
                          }
                          setCapturedImage(null);
                          setUploadComplete(true);
                        }}
                      >
                        Add Image
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Upload Options (only show if not in QR or Camera mode) */}
              {!showQR && !showCamera && !uploadComplete && (
                <>
                  {uploadOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg shadow hover:scale-105 transition"
                      onClick={() => handleUploadOption(opt, { 
                        question_id: uploadModal.qid, 
                        section: uploadModal.section 
                      })}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleCapture}
                    multiple
                  />
                </>
              )}

              {/* Done button after upload (only for device uploads) */}
              {uploadComplete && !showQR && !showCamera && (
                <button
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow hover:scale-105 transition"
                  onClick={closeUploadModal}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ReviewAnswers;