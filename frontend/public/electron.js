import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const __dirname = path.resolve(
  path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1)
);

async function createWindow() {
  const { default: isDev } = await import("electron-is-dev");

  let mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    icon: path.join(__dirname, "favicon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.removeMenu();

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => (mainWindow = null));

  ipcMain.handle("open-file-dialog", async () => {
    try {
      const filePath = await openFileDialog();
      return filePath;
    } catch (error) {
      console.error("Error en open-file-dialog:", error);
      return null;
    }
  });

  ipcMain.handle(
    "calculate-metrics",
    async (event, pricesFile, elasticitiesFile) => {
      try {
        const result = await calculateMetricScript(
          pricesFile,
          elasticitiesFile
        );

        return result;
      } catch (error) {
        console.error("Error al ejecutar el script Python:", error);
        return { error: error.message };
      }
    }
  );

  ipcMain.handle(
    "setup-project",
    async (event, projectName, filePrices, fileElasticities) => {
      try {
        const result = await setupProject(
          projectName,
          filePrices,
          fileElasticities
        );
        return result;
      } catch (error) {
        console.error("Error al configurar el proyecto:", error);
        return { error: error || "Error desconocido." };
      }
    }
  );

  ipcMain.handle(
    "run-clustering",
    async (
      event,
      clusteringMethod,
      projectPath,
      filePricesPath,
      fileElasticitiesPath,
      solverType
    ) => {
      try {
        const result = await runClustering(
          clusteringMethod,
          projectPath,
          filePricesPath,
          fileElasticitiesPath,
          solverType
        );
        return result;
      } catch (error) {
        console.error("Error al ejecutar el clustering:", error);
        return { error: error || "Error desconocido." };
      }
    }
  );

  ipcMain.handle("get-cluster-files-paths", async (event, clustersPath) => {
    try {
      const result = await getClusterFilesPaths(clustersPath);
      return result;
    } catch (error) {
      console.error("Error al obtener los archivos de clusters:", error);
      return { error: error || "Error desconocido." };
    }
  });

  ipcMain.handle(
    "get-cluster-data",
    async (event, clustersPath, clusterNumber) => {
      try {
        const result = await getClusterData(clustersPath, clusterNumber);
        return result;
      } catch (error) {
        console.error("Error al obtener los datos del cluster:", error);
        return { error: error || "Error desconocido." };
      }
    }
  );

  ipcMain.handle(
    "run-elastic-pricing",
    async (event, folderPath, outputFile, solverType, numReads, token) => {
      try {
        const result = await runElasticPricing(
          folderPath,
          outputFile,
          solverType,
          numReads,
          token
        );
        return result;
      } catch (error) {
        return error;
      }
    }
  );

  ipcMain.handle("get-results-data", async (event, resultsFilePath) => {
    try {
      const result = await getResultsData(resultsFilePath);
      return result;
    } catch (error) {
      return error;
    }
  });

  ipcMain.handle("show-dialog", async (event, title, message) => {
    const result = dialog.showMessageBoxSync({
      type: "question",
      title: title,
      message: message,
      buttons: ["Cancelar", "Aceptar"],
      defaultId: 1,
      cancelId: 0,
    });

    return result === 1;
  });

  ipcMain.on("show-error-dialog", (event) => {
    dialog
      .showMessageBox(mainWindow, {
        type: "error",
        title: "Error en la aplicación",
        message: "Algo salió mal. La aplicación se reiniciará.",
        buttons: ["Aceptar"],
      })
      .then(() => {
        mainWindow.reload();
      });
  });

  ipcMain.handle(
    "get-margin-of-sales",
    async (event, resultsFilePath, pricesFilePath) => {
      return new Promise((resolve, reject) => {
        const python = spawn("python", [
          path.join(__dirname, "../../get_margin_of_sales.py"),
          resultsFilePath,
          pricesFilePath,
        ]);

        let result = "";
        let errorMessage = "";

        python.stdout.on("data", (data) => {
          result += data.toString();
        });

        python.stderr.on("data", (data) => {
          errorMessage += data.toString();
        });

        python.on("close", (code) => {
          if (code === 0) {
            try {
              const parsedResult = JSON.parse(result);
              resolve(parsedResult);
            } catch (error) {
              console.error("Error al parsear el resultado:", error);
              resolve({ error: "Error al parsear el resultado." });
            }
          } else {
            console.error("Error en el script Python:", errorMessage);
            resolve({ error: errorMessage || "Error en el script Python." });
          }
        });
      });
    }
  );
}

function openFileDialog() {
  return new Promise((resolve, reject) => {
    dialog
      .showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "CSV Files", extensions: ["csv"] }],
      })
      .then((result) => {
        if (
          result.canceled ||
          !result.filePaths ||
          result.filePaths.length === 0
        ) {
          resolve(null);
        } else {
          resolve(result.filePaths[0]);
        }
      })
      .catch((error) => {
        console.error("Error en el diálogo de archivos:", error);
        reject(error);
      });
  });
}

function calculateMetricScript(pricesFile, elasticitiesFile) {
  return new Promise(async (resolve, reject) => {
    const python = await spawn("python", [
      path.join(__dirname, "../../calculate_metrics.py"),
      pricesFile,
      elasticitiesFile,
    ]);

    let result = "";
    let errorMessage = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (error) {
          reject(new Error("Error parsing the Python script result."));
        }
      } else {
        reject(new Error(errorMessage || "Python script execution failed..."));
      }
    });
  });
}

function setupProject(projectName, filePrices, fileElasticities) {
  return new Promise(async (resolve, reject) => {
    const python = await spawn("python", [
      path.join(__dirname, "../../setup_project.py"),
      projectName,
      filePrices,
      fileElasticities,
    ]);

    let result = "";
    let errorMessage = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (error) {
          reject(new Error("Error al parsear el resultado: ", error));
        }
      } else {
        try {
          const errorResult = JSON.parse(result.trim());
          reject(errorResult.message);
        } catch (parseError) {
          console.error("Error al parsear el resultado:", parseError);
        }
        return;
      }
    });
  });
}

function runClustering(
  clusteringMethod,
  projectPath,
  filePricesPath,
  fileElasticitiesPath,
  solverType
) {
  return new Promise(async (resolve, reject) => {
    const python = await spawn("python", [
      path.join(__dirname, "../../clustering.py"),
      "--method",
      clusteringMethod,
      "--output_dir",
      projectPath,
      "--prices_file",
      filePricesPath,
      "--cross_elasticity_file",
      fileElasticitiesPath,
      "--solver_type",
      solverType,
    ]);

    let result = "";
    let errorMessage = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (error) {
          reject(new Error("Error al parsear el resultado: ", error));
        }
      } else {
        try {
          const errorResult = JSON.parse(result.trim());
          reject(errorResult.message);
        } catch (parseError) {
          console.error("Error al parsear el resultado:", parseError);
        }
        return;
      }
    });
  });
}

function getClusterFilesPaths(clustersPath) {
  return new Promise((resolve, reject) => {
    try {
      const files = fs.readdirSync(clustersPath);
      const numClusters = Math.floor(files.length / 2);

      resolve(numClusters);
    } catch (error) {
      console.error("Error al obtener archivos de clusters:", error);
      reject(error);
    }
  });
}

function getClusterData(clustersPath, clusterNumber) {
  return new Promise((resolve, reject) => {
    const python = spawn("python", [
      path.join(__dirname, "../../get_cluster_data.py"),
      clustersPath,
      clusterNumber.toString(),
    ]);

    let result = "";
    let errorMessage = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(result));
        } catch (error) {
          console.error("Error al parsear JSON del script Python:", error);
          reject(new Error("Error al parsear JSON del script Python."));
        }
      } else {
        console.error("Error en el script Python:", errorMessage);
        reject(new Error(errorMessage || "Error en el script Python"));
      }
    });
  });
}

function runElasticPricing(
  folderPath,
  outputFile,
  solverType,
  numReads,
  token
) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      "../../elastic_pricing_clustering.py"
    );

    const process = spawn("python", [
      scriptPath,
      "--folder",
      folderPath,
      "--output",
      outputFile,
      "--solver",
      solverType,
      "--num_reads",
      numReads.toString(),
      "--token",
      token,
    ]);

    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve({
          status: "success",
          message: "Asignación de precios completada",
          output,
        });
      } else {
        reject({
          status: "error",
          message: "Error executing elastic pricing",
          error: errorOutput,
        });
      }
    });
  });
}

function getResultsData(resultsFilePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(resultsFilePath)) {
      return reject({ error: "El archivo de resultados no existe" });
    }

    const python = spawn("python", [
      path.join(__dirname, "../../get_results_data.py"),
      resultsFilePath,
    ]);

    let result = "";
    let errorMessage = "";

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorMessage += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (error) {
          reject({ error: "Error al parsear el JSON de los resultados." });
        }
      } else {
        reject({
          error: errorMessage || "Error en la ejecución del script Python.",
        });
      }
    });
  });
}

console.log("Aplicación Electron iniciando...");
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
