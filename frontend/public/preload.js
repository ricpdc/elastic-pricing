const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  setupProject: (projectName, filePrices, fileElasticities) =>
    ipcRenderer.invoke(
      "setup-project",
      projectName,
      filePrices,
      fileElasticities
    ),
  calculateMetrics: (pricesFile, elasticitiesFile) =>
    ipcRenderer.invoke("calculate-metrics", pricesFile, elasticitiesFile),
  runClustering: (
    clusteringMethod,
    projectPath,
    filePricesPath,
    fileElasticitiesPath,
    solverType
  ) =>
    ipcRenderer.invoke(
      "run-clustering",
      clusteringMethod,
      projectPath,
      filePricesPath,
      fileElasticitiesPath,
      solverType
    ),
  getClusterFilesPaths: (clustersPath) =>
    ipcRenderer.invoke("get-cluster-files-paths", clustersPath),
  getClusterData: (clustersPath, clusterNumber) =>
    ipcRenderer.invoke("get-cluster-data", clustersPath, clusterNumber),
  runElasticPricing: (folderPath, outputFile, solverType, numReads, token) =>
    ipcRenderer.invoke(
      "run-elastic-pricing",
      folderPath,
      outputFile,
      solverType,
      numReads,
      token
    ),
  getResultsData: (resultsFilePath) =>
    ipcRenderer.invoke("get-results-data", resultsFilePath),
});
