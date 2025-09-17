import React, { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import UploadPage from "../Upload/Upload";
import axios from "axios";
import { questionPaperDataJSON } from "./DifferentPatternPaper";
import testDiagramImage from "../../assets/plantcell.jpg";
import { motion } from 'framer-motion';
import { fadeIn } from './animations';
import { useNavigate } from "react-router-dom";

export const API_TheoryPaper = () => {
  const contentRef = useRef(null);
  // const [questionPaperData, setQuestionPaperData] = useState(questionPaperDataJSON);
  const [questionPaperData , setQuestionPaperData ] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [userassid ,setUserAssId] = useState('');
//   const [secondsLeft, setSecondsLeft] = useState(() => {
//   // Parse time_allowed (e.g., "3 hours" or "180 minutes")
//   const timeStr = questionPaperData.exam_details?.time_allowed || "80";
//   let mins = 0;
//   if (timeStr.toLowerCase().includes("hour")) {
//     mins = parseInt(timeStr) * 60;
//   } else {
//     mins = parseInt(timeStr);
//   }
//   return mins * 60;
// });
// const [assessment_id , setAssessment_id] = useState("");
// const [user_ass_id , setUser_ass_id] = useState("");


const navigate = useNavigate();

const handleSubmit = () => {
// Build a map of question_id to user_answer_id
  const userAnswerIds = {};
  questionPaperData.section_data?.forEach(section => {
    section.question_data.forEach(q => {
      userAnswerIds[q.question_id] = q.user_answer_id;
    });
  });

  // Calculate time_taken (in seconds)
  const timeTaken = /* your logic to calculate time taken, e.g. */ 
    (hours * 3600) + (minutes * 60) + seconds;

  // Calculate ass_end_time (ISO string)
  const assEndTime = new Date().toISOString();
  // console.log("answers",answers,"questionPapaer Data",questionPaperData,"user answer id",userAnswerIds,"Time taken", timeTaken,"ass end time",assEndTime);

  navigate("/review-answers", { 
    state: { 
      answers, 
      questionPaperData, 
      userAnswerIds,// <-- pass this to next page
      time_taken: timeTaken,
      ass_end_time: assEndTime,
      user_ass_id : userassid,
    } 
  }
);
console.log(userassid);
};

// useEffect(() => {
//   if (secondsLeft <= 0) return;
//   const interval = setInterval(() => setSecondsLeft(s => s - 1), 1000);
//   return () => clearInterval(interval);
// }, [secondsLeft]);

// const formatTime = (secs) => {
//   const h = Math.floor(secs / 3600);
//   const m = Math.floor((secs % 3600) / 60);
//   const s = secs % 60;
//   return [
//     h > 0 ? String(h).padStart(2, "0") : null,
//     String(m).padStart(2, "0"),
//     String(s).padStart(2, "0"),
//   ].filter(Boolean).join(":");
// };

  // API configuration
  const API_BASE_URL = "https://api-dev.mindshaala.com/api/v1/cil/assessment/fetch/theory?user_ass_id=101120";
  // const USER_ASS_ID = 101104;

  const fetchQuestionDataFromApi = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(API_BASE_URL,
      //    {
      //   params: { user_ass_id: USER_ASS_ID },
      //   headers: { "Content-Type": "application/json" },
      // }
    );

      if (response.data) {
        // console.log(response.data);
        setQuestionPaperData(response.data);
        setMinutes(response.data?.total_time);
        setUserAssId(response.data?.user_ass_id);

      } else {
        throw new Error("No data received from API");
      }
    } catch (error) {
      console.error("Error fetching question paper data:", error);
      setError(error.message || "Failed to fetch question paper data");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    // console.log("Minutes" , minutes);
    const interval = setTimeout(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
        // if(!enterFullScreen() && seconds === 30 ){
        //     // enterFullScreen();
        //     // console.log("FullScreenMethod");
        //   }
      }
      if (seconds === 0) {
        if (minutes === 0 && hours === 0) {
          console.log("Time is Up");
          handleSubmit();
          // handleStopRecording();
          // handleSubmit();
          // navigate('/thank-you');
        } else {
          if (minutes === 0 && hours > 0) {
            setSeconds(59);
            setMinutes(59);
            setHours(hours - 1);
          } else {
            setSeconds(59);
            setMinutes(minutes - 1);
            if (minutes === 5) {
              toast.warn("5 minutes remaining");
            }
            if (minutes === 1) {
              toast.warn("1 minute remaining");
            }
          }
        }
      }
    }, 1000);
    return () => clearTimeout(interval);
  }, [seconds, minutes, hours]);

//   useEffect(() => {
//   if (secondsLeft <= 0) {
//     handleSubmit();
//   }
// }, [secondsLeft]);

  useEffect(() => {
    fetchQuestionDataFromApi();
    setLoading(false);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.onload = () => {
      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
          displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        },
        svg: { fontCache: "global" },
        startup: {
          ready: () => {
            window.MathJax.startup.defaultReady();
            if (contentRef.current) {
              window.MathJax.typesetPromise([contentRef.current]).catch((err) =>
                console.error("MathJax typesetting error:", err)
              );
            }
          },
        },
      };
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete window.MathJax;
    };
  }, []);

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise && contentRef.current) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) =>
        console.error("MathJax re-typesetting error:", err)
      );
    }
  }, [questionPaperData]);

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  // Match the Following pairs
  // const renderMatchTheFollowing = (question, index) => {
  //   const getAlphabetPrefix = (index) => String.fromCharCode(65 + index);
  //   const rightItems = question.shuffle_options
  //     ? [...question.match_pairs]
  //         .sort(() => Math.random() - 0.5)
  //         .map((pair) => pair.right)
  //     : question.match_pairs.map((pair) => pair.right);

  //   return (
  //     <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
  //       <div className="flex justify-between items-start">
  //         <p className="font-medium">
  //           {index + 1}. {question.question_latex}
  //         </p>
  //         <span className="text-sm font-semibold text-gray-600">
  //           [{question.marks} mark{question.marks > 1 ? "s" : ""}]
  //         </span>
  //       </div>

  //       <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
  //         <div className="space-y-3">
  //           <h4 className="font-semibold text-center bg-gray-100 py-2">Column A</h4>
  //           <ul className="space-y-2">
  //             {question.match_pairs.map((pair, idx) => (
  //               <li key={`left-${idx}`} className="p-2 border rounded flex items-center">
  //                 <span className="mr-2 font-medium">{idx + 1}.</span>
  //                 {pair.left}
  //               </li>
  //             ))}
  //           </ul>
  //         </div>

  //         <div className="space-y-3">
  //           <h4 className="font-semibold text-center bg-gray-100 py-2">Column B</h4>
  //           <ul className="space-y-2">
  //             {rightItems.map((item, idx) => (
  //               <li key={`right-${idx}`} className="p-2 border rounded flex items-center">
  //                 <span className="mr-2 font-medium">{getAlphabetPrefix(idx)}.</span>
  //                 {item}
  //               </li>
  //             ))}
  //           </ul>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };
  // Match the Following with input boxes
const renderMatchTheFollowing = (question, index) => {
  const getAlphabetPrefix = (idx) => String.fromCharCode(65 + idx);
  const rightItems = question.shuffle_options
    ? [...question.match_pairs]
        .sort(() => Math.random() - 0.5)
        .map((pair) => pair.right)
    : question.match_pairs.map((pair) => pair.right);

  return (
    <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <p className="font-medium">
          {index + 1}. {question.question_latex}
        </p>
        <span className="text-sm font-semibold text-gray-600">
          [{question.marks} mark{question.marks > 1 ? "s" : ""}]
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-center bg-gray-100 py-2">Column A</h4>
          <ul className="space-y-2">
            {question.match_pairs.map((pair, idx) => (
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
      {/* Input boxes for matching */}
      {/* <div className="mt-4 flex flex-wrap gap-4">
        {question.match_pairs.map((pair, idx) => (
          <div key={`input-${idx}`} className="flex items-center">
            <span className="mr-2 font-semibold">{idx + 1}-</span>
           
            <input
  type="text"
  placeholder="?"
  className="w-12 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
  value={answers[`${question.question_id}_${idx}`] || ""}
  onChange={(e) =>
    setAnswers((prev) => ({
      ...prev,
      [`${question.question_id}_${idx}`]: e.target.value,
    }))
  }
/>
          </div>
        ))}
      </div> */}
    </div>
  );
};

  // // MCQ Questions
  // const renderMCQ = (question, index) => {
  //   return (
  //     <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
  //       <div className="flex justify-between items-start">
  //         <p className="font-medium">
  //           {index + 1}. {question.question_latex}
  //         </p>
  //         <span className="text-sm font-semibold text-gray-600">
  //           [{question.marks} mark{question.marks > 1 ? "s" : ""}]
  //         </span>
  //       </div>

  //       <div className="mt-4 ml-6 space-y-2">
  //         {question.option1_latex && (
  //           <div className="flex">
  //             <label htmlFor={`q${question.question_id}_a`}>A) {question.option1_latex}</label>
  //           </div>
  //         )}
  //         {question.option2_latex && (
  //           <div className="flex">
  //             <label htmlFor={`q${question.question_id}_b`}>B) {question.option2_latex}</label>
  //           </div>
  //         )}
  //         {question.option3_latex && (
  //           <div className="flex">
  //             <label htmlFor={`q${question.question_id}_c`}>C) {question.option3_latex}</label>
  //           </div>
  //         )}
  //         {question.option4_latex && (
  //           <div className="flex">
  //             <label htmlFor={`q${question.question_id}_d`}>D) {question.option4_latex}</label>
  //           </div>
  //         )}
  //         {question.option5_latex && (
  //           <div className="flex">
  //             <label htmlFor={`q${question.question_id}_e`}>E) {question.option5_latex}</label>
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
  // };
  // MCQ Questions with radio buttons
const renderMCQ = (question, index) => {
  const options = [
    question.option1_latex,
    question.option2_latex,
    question.option3_latex,
    question.option4_latex,
    question.option5_latex,
  ].filter(Boolean);

  return (
    <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <p className="font-medium">
          {index + 1}. {question.question_latex}
        </p>
        <span className="text-sm font-semibold text-gray-600">
          [{question.marks} mark{question.marks > 1 ? "s" : ""}]
        </span>
      </div>
      <div className="mt-4 ml-6 space-y-2">
        {options.map((opt, i) => (
          <div className="flex items-center" key={i}>
           {/* <input
  type="radio"
  name={`mcq_${question.question_id}`}
  id={`mcq_${question.question_id}_${i}`}
  className="mr-2 accent-blue-600"
  checked={answers[question.question_id] === i}
  onChange={() =>
    setAnswers((prev) => ({
      ...prev,
      [question.question_id]: i,
    }))
  }
/> */}
            <label htmlFor={`mcq_${question.question_id}_${i}`}>
              {String.fromCharCode(65 + i)}) {opt}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

  // Diagram Questions
  const renderDiagramQuestion = (question, index) => {
    return (
      <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
        <div className="flex justify-between items-start">
          <p className="font-medium">
            {index + 1}. {question.question_latex}
          </p>
          <span className="text-sm font-semibold text-gray-600">
            [{question.marks} mark{question.marks > 1 ? "s" : ""}]
          </span>
        </div>

        <div className="mt-4">
          {question.question_diagrams_url?.map((url, idx) => (
            <div key={`diagram-${idx}`} className="mb-4">
              <img
                src={testDiagramImage}
                alt="Plant cell diagram for labeling"
                className="max-w-full h-auto mx-auto border rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400x300?text=Diagram+Not+Available";
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Label the parts (comma separated):
          </label>
          {question.answer_description && (
            <p className="mt-2 text-xs text-gray-500">
              Expected labels: {question.answer_description}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Comprehension Section
  const renderComprehensionSection = (section) => {
    if (section.question_type_name?.toLowerCase() !== "comprehension") {
      return null;
    }

    const hasPassage = section.passage_text || section.passage_latex;
    if (!hasPassage) {
      console.warn('Comprehension section missing passage content:', section);
      return null;
    }

    return (
      <div key={section.assessment_section_id} className="mb-10">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold">
            Section {section.section_number}: {section.section_heading}
          </h2>
          <span className="text-sm font-semibold text-gray-600">
            [Total: {section.section_total_marks} marks]
          </span>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-3 text-lg">
            Read the following passage carefully:
          </h3>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            {section.passage_text ? (
              <div className="whitespace-pre-line">{section.passage_text}</div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: section.passage_latex }} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {section.question_data?.map((question, qIndex) => (
            <div key={question.question_id} className="pl-4 border-l-4 border-blue-200">
              {renderQuestion(question, qIndex)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render each question based on its type
  const renderQuestion = (question, index) => {
    switch (question.question_type_name) {
      case "Match the Following":
        return renderMatchTheFollowing(question, index);
      case "MCQ1":
        return renderMCQ(question, index);
      case "Diagram":
        return renderDiagramQuestion(question, index);
      // True/False with radio buttons
// In renderQuestion, replace the "True/False" case with:
case "True/False":
  return (
    <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
      <div className="flex justify-between items-start">
        <p className="font-medium">
          {index + 1}. {question.question_latex}
        </p>
        <span className="text-sm font-semibold text-gray-600">
          [{question.marks} mark{question.marks > 1 ? "s" : ""}]
        </span>
      </div>
      <div className="mt-4 ml-6 flex space-x-6">
        <label className="flex items-center">
          {/* <input
            type="radio"
            name={`tf_${question.question_id}`}
            className="mr-2 accent-blue-600"
          /> */}
          {/* <input
  type="radio"
  name={`tf_${question.question_id}`}
  className="mr-2 accent-blue-600"
  checked={answers[question.question_id] === true}
  onChange={() =>
    setAnswers((prev) => ({
      ...prev,
      [question.question_id]: true,
    }))
  }
/>
          True */}
        </label>
        <label className="flex items-center">
          {/* <input
            type="radio"
            name={`tf_${question.question_id}`}
            className="mr-2 accent-blue-600"
          /> */}
          {/* <input
  type="radio"
  name={`tf_${question.question_id}`}
  className="mr-2 accent-blue-600"
  checked={answers[question.question_id] === false}
  onChange={() =>
    setAnswers((prev) => ({
      ...prev,
      [question.question_id]: false,
    }))
  }
/>
          False */}
        </label>
      </div>
    </div>
  );
      case "Fill in the Blanks":
        return (
          <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <p className="font-medium">
                {index + 1}. {question.question_latex.replace("__________", "_______")}
              </p>
              <span className="text-sm font-semibold text-gray-600">
                [{question.marks} mark{question.marks > 1 ? "s" : ""}]
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div key={question.question_id} className="mb-8 p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <p className="font-medium">
                {index + 1}. {question.question_latex}
              </p>
              <span className="text-sm font-semibold text-gray-600">
                [{question.marks} mark{question.marks > 1 ? "s" : ""}]
              </span>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question paper...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <h3 className="text-lg font-medium text-red-800">Error Loading Question Paper</h3>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={fetchQuestionDataFromApi}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!questionPaperData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No question paper data available</p>
        </div>
      </div>
    );
  }

  return (
    <>
     {/* Sticky Navbar */}
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg flex items-center justify-between px-6 py-3">
      <span className="text-white font-bold text-lg truncate max-w-[60vw]">
        {questionPaperData.exam_details?.subject || "Exam Title"}
      </span>
      <span className="text-white font-mono text-base sm:text-lg bg-black bg-opacity-20 px-4 py-1 rounded-lg shadow-inner tracking-widest">
        {/* {formatTime(secondsLeft)} */}
        <p>
                    Time: {hours < 10 ? `0${hours}` : hours}:
                    {minutes < 10 ? `0${minutes}` : minutes}:
                    {seconds < 10 ? `0${seconds}` : seconds}
                  </p>
      </span>
    </nav>

    {/* Add a spacer to prevent content being hidden under navbar */}
    <div className="h-16"></div>

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-8 flex flex-col items-center font-inter text-gray-800"
      >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        ref={contentRef}
        className="bg-white p-6 sm:p-10 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-200 mb-4 hover:shadow-blue-100 transition-all duration-300"
        >
        {/* Header section with enhanced styling */}
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8 pb-4 border-b border-gray-200"
          >
          <p className="font-bold text-lg sm:text-xl md:text-2xl mb-1 text-gray-900 hover:text-blue-700 transition-colors">
            {/* {questionPaperData.exam_details.board.replace(/\\/g, '') || "Board Name"} */}
          </p>
          <p className="font-bold text-base sm:text-lg md:text-xl mb-1 text-gray-800">
            {/* {questionPaperData.exam_details.examination || "Examination Name"} */}
            {questionPaperData.assessment_name || "Examination Name"}
          </p>
          <p className="font-bold text-sm sm:text-base md:text-lg mb-4 text-gray-700">
            {/* {questionPaperData.exam_details.class || "Class Name"} */}
            {/* {questionPaperData.exam_details.class || "Class Name"} */}
          </p>
          <div className="flex justify-between items-center text-sm sm:text-base mb-8 px-4">
            {/* <p className="text-gray-600">Time: {questionPaperData.exam_details.time_allowed || "30"}</p> */}
            <p className="text-gray-600">Time: {questionPaperData.total_tim || "30"}</p>            
            {/* <p className="text-gray-600">Max. Marks: {questionPaperData.exam_details.max_marks || "80"}</p> */}
            <p className="text-gray-600">Max. Marks: {questionPaperData.total_marks || "80"}</p>
          </div>
          <h1 className="font-extrabold text-xl sm:text-2xl md:text-3xl tracking-wide text-blue-700 uppercase">
            {/* {questionPaperData.exam_details.subject || "Subject Name"} */}
            {questionPaperData.assessment_name || "Subject Name"}
          </h1>
        </motion.div>

        {/* Instructions with enhanced styling */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm"
          >
          <h2 className="font-bold mb-3 text-blue-800">General Instructions:</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>All questions are compulsory.</li>
            <li>Read the questions carefully before answering.</li>
            <li>Marks are indicated against each question.</li>
          </ul>
        </motion.div>

        {/* Sections with enhanced styling */}
        {questionPaperData.section_data?.map((section, idx) =>  {   
          if(section.question_type_name?.toLowerCase() === "comprehension") {
            return renderComprehensionSection(section);
          }
         
          return (
            <motion.div
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={section.assessment_section_id}
            className="mb-10 hover:shadow-lg transition-shadow duration-300 rounded-xl p-4"
            >
            <div key={section.assessment_section_id} className="mb-10">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold">
                  Section {section.section_number}: {section.section_heading}
                </h2>
                <span className="text-sm font-semibold text-gray-600">
                  [Total: {section.section_total_marks} marks]
                </span>
              </div>
              <div className="space-y-6">
                {section.question_data?.map((question, index) =>
                  renderQuestion(question, index)
                )}
              </div>
            </div>
          </motion.div>
          );
        })}
      </motion.div>

      <motion.div
  initial={{ y: 20 }}
  animate={{ y: 0 }}
  className="w-full py-4 flex justify-center"
>
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={handleSubmit}
    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg font-bold text-lg transition-all duration-300"
  >
    Submit Answers
  </motion.button>
</motion.div>

      {/* Enhanced Action Buttons */}
      {/* <motion.div 
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className=" bottom-0 w-full bg-opacity-90 backdrop-blur-sm py-4 shadow-lg"
        >
        <div className="flex justify-center space-x-6 max-w-4xl mx-auto px-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setModalContent("qr");
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg transition-all duration-300 shadow-blue-200 shadow-lg hover:shadow-blue-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Scan QR Code
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setModalContent("upload");
              setShowModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg transition-all duration-300 shadow-green-200 shadow-lg hover:shadow-green-300 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
            </svg>
            Upload Answers
          </motion.button>
        </div>
      </motion.div> */}

      {/* Modal for QR/Upload */}
      {/* {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-2xl relative mx-auto transform transition-all duration-300 scale-100 opacity-100 ${
            modalContent === "upload" ? "w-full max-w-5xl" : "w-full max-w-md"
          }`}>
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold transition-transform duration-200 transform hover:rotate-90"
              aria-label="Close modal"
              >
              &times;
            </button>

            {modalContent === "qr" && (
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Scan QR Code</h3>
                <div className="flex justify-center mb-4">
                  <QRCodeSVG
                    value={`${
                      window.location.origin
                    }/upload?examId=${100076}&studentId=${100084}`}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    className="border border-gray-200 p-2 rounded"
                    />
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Scan this QR code to upload your answers
                </p>
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-all"
                  >
                  Close
                </button>
              </div>
            )}
            {modalContent === "upload" && (
              <div className="flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center border-b p-4">
                  <h3 className="text-xl font-bold text-gray-800">Upload Answers</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
                    aria-label="Close modal"
                    >
                    &times;
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow p-6">
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <UploadPage closeModal={closeModal} className="w-full h-full" />
                  </div>
                </div>
                <div className="border-t p-4 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}
    </motion.div>
      </>
  );
};