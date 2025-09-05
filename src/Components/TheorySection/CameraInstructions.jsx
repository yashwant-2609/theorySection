import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const CameraInstructions = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const questionId = searchParams.get('questionId');
  const assessmentId = searchParams.get('assessmentId');
  const sectionId = searchParams.get('sectionId');
  const userAnswerId = searchParams.get('userAnswerId');
  console.log("CameraInstructions", { questionId, assessmentId, sectionId });

  const startCamera = () => {
    // Navigate to the camera page
    navigate(`/camera?questionId=${questionId}&userAnswerId=${userAnswerId}`);
  };

  const cameraInfo = JSON.parse(localStorage.getItem("cameraInfo") || "{}");
  const sectionNumber = cameraInfo.sectionNumber;
  const sectionHeading = cameraInfo.sectionHeading;
  const questionNumber = cameraInfo.questionNumber;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Capture Your Answer</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure you're in a well-lit area</li>
            <li>Hold your phone steady</li>
            <li>Capture clear images of your answer</li>
            <li>You can take multiple pictures</li>
          </ol>
        </div>

        <button
          onClick={startCamera}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          Open Camera
        </button>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> You'll need to allow camera permissions when prompted.
          </p>
        </div>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-500">
            Section {sectionNumber}: {sectionHeading}
          </p>
          <p className="text-center text-sm text-gray-500">
            Question {questionNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraInstructions;