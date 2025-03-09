import React, { useState, useEffect } from "react";
import TablerFileTypeCsv from "../assets/csvIcon";
import ElasticityChart from "../components/elasticitiesChart.jsx";

import "../styles/inputDataPage.css";

export default function InputDataPage({
  projectData,
  updateProjectData,
  completedSteps,
  setCompletedSteps,
  setLoadingSteps,
  filePrices,
  setFilePrices,
  fileElasticities,
  setFileElasticities,
  onNext,
}) {
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const selectFile = async (setFile) => {
    try {
      const filePath = await window.electron.openFileDialog();
      if (filePath) setFile(filePath);
    } catch (error) {
      console.error("Error al seleccionar archivo:", error);
    }
  };

  const handleNext = () => {
    if (
      !projectData.projectName ||
      !projectData.apiKey ||
      !projectData.clustering ||
      !projectData.solver ||
      !filePrices ||
      !fileElasticities
    ) {
      console.error(
        "Por favor, introduce todos los campos y selecciona los archivos CSV."
      );
      return;
    }

    try {
      setupProject();
    } catch (error) {
      console.error("Error en el proceso:", error);
    }
  };

  const setupProject = async () => {
    try {
      const response = await window.electron.setupProject(
        projectData.projectName,
        filePrices,
        fileElasticities
      );

      if (response.error) {
        console.error(`Error al configurar el proyecto: ${response.error}`);
        return;
      }

      updateProjectData("projectPath", response.path);
      updateProjectData("filePricesPath", response.files.prices_file);
      updateProjectData(
        "fileElasticitiesPath",
        response.files.elasticities_file
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (completedSteps[0]) return;
    if (projectData.filePricesPath && projectData.fileElasticitiesPath) {
      processMetrics();
      setCompletedSteps([true, completedSteps[1], completedSteps[2]]);
    }
  }, [projectData.filePricesPath, projectData.fileElasticitiesPath]);

  const processMetrics = async () => {
    if (!projectData.filePricesPath || !projectData.fileElasticitiesPath) {
      console.error("Por favor, selecciona ambos archivos CSV.");
      return;
    }

    setLoadingMetrics(true);
    updateProjectData("metrics", null);

    try {
      const response = await window.electron.calculateMetrics(
        projectData.filePricesPath,
        projectData.fileElasticitiesPath
      );

      if (response.status === "success") {
        updateProjectData("metrics", response.metrics);
      } else {
        console.error("Error al calcular métricas.");
      }
    } catch (e) {
      console.error("Error calculando las métricas.");
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (projectData.metrics && !completedSteps[1]) {
      handleClustering();
    }
  }, [projectData.metrics]);

  const handleClustering = async () => {
    setLoadingSteps([false, true, false]);

    try {
      const response = await window.electron.runClustering(
        projectData.clustering,
        projectData.projectPath,
        projectData.filePricesPath,
        projectData.fileElasticitiesPath,
        projectData.solver
      );

      if (response.status === "success") {
        alert(response.message);
        setCompletedSteps([completedSteps[0], true, completedSteps[2]]);
        setLoadingSteps([false, false, true]);
      } else {
        console.error("Error al calcular los clusters.");
      }
    } catch (error) {
      console.error("Error en clustering:", error);
    }
  };

  return (
    <div className="input-data-page">
      <div className="input-data-page-container">
        <div className="left-panel">
          <h2>PARÁMETROS</h2>
          <input
            type="text"
            placeholder="Nombre del proyecto"
            value={projectData.projectName}
            onChange={(e) => updateProjectData("projectName", e.target.value)}
            className="input-field"
            disabled={completedSteps[0]}
          />
          <input
            type="password"
            placeholder="API KEY"
            value={projectData.apiKey}
            onChange={(e) => updateProjectData("apiKey", e.target.value)}
            className="input-field"
            disabled={completedSteps[0]}
          />

          <select
            value={projectData.clustering}
            onChange={(e) => updateProjectData("clustering", e.target.value)}
            className="input-field"
            disabled={completedSteps[0]}
          >
            <option value="">Seleccionar tipo de clustering</option>
            <option value="kernighan_lin">Kernighan-Lin</option>
            <option value="louvain_spectral">
              Louvain/Spectral clustering
            </option>
          </select>

          <select
            value={projectData.solver}
            onChange={(e) => updateProjectData("solver", e.target.value)}
            className="input-field"
            disabled={completedSteps[0]}
          >
            <option value="">Seleccionar solver</option>
            <option value="quantum">Solver cuántico</option>
            <option value="hybrid">Solver híbrido</option>
            <option value="exact">Simulador</option>
          </select>

          <div className="file-upload">
            <button
              className={`file-button ${completedSteps[0] ? "disabled" : ""}`}
              onClick={() => selectFile(setFilePrices)}
              disabled={completedSteps[0]}
            >
              <TablerFileTypeCsv className="icon" />

              <span className="file-info">
                <h4>Fichero de precios</h4>
                {(filePrices && <p className="file-path">{filePrices}</p>) || (
                  <p>No hay ningún fichero seleccionado</p>
                )}
              </span>
            </button>

            <button
              className={`file-button ${completedSteps[0] ? "disabled" : ""}`}
              onClick={() => selectFile(setFileElasticities)}
              disabled={completedSteps[0]}
            >
              <TablerFileTypeCsv className="icon" />

              <span className="file-info">
                <h4>Fichero de elasticidades</h4>
                {(fileElasticities && (
                  <p className="file-path">{fileElasticities}</p>
                )) || <p>No hay ningún fichero seleccionado</p>}
              </span>
            </button>
          </div>

          <div className="next-button-container">
            <button
              onClick={!completedSteps[1] ? handleNext : onNext}
              className="next-button"
              disabled={completedSteps[0] && !completedSteps[1]}
            >
              ➜
            </button>
          </div>
        </div>

        <div className="right-panel">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
              </tr>
            </thead>

            <tbody>
              {[
                { key: "num_productos", label: "Nº de productos" },
                { key: "max_precios", label: "Máx. precios por producto" },
                { key: "min_precios", label: "Mín. precios por producto" },
                { key: "media_precios", label: "Media precios por producto" },
                { key: "num_elasticidades", label: "Nº de elasticidades" },
              ].map(({ key, label }) => (
                <tr key={key}>
                  <td>{label}</td>
                  <td>
                    {loadingMetrics
                      ? "Calculando..."
                      : projectData.metrics?.[key] ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ElasticityChart
            elasticitySummary={projectData.metrics?.elasticity_summary ?? []}
          />
        </div>
      </div>
    </div>
  );
}
