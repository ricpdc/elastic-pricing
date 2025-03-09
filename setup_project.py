import os
import sys
import json
import shutil

BASE_DIR = "C:\\QAP"


def create_project_folder(project_name, prices_file, elasticities_file):
    output = {}

    # Check if the base folder exists, if not, create it
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    # Path for the new project folder
    project_path = os.path.join(BASE_DIR, project_name)

    # If the project folder already exists, return an error in JSON format
    if os.path.exists(project_path):
        print(
            json.dumps(
                {"status": "error", "message": "El nombre del proyecto ya está en uso."}
            )
        )
        sys.exit(1)

    # Create the project folder
    os.makedirs(project_path)

    # Create the clusters folder inside the project folder
    clusters_path = os.path.join(project_path, "clusters")
    os.makedirs(clusters_path)

    # Copy the prices and elasticities files to the project folder
    try:
        copied_prices_file = shutil.copy(prices_file, project_path)
        copied_elasticities_file = shutil.copy(elasticities_file, project_path)
        output["status"] = "success"
        output["message"] = f"Proyecto creado en: {project_path}"
        output["path"] = project_path
        output["files"] = {
            "prices_file": copied_prices_file,
            "elasticities_file": copied_elasticities_file,
        }
    except Exception as e:
        print(
            json.dumps(
                {"status": "error", "message": f"Error al copiar archivos: {str(e)}"}
            )
        )
        sys.exit(1)

    # Print the output in JSON format
    print(json.dumps(output))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            json.dumps(
                {
                    "status": "error",
                    "message": "Uso: python setup_project.py <nombre_proyecto> <fichero_precios> <fichero_elasticidades>",
                }
            )
        )
        sys.exit(1)

    project_name = sys.argv[1]
    prices_file = sys.argv[2]
    elasticities_file = sys.argv[3]

    create_project_folder(project_name, prices_file, elasticities_file)
