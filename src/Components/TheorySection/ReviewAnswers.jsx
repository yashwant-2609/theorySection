import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "./animations";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";

const uploadOptions = [
  { label: "Upload from Device", value: "device" },
  { label: "Use Camera", value: "camera" },
  { label: "Scan QR", value: "qr" },
];

const ReviewAnswers = () => {
  const { state } = useLocation();
  const { answers, questionPaperData, userAnswerIds, time_taken,ass_end_time } = state || {};
  const [uploadModal, setUploadModal] = useState({
    open: false,
    qid: null,
    section: null,
  });
  const [showCamera, setShowCamera] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploadedImages, setUploadedImages] = useState({});
  const [matchAnswers, setMatchAnswers] = useState({});
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [tfAnswers, setTfAnswers] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [pendingUploads, setPendingUploads] = useState({}); // { [qid]: [File, ...] }
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const [uploadedStatus, setUploadedStatus] = useState({});
  const [savedMcq, setSavedMcq] = useState({});
  // const [uploadedImages, setUploadedImages] = useState({});
  const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MTkxMTI3NjcyNzYiLCJ0b2tlblZlcnNpb24iOjE3NTYzMTQyNzkxMTAxODk3LCJpYXQiOjE3NTY0ODk5MjgsImV4cCI6MzUxMzAxNzEwNX0.TgVE9qc5yztYw9g49mikqF2bueSi8-KdOT8f5AruKSY";

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

      questionPaperData.section_data?.forEach((section) => {
        section.question_data.forEach((q) => {
          if (
            q.question_type_name === "MCQ1" &&
            answers[q.question_id] !== undefined
          ) {
            mcqState[q.question_id] = answers[q.question_id];
          } else if (
            q.question_type_name === "True/False" &&
            answers[q.question_id] !== undefined
          ) {
            tfState[q.question_id] = answers[q.question_id];
          } else if (q.question_type_name === "Match the Following") {
            q.match_pairs.forEach((_, i) => {
              const key = `${q.question_id}_${i}`;
              if (answers[key] !== undefined) {
                matchState[key] = answers[key];
              }
            });
          } else if (
            answers[q.question_id] &&
            typeof answers[q.question_id] === "object"
          ) {
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

  useEffect(() => {
    if (!userAnswerIds) return;


    const fetchUploadStatus = async () => {
      const statusObj = {};
      const mcqState = {};
      const savedMcqState = {};
      for (const qid in userAnswerIds) {
        const user_answer_id = userAnswerIds[qid];
        try {
          const res = await axios.get(
            `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/get?user_answer_id=${user_answer_id}`
          );
          // If user_answer is not null, mark as uploaded
          if (res.data && res.data.user_answer) {
            statusObj[qid] = "uploaded";
            const answerAlphabet = res.data.user_answer;
            if (
              typeof answerAlphabet === "string" &&
              answerAlphabet.length === 1 &&
              answerAlphabet.match(/[A-Z]/i)
            ) {
              mcqState[qid] = answerAlphabet.charCodeAt(0) - 65;
              savedMcqState[qid] = true; // Mark as saved if answer exists
            }
          }
        } catch (err) {
          console.log("Error", err);
          // Optionally handle error
        }
      }
      setUploadedStatus((prev) => ({ ...prev, ...statusObj }));
      setMcqAnswers((prev) => ({ ...prev, ...mcqState }));
      setSavedMcq((prev) => ({ ...prev, ...savedMcqState })); // <-- Add this line
    };

    fetchUploadStatus();
    // eslint-disable-next-line
  }, [userAnswerIds]);

  if (!answers || !questionPaperData) {
    return (
      <div className="p-8 text-center text-red-600">No answers to review.</div>
    );
  }

  // Handle MCQ answer change
  const handleMcqChange = (qid, value) => {
    setMcqAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  // Handle True/False answer change
  const handleTfChange = (qid, value) => {
    setTfAnswers((prev) => ({ ...prev, [qid]: value === "true" }));
  };

  // Handle Match answer change
  const handleMatchChange = (key, value) => {
    setMatchAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Update handleCapture to store File objects for upload
  const handleCapture = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && uploadModal.qid) {
      setPendingUploads((prev) => ({
        ...prev,
        // [uploadModal.qid]: files,
          [uploadModal.qid]: [...(prev[uploadModal.qid] || []), ...files], // <-- This adds to the array!
      }));
      setUploadComplete(false);
    }
  };

  // //Remove uploaded image
  // const removeImage = (qid, idx) => {
  //   setUploadedImages((prev) => {
  //     const updatedImages = [...prev[qid]];
  //     updatedImages.splice(idx, 1);
  //     return { ...prev, [qid]: updatedImages };
  //   });
  // }

  const removePendingImage = (qid, idx) => {
    setPendingUploads((prev) => {
      const updated = [...(prev[qid] || [])];
      updated.splice(idx, 1);
      return { ...prev, [qid]: updated };
    });
  };

  // Cancel device upload
  const handleCancelUpload = (qid) => {
    setPendingUploads((prev) => ({ ...prev, [qid]: [] }));
    setUploadComplete(false);
    closeUploadModal();
  };

  // Upload device images for a question
  const handleUploadImages = async (qid) => {
    console.log("Uploading images for question:", qid);
    setUploading(true);
    try {
      const token =
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MTkxMTI3NjcyNzYiLCJ0b2tlblZlcnNpb24iOjE3NTU1OTQ0MTU4MTI3MTg4LCJpYXQiOjE3NTU3Njk5OTIsImV4cCI6MzUxMTUzNTA2NX0.o5phxoftx3ZfYj5Hj2Zx3dSe72_UncoNoEAHsvmagOs";
      const files = pendingUploads[qid];
      const userAnswerId = userAnswerIds[qid];
      console.log(
        "Uploading files for question:",
        qid,
        "User Answer ID:",
        userAnswerId,
        "token",
        token
      );
      let newImageUrls = [];
      for (let file of files) {
        const formData = new FormData();
        formData.append("userAnswerId", userAnswerId);
        formData.append("userAnswerImages", file);
        // Replace with your actual API endpoint
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
        if (res.status === 200) {
          console.log("Upload successful :", res);
          setUploadedStatus((prev) => ({ ...prev, [qid]: "uploaded" }));
          setUploadModal({ open: false, qid: null, section: null });
          setShowCamera(false);
          setShowQR(false);
          setCapturedImage(null);
          setUploadComplete(false);
          setQrData(null);
        }
        // If your API returns the uploaded image URL, use it. Otherwise, use local preview.
        if (res.data?.imageUrl) {
          newImageUrls.push(res.data.imageUrl);
        } else {
          newImageUrls.push(URL.createObjectURL(file));
        }
      }
      setUploadedImages((prev) => ({
        ...prev,
        [qid]: [...(prev[qid] || []), ...newImageUrls],
      }));
      setPendingUploads((prev) => ({ ...prev, [qid]: [] }));
      setUploadComplete(false);
      closeUploadModal();
    } catch (err) {
      alert("Upload failed. Please try again.");
      console.error("Upload error:", err);
    }
    setUploading(false);
  };

  // Generate QR data for a specific question
  const generateQRData = (question) => {
    // Create a URL that points to your camera instruction page
    // const cameraUrl = `${window.location.origin
    //   }/camera-instructions?questionId=${question.question_id}&assessmentId=${questionPaperData.assessment_id || "unknown"
    //   }&sectionId=${question.section?.assessment_section_id || "unknown"}`;
    const cameraUrl = `${window.location.origin}/camera-instructions?questionId=${question.question_id}&userAnswerId=${userAnswerIds[question.question_id]}`;
    return cameraUrl;
  };

  // Before generating QR, store info in localStorage
  // const handleQROption = (question, section, questionNumber) => {
  //   console.log("Stored cameraInfo in localStorage:", {
  //     sectionNumber: section.section_number,
  //     sectionHeading: section.section_heading,
  //     questionNumber: questionNumber,
  //   });
  //   localStorage.setItem("cameraInfo", JSON.stringify({
  //     sectionNumber: section.section_number,
  //     sectionHeading: section.section_heading,
  //     questionNumber: questionNumber,
  //   }));
  //   setQrData(`${window.location.origin}/camera-instructions`);
  //   console.log("QR Data URL:", qrData);
  //   setShowQR(true);
  // };

  const handleQROption = (qid, section, questionNumber) => {
    if (!section) {
      alert("Section information is missing!");
      return;
    }
    // localStorage.setItem("cameraInfo", JSON.stringify({
    //   sectionNumber: section.section_number,
    //   sectionHeading: section.section_heading,
    //   questionNumber: questionNumber,
    // }));
    
    // setQrData(`${window.location.origin}/camera-instructions`);
    // setQrData(`${window.location.origin}/#/camera-instructions`);
   setQrData(`${window.location.origin}/#/camera-instructions?questionId=${qid}&userAnswerId=${userAnswerIds[qid]}`);
    setShowQR(true);
  };

  const getAnswerDisplay = (q, idx) => {
    if (q.question_type_name === "MCQ1") {
      const options = [
        q.option1_latex,
        q.option2_latex,
        q.option3_latex,
        q.option4_latex,
        q.option5_latex,
      ].filter((opt) => opt !== null && opt !== undefined);

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
              <span>
                {String.fromCharCode(65 + optIdx)}) {opt}
              </span>
            </label>
          ))}
            {mcqAnswers[q.question_id] !== undefined && !savedMcq[q.question_id] && (
        <div className="flex gap-4 mt-2">
          <button
            className="px-4 py-1 bg-blue-600 text-white rounded shadow"
            onClick={() => handleSaveMCQ(q.question_id)}
          >
            Save
          </button>
          <button
            className="px-4 py-1 bg-red-500 text-white rounded shadow"
            onClick={() => handleClearMCQ(q.question_id)}
          >
            Clear Response
          </button>
        </div>
      )}
        </div>
      );
    }

    //True and False
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
          {tfAnswers[q.question_id] !== undefined && (
            <div className="flex gap-4 mt-2">
          <button
            className="px-4 py-1 bg-blue-600 text-white rounded shadow"
            onClick={() => handleSaveMCQ(q.question_id)}
          >
            Save
          </button>
          <button
            className="px-4 py-1 bg-red-500 text-white rounded shadow"
            onClick={() => handleClearMCQ(q.question_id)}
          >
            Clear Response
          </button>
        </div>
        
      )}
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
              <h4 className="font-semibold text-center bg-gray-100 py-2">
                Column A
              </h4>
              <ul className="space-y-2">
                {q.match_pairs.map((pair, idx) => (
                  <li
                    key={`left-${idx}`}
                    className="p-2 border rounded flex items-center"
                  >
                    <span className="mr-2 font-medium">{idx + 1}.</span>
                    {pair.left}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-center bg-gray-100 py-2">
                Column B
              </h4>
              <ul className="space-y-2">
                {rightItems.map((item, idx) => (
                  <li
                    key={`right-${idx}`}
                    className="p-2 border rounded flex items-center"
                  >
                    <span className="mr-2 font-medium">
                      {getAlphabetPrefix(idx)}.
                    </span>
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
                    onChange={(e) =>
                      handleMatchChange(
                        `${q.question_id}_${idx}`,
                        e.target.value
                      )
                    }
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
        {uploadedStatus[q.question_id] === "uploaded" ? (
          <button
            className="px-4 py-1 bg-gray-400 text-white rounded shadow cursor-not-allowed"
            disabled
          >
            Uploaded
          </button>
        ) : (
          <button
            className="px-4 py-1 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded shadow hover:scale-105 transition"
            onClick={() =>
              setUploadModal({
                open: true,
                qid: q.question_id,
                section: q.section,
              })
            }
          >
            Upload Answer
          </button>
        )}

        {/* Show uploaded images preview */}
        {/* {uploadedImages[q.question_id] &&
          uploadedImages[q.question_id].length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {uploadedImages[q.question_id].map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Uploaded ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              ))}
            </div>
          )} */}
      </div>
    );
  };

  // Final submit: call API for all questions
  // const handleFinalSubmit = async () => {
  //   setUploading(true);
  //   try {
  //     // MCQ/TF/Match
  //     for (const qid in userAnswerIds) {
  //       const user_answer_id = userAnswerIds[qid];
  //       // MCQ
  //       if (mcqAnswers[qid] !== undefined) {
  //         await axios.post(
  //           "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
  //           {
  //             userAnswerId: user_answer_id,
  //             value: mcqAnswers[qid],
  //           }
  //         );
  //       }
  //       // True/False
  //       else if (tfAnswers[qid] !== undefined) {
  //         await axios.post(
  //           "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
  //           {
  //             userAnswerId: user_answer_id,
  //             value: tfAnswers[qid],
  //           }
  //         );
  //       }
  //       // Match the Following
  //       else if (Object.keys(matchAnswers).some((k) => k.startsWith(qid))) {
  //         // Send all match values for this question as needed by your API
  //         // Example: { answerid, value: { 0: "A", 1: "B", ... } }
  //         const matchObj = {};
  //         Object.keys(matchAnswers).forEach((k) => {
  //           if (k.startsWith(qid)) {
  //             const idx = k.split("_")[1];
  //             matchObj[idx] = matchAnswers[k];
  //           }
  //         });
  //         await axios.post(
  //           "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
  //           {
  //             answerid: user_answer_id,
  //             value: matchObj,
  //           }
  //         );
  //       }
  //       // Theory with images
  //       if (pendingUploads[qid] && pendingUploads[qid].length > 0) {
  //         for (let file of pendingUploads[qid]) {
  //           const formData = new FormData();
  //           formData.append("userAnswerId", user_answer_id);
  //           formData.append("image", file);
  //           await axios.post(
  //             "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
  //             formData,
  //             {
  //               headers: { "Content-Type": "multipart/form-data" },
  //             }
  //           );
  //         }
  //       }
  //     }
  //     alert("All answers submitted!");
  //     navigate("/solutionpage");
  //   } catch (err) {
  //     alert("Submission failed. Please try again.");
  //   }
  //   setUploading(false);
  // };

  const refreshSingleMCQAnswer = async (qid, user_answer_id) => {
  try {
    const res = await axios.get(
      `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/get?user_answer_id=${user_answer_id}`
    );
    if (res.data && res.data.user_answer) {
      // Convert alphabet back to index for checked state
      const answerAlphabet = res.data.user_answer;
      const idx = answerAlphabet
        ? answerAlphabet.charCodeAt(0) - 65
        : undefined;
      setMcqAnswers((prev) => ({ ...prev, [qid]: idx }));
    }
  } catch (err) {
    // Optionally handle error
  }
};

  const handleSaveMCQ = async (qid) => {
  const user_answer_id = userAnswerIds[qid];
    // Convert index to alphabet (A, B, C, ...)
  const selectedIdx = mcqAnswers[qid];
  const selectedAlphabet = String.fromCharCode(65 + Number(selectedIdx));
  const MCQpayload = {
        userAnswerId: user_answer_id,
        userAnswerImages: null,
        userAnswerText: selectedAlphabet,
        answerUploadType: "ANSWER_TEXT",
      }
  try {
    await axios.post(
      "https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer",
      MCQpayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("MCQ Payload", MCQpayload);
     await refreshSingleMCQAnswer(qid, user_answer_id);
      setSavedMcq((prev) => ({ ...prev, [qid]: true })); // Mark as saved
    alert("Answer saved!");
  } catch (err) {
    alert("Failed to save answer.");
  }
};

const handleClearMCQ = (qid) => {
   setSavedMcq((prev) => ({ ...prev, [qid]: true })); // Mark as saved
  setMcqAnswers((prev) => ({ ...prev, [qid]: undefined }));
};


  const handleFinalSubmit = async () => {
  setUploading(true);
 const payload = {
      // user_ass_id: questionPaperData.user_assessment_id,
      assessment_status: "SUBMITTED",
      time_taken: time_taken,
      ass_end_time: ass_end_time,
      // ...other parameters as needed
    };
    console.log("Final Submit Payload", payload);
  try {
    const response = await axios.get(
      // `https://api-dev.mindshaala.com/api/v1/cil/assessment/submit/theory?user_ass_id=${user_ass_id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // const requests = [];

    // for (const qid in userAnswerIds) {
    //   const user_answer_id = userAnswerIds[qid];

    //   // MCQ
    //   if (mcqAnswers[qid] !== undefined) {
    //     requests.push(
    //       axios.post(
    //         `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer`,
    //         {
    //           userAnswerId: user_answer_id,
    //           userAnswerImages: null,
    //           userAnswerText: mcqAnswers[qid],
    //           answerUploadType: "ANSWER_TEXT",
    //         },
    //         {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           "Content-Type": "multipart/form-data",
    //         },
    //       }
    //       )
    //     );
    //   }

    //   // True/False
    //   if (tfAnswers[qid] !== undefined) {
    //     requests.push(
    //       axios.post(
    //         `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer`,
    //         {
    //           userAnswerId: user_answer_id,
    //           userAnswerImages: null,
    //           userAnswerText: tfAnswers[qid],
    //           answerUploadType: "ANSWER_TEXT",
    //         },
    //         {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           "Content-Type": "multipart/form-data",
    //         },
    //       }
    //       )
    //     );
    //   }

    //   // Match the Following
    //   if (Object.keys(matchAnswers).some((k) => k.startsWith(qid))) {
    //     const matchObj = {};
    //     Object.keys(matchAnswers).forEach((k) => {
    //       if (k.startsWith(qid)) {
    //         const idx = k.split("_")[1];
    //         matchObj[idx] = matchAnswers[k];
    //       }
    //     });
    //     requests.push(
    //       axios.post(
    //         `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer`,
    //         {
    //           userAnswerId: user_answer_id,
    //           userAnswerImages: null,
    //           userAnswerText: matchObj,
    //           answerUploadType: "ANSWER_TEXT",
    //         },
    //         {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           "Content-Type": "multipart/form-data",
    //         },
    //       }
    //       )
    //     );
    //   }

      // Theory with images
      // if (pendingUploads[qid] && pendingUploads[qid].length > 0) {
      //   for (let file of pendingUploads[qid]) {
      //     const formData = new FormData();
      //     formData.append("userAnswerId", user_answer_id);
      //     formData.append("userAnswerImages", file);
      //     formData.append("userAnswerText", null);
      //     formData.append("answerUploadType", "ANSWER_IMAGE");
      //     requests.push(
      //       axios.post(
      //         `https://api-dev.mindshaala.com/api/v1/cil/user-answer-data/save/theory_answer`,
      //         formData,
      //         {
      //           headers: { "Content-Type": "multipart/form-data" },
      //         }
      //       )
      //     );
      //   }
      // }
    // }

    // await Promise.all(requests);

    alert("All answers submitted!");
    console.log("All requests completed successfully");
    console.log("Navigating to solution page");
    navigate("/solutionpage");
  } catch (err) {
    alert("Submission failed. Please try again.");
    console.error("Submission error:", err);
  }
  setUploading(false);
};


  const closeUploadModal = () => {
    setUploadModal({ open: false, qid: null, section: null });
    setShowCamera(false);
    setShowQR(false);
    setCapturedImage(null);
    setUploadComplete(false);
    setQrData(null);
  };

  const handleAbdMore = () => {
    // Camera stays open, just allow another capture
  };

  // Handle option selection in the upload modal
  // const handleUploadOption = (option, question) => {
  //   if (option.value === "device") {
  //     fileInputRef.current.click();
  //   } else if (option.value === "camera") {
  //     setShowCamera(true);
  //   } else if (option.value === "qr") {
  //     handleQROption(question);
  //   }
  // };
  const handleUploadOption = (option, qid, section, questionNumber) => {
    if (option.value === "device") {
      fileInputRef.current.click();
    } else if (option.value === "camera") {
      setShowCamera(true);
    } else if (option.value === "qr") {
      handleQROption(qid, section, questionNumber);
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
            {/* {questionPaperData.exam_details.board.replace(/\\/g, '')} */}
          </p>
          <p className="font-bold text-base sm:text-lg md:text-xl mb-1 text-gray-800">
            {/* {questionPaperData.exam_details.examination} */}
            {questionPaperData.assessment_name || "Examination Name"}
          </p>
          <p className="font-bold text-sm sm:text-base md:text-lg mb-4 text-gray-700">
            {/* {questionPaperData.exam_details.class} */}
          </p>
          <div className="flex justify-between items-center text-sm sm:text-base mb-8 px-4">
            {/* <p className="text-gray-600">Time: {questionPaperData.exam_details.time_allowed || "30"}</p> */}
            <p className="text-gray-600">
              Time: {questionPaperData.total_tim || "30"}
            </p>
            {/* <p className="text-gray-600">Max. Marks: {questionPaperData.exam_details.max_marks || "80"}</p> */}
            <p className="text-gray-600">
              Max. Marks: {questionPaperData.total_marks || "80"}
            </p>
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
                    <div className="font-semibold text-black text-left">
                      Q{idx + 1}: {q.question_latex}
                    </div>
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
          // onClick={handleFinalSubmit}
          onClick={() => navigate("/solutionpage")}
          disabled={uploading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-bold text-lg transition-all duration-300"
        >
          {uploading ? "Submitting..." : "Submit All Answers"}
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
              Upload Answer for Section {uploadModal.section?.section_number}:{" "}
              {uploadModal.section?.section_heading}
            </h3>

            {/* Show already uploaded images */}
            {uploadedImages[uploadModal.qid] &&
              uploadedImages[uploadModal.qid].length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Uploaded Images:</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages[uploadModal.qid].map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          // onClick={() => removeImage(uploadModal.qid, idx)}
                          onClick={() => removePendingImage(uploadModal.qid, idx)}
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
                  <h4 className="font-medium text-center">
                    Scan this QR code with your phone
                  </h4>
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
                  <p className="text-sm text-gray-600 text-center">
                    Click the button below to open your device's camera
                  </p>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded shadow"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {pendingUploads[uploadModal.qid]?.length > 0 ? "Add Image" : "Open Camera"}
                  </button>
                  {/* Preview all captured images */}
                  {pendingUploads[uploadModal.qid] && pendingUploads[uploadModal.qid].length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pendingUploads[uploadModal.qid].map((file, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => removePendingImage(uploadModal.qid, idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Show Upload and Cancel only if at least one image is captured */}
                  {pendingUploads[uploadModal.qid] && pendingUploads[uploadModal.qid].length > 0 && (
                    <div className="flex gap-4 mt-2">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded shadow"
                        onClick={() => handleUploadImages(uploadModal.qid)}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading..." : "Upload"}
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-400 text-white rounded shadow"
                        onClick={() => handleCancelUpload(uploadModal.qid)}
                        disabled={uploading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* {!capturedImage ? (
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
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-40 h-40 object-contain rounded shadow"
                      />
                      <button
                        className="px-4 py-2 bg-green-500 text-white rounded shadow"
                        onClick={() => {
                          if (uploadModal.qid) {
                            setUploadedImages((prev) => ({
                              ...prev,
                              [uploadModal.qid]: [
                                ...(prev[uploadModal.qid] || []),
                                capturedImage,
                              ],
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
              )} */}

              {/* Upload Options (only show if not in QR or Camera mode) */}
              {!showQR && !showCamera && !uploadComplete && (
                <>
                  {uploadOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg shadow hover:scale-105 transition"
                      onClick={() =>
                        handleUploadOption(opt, uploadModal.qid, uploadModal.section, uploadModal.questionNumber)
                      }
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
              {/* {uploadComplete && !showQR && !showCamera && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pendingUploads[uploadModal.qid].map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded shadow"
                      onClick={() => handleUploadImages(uploadModal.qid)}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-400 text-white rounded shadow"
                      onClick={() => handleCancelUpload(uploadModal.qid)}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )} */}
              {uploadComplete && pendingUploads[uploadModal.qid] && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                      {pendingUploads[uploadModal.qid].map((file, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            // onClick={() => removeImage(uploadModal.qid, idx)}
                            onClick={() => removePendingImage(uploadModal.qid, idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* {pendingUploads[uploadModal.qid].map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    ))} */}

                  </div>
                  <div className="flex gap-4">
                    {uploadedImages[uploadModal.qid] &&
                      uploadedImages[uploadModal.qid].length > 0 ? (
                      <span className="px-4 py-2 bg-green-500 text-white rounded shadow flex items-center">
                        Uploaded
                      </span>
                    ) : (
                      <>
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
                          onClick={() => handleUploadImages(uploadModal.qid)}
                          disabled={uploading}
                        >
                          {uploading ? "Uploading..." : "Upload"}
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-400 text-white rounded shadow"
                          onClick={() => handleCancelUpload(uploadModal.qid)}
                          disabled={uploading}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ReviewAnswers;
