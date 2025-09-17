import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, MessageSquare, Loader2 } from 'lucide-react';
import axios from 'axios';

const SolutionPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState({});
  const [showFeedback, setShowFeedback] = useState({});

  // Mock API call - replace with your actual API endpoint
  // const fetchSolutionData = async () => {
  //   try {
  //     // Simulating API call delay
  //     await new Promise(resolve => setTimeout(resolve, 1000));
      
  //     // Mock data - replace with actual API call
  //     const mockData = [
  //       {
  //         id: 1,
  //         type: 'mcq',
  //         question: 'What is the capital of France?',
  //         options: ['London', 'Berlin', 'Paris', 'Madrid'],
  //         userAnswer: 'C',
  //         correctAnswer: 'C',
  //         attempted: true
  //       },
  //       {
  //         id: 2,
  //         type: 'mcq',
  //         question: 'Which planet is known as the Red Planet?',
  //         options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  //         userAnswer: 'A',
  //         correctAnswer: 'B',
  //         attempted: true
  //       },
  //       {
  //         id: 3,
  //         type: 'theory',
  //         question: 'Explain the concept of photosynthesis and its importance in the ecosystem.',
  //         userAnswer: 'Photosynthesis is the process by which plants convert sunlight into energy...',
  //         solution: 'Photosynthesis is a biological process where plants, algae, and certain bacteria convert light energy into chemical energy. The process occurs in chloroplasts and involves two main stages: light-dependent reactions and light-independent reactions (Calvin cycle). This process is crucial for life on Earth as it produces oxygen and serves as the foundation of most food chains.',
  //         feedback: 'Good understanding of the basic concept. Your answer covers the main points but could benefit from mentioning the two stages of photosynthesis and the role of chloroplasts.',
  //         attempted: true
  //       },
  //       {
  //         id: 4,
  //         type: 'mcq',
  //         question: 'What is the largest ocean on Earth?',
  //         options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
  //         userAnswer: null,
  //         correctAnswer: 'D',
  //         attempted: false
  //       }
  //     ];
      
  //     setQuestions(mockData);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error('Error fetching solution data:', error);
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchSolutionData();
  // }, []);

  const fetchSolutionData = async () => {
  try {
    const response = await axios.get(
      `https://api-dev.mindshaala.com/api/v1/cil/assessment/solution/theory?user_ass_id=101120`
    );
    if (response.status === 200 && response.data && response.data.section_details) {
      // Flatten and map the data
      const questions = [];
      response.data.section_details.forEach((section) => {
        section.solution_details.forEach((q) => {
          if (q.question_type_name?.toLowerCase().includes("mcq")) {
            questions.push({
              id: q.question_id,
              type: "mcq",
              question: q.question_latex,
              options: [
                q.option1_latex,
                q.option2_latex,
                q.option3_latex,
                q.option4_latex,
                q.option5_latex,
              ].filter(Boolean),
              userAnswer: q.user_answer || null,
              correctAnswer: getCorrectOptionLabel(q),
              attempted: q.attempt_status !== "NOT_VISITED",
              feedback: "No Feedback Available", // Set feedback as empty for now
            });
          } else {
            questions.push({
              id: q.question_id,
              type: "theory",
              question: q.question_latex,
              userAnswer: q.user_answer || "",
              solution: q.answer_latex || "",
              feedback:"No Feedback Available", // Set feedback as empty for now
              attempted: q.attempt_status !== "NOT_VISITED",
            });
          }
        });
      });
      setQuestions(questions);
    }
    setLoading(false);
  } catch (error) {
    console.error("Error fetching solution data:", error);
    setLoading(false);
  }
};

useEffect(() => {
  fetchSolutionData();
}, []);

// Helper to get correct answer label for MCQ
function getCorrectOptionLabel(q) {
  // Find which option matches answer_latex
  const options = [
    q.option1_latex,
    q.option2_latex,
    q.option3_latex,
    q.option4_latex,
    q.option5_latex,
  ].filter(Boolean);
  const idx = options.findIndex((opt) => opt === q.answer_latex);
  return idx !== -1 ? String.fromCharCode(65 + idx) : "";
}

  const toggleSolution = (questionId) => {
    setShowSolution(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleFeedback = (questionId) => {
    setShowFeedback(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const getOptionLabel = (index) => String.fromCharCode(65 + index); // A, B, C, D

  const MCQQuestion = ({ question, index }) => {
    const isCorrect = question.userAnswer === question.correctAnswer;
    const borderColor = question.attempted 
      ? (isCorrect ? 'border-green-500' : 'border-red-500')
      : 'border-gray-300';

    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${borderColor} transition-all duration-300 hover:shadow-xl`}>
        <div className="flex items-start gap-4 mb-6">
          <span className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm">
            Q{index + 1}
          </span>
          <div className="flex-1 text-left">
            <h3 className="text-lg  font-medium text-gray-800 leading-relaxed">
              {question.question}
            </h3>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {question.options.map((option, optionIndex) => {
            const optionLabel = getOptionLabel(optionIndex);
            const isUserAnswer = question.userAnswer === optionLabel;
            const isCorrectAnswer = question.correctAnswer === optionLabel;
            
            let optionClass = 'p-4 rounded-lg border-2 transition-all duration-200 ';
            
            if (question.attempted) {
              if (isCorrectAnswer && isUserAnswer) {
                optionClass += 'bg-green-50 border-green-500 text-green-800';
              } else if (isCorrectAnswer) {
                optionClass += 'bg-green-50 border-green-500 text-green-800';
              } else if (isUserAnswer) {
                optionClass += 'bg-red-50 border-red-500 text-red-800';
              } else {
                optionClass += 'bg-gray-50 border-gray-200 text-gray-600';
              }
            } else {
              if (isCorrectAnswer) {
                optionClass += 'bg-green-50 border-green-500 text-green-800';
              } else {
                optionClass += 'bg-gray-50 border-gray-200 text-gray-600';
              }
            }

            return (
              <div key={optionIndex} className={optionClass}>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm bg-white px-2 py-1 rounded">
                    {optionLabel}
                  </span>
                  <span className="flex-1">{option}</span>
                  {question.attempted && isUserAnswer && (
                    isCorrect ? 
                      <CheckCircle className="h-5 w-5 text-green-600" /> : 
                      <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {isCorrectAnswer && !isUserAnswer && question.attempted && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-6">
            <div>
              <span className="text-sm font-medium text-gray-600">Your Answer:</span>
              <span className="ml-2 font-semibold">
                {question.attempted ? question.userAnswer : 'Not Attempted'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Correct Answer:</span>
              <span className="ml-2 font-semibold text-green-600">
                {question.correctAnswer}
              </span>
            </div>
          </div>
          
          {question.attempted && (
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Correct</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Incorrect</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TheoryQuestion = ({ question, index }) => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <span className="bg-purple-100 text-purple-800 font-semibold px-3 py-1 rounded-full text-sm">
            Q{index + 1}
          </span>
          <div className="flex-1 text-left">
            <h3 className="text-lg font-medium text-gray-800 leading-relaxed">
              {question.question}
            </h3>
          </div>
        </div>

        {question.attempted && question.userAnswer && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Your Answer:</h4>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">{question.userAnswer}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => toggleSolution(question.id)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
          >
            <Eye className="h-4 w-4" />
            {showSolution[question.id] ? 'Hide Solution' : 'Show Solution'}
          </button>
          
          {question.feedback && (
            <button
              onClick={() => toggleFeedback(question.id)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              {showFeedback[question.id] ? 'Hide Feedback' : 'Show Feedback'}
            </button>
          )}
        </div>

        {showSolution[question.id] && (
          <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-green-700 mb-3">Solution:</h4>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">{question.solution}</p>
            </div>
          </div>
        )}

        {showFeedback[question.id] && question.feedback && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-blue-700 mb-3">Feedback:</h4>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">{question.feedback}</p>
            </div>
          </div>
        )}

        {!question.attempted && (
          <div className="text-center py-4">
            <p className="text-gray-500 italic">This question was not attempted</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading solutions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz Solutions</h1>
          <p className="text-gray-600">Review your answers and learn from detailed explanations</p>
        </div>

        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id}>
              {question.type === 'mcq' ? (
                <MCQQuestion question={question} index={index} />
              ) : (
                <TheoryQuestion question={question} index={index} />
              )}
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No solutions available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionPage;