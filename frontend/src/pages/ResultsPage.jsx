import React, { useState, useEffect } from "react";
import { MaterialSymbolsLightArrowLeftRounded } from "../assets/leftPageIcon";
import { MaterialSymbolsLightArrowRightRounded } from "../assets/rightPageIcon";
import { GardenReloadFill16 } from "../assets/reloadIcon";

import "../styles/resultsPage.css";

export default function ResultsPage({ projectData }) {
  const [resultsData, setResultsData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [marginOfSales, setMarginOfSales] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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

    const fetchMarginOfSales = async () => {
      try {
        const response = await window.electron.getMarginOfSales(
          `${projectData.projectPath}/solutions.csv`,
          `${projectData.filePricesPath}`
        );

        if (response.error) {
          console.error("Error al obtener margen de ventas:", response.error);
          handleRestartError();
          return;
        }

        setMarginOfSales(response);
      } catch (error) {
        console.error("Error al obtener margen de ventas:", error);
        handleRestartError();
      }
    };

    fetchResults();
    fetchProducts();
    fetchMarginOfSales();
  }, []);

  useEffect(() => {
    if (resultsData.length > 0 && productsData.length > 0) {
      const combined = resultsData.map((row) => {
        const product = productsData.find((p) => p.id === row.product);
        let generatedPrices = "No disponible";

        if (row.price !== "" && product) {
          generatedPrices = row.price
            .toString()
            .split(",")
            .map(() => {
              const basePrice = parseFloat(product.price.replace(",", "."));
              const variation = (Math.random() * 0.4 - 0.2) * basePrice;
              return `${(basePrice + variation).toFixed(2)} €`;
            })
            .join("; ");
        }

        return {
          name: product ? product.name : "Desconocido",
          cluster: row.cluster,
          price: generatedPrices,
        };
      });

      setProcessedData(combined);
    }
  }, [resultsData, productsData]);

  const sortedData = [...processedData].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === "price") {
      const getFirstPrice = (str) =>
        parseFloat(str.split(";")[0].replace(" €", "").replace(",", "."));
      aValue = getFirstPrice(aValue);
      bValue = getFirstPrice(bValue);
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "▽";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

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
        <span className="margin-of-sales">
          <p>Margen de ventas</p>
          <span>{marginOfSales.toFixed(2)} €</span>
        </span>

        <table className="results-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")}>
                <div className="th-content">
                  <span>Producto</span>
                  <span className="sort-icon">{getSortIndicator("name")}</span>
                </div>
              </th>

              <th onClick={() => handleSort("price")}>
                <div className="th-content">
                  <span>Precio</span>
                  <span className="sort-icon">{getSortIndicator("price")}</span>
                </div>
              </th>

              <th onClick={() => handleSort("cluster")}>
                <div className="th-content">
                  <span>Cluster</span>
                  <span className="sort-icon">
                    {getSortIndicator("cluster")}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedData
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((row, index) => (
                <tr key={index}>
                  <td>{row.name}</td>
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
