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
    num_products, price_range, margin_range, margin_probabilities=None
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

    for product in range(1, num_products + 1):
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
def generate_cross_elasticities(disjoint_groups, valid_prices_map, elasticity_density):
    seen_combinations = set()
    output_file = "temp_elasticities.csv"

    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(
            ["product_A", "affected_product_B", "price_A", "afected_margin_B"]
        )

        # Parallelize the generation of elasticities
        pool = Pool(processes=cpu_count())
        tasks = []

        for group in disjoint_groups:
            # Ensure a minimum connection (linear chain) within each disjoint group
            for product_A, product_B in zip(group, group[1:]):
                # Always connect A -> B to enforce graph connectivity
                price_A_values = valid_prices_map[product_A]
                elasticity_values = np.random.uniform(-20, 20, len(price_A_values))
                for price_A, elasticity_value in zip(price_A_values, elasticity_values):
                    combination = (product_A, product_B, price_A)
                    if combination not in seen_combinations:
                        seen_combinations.add(combination)
                        writer.writerow(
                            [
                                product_A,
                                product_B,
                                price_A,
                                round(elasticity_value, 2),
                            ]
                        )

                # Generate B -> A based on elasticity_density
                if random.random() < elasticity_density:
                    price_B_values = valid_prices_map[product_B]
                    elasticity_values = np.random.uniform(-20, 20, len(price_B_values))
                    for price_B, elasticity_value in zip(
                        price_B_values, elasticity_values
                    ):
                        combination = (product_B, product_A, price_B)
                        if combination not in seen_combinations:
                            seen_combinations.add(combination)
                            writer.writerow(
                                [
                                    product_B,
                                    product_A,
                                    price_B,
                                    round(elasticity_value, 2),
                                ]
                            )

            # Add additional connections based on elasticity_density
            for product_A, product_B in combinations(group, 2):
                tasks.append(
                    (
                        product_A,
                        product_B,
                        valid_prices_map,
                        elasticity_density,
                        seen_combinations,
                    )
                )

                # Process tasks in smaller chunks to save memory
                if len(tasks) >= 1000:
                    results = pool.map(
                        generate_elasticities_for_pair, tasks, chunksize=50
                    )
                    for result in results:
                        writer.writerows(result)
                    tasks = []

        # Process remaining tasks
        if tasks:
            results = pool.map(generate_elasticities_for_pair, tasks, chunksize=50)
            for result in results:
                writer.writerows(result)

        pool.close()
        pool.join()

    return output_file


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

    # Generate prices and margins
    prices, valid_prices_map = generate_prices_and_margins(
        num_products, price_range, margin_range, margin_probabilities
    )

    # Generate cross elasticities
    elasticities_file = generate_cross_elasticities(
        disjoint_groups, valid_prices_map, elasticity_density
    )

    # Save to CSV files
    prices_filename = os.path.join(
        output_dir, f"{filename_prefix}_elasticity_prices.csv"
    )
    elasticities_filename = os.path.join(
        output_dir, f"{filename_prefix}_cross_elasticity_prices.csv"
    )

    save_to_csv(prices_filename, ["product", "price", "margin_of_sales"], prices)

    # Move the temporary file to the final location
    os.rename(elasticities_file, elasticities_filename)

    end_time = time.time()
    print(
        f"Data generated: {prices_filename} and {elasticities_filename} in {end_time - start_time:.2f} seconds"
    )


if __name__ == "__main__":
    # Example 1: homogeneous margins
    generate_synthetic_data(
        num_products=5,
        price_range=(2, 3),
        margin_range=(100, 200),
        elasticity_density=0,
        num_disjoint_graphs=1,
        output_dir="data/synthetic_data/simple_examples",
        filename_prefix="example_1",
    )

    # Example 2: margin variability
    generate_synthetic_data(
        num_products=5,
        price_range=(2, 4),
        margin_range=(10, 1000),
        margin_probabilities=[1, 0, 0, 0],
        elasticity_density=0.3,
        num_disjoint_graphs=1,
        output_dir="data/synthetic_data/simple_examples",
        filename_prefix="example_2",
    )

    # Example 3: disjoint groups of products
    generate_synthetic_data(
        num_products=6,
        price_range=(2, 3),
        margin_range=(100, 300),
        elasticity_density=0,
        num_disjoint_graphs=2,
        output_dir="data/synthetic_data/simple_examples",
        filename_prefix="example_3",
    )

    # Example 4: disjoint groups of products
    generate_synthetic_data(
        num_products=6,
        price_range=(2, 3),
        margin_range=(100, 300),
        elasticity_density=1,
        num_disjoint_graphs=2,
        output_dir="data/synthetic_data/simple_examples",
        filename_prefix="example_4",
    )
