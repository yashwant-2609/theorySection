// UploadPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
// import { FiUpload } from "react-icons/fi"; // Removed as it's not used
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, X, Check, Camera } from "lucide-react";

const UploadPage = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");
  const questionId = searchParams.get("questionId");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Renamed from 'uploading' for consistency

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    processFiles(selected);
  };

  const processFiles = (selectedFiles) => {
    // Filter out non-image files if any
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleAddMoreClick = () => {
    fileInputRef.current.click();
  };

  const removeImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Check for mobile devices - this useEffect is actually redundant with Tailwind's responsive classes
  // However, if you have specific JS logic based on screen size, you might keep it.
  // const [isMobile, setIsMobile] = useState(false);
  // useEffect(() => {
  //   const checkDevice = () => {
  //     setIsMobile(window.innerWidth <= 768);
  //   };
  //   checkDevice();
  //   window.addEventListener('resize', checkDevice);
  //   return () => window.removeEventListener('resize', checkDevice);
  // }, []);


  // Upload all files concurrently
  const handleUpload = async () => {
    if (!files.length) return;
    setIsUploading(true); // Use isUploading state
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("examId", examId);
        formData.append("studentId", studentId);
        formData.append("questionId", questionId);
        return fetch("http://localhost:8080/api/upload-answer", {
          method: "POST",
          body: formData,
        }).then(res => res.json());
      });
      const results = await Promise.all(uploadPromises);
      const newUploads = results.filter(data => data?.fileUrl).map(data => data.fileUrl);
      // setUploadedImages(prev => [...prev, ...newUploads]); // This state isn't used in rendering
      // Optionally clear previews or handle uploaded images
      setFiles([]); // Clear files after upload
      setPreviews([]); // Clear previews after upload
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false); // Reset isUploading state
    }
  };

  return (
    // Equivalent to .pageContainer
    <div className="min-h-screen p-8 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gray-900 sm:p-2">
      {/* Animated Background Elements - these are already using Tailwind and Framer Motion */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-r from-pink-200/30 to-indigo-200/30 rounded-full blur-xl"
        />
      </div>

      {/* Equivalent to .container */}
      <div
        className="relative z-10 w-full max-w-4xl mx-auto p-8 bg-white/60 rounded-2xl shadow-lg animate-fadeIn backdrop-blur-sm
                   md:p-4
                   dark:bg-gray-800 dark:shadow-xl"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotateY: [0, 10, -10, 0],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 dark:text-white">
            Upload Answer Images
          </h1>
          <p className="text-gray-600 text-lg">
            Student: <span className="font-semibold text-blue-600">{studentId}</span> |
            Question: <span className="font-semibold text-purple-600">{questionId}</span>
          </p>
        </motion.div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden" // Equivalent to .hiddenInput
        />

        {/* Drop Zone - Equivalent to .uploadSection and related styles */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative mb-8 p-8 border-2 border-dashed rounded-3xl transition-all duration-300
                      ${isDragging
                        ? 'border-blue-400 bg-blue-50/50 scale-105'
                        : 'border-gray-300 bg-white/60 hover:border-blue-300 hover:bg-blue-50/30'
                      }
                      backdrop-blur-sm shadow-lg hover:shadow-xl
                      md:gap-3 sm:flex-col sm:text-center
                      dark:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-500`}
        >
          <div className="text-center">
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: isDragging ? [0, 5, -5, 0] : 0
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-4"
            >
              <Upload className={`w-12 h-12 mx-auto transition-colors duration-300
                                ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2 dark:text-white">
              {isDragging ? 'Drop your images here!' : 'Drag & drop images here'}
            </h3>
            <p className="text-gray-500 mb-4">or</p>
            {/* Equivalent to .customFileInput */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleAddMoreClick}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium
                         dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 dark:hover:border-blue-500"
            >
              <Image className="w-5 h-5 inline mr-2" />
              Browse Images
            </motion.button>
          </div>
        </motion.div>

        {/* Image Previews - Equivalent to .previewSection and .previewGrid */}
        <AnimatePresence>
          {previews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center dark:text-white">
                <Image className="w-5 h-5 mr-2 text-blue-500" />
                Selected Images ({previews.length})
              </h3>
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              >
                {previews.map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    transition={{
                      duration: 0.5,
                      delay: idx * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    layout
                    className="relative group"
                  >
                    {/* Equivalent to .imageWrapper */}
                    <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105 animate-popIn border-2 border-gray-200">
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover block motion-safe:transition-none" // Equivalent to .imageWrapper img
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ delay: idx * 0.1 + 0.3, duration: 0.3 }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button - Equivalent to .buttonWrapper and .button */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className="text-center mt-4" // Equivalent to .buttonWrapper
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={handleUpload}
                disabled={isUploading}
                className={`relative px-12 py-4 rounded-2xl shadow-xl font-semibold text-lg transition-all duration-300
                            ${isUploading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white hover:shadow-2xl'
                            }
                            motion-safe:hover:transform-none`} // Equivalent to .button and hover
              >
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      {/* Equivalent to .spinner */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3 inline-block align-middle motion-safe:animate-none"
                      />
                      Uploading...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Upload {files.length} Image{files.length > 1 ? "s" : ""}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {files.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-gray-500 mt-8"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              📷 No images selected yet. Start by adding some!
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;