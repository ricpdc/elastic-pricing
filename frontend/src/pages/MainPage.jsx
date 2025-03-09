import React, { useState, useEffect } from "react";
import StepIndicator from "../components/stepIndicator";

import InputDataPage from "./InputDataPage";
import ClusteringPage from "./ClusteringPage";
import ResultsPage from "./ResultsPage";

import "../styles/mainPage.css";

export default function MainPage() {
  const steps = ["1", "2", "3"];
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState([false, false, false]);
  const [completedSteps, setCompletedSteps] = useState([false, false, false]);

  const [projectData, setProjectData] = useState({
    projectName: "",
    apiKey: "",
    clustering: "",
    solver: "",
    projectPath: "",
    filePricesPath: "",
    fileElasticitiesPath: "",
    metrics: null,
  });

  const [filePrices, setFilePrices] = useState(null);
  const [fileElasticities, setFileElasticities] = useState(null);

  useEffect(() => {
    if (loadingSteps[2]) {
      calculateSolutions();
    }
  }, [loadingSteps[2]]);

  const calculateSolutions = async () => {
    try {
      const response = await window.electron.runElasticPricing(
        `${projectData.projectPath}/clusters`,
        `${projectData.projectPath}/solutions.csv`,
        projectData.solver,
        10 // num_reads
      );

      if (response.status === "success") {
        alert(response.message);
        setCompletedSteps([true, true, true]);
      } else {
        console.error("Error al obtener soluciones.");
      }
    } catch (error) {
      console.error("Error al obtener soluciones:", error);
    } finally {
      setLoadingSteps([false, false, false]);
    }
  };

  const updateProjectData = (field, value) => {
    setProjectData((prevData) => ({ ...prevData, [field]: value }));
  };

  const goToStep = (stepIndex) => {
    if (completedSteps[stepIndex]) {
      setCurrentStep(stepIndex);
    }
  };

  const markStepCompleted = (stepIndex) => {
    setCompletedSteps((prevSteps) => {
      const newSteps = [...prevSteps];
      newSteps[stepIndex] = true;
      return newSteps;
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <InputDataPage
            projectData={projectData}
            updateProjectData={updateProjectData}
            completedSteps={completedSteps}
            setCompletedSteps={setCompletedSteps}
            setLoadingSteps={setLoadingSteps}
            filePrices={filePrices}
            setFilePrices={setFilePrices}
            fileElasticities={fileElasticities}
            setFileElasticities={setFileElasticities}
            onNext={() => {
              markStepCompleted(1);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <ClusteringPage
            projectData={projectData}
            completedSteps={completedSteps}
            onNext={() => {
              markStepCompleted(2);
              setCurrentStep(2);
            }}
            onBack={() => setCurrentStep(0)}
          />
        );
      case 2:
        return (
          <ResultsPage
            projectData={projectData}
            onBack={() => setCurrentStep(1)}
          />
        );
      default:
        return <InputDataPage onNext={() => setCurrentStep(1)} />;
    }
  };

  return (
    <div className="main-container">
      <div className="main-step-indicator">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={goToStep}
          completedSteps={completedSteps}
          loadingSteps={loadingSteps}
        />
      </div>
      <span className="main-step">{renderStep()}</span>
    </div>
  );
}
