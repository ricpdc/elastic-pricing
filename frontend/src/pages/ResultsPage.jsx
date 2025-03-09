import React, { useState, useEffect } from "react";
import { MaterialSymbolsLightArrowLeftRounded } from "../assets/leftPageIcon";
import { MaterialSymbolsLightArrowRightRounded } from "../assets/rightPageIcon";

import "../styles/resultsPage.css";

export default function ResultsPage({ projectData }) {
  const [resultsData, setResultsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await window.electron.getResultsData(
          `${projectData.projectPath}/solutions.csv`
        );

        if (response.error) {
          console.error("Error al obtener resultados:", response.error);
          return;
        }

        setResultsData(response);
      } catch (error) {
        console.error("Error al obtener resultados:", error);
      }
    };

    fetchResults();
  }, []);

  const totalPages = Math.ceil(resultsData.length / itemsPerPage);

  const handlePageInput = (e) => {
    let value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const clusteringMap = {
    kernighan_lin: "Kernighan-Lin",
    louvain_spectral: "Louvain/Spectral",
  };

  const solverMap = {
    quantum: "Cuántico",
    hybrid: "Híbrido",
    exact: "Simulador",
  };

  return (
    <div className="results-page">
      <div className="left-panel">
        <div className="result-metrics">
          <h2>RESUMEN</h2>
          <div className="metric-item">
            <span className="metric-name">Nº de productos</span>
            <span className="metric-value">
              {projectData.metrics?.num_productos ?? "-"}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-name">Media precios por producto</span>
            <span className="metric-value">
              {projectData.metrics?.media_precios ?? "-"}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-name">Nº de elasticidades</span>
            <span className="metric-value">
              {projectData.metrics?.num_elasticidades ?? "-"}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-name">Método de clustering</span>
            <span className="metric-value">
              {clusteringMap[projectData.clustering] ?? "Desconocido"}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-name">Solver utilizado</span>
            <span className="metric-value">
              {solverMap[projectData.solver] ?? "Desconocido"}
            </span>
          </div>

          <div className="metric-item">
            <span className="metric-name">Archivo de soluciones</span>
            <span
              className="metric-value"
              title={`${projectData.projectPath}\\solutions.csv`}
            >
              {`${projectData.projectPath}\\solutions.csv`}
            </span>
          </div>
        </div>

        <div className="next-button-container">
          <button className="next-button">➜</button>
        </div>
      </div>
      <div className="right-panel">
        <table className="results-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cluster</th>
            </tr>
          </thead>
          <tbody>
            {resultsData
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((row, index) => (
                <tr key={index}>
                  <td>{row.product}</td>
                  <td>{row.price}</td>
                  <td>{row.cluster}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <MaterialSymbolsLightArrowLeftRounded />
          </button>
          <span className="page-info">
            <input
              className="results-page-input"
              type="number"
              value={currentPage}
              onChange={handlePageInput}
              min="1"
              max={totalPages}
            />
            <span> de {totalPages}</span>
          </span>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            <MaterialSymbolsLightArrowRightRounded />
          </button>
        </div>
      </div>
    </div>
  );
}
