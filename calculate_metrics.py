import sys
import json
from collections import defaultdict
import numpy as np
from utils import read_price_data


def calculate_metrics(prices_file, cross_elasticity_file):
    product_prices, cross_product_prices, min_margins = read_price_data(
        prices_file, cross_elasticity_file
    )

    # Dictionary with the prices per product
    prices_per_product = defaultdict(set)
    elasticities = []

    for (
        product_A,
        product_B,
        price_A,
    ), affected_margin_B in cross_product_prices.items():
        elasticities.append(affected_margin_B)

    for product, price in product_prices.keys():
        prices_per_product[product].add(price)

    # Calculate main metrics
    num_productos = len(prices_per_product)
    prices_per_product_lens = [len(precios) for precios in prices_per_product.values()]
    max_prices = max(prices_per_product_lens, default=0)
    min_prices = min(prices_per_product_lens, default=0)
    media_prices = np.mean(prices_per_product_lens) if prices_per_product_lens else 0
    media_margin_of_sales = (
        np.mean(list(product_prices.values())) if product_prices else 0
    )

    # Calculate elasticity metrics
    num_elasticidades = len(elasticities)
    max_elasticidad = max(elasticities, default=0)
    min_elasticidad = min(elasticities, default=0)
    media_elasticidad = np.mean(elasticities) if elasticities else 0

    # Group elasticities by intervals of 5
    interval_size = 5
    grouped_elasticities = defaultdict(int)

    for elasticity in elasticities:
        rounded_elasticity = round(elasticity / interval_size) * interval_size
        grouped_elasticities[rounded_elasticity] += 1

    # Create a summary of the elasticities
    elasticity_summary = [
        {"elasticity": key, "count": grouped_elasticities[key]}
        for key in sorted(grouped_elasticities.keys())
    ]

    # Create the result dictionary
    result = {
        "status": "success",
        "metrics": {
            "num_productos": num_productos,
            "max_precios": max_prices,
            "min_precios": min_prices,
            "media_precios": round(media_prices, 2),
            "media_margin_of_sales": round(media_margin_of_sales, 4),
            "num_elasticidades": num_elasticidades,
            "max_elasticidad": max_elasticidad,
            "min_elasticidad": min_elasticidad,
            "media_elasticidad": round(media_elasticidad, 2),
            "elasticity_summary": elasticity_summary,
        },
    }

    print(json.dumps(result))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(
            json.dumps(
                {"status": "error", "message": "Se necesitan exactamente 2 archivos."}
            )
        )
        sys.exit(1)

    try:
        calculate_metrics(sys.argv[1], sys.argv[2])
    except ValueError:
        print(
            json.dumps(
                {
                    "status": "error",
                    "message": "Los argumentos deben ser archivos válidos.",
                }
            )
        )
        sys.exit(1)
