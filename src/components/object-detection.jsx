"use client";

import React, {useEffect, useRef, useState, useCallback} from "react";
import Webcam from "react-webcam";
import {load as cocoSSDLoad} from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import {renderPredictions} from "@/utils/render-predictions";

let detectInterval;

const ObjectDetection = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [confidence, setConfidence] = useState(0.6);
  const [fps, setFps] = useState(30);
  const [modelType, setModelType] = useState('lite'); // lite, mobilenet_v1, mobilenet_v2
  const [detectionCount, setDetectionCount] = useState({});
  const [error, setError] = useState(null);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  // Enhanced model loading with different architectures
  async function runCoco() {
    setIsLoading(true);
    setError(null);
    
    try {
      // Set TensorFlow.js backend for better performance
      await tf.ready();
      
      // Load model with specified architecture
      const modelConfig = {
        base: modelType === 'lite' ? 'lite_mobilenet_v2' : 
              modelType === 'mobilenet_v1' ? 'mobilenet_v1' : 'mobilenet_v2'
      };
      
      console.log(`Loading COCO-SSD model with ${modelConfig.base} architecture...`);
      const net = await cocoSSDLoad(modelConfig);
      modelRef.current = net;
      
      setIsLoading(false);
      console.log("Model loaded successfully!");
      
      // Start detection
      startDetection();
      
    } catch (error) {
      console.error("Error loading model:", error);
      setError("Failed to load AI model. Please refresh and try again.");
      setIsLoading(false);
    }
  }

  // Start/Stop detection with better control
  const startDetection = useCallback(() => {
    if (detectInterval) clearInterval(detectInterval);
    
    const detectionSpeed = Math.max(10, 1000 / fps); // Convert FPS to interval
    
    detectInterval = setInterval(() => {
      runObjectDetection();
    }, detectionSpeed);
    
    setIsDetecting(true);
  }, [fps]);

  const stopDetection = useCallback(() => {
    if (detectInterval) {
      clearInterval(detectInterval);
      detectInterval = null;
    }
    setIsDetecting(false);
  }, []);

  // Enhanced object detection with performance monitoring
  async function runObjectDetection() {
    if (
      !modelRef.current ||
      !canvasRef.current ||
      !webcamRef.current?.video ||
      webcamRef.current.video.readyState !== 4
    ) {
      return;
    }

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Run detection with higher accuracy
      const startTime = Date.now();
      const detectedObjects = await modelRef.current.detect(
        video,
        undefined,
        confidence
      );
      const detectionTime = Date.now() - startTime;

      // Update FPS counter
      frameCount.current++;
      const now = Date.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }

      // Filter and enhance detections
      const filteredObjects = detectedObjects
        .filter(obj => obj.score >= confidence)
        .map(obj => ({
          ...obj,
          detectionTime,
          timestamp: Date.now()
        }));

      setDetectedObjects(filteredObjects);

      // Update detection counts
      const counts = {};
      filteredObjects.forEach(obj => {
        counts[obj.class] = (counts[obj.class] || 0) + 1;
      });
      setDetectionCount(counts);

      // Render predictions
      const context = canvas.getContext("2d");
      renderPredictions(filteredObjects, context);
      
    } catch (error) {
      console.error("Detection error:", error);
    }
  }

  const showmyVideo = useCallback(() => {
    if (
      webcamRef.current?.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const myVideoWidth = video.videoWidth;
      const myVideoHeight = video.videoHeight;

      video.width = myVideoWidth;
      video.height = myVideoHeight;
      
      // Update canvas dimensions to match
      if (canvasRef.current) {
        canvasRef.current.width = myVideoWidth;
        canvasRef.current.height = myVideoHeight;
      }
    }
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      stopDetection();
      if (modelRef.current) {
        modelRef.current.dispose?.();
      }
    };
  }, [stopDetection]);

  useEffect(() => {
    runCoco();
  }, [modelType]); // Reload model when type changes

  useEffect(() => {
    if (modelRef.current && isDetecting) {
      startDetection(); // Restart with new FPS
    }
  }, [fps, confidence, startDetection, isDetecting]);

  return (
    <div className="mt-4 px-2 sm:mt-8 sm:px-0">
      {/* Mobile-Optimized Control Panel */}
      <div className="mb-4 p-3 sm:p-4 bg-gray-100 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Detection Controls</h3>
        
        {/* Mobile-First Grid Layout */}
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-4">
          
          {/* Model Type Selection - Full width on mobile */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Model Type:</label>
            <select 
              value={modelType} 
              onChange={(e) => setModelType(e.target.value)}
              className="w-full p-3 sm:p-2 border rounded text-base sm:text-sm"
              disabled={isLoading}
            >
              <option value="lite">Lite (Fastest)</option>
              <option value="mobilenet_v1">MobileNet V1 (Balanced)</option>
              <option value="mobilenet_v2">MobileNet V2 (Most Accurate)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1 hidden sm:block">
              {modelType === 'lite' ? 'Best for older devices' : 
               modelType === 'mobilenet_v1' ? 'Balanced performance' : 
               'Highest accuracy'}
            </p>
          </div>

          {/* Confidence Threshold - Full width on mobile */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">
              Confidence: <span className="font-bold text-blue-600">{confidence.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full h-8 sm:h-auto"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low (0.1)</span>
              <span>High (0.95)</span>
            </div>
          </div>

          {/* Detection Control - Full width on mobile */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Detection:</label>
            <button
              onClick={isDetecting ? stopDetection : startDetection}
              className={`w-full p-3 sm:p-2 rounded font-medium text-base sm:text-sm transition-colors ${
                isDetecting 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              disabled={isLoading || !modelRef.current}
            >
              {isDetecting ? '⏸ Stop Detection' : '▶ Start Detection'}
            </button>
          </div>
        </div>

        {/* Mobile-Optimized Statistics */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
          <div className="bg-white p-3 sm:p-2 rounded text-center">
            <div className="font-medium text-xs sm:text-sm">FPS</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{fps}</div>
          </div>
          <div className="bg-white p-3 sm:p-2 rounded text-center">
            <div className="font-medium text-xs sm:text-sm">Objects</div>
            <div className="text-lg sm:text-xl font-bold text-green-600">{detectedObjects.length}</div>
          </div>
          <div className="bg-white p-3 sm:p-2 rounded text-center">
            <div className="font-medium text-xs sm:text-sm">People</div>
            <div className="text-lg sm:text-xl font-bold text-red-600">{detectionCount.person || 0}</div>
          </div>
          <div className="bg-white p-3 sm:p-2 rounded text-center">
            <div className="font-medium text-xs sm:text-sm">Status</div>
            <div className={`text-lg sm:text-xl font-bold ${isDetecting ? 'text-green-600' : 'text-gray-400'}`}>
              {isDetecting ? '●' : '○'}
            </div>
          </div>
        </div>

        {/* Mobile-Friendly Object List */}
        {detectedObjects.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2 text-sm sm:text-base">Currently Detected:</h4>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {Object.entries(detectionCount).map(([className, count]) => (
                <span
                  key={className}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm"
                >
                  {className}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Detection Area */}
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <div className="gradient-text text-xl mb-2">Loading AI Model...</div>
          <div className="text-gray-600 text-sm sm:text-base">Loading {modelType} model for object detection</div>
          <div className="mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : (
        <div className="relative flex justify-center items-center gradient p-1 sm:p-1.5 rounded-md">
          {/* webcam */}
          <Webcam
            ref={webcamRef}
            className="rounded-md w-full h-auto max-h-[60vh] sm:max-h-none sm:lg:h-[550px]"
            muted
            onLoadedData={showmyVideo}
            videoConstraints={{
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: "environment" // Use back camera on mobile
            }}
          />
          {/* canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-10 w-full h-full pointer-events-none rounded-md"
          />
          
          {/* Mobile-Optimized Performance overlay */}
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-70 text-white p-1 sm:p-2 rounded text-xs">
            <div>FPS: {fps}</div>
            <div>Objects: {detectedObjects.length}</div>
            <div className="hidden sm:block">Confidence: {confidence}</div>
          </div>

          {/* Mobile Touch Instructions */}
          {detectedObjects.length === 0 && isDetecting && (
            <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-black bg-opacity-70 text-white p-2 sm:p-3 rounded text-center text-xs sm:text-sm">
              <div className="sm:hidden">👆 Point camera at objects to detect them</div>
              <div className="hidden sm:block">Point camera at objects, people, or vehicles to detect them</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectDetection;