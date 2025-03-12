import React from "react";
import { FaCheck } from "react-icons/fa";
import "../styles/stepIndicator.css";

export default function StepIndicator({
  steps,
  currentStep,
  setCurrentStep,
  completedSteps,
  loadingSteps,
}) {
  const stepLabels = ["Introducir datos", "Clustering", "Resultados"];

  return (
    <div className="step-indicator-container">
      {steps.map((step, index) => (
        <div key={index} className="step-wrapper">
          <div
            className={`step-indicator 
              ${index === currentStep ? "active" : ""} 
              ${completedSteps[index] ? "completed" : ""}
              ${loadingSteps[index] ? "loading" : ""}`}
            onClick={() => completedSteps[index] && setCurrentStep(index)}
          >
            {loadingSteps[index] && <div className="loading-border"></div>}
            {completedSteps[index] ? (
              <FaCheck className="icon" />
            ) : (
              <p className="step-number">{step}</p>
            )}
          </div>

          <div className="step-label">{stepLabels[index]}</div>
        </div>
      ))}
    </div>
  );
}
