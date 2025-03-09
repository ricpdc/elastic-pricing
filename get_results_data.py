import os
import sys
import csv
import json


def read_results_data(results_file):
    # Check if the results file exists
    if not os.path.exists(results_file):
        print(json.dumps({"error": "El archivo de resultados no existe"}))
        sys.exit(1)

    results_data = []

    # Read the results file
    with open(results_file, newline="", encoding="utf-8") as csvfile:
        csv_reader = csv.reader(csvfile, delimiter=";")

        headers = next(csv_reader, None)
        if headers is None or len(headers) < 3:
            print(
                json.dumps(
                    {"error": "El archivo de resultados no tiene un formato válido"}
                )
            )
            sys.exit(1)

        for row in csv_reader:
            if len(row) >= 3:
                results_data.append(
                    {"product": int(row[0]), "price": float(row[1]), "cluster": row[2]}
                )

    print(json.dumps(results_data))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(
            json.dumps({"error": "Uso: python get_results_data.py <ruta_results.csv>"})
        )
        sys.exit(1)

    results_file = sys.argv[1]
    read_results_data(results_file)
