// Detection configuration and utilities

export const MODEL_CONFIGS = {
  lite: {
    base: 'lite_mobilenet_v2',
    description: 'Fastest detection, lower accuracy',
    recommendedFPS: 30,
    recommendedConfidence: 0.6
  },
  mobilenet_v1: {
    base: 'mobilenet_v1', 
    description: 'Balanced speed and accuracy',
    recommendedFPS: 20,
    recommendedConfidence: 0.65
  },
  mobilenet_v2: {
    base: 'mobilenet_v2',
    description: 'Most accurate, slower detection', 
    recommendedFPS: 15,
    recommendedConfidence: 0.7
  }
};

export const OBJECT_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
  'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
  'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
  'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush'
];

export const ALERT_CLASSES = ['person', 'car', 'truck', 'motorcycle', 'bicycle'];

export const PERFORMANCE_SETTINGS = {
  low: {
    fps: 10,
    confidence: 0.7,
    description: 'Low performance mode - better for older devices'
  },
  medium: {
    fps: 20, 
    confidence: 0.65,
    description: 'Balanced performance and accuracy'
  },
  high: {
    fps: 30,
    confidence: 0.6,
    description: 'High performance mode - requires powerful device'
  }
};

// Utility functions
export const getOptimalSettings = (deviceInfo) => {
  // Simple device capability detection
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  
  if (cores >= 8 && memory >= 8) {
    return PERFORMANCE_SETTINGS.high;
  } else if (cores >= 4 && memory >= 4) {
    return PERFORMANCE_SETTINGS.medium;
  } else {
    return PERFORMANCE_SETTINGS.low;
  }
};

export const filterPredictionsByClass = (predictions, allowedClasses) => {
  return predictions.filter(pred => allowedClasses.includes(pred.class));
};

export const sortPredictionsByConfidence = (predictions) => {
  return [...predictions].sort((a, b) => b.score - a.score);
};

export const groupPredictionsByClass = (predictions) => {
  return predictions.reduce((groups, pred) => {
    if (!groups[pred.class]) {
      groups[pred.class] = [];
    }
    groups[pred.class].push(pred);
    return groups;
  }, {});
};
