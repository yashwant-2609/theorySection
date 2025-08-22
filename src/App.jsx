import { useState } from 'react'
import './App.css'
import {  Route, Routes } from 'react-router-dom'
import Solutions from './Components/Solutions/Solutions'
import UploadPage from './Components/Upload/Upload'
import { TheoryExamScreen } from './Components/TheorySection/MultipleSections'
import ReviewAnswers from './Components/TheorySection/ReviewAnswers'
import CameraInstructions from './Components/TheorySection/CameraInstructions'
import CameraPage from './Components/TheorySection/CameraPage'
import { API_TheoryPaper } from './Components/TheorySection/API_TheoryPaper'
// import { TheoryExamScreen } from './Components/TheorySection/TheoryExamScreen'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       {/* <BrowserRouter> */}
        <Routes>
          {/* <Route path="/" element={<Solutions />} /> */}
          {/* <Route path="/" element={<TheoryExamScreen />} /> */}
          <Route path="/" element={<API_TheoryPaper />} />
          <Route path="/upload-answer" element={<UploadPage />} />
          <Route path="/review-answers" element={<ReviewAnswers />} />
          <Route path="/camera-instructions" element={<CameraInstructions />} />
<Route path="/camera" element={<CameraPage />} />
        </Routes>
      {/* </BrowserRouter> */}
    </>
  )
}

export default App
