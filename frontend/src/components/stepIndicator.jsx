import React from "react";
import "../styles/stepIndicator.css";

export default function StepIndicator({
  steps,
  currentStep,
  setCurrentStep,
  completedSteps,
  loadingSteps,
}) {
  return (
    <div className="step-indicator-container">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`step-indicator 
              ${index === currentStep ? "active" : ""} 
              ${completedSteps[index] ? "clickable" : ""}
              ${loadingSteps[index] ? "loading" : ""}`}
          onClick={() => completedSteps[index] && setCurrentStep(index)}
        >
          {step}
        </div>
      ))}
    </div>
  );
}
