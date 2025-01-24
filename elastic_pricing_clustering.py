import os
import csv
from utils import (
    read_price_data,
    build_qubo_matrix,
    solve_qubo_model,
    validate_qubo_size,
)


def solve_and_integrate(folder_path, output_file, solver_type="quantum", num_reads=10):
    solutions = {}

    # Iterate through the subgraphs in the folder
    for file in os.listdir(folder_path):
        if file.endswith("_cross_elasticity_prices.csv"):
            prefix = file.replace("_cross_elasticity_prices.csv", "")
            prices_file = os.path.join(folder_path, f"{prefix}_elasticity_prices.csv")
            cross_elasticity_file = os.path.join(
                folder_path, f"{prefix}_cross_elasticity_prices.csv"
            )

            print(prices_file + " " + cross_elasticity_file)

            # Read price data
            product_prices, cross_product_prices, min_margins = read_price_data(
                prices_file, cross_elasticity_file
            )

            # Build QUBO matrix
            Q = build_qubo_matrix(product_prices, cross_product_prices, min_margins)

            # Validate QUBO matrix size
            max_variables = 175
            max_connections = 30625
            if not validate_qubo_size(Q, max_variables, max_connections):
                print(f"Skipping {prefix}: QUBO matrix size exceeds the limits.")
                continue

            # Solve the QUBO model
            result = solve_qubo_model(Q, solver_type=solver_type, num_reads=num_reads)

            # Extract the solution
            sample = result.first.sample
            for var, value in sample.items():
                if value == 1:
                    parts = var.split("_")
                    product = int(parts[0][1:])
                    price = int(parts[1][1:])
                    if product not in solutions:
                        solutions[product] = []
                    solutions[product].append(price)

    # Write the integrated solutions to the output file
    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")  # Set delimiter to ";"
        writer.writerow(["product", "price"])
        all_products = set(
            range(max(solutions.keys(), default=0) + 1)
        )  # Ensure all products are considered
        for product in sorted(all_products):
            if product in solutions:
                prices = sorted(solutions[product])
                writer.writerow([product, ",".join(map(str, prices))])
            else:
                writer.writerow([product, "-1"])

    print(f"Solutions integrated and saved to {output_file}")


def main():
    import argparse

    # Argument parser
    parser = argparse.ArgumentParser(
        description="Solve and integrate subgraph solutions."
    )
    parser.add_argument(
        "--folder", required=True, help="Path to the folder with subgraphs."
    )
    parser.add_argument("--output", required=True, help="Path to the output CSV file.")
    parser.add_argument(
        "--solver",
        default="quantum",
        choices=["quantum", "exact", "hybrid"],
        help="Solver type.",
    )
    parser.add_argument(
        "--num_reads", type=int, default=10, help="Number of reads for the solver."
    )
    args = parser.parse_args()

    # Solve and integrate solutions
    solve_and_integrate(
        args.folder, args.output, solver_type=args.solver, num_reads=args.num_reads
    )


if __name__ == "__main__":
    main()
