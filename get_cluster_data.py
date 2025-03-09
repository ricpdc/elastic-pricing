import os
import sys
import json
import csv
from collections import defaultdict
import numpy as np


def read_cluster_data(clusters_path, cluster_number):
    prices_file = os.path.join(clusters_path, f"{cluster_number}_elasticity_prices.csv")
    elasticities_file = os.path.join(
        clusters_path, f"{cluster_number}_cross_elasticity_prices.csv"
    )

    if not os.path.exists(prices_file) or not os.path.exists(elasticities_file):
        print(json.dumps({"error": "Archivos de cluster no encontrados"}))
        sys.exit(1)

    # Read prices
    prices_data = []
    prices_per_product = defaultdict(set)

    with open(prices_file, newline="", encoding="utf-8") as csvfile:
        csv_reader = csv.reader(csvfile, delimiter=";")
        next(csv_reader, None)
        for row in csv_reader:
            product, price, margin = int(row[0]), int(row[1]), float(row[2])
            prices_data.append(
                {"product": product, "price": price, "margin_of_sales": margin}
            )
            prices_per_product[product].add(price)

    # Leer elasticidades
    elasticities_data = []
    elasticities = []

    with open(elasticities_file, newline="", encoding="utf-8") as csvfile:
        csv_reader = csv.reader(csvfile, delimiter=";")
        next(csv_reader, None)
        for row in csv_reader:
            product_A, product_B, price_A, affected_margin_B = (
                int(row[0]),
                int(row[1]),
                int(row[2]),
                float(row[3]),
            )
            elasticities_data.append(
                {
                    "product_A": product_A,
                    "affected_product_B": product_B,
                    "price_A": price_A,
                    "affected_margin_B": affected_margin_B,
                }
            )
            elasticities.append(affected_margin_B)

    # Calculate metrics
    num_products = len(prices_per_product)
    prices_per_product_lens = [len(precios) for precios in prices_per_product.values()]

    max_prices = max(prices_per_product_lens, default=0)
    min_prices = min(prices_per_product_lens, default=0)
    avg_prices = np.mean(prices_per_product_lens) if prices_per_product_lens else 0

    num_elasticities = len(elasticities)

    # Output JSON
    output = {
        "metrics": {
            "num_products": num_products,
            "max_prices": max_prices,
            "min_prices": min_prices,
            "avg_prices": round(avg_prices, 2),
            "num_elasticities": num_elasticities,
        },
        "prices": prices_data,
        "elasticities": elasticities_data,
    }

    print(json.dumps(output))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            json.dumps(
                {
                    "error": "Uso: python get_cluster_data.py <ruta_clusters> <num_cluster>"
                }
            )
        )
        sys.exit(1)

    clusters_path = sys.argv[1]
    cluster_number = int(sys.argv[2])

    read_cluster_data(clusters_path, cluster_number)
