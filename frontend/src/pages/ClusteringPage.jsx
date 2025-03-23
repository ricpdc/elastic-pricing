import React, { useState, useEffect } from "react";
import Select from "react-select";
import { MaterialSymbolsLightArrowLeftRounded } from "../assets/leftPageIcon";
import { MaterialSymbolsLightArrowRightRounded } from "../assets/rightPageIcon";

import "../styles/clusteringPage.css";

export default function ClusteringPage({
  projectData,
  completedSteps,
  onNext,
}) {
  const [clustersCount, setClustersCount] = useState(1);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [clusterMetrics, setClusterMetrics] = useState(null);
  const [pricesData, setPricesData] = useState([]);
  const [elasticitiesData, setElasticitiesData] = useState([]);

  const [currentPagePrices, setCurrentPagePrices] = useState(1);
  const [currentPageElasticities, setCurrentPageElasticities] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const count = await window.electron.getClusterFilesPaths(
          `${projectData.projectPath}/clusters`
        );
        setClustersCount(count);
        setSelectedCluster(1);
      } catch (error) {
        handleRestart();
        console.error("Error al obtener los clusters:", error);
      }
    };

    fetchClusters();
  }, [projectData.projectPath]);

  useEffect(() => {
    if (selectedCluster) {
      fetchClusterData(selectedCluster);

      setCurrentPagePrices(1);
      setCurrentPageElasticities(1);
    }
  }, [selectedCluster]);

  const fetchClusterData = async (clusterNumber) => {
    try {
      const response = await window.electron.getClusterData(
        `${projectData.projectPath}/clusters`,
        clusterNumber
      );

      if (response.error) {
        console.error("Error al obtener datos del cluster:", response.error);
        handleRestart();
        return;
      }

      setClusterMetrics(response.metrics);
      setPricesData(response.prices);
      setElasticitiesData(response.elasticities);
    } catch (error) {
      console.error("Error al obtener datos del cluster:", error);
      handleRestart();
    }
  };

  useEffect(() => {
    const updateItemsPerPage = () => {
      const height = window.innerHeight;

      if (height < 500) setItemsPerPage(4);
      else if (height < 900) setItemsPerPage(6);
      else setItemsPerPage(10);
    };

    updateItemsPerPage();

    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const clusterOptions = Array.from({ length: clustersCount }, (_, i) => ({
    value: i + 1,
    label: `Cluster ${i + 1}`,
  }));

  const handlePageInput = (e, setPage, maxPages) => {
    let value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= maxPages) {
      setPage(value);
    }
  };

  const handleRestart = async () => {
    const confirmed = await window.electron.showErrorDialog(
      "Algo salió mal",
      "La aplicación ha encontrado un error inesperado. Por favor, pulsa aceptar para reiniciar el proceso."
    );

    if (confirmed) {
      window.location.reload();
    }
  };

  return (
    <div className="clustering-page">
      <div className="selector-container">
        <Select
          className="cluster-selector"
          options={clusterOptions}
          value={clusterOptions.find((opt) => opt.value === selectedCluster)}
          onChange={(selectedOption) =>
            setSelectedCluster(selectedOption.value)
          }
          placeholder="🔍 Buscar cluster..."
          isSearchable={true}
          menuPlacement="auto"
          maxMenuHeight={200}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: "#2B3482",
              "&:hover": { borderColor: "#F09223" },
              boxShadow: "none",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? "#2B3482"
                : state.isFocused
                ? "#9498C1"
                : "white",
              color: state.isSelected || state.isFocused ? "white" : "black",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#2F3444",
            }),
          }}
          noOptionsMessage={() => "No se encontraron clusters"}
        />
      </div>
      <div className="clustering-page-container">
        <div className="left-panel">
          <div className="cluster-metrics">
            <h2>MÉTRICAS DEL CLUSTER</h2>
            <div className="metric-item">
              <span className="metric-name">Nº de productos</span>
              <span className="metric-value">
                {clusterMetrics ? clusterMetrics.num_products : "-"}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Media precios por producto</span>
              <span className="metric-value">
                {clusterMetrics ? clusterMetrics.avg_prices : "-"}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Mín. precios por producto</span>
              <span className="metric-value">
                {clusterMetrics ? clusterMetrics.min_prices : "-"}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Máx. precios por producto</span>
              <span className="metric-value">
                {clusterMetrics ? clusterMetrics.max_prices : "-"}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-name">Nº de elasticidades</span>
              <span className="metric-value">
                {clusterMetrics ? clusterMetrics.num_elasticities : "-"}
              </span>
            </div>
          </div>

          <div className="next-button-container">
            <button
              onClick={completedSteps[2] ? onNext : null}
              className="next-button"
              disabled={!completedSteps[2]}
            >
              ➜
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="cluster-tables">
            <div className="table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Margen Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {pricesData
                    .slice(
                      (currentPagePrices - 1) * itemsPerPage,
                      currentPagePrices * itemsPerPage
                    )
                    .map((row, index) => (
                      <tr key={index}>
                        <td>{row.product}</td>
                        <td>{row.price}</td>
                        <td>{row.margin_of_sales}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="pagination">
                <button
                  onClick={() =>
                    setCurrentPagePrices(Math.max(1, currentPagePrices - 1))
                  }
                  disabled={currentPagePrices === 1}
                >
                  <MaterialSymbolsLightArrowLeftRounded />
                </button>
                <span className="page-info">
                  <input
                    className="cluster-page-input"
                    type="number"
                    value={currentPagePrices}
                    onChange={(e) =>
                      handlePageInput(
                        e,
                        setCurrentPagePrices,
                        Math.ceil(pricesData.length / itemsPerPage)
                      )
                    }
                    min="1"
                    max={Math.ceil(pricesData.length / itemsPerPage)}
                  />
                  <span> de {Math.ceil(pricesData.length / itemsPerPage)}</span>
                </span>
                <button
                  onClick={() =>
                    setCurrentPagePrices(
                      Math.min(
                        Math.ceil(pricesData.length / itemsPerPage),
                        currentPagePrices + 1
                      )
                    )
                  }
                  disabled={
                    currentPagePrices * itemsPerPage >= pricesData.length
                  }
                >
                  <MaterialSymbolsLightArrowRightRounded />
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>A</th>
                    <th>B</th>
                    <th>Precio A</th>
                    <th>Margen B</th>
                  </tr>
                </thead>
                <tbody>
                  {elasticitiesData
                    .slice(
                      (currentPageElasticities - 1) * itemsPerPage,
                      currentPageElasticities * itemsPerPage
                    )
                    .map((row, index) => (
                      <tr key={index}>
                        <td>{row.product_A}</td>
                        <td>{row.affected_product_B}</td>
                        <td>{row.price_A}</td>
                        <td>{row.affected_margin_B}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="pagination">
                <button
                  onClick={() =>
                    setCurrentPageElasticities(
                      Math.max(1, currentPageElasticities - 1)
                    )
                  }
                  disabled={currentPageElasticities === 1}
                >
                  <MaterialSymbolsLightArrowLeftRounded />
                </button>
                <span className="page-info">
                  <input
                    className="cluster-page-input"
                    type="number"
                    value={currentPageElasticities}
                    onChange={(e) =>
                      handlePageInput(
                        e,
                        setCurrentPageElasticities,
                        Math.ceil(elasticitiesData.length / itemsPerPage)
                      )
                    }
                    min="1"
                    max={Math.ceil(elasticitiesData.length / itemsPerPage)}
                  />
                  <span>
                    {" "}
                    de {Math.ceil(elasticitiesData.length / itemsPerPage)}
                  </span>
                </span>
                <button
                  onClick={() =>
                    setCurrentPageElasticities(
                      Math.min(
                        Math.ceil(elasticitiesData.length / itemsPerPage),
                        currentPageElasticities + 1
                      )
                    )
                  }
                  disabled={
                    currentPageElasticities * itemsPerPage >=
                    elasticitiesData.length
                  }
                >
                  <MaterialSymbolsLightArrowRightRounded />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
