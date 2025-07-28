import {throttle} from "lodash";
import { playPersonAlert, playVehicleAlert, speakDetection } from "./audio-manager";
import { ALERT_CLASSES } from "./detection-config";

// Color scheme for different object classes
const CLASS_COLORS = {
  person: "#FF0000",
  car: "#00FF00", 
  truck: "#0000FF",
  bike: "#FFFF00",
  motorcycle: "#FF00FF",
  bus: "#00FFFF",
  cat: "#FFA500",
  dog: "#800080",
  bird: "#FFC0CB",
  // Add more colors for other classes
  default: "#FFFFFF"
};

export const renderPredictions = (predictions, ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Responsive fonts and sizing based on canvas size
  const canvasSize = Math.min(ctx.canvas.width, ctx.canvas.height);
  const isMobile = canvasSize < 600;
  const fontSize = Math.max(10, Math.min(24, canvasSize / (isMobile ? 30 : 50)));
  const font = `${fontSize}px Arial, sans-serif`;
  ctx.font = font;
  ctx.textBaseline = "top";

  predictions.forEach((prediction, index) => {
    const [x, y, width, height] = prediction["bbox"];
    const className = prediction.class;
    const confidence = prediction.score;
    const isPerson = className === "person";
    
    // Get color for this class
    const color = CLASS_COLORS[className] || CLASS_COLORS.default;

    // Mobile-optimized bounding box thickness
    const lineWidth = isMobile ? (isPerson ? 3 : 2) : (isPerson ? 4 : 3);

    // Enhanced bounding box with shadow effect
    ctx.save();
    
    // Draw shadow (lighter on mobile to avoid clutter)
    ctx.strokeStyle = isMobile ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = lineWidth + 1;
    ctx.strokeRect(x + 1, y + 1, width, height);
    
    // Draw main bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, width, height);

    // Enhanced fill with gradient for persons (lighter on mobile)
    if (isPerson) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      const opacity = isMobile ? 0.15 : 0.3;
      gradient.addColorStop(0, `rgba(255, 0, 0, ${opacity})`);
      gradient.addColorStop(1, `rgba(255, 0, 0, ${opacity * 0.3})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, width, height);
    }

    // Mobile-optimized label with confidence score
    const showConfidence = !isMobile || width > 80; // Hide confidence on small mobile detections
    const labelText = showConfidence 
      ? `${className} (${(confidence * 100).toFixed(0)}%)`
      : className;
    
    const textMetrics = ctx.measureText(labelText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    // Responsive label padding
    const padding = isMobile ? 4 : 6;
    const labelHeight = textHeight + padding * 2;
    
    // Only show label if there's enough space
    const showLabel = y - labelHeight > 0 && textWidth + padding * 2 < ctx.canvas.width - x;
    
    if (showLabel) {
      // Draw label background
      ctx.fillStyle = color;
      ctx.fillRect(x, y - labelHeight, textWidth + padding * 2, labelHeight);
      
      // Draw label border (thinner on mobile)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = isMobile ? 0.5 : 1;
      ctx.strokeRect(x, y - labelHeight, textWidth + padding * 2, labelHeight);

      // Draw label text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.fillText(labelText, x + padding, y - labelHeight + padding);
    }

    // Mobile-optimized confidence bar (only for larger detections)
    if (!isMobile || width > 60) {
      const barWidth = Math.min(width * 0.8, isMobile ? 60 : 100);
      const barHeight = isMobile ? 3 : 4;
      const barY = y + height - barHeight - (isMobile ? 3 : 5);
      
      // Background bar
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(x, barY, barWidth, barHeight);
      
      // Confidence bar
      const confidenceWidth = barWidth * confidence;
      const confidenceColor = confidence > 0.8 ? "#00FF00" : confidence > 0.6 ? "#FFFF00" : "#FF8800";
      ctx.fillStyle = confidenceColor;
      ctx.fillRect(x, barY, confidenceWidth, barHeight);
    }

    // Special handling for different object types with audio alerts
    if (isPerson) {
      playPersonAlert();
      drawPersonAlert(ctx, x, y, width, height, index, isMobile);
    } else if (['car', 'truck', 'motorcycle', 'bicycle', 'bus'].includes(className)) {
      playVehicleAlert(className);
    }

    // Speak detection for important objects (less frequent on mobile)
    if (ALERT_CLASSES.includes(className)) {
      const count = predictions.filter(p => p.class === className).length;
      speakDetection(className, count);
    }

    // Mobile-optimized object ID (smaller and only for first few objects)
    if (!isMobile || index < 3) {
      const idSize = isMobile ? 18 : 25;
      const idFontSize = isMobile ? 10 : 12;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(x + width - idSize, y, idSize, idSize);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${idFontSize}px Arial`;
      ctx.fillText(`${index + 1}`, x + width - idSize + (isMobile ? 4 : 5), y + 2);
    }
    
    ctx.restore();
  });

  // Mobile-optimized detection statistics overlay
  if (!isMobile) {
    drawStatsOverlay(ctx, predictions);
  } else {
    drawMobileStatsOverlay(ctx, predictions);
  }
};

// Enhanced visual alert for person detection with mobile optimization
const drawPersonAlert = (ctx, x, y, width, height, index, isMobile = false) => {
  ctx.save();
  
  // Pulsing animation effect
  const time = Date.now() / 1000;
  const pulse = Math.sin(time * 4) * 0.5 + 0.5; // 0 to 1
  
  // Mobile-optimized alert border
  const borderOffset = isMobile ? 5 : 10;
  const borderWidth = isMobile ? 4 + pulse * 2 : 8 + pulse * 4;
  
  // Draw pulsing alert border
  ctx.strokeStyle = `rgba(255, 0, 0, ${0.7 + pulse * 0.3})`;
  ctx.lineWidth = borderWidth;
  ctx.setLineDash([isMobile ? 10 : 15, isMobile ? 5 : 10]);
  ctx.strokeRect(x - borderOffset, y - borderOffset, width + borderOffset * 2, height + borderOffset * 2);
  
  // Mobile-optimized corner indicators
  if (!isMobile || width > 100) { // Only show corners on larger detections or desktop
    const cornerSize = isMobile ? 15 : 20;
    const cornerOffset = isMobile ? 3 : 5;
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = isMobile ? 3 : 4;
    ctx.setLineDash([]);
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(x - cornerOffset, y - cornerOffset + cornerSize);
    ctx.lineTo(x - cornerOffset, y - cornerOffset);
    ctx.lineTo(x - cornerOffset + cornerSize, y - cornerOffset);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(x + width + cornerOffset - cornerSize, y - cornerOffset);
    ctx.lineTo(x + width + cornerOffset, y - cornerOffset);
    ctx.lineTo(x + width + cornerOffset, y - cornerOffset + cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(x - cornerOffset, y + height + cornerOffset - cornerSize);
    ctx.lineTo(x - cornerOffset, y + height + cornerOffset);
    ctx.lineTo(x - cornerOffset + cornerSize, y + height + cornerOffset);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(x + width + cornerOffset - cornerSize, y + height + cornerOffset);
    ctx.lineTo(x + width + cornerOffset, y + height + cornerOffset);
    ctx.lineTo(x + width + cornerOffset, y + height + cornerOffset - cornerSize);
    ctx.stroke();
  }
  
  // Mobile-optimized alert text
  const alertText = isMobile ? `⚠️ PERSON #${index + 1}` : `⚠️ PERSON DETECTED #${index + 1}`;
  const alertFontSize = isMobile ? 14 : 18;
  ctx.font = `bold ${alertFontSize}px Arial, sans-serif`;
  const textMetrics = ctx.measureText(alertText);
  const textWidth = textMetrics.width;
  
  // Only show alert text if there's space and it's above the detection box
  const alertY = y - (isMobile ? 30 : 45);
  const showAlertText = alertY > 0 && textWidth + 16 < ctx.canvas.width - x;
  
  if (showAlertText) {
    // Alert text background
    ctx.fillStyle = `rgba(255, 0, 0, ${0.8 + pulse * 0.2})`;
    ctx.fillRect(x, alertY, textWidth + 16, isMobile ? 20 : 25);
    
    // Alert text border
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = isMobile ? 1 : 2;
    ctx.strokeRect(x, alertY, textWidth + 16, isMobile ? 20 : 25);
    
    // Alert text
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(alertText, x + 8, alertY + (isMobile ? 3 : 5));
  }
  
  ctx.restore();
};

// Draw statistics overlay
const drawStatsOverlay = (ctx, predictions) => {
  if (predictions.length === 0) return;
  
  ctx.save();
  
  // Count objects by class
  const classCounts = {};
  predictions.forEach(pred => {
    classCounts[pred.class] = (classCounts[pred.class] || 0) + 1;
  });
  
  // Background for stats
  const statsHeight = Object.keys(classCounts).length * 25 + 40;
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, 10, 220, statsHeight);
  
  // Border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 220, statsHeight);
  
  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px Arial";
  ctx.fillText("Detection Summary", 20, 30);
  
  // Stats
  ctx.font = "14px Arial";
  let yPos = 55;
  Object.entries(classCounts).forEach(([className, count]) => {
    const color = CLASS_COLORS[className] || CLASS_COLORS.default;
    
    // Color indicator
    ctx.fillStyle = color;
    ctx.fillRect(20, yPos - 10, 15, 15);
    
    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${className}: ${count}`, 45, yPos);
    yPos += 25;
  });
  
  ctx.restore();
};

// Mobile-optimized minimal stats overlay
const drawMobileStatsOverlay = (ctx, predictions) => {
  if (predictions.length === 0) return;
  
  ctx.save();
  
  // Count objects by class
  const classCounts = {};
  predictions.forEach(pred => {
    classCounts[pred.class] = (classCounts[pred.class] || 0) + 1;
  });
  
  // Show only top 3 most common objects on mobile
  const topClasses = Object.entries(classCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  if (topClasses.length === 0) return;
  
  // Mobile-optimized compact stats
  const statsHeight = topClasses.length * 18 + 25;
  const statsWidth = 140;
  
  // Background for stats (smaller and semi-transparent)
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(8, 8, statsWidth, statsHeight);
  
  // Border
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, statsWidth, statsHeight);
  
  // Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 12px Arial";
  ctx.fillText("Detected:", 14, 22);
  
  // Stats (compact format)
  ctx.font = "11px Arial";
  let yPos = 38;
  topClasses.forEach(([className, count]) => {
    const color = CLASS_COLORS[className] || CLASS_COLORS.default;
    
    // Smaller color indicator
    ctx.fillStyle = color;
    ctx.fillRect(14, yPos - 8, 10, 10);
    
    // Text
    ctx.fillStyle = "#FFFFFF";
    const displayText = `${className}: ${count}`;
    ctx.fillText(displayText, 30, yPos);
    yPos += 18;
  });
  
  ctx.restore();
};