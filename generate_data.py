import os
import random
import numpy as np
import csv
from itertools import combinations
import time
from multiprocessing import Pool, cpu_count


# Create the output directory if it does not exist
def create_output_directory(output_dir):
    os.makedirs(output_dir, exist_ok=True)


# Validate the inputs for the data generation
def validate_inputs(num_products, elasticity_density, num_disjoint_graphs):
    if not (0 <= elasticity_density <= 1):
        raise ValueError("elasticity_density must be between 0 and 1.")
    if num_disjoint_graphs > num_products:
        raise ValueError(
            "num_disjoint_graphs must be less than or equal to num_products."
        )


# Generate valid prices and margins for each product
def generate_prices_and_margins(
    group, price_range, margin_range, margin_probabilities=None
):
    prices = []
    valid_prices_map = {}

    if margin_probabilities:
        if not np.isclose(sum(margin_probabilities), 1):
            raise ValueError("The sum of margin_probabilities must be 1.")
        num_subranges = len(margin_probabilities)
        subrange_size = (margin_range[1] - margin_range[0]) / num_subranges
        subranges = [
            (
                margin_range[0] + i * subrange_size,
                margin_range[0] + (i + 1) * subrange_size,
            )
            for i in range(num_subranges)
        ]

    for product in group:
        num_prices = random.randint(*price_range)
        valid_prices = []
        for price in range(1, num_prices + 1):
            if margin_probabilities:
                subrange_index = np.random.choice(
                    range(len(subranges)), p=margin_probabilities
                )
                margin = random.randint(
                    int(subranges[subrange_index][0]), int(subranges[subrange_index][1])
                )
            else:
                margin = random.randint(*margin_range)

            prices.append([product, price, margin])
            valid_prices.append(price)
        valid_prices_map[product] = valid_prices

    return prices, valid_prices_map


# Generate cross elasticities between two products in a group
def generate_elasticities_for_pair(args):
    product_A, product_B, valid_prices_map, elasticity_density, seen_combinations = args
    elasticities = []

    # A -> B connection
    if random.random() < elasticity_density:
        price_A_values = valid_prices_map[product_A]
        elasticity_values = np.random.uniform(-20, 20, len(price_A_values))
        for price_A, elasticity_value in zip(price_A_values, elasticity_values):
            combination = (product_A, product_B, price_A)
            if combination not in seen_combinations:
                seen_combinations.add(combination)
                elasticities.append(
                    [product_A, product_B, price_A, round(elasticity_value, 2)]
                )

    # B -> A connection
    if random.random() < elasticity_density:
        price_B_values = valid_prices_map[product_B]
        elasticity_values = np.random.uniform(-20, 20, len(price_B_values))
        for price_B, elasticity_value in zip(price_B_values, elasticity_values):
            combination = (product_B, product_A, price_B)
            if combination not in seen_combinations:
                seen_combinations.add(combination)
                elasticities.append(
                    [product_B, product_A, price_B, round(elasticity_value, 2)]
                )

    return elasticities


# Generate cross elasticities between products
def generate_elasticities_for_group(
    group, valid_prices_map, elasticity_density, output_file
):
    seen_combinations = set()
    tasks = []

    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(
            ["product_A", "affected_product_B", "price_A", "affected_margin_B"]
        )

        for product_A, product_B in zip(group, group[1:]):
            price_A_values = valid_prices_map[product_A]
            elasticity_values = np.random.uniform(-20, 20, len(price_A_values))
            for price_A, elasticity_value in zip(price_A_values, elasticity_values):
                combination = (product_A, product_B, price_A)
                if combination not in seen_combinations:
                    seen_combinations.add(combination)
                    writer.writerow(
                        [product_A, product_B, price_A, round(elasticity_value, 2)]
                    )

            if random.random() < elasticity_density:
                price_B_values = valid_prices_map[product_B]
                elasticity_values = np.random.uniform(-20, 20, len(price_B_values))
                for price_B, elasticity_value in zip(price_B_values, elasticity_values):
                    combination = (product_B, product_A, price_B)
                    if combination not in seen_combinations:
                        seen_combinations.add(combination)
                        writer.writerow(
                            [product_B, product_A, price_B, round(elasticity_value, 2)]
                        )

        pair_tasks = [
            (
                product_A,
                product_B,
                valid_prices_map,
                elasticity_density,
                seen_combinations,
            )
            for product_A, product_B in combinations(group, 2)
        ]

        pool = Pool(processes=cpu_count())
        for i in range(0, len(pair_tasks), 1000):
            chunk = pair_tasks[i : i + 1000]
            results = pool.map(generate_elasticities_for_pair, chunk, chunksize=100)
            for result in results:
                writer.writerows(result)
        pool.close()
        pool.join()


# Save data to a CSV file
def save_to_csv(filename, header, rows):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(header)
        writer.writerows(rows)


# Generate synthetic data for prices and cross elasticities
def generate_synthetic_data(
    num_products=10,
    price_range=(2, 7),
    margin_range=(100, 10000),
    elasticity_density=0.5,
    num_disjoint_graphs=1,
    output_dir="data/synthetic_data",
    filename_prefix="synthetic",
    margin_probabilities=None,
):
    start_time = time.time()

    # Create output directory and validate inputs
    create_output_directory(output_dir)
    validate_inputs(num_products, elasticity_density, num_disjoint_graphs)

    # Divide products into disjoint groups
    products = list(range(1, num_products + 1))
    random.shuffle(products)
    disjoint_groups = [
        products[i::num_disjoint_graphs] for i in range(num_disjoint_graphs)
    ]

    for i, group in enumerate(disjoint_groups):
        prices, valid_prices_map = generate_prices_and_margins(
            group, price_range, margin_range, margin_probabilities
        )

        prices_filename = os.path.join(
            output_dir, f"{filename_prefix}_elasticity_prices_{i + 1}.csv"
        )
        save_to_csv(prices_filename, ["product", "price", "margin_of_sales"], prices)

        group_filename = os.path.join(
            output_dir, f"{filename_prefix}_cross_elasticity_prices_{i + 1}.csv"
        )
        generate_elasticities_for_group(
            group, valid_prices_map, elasticity_density, group_filename
        )

    end_time = time.time()
    print(
        f"Data generated: Individual graph files in {end_time - start_time:.2f} seconds"
    )


if __name__ == "__main__":
    # Example for generating synthetic data
    generate_synthetic_data(
        num_products=5,
        price_range=(2, 3),
        margin_range=(100, 200),
        margin_probabilities=[0.5, 0.3, 0.2],
        elasticity_density=0,
        num_disjoint_graphs=1,
        output_dir="data/examples",
        filename_prefix="example_1",
    )
