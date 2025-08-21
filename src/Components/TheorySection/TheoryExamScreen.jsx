import React, { useEffect, useRef, useState } from 'react';
import { questionPaperData as initialQuestionPaperData } from './SAMPLEDATATHEORY'; // Import the data from the new file
import { QRCodeSVG } from 'qrcode.react';
import UploadPage from '../Upload/Upload';
import axios from 'axios';

export const TheoryExamScreen = () => {
  const contentRef = useRef(null);
  const [questionPaperData, setQuestionPaperData] = useState(initialQuestionPaperData);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null); // 'qr' or 'upload'
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // Method to simulate API call (commented out as requested)
  const fetchQuestionDataFromApi = async () => {
    console.log("Fetching question paper data from API...");
    // Simulate an API call to fetch question paper data
    try {
      // Replace with your actual API endpoint
      const response = await axios.get('https://test-medhvrushti.checkerslab.com/api/v1/cil/assessment/fetch/theory?user_ass_id=101104');
      // if (!response.status === 200) {
      //   console.log("Error", response);
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // const data = await response.json();
      setQuestionPaperData(response.data); // Update state with fetched data
      console.log('Question paper data fetched successfully:', response.data);
    } catch (error) {
      console.error('Error fetching question paper data:', error);
      // Optionally, set an error state or display a message to the user
    }
  
    console.log("API calling method is commented out. Using local data.");
  };

  // Effect to load MathJax and typeset content
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    script.onload = () => {
      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']]
        },
        svg: {
          fontCache: 'global'
        },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            if (contentRef.current) {
              window.MathJax.typesetPromise([contentRef.current]).catch((err) => console.error('MathJax typesetting error:', err));
            }
          }
        }
      };
      if (!window.MathJax) {
          window.MathJax = {};
      }
    };
    document.head.appendChild(script);

    fetchQuestionDataFromApi(); // Uncomment to enable API call on mount

    return () => {
      document.head.removeChild(script);
      delete window.MathJax;
    };
  }, []);

  // Effect to re-typeset MathJax when content changes
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise && contentRef.current) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) => console.error('MathJax re-typesetting error:', err));
    }
  }, [questionPaperData]);

  // Handler for Scan QR button click
  const handleScanQR = (questionId) => {
    setActiveQuestionId(questionId);
    setModalContent('qr');
    setShowModal(true);
  };

  // Handler for Upload Answer button click
  const handleUploadAnswer = (questionId) => {
    setActiveQuestionId(questionId);
    setModalContent('upload');
    setShowModal(true);
  };

  // Handler to close the modal
  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
    setActiveQuestionId(null);
  };

  // Helper to group questions by their 'Q.X.' number (e.g., Q.1., Q.2.)
  const groupQuestions = (questions) => {
    const grouped = [];
    let currentGroup = null;

    questions.forEach(q => {
      const qNum = q.question_number;
      if (!currentGroup || currentGroup.question_number !== qNum) {
        currentGroup = {
          question_number: qNum,
          instruction: q.instruction, // Use the instruction from the first question in the group
          marks: q.marks,
          sub_questions: []
        };
        grouped.push(currentGroup);
      }
      currentGroup.sub_questions.push(q);
    });
    return grouped;
  };

  // Process questions to handle multi-part questions (like the triangle problem) dynamically
  const processQuestionsForDisplay = (questions) => {
    const processedList = [];
    const skippedIds = new Set(); // To keep track of question IDs that are parts of a multi-part question

    questions.forEach((q, index) => {
      if (skippedIds.has(q.question_id)) {
        return; // Skip if this question has already been processed as a part of another
      }

      const questionLatex = q.ques_line_by_latex ? q.ques_line_by_latex.map(p => p.text).join('') : q.question_latex;

      // Regex to detect (i), (ii), (iii), etc., and capture the main prefix and each part's content
      // This regex is designed to work if all parts are in one string, or if they are in separate Q objects
      const partsRegex = /\((i|ii|iii|iv|v)\)\s*(.*?)(?=\s*\(i|\s*\(ii|\s*\(iii|\s*\(iv|\s*\(v\)|\s*$)/g;
      let match;
      const extractedParts = [];
      let mainTextPrefix = questionLatex; // Default to full text if no parts found

      // Try to find the first part to determine the main text prefix
      const firstPartMatch = questionLatex.match(/^\s*(.*?)\s*\((i|ii|iii|iv|v)\)\s*(.*)/);

      if (firstPartMatch) {
        mainTextPrefix = firstPartMatch[1].trim();
        let currentString = questionLatex.substring(firstPartMatch.index); // Start matching from the first part found

        while ((match = partsRegex.exec(currentString)) !== null) {
          extractedParts.push({ label: match[1], text: match[2].trim() });
        }

        // If parts were extracted from this single question_latex, then this is a multi-part parent
        if (extractedParts.length > 0) {
          processedList.push({
            ...q,
            question_latex: mainTextPrefix,
            ques_line_by_latex: [{ type: 'text', text: mainTextPrefix }],
            parts: extractedParts,
            isMultiPartParent: true
          });
        } else {
          // If no parts were found despite a potential (i) match (e.g., just a single (i) without subsequent parts)
          processedList.push(q);
        }

      } else {
        // No (i), (ii), (iii) pattern found, treat as a regular question
        processedList.push(q);
      }
    });
    return processedList;
  };

  const groupedSections = questionPaperData.sections.map(section => ({
    ...section,
    groupedQuestions: groupQuestions(section.questions)
  }));

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex justify-center items-start font-inter text-gray-800">
      <div
        ref={contentRef}
        className="bg-white p-6 sm:p-10 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200"
      >
        {/* Assessment Details Header */}
        <div className="text-center mb-8 pb-4 border-b border-gray-200">
          <p className="font-bold text-lg sm:text-xl md:text-2xl mb-1 text-gray-900">
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
            {questionPaperData.exam_details.subject}
          </h1>
        </div>

        {/* Instructions */}
        <div className="mb-8 p-4 bg-gray-50 rounded-md shadow-sm border border-gray-100">
          <p className="font-bold text-base text-start sm:text-lg mb-2 text-gray-700">Instructions:</p>
          <ol className="list-decimal list-inside pl-4 text-start text-sm sm:text-base space-y-1 text-gray-600">
            {questionPaperData.instructions.map((inst, index) => (
              <li key={index}>{inst}</li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        {groupedSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={`mb-8 p-4 rounded-lg border border-gray-200 ${section.name === 'SECTION C' ? 'mt-10 pt-6 border-t-2 border-dashed border-gray-300 bg-blue-50 bg-opacity-20' : 'bg-white'}`}>
            <h2 className="font-bold text-lg sm:text-xl mb-6 text-center text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-200">
              {section.name}
            </h2>
            {/* Iterate through the grouped questions (e.g., Q.1. group, Q.2. group) */}
            {section.groupedQuestions.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-8 p-4 border border-gray-100 rounded-md bg-white shadow-sm">
                {/* Main Question Heading (e.g., Q. 1. Attempt any One...) */}
                <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-100">
                  <p className="font-bold text-base sm:text-lg text-gray-800">
                    {group.question_number} {group.instruction}
                  </p>
                  {group.marks && (
                    <p className="font-bold text-base sm:text-lg ml-4 whitespace-nowrap text-gray-600">
                      {group.marks} marks
                    </p>
                  )}
                </div>
                {/* Individual sub-questions (1., 2., etc.) */}
                <ol className="list-none pl-0 text-left text-sm sm:text-base space-y-4 text-gray-700">
                  {processQuestionsForDisplay(group.sub_questions).map((q, qIndex) => (
                    <li key={q.question_id || qIndex} className="mb-4 flex items-start flex-col">
                      <div className='flex flex-row items-start w-full'>
                        {/* Manually render the number */}
                        <span className="font-bold mr-2 w-6 flex-shrink-0 text-right">
                          {qIndex + 1}.
                        </span>
                        <div className="flex flex-col items-start flex-grow">
                          {/* Render question text */}
                          <p className="mb-2" dangerouslySetInnerHTML={{ __html: q.question_latex }}></p>

                          {/* Render parts if available (now populated by processQuestionsForDisplay) */}
                          {q.parts && q.parts.length > 0 && (
                            <ol className="list-none pl-6 mt-1 space-y-1 text-gray-600">
                              {q.parts.map((part, partIndex) => (
                                <li key={partIndex} className="flex items-start">
                                  <span className="mr-1">({part.label})</span>
                                  <span dangerouslySetInnerHTML={{ __html: part.text }}></span>
                                </li>
                              ))}
                            </ol>
                          )}

                          {/* If there's a table associated with the question */}
                          {q.table && (
                            <div className="overflow-x-auto border rounded-lg mt-4 w-full">
                              <table className="min-w-full bg-white border border-gray-300 rounded-md overflow-hidden table-auto border-collapse shadow-sm">
                                <thead>
                                  <tr>
                                    {q.table.headers.map((header, hIndex) => (
                                      <th
                                        key={hIndex}
                                        className="py-2 px-3 border border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider text-center"
                                        dangerouslySetInnerHTML={{ __html: header }}
                                      ></th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.table.rows.map((row, rIndex) => (
                                    <tr key={rIndex} className="hover:bg-gray-50">
                                      <td
                                        className="py-2 px-3 border border-gray-300 whitespace-nowrap text-center text-gray-700"
                                        dangerouslySetInnerHTML={{ __html: row.row_name }}
                                      ></td>
                                      {row.values.map((val, vIndex) => (
                                        <td
                                          key={vIndex}
                                          className="py-2 px-3 border border-gray-300 text-center text-gray-700"
                                          dangerouslySetInnerHTML={{ __html: val }}
                                        ></td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Buttons at the bottom of each question */}
                      <div className="flex justify-end space-x-4 mt-6 pr-2 w-full">
                        <button
                          onClick={() => handleScanQR(q.question_id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                          Scan QR
                        </button>
                        <button
                          onClick={() => handleUploadAnswer(q.question_id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                        >
                          Upload Answer
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
          <p className="mb-2">{questionPaperData.footer.code}</p>
          <p className="mb-2">Page: {questionPaperData.footer.page_numbers.join(', ')}</p>
          <p className="font-bold text-base" dangerouslySetInnerHTML={{ __html: questionPaperData.footer.end_marker }}></p>
        </div>
      </div>

      {/* Modal for QR Scan / Upload Answer */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 relative w-full max-w-md mx-auto transform transition-all duration-300 scale-100 opacity-100">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold transition-transform duration-200 transform hover:rotate-90"
              aria-label="Close modal"
            >
              &times;
            </button>

            {modalContent === 'qr' && (
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Scan QR Code for Question ID: {activeQuestionId}</h3>
                {/* Placeholder for QR Code */}
                {/* <img
                  src={`https://placehold.co/200x200/E0F2F7/333333?text=QR+Code+for+${activeQuestionId}`}
                  alt={`QR Code for Question ID ${activeQuestionId}`}
                  className="mx-auto my-4 rounded-md shadow-md"
                /> */}
                <div className="flex justify-center mb-4">
                 <QRCodeSVG 
                  //  value={`http://localhost:5173/upload?examId=${100076}&studentId=${100084}&questionId=${question.id}`},
                    value={`${window.location.origin}/upload?examId=${100076}&studentId=${100084}&questionId=${activeQuestionId}`}
                    size={128}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  (Simulated QR code. In a real app, this would be a scannable QR.)
                </p>
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            )}

            {modalContent === 'upload' && (
              <div className=" w-full max-h-[650px] overflow-y-auto">
                <UploadPage questionId={activeQuestionId} closeModal={closeModal} />
                {/* <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Answer for Question ID: {activeQuestionId}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  (Simulated upload. In a real app, this would integrate with camera/gallery and cropping options.)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
                />
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      alert('Simulated Upload: Image would be processed here!');
                      closeModal();
                    }}
                    className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Simulate Upload
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div> */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
