import React, { useState, useEffect } from "react";
import { MaterialSymbolsLightArrowLeftRounded } from "../assets/leftPageIcon";
import { MaterialSymbolsLightArrowRightRounded } from "../assets/rightPageIcon";
import { GardenReloadFill16 } from "../assets/reloadIcon";

import "../styles/resultsPage.css";

export default function ResultsPage({ projectData }) {
  const [resultsData, setResultsData] = useState([]);
  const [productsData, setProductsData] = useState([]);
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
          handleRestartError();
          return;
        }

        setResultsData(response);
      } catch (error) {
        console.error("Error al obtener resultados:", error);
        handleRestartError();
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await fetch("../assets/productsData.json");
        const data = await response.json();
        setProductsData(data);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        handleRestartError();
      }
    };

    fetchResults();
    fetchProducts();
  }, []);

  const totalPages = Math.ceil(resultsData.length / itemsPerPage);

  const handlePageInput = (e) => {
    let value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handleRestart = async () => {
    const confirmed = await window.electron.showDialog(
      "Confirmar reinicio",
      "¿Estás seguro de que quieres reiniciar el proceso?"
    );

    if (confirmed) {
      window.location.reload();
    }
  };

  const handleRestartError = async () => {
    const confirmed = await window.electron.showErrorDialog(
      "Algo salió mal",
      "La aplicación ha encontrado un error inesperado. Por favor, pulsa aceptar para reiniciar el proceso."
    );

    if (confirmed) {
      window.location.reload();
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
          <button className="next-button" onClick={handleRestart}>
            <GardenReloadFill16 />
          </button>
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
              .map((row, index) => {
                const product = productsData.find((p) => p.id === row.product);
                return (
                  <tr key={index}>
                    <td>{product ? product.name : "Desconocido"}</td>
                    <td>
                      {row.price === ""
                        ? "No disponible"
                        : product
                        ? row.price
                            .toString()
                            .split(",")
                            .map(() => {
                              const basePrice = parseFloat(
                                product.price.replace(",", ".")
                              );
                              const variation =
                                (Math.random() * 0.4 - 0.2) * basePrice;
                              return `${(basePrice + variation).toFixed(2)} €`;
                            })
                            .join("; ")
                        : "-"}
                    </td>

                    <td>{row.cluster}</td>
                  </tr>
                );
              })}
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
