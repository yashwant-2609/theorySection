import axios from "axios";
import React, { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
import QuestionMathJax from "./QuestionMathJax";
import styles from "./Solutions.module.css";
// import LatexRenderer from "./MathJax Files/SolutionMathjax";
import { MathJax, MathJaxContext } from "better-react-mathjax";
// import { sampleSolutions } from "../Data/SampleSolutions";
import { sampledata } from "../Data/SAMPLEDATA";
import { QRCodeSVG } from "qrcode.react";

const Solutions = () => {
  // const location = useLocation();
  const user_ass_id = location.state?.user_ass_id;
  const [solutionData, setSolutionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState({});
  const [assessmentName, setAssessmentName] = useState("");
  //Sections
  const [sections, setSections] = useState([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  useEffect(() => {
    // Transform sampledata into sections format
    const sectionsData = [
      {
        id: "sample-section",
        name: "Sample Questions",
        questions: sampledata.map((question, index) => ({
          id: question.question_id,
          que: question.question_latex,
          options: [
            question.option1_latex,
            question.option2_latex,
            question.option3_latex,
            question.option4_latex,
          ],
          answer_description: question.answer_description,
        })),
      },
    ];
    setSections(sectionsData);
  }, []);

  const toggleSolution = (index) => {
    setShowSolution((prev) => ({ ...prev, [index]: !prev[index] }));
  };


  return (
    <MathJaxContext
      config={{
        loader: { load: ["input/tex", "output/chtml"] }, // Use HTML instead of SVG
        tex: {
          inlineMath: [["\\(", "\\)"]],
          displayMath: [["\\[", "\\]"]],
          processEscapes: true,
        },
        chtml: {
          scale: 1, // Keep math text size normal
          minScale: 0.5, // Minimum scaling
          matchFontHeight: true, // Ensures math font matches surrounding text
        },
        options: {
          enableMenu: true, // Enable right-click menu
        },
      }}
    >
      <div className={styles.selectableMaths}>
        <div className={styles.solutionsContainer}>
          {sampledata.map((question, index) => (
            <div key={`${question.question_id}-${index}`} className={styles.questionCard}>
              {/* Question */}
              <div className={styles.questionSection}>
                <h3>Question {index + 1}</h3>
                <div className={styles.questionText}>
                  <QuestionMathJax content={question.question_latex} />
                </div>
              </div>

              {/*Options Sections */}
              <div className={styles.optionsSection}>
                {[
                  question.option1_latex,
                  question.option2_latex,
                  question.option3_latex,
                  question.option4_latex,
                ].map((optionText, num) => (
                  optionText && (
                    <div
                      key={num}
                      className={`${styles.option} ${
                        question.USER_ANSWER === String.fromCharCode(65 + num)
                          ? question.correct_option === String.fromCharCode(65 + num)
                            ? styles.correct
                            : styles.wrong
                          : question.correct_option === String.fromCharCode(65 + num)
                          ? styles.correct
                          : ""
                      }`}
                    >
                      <span>{String.fromCharCode(65 + num)}. </span>
                      <QuestionMathJax content={optionText} />
                    </div>
                  )
                ))}
              </div>

                <div className={styles.qrSection}>
                  {/* <p className={styles.qrText}>Scan to Upload answer:</p> */}
                  <QRCodeSVG 
                  //  value={`http://localhost:5173/upload?examId=${100076}&studentId=${100084}&questionId=${question.id}`},
                    value={`${window.location.origin}/upload?examId=${100076}&studentId=${100084}&questionId=${question.question_id}`}
                    size={128}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>



              {/* Show/Hide Solution Button */}
              <button 
                onClick={() => toggleSolution(index)}
                className={styles.solutionButton}
              >
                {showSolution[index] ? 'Hide Solution' : 'Show Solution'}
              </button>

              {/* Solution / Description */}
              {showSolution[index] && (
                <div className={styles.solutionSection}>
                  <h4>Solution:</h4>
                  {question.answer_description ? (
                    <QuestionMathJax content={question.answer_description} />
                  ) : (
                    <p className={styles.noSolution}>Solution not available.</p>
                  )}
                </div>
              )}{" "}
            </div>
          ))}
        </div>
      </div>
    </MathJaxContext>
  );
};

export default Solutions;
