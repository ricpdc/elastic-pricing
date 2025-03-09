import argparse
import json
import sys
from utils import read_price_data
from clustering import (
    build_graph_from_cross_elasticities,
    kernighan_lin_clustering,
    louvain_spectral_clustering,
    save_subgraph_data,
    determine_graph_limits,
)


def main():
    # Argument parser
    parser = argparse.ArgumentParser(description="Run graph clustering algorithms.")
    parser.add_argument(
        "--method",
        choices=["kernighan_lin", "louvain_spectral"],
        required=True,
        help="Clustering method to use (kernighan_lin or louvain_spectral)",
    )
    parser.add_argument(
        "--output_dir",
        required=True,
        help="Output directory for subgraph data",
    )
    parser.add_argument(
        "--prices_file",
        required=True,
        help="Path to the prices CSV file",
    )
    parser.add_argument(
        "--cross_elasticity_file",
        required=True,
        help="Path to the cross elasticity CSV file",
    )
    parser.add_argument(
        "--solver_type",
        default="exact",
        choices=["exact", "hybrid", "quantum"],
        help="Solver type to use for clustering",
    )

    args = parser.parse_args()

    try:
        # Read the input arguments
        method = args.method
        output_dir = args.output_dir
        prices_file = args.prices_file
        cross_elasticity_file = args.cross_elasticity_file
        solver_type = args.solver_type

        # Read price data from CSV files
        product_prices, cross_product_prices, min_margins = read_price_data(
            prices_file, cross_elasticity_file
        )

        # Build the graph from cross elasticities
        graph = build_graph_from_cross_elasticities(cross_product_prices)

        # Determine the maximum size of the subgraphs
        num_products, max_prices_per_product, max_size = determine_graph_limits(
            product_prices, solver_type
        )

        # Apply the selected clustering method
        if method == "kernighan_lin":
            # Apply the Kernighan-Lin algorithm to partition the graph
            subgraphs = kernighan_lin_clustering(graph, max_size)
        elif method == "louvain_spectral":
            # Apply the Louvain-Spectral clustering algorithm to partition the graph
            max_louvain_clusters = num_products // max_size
            subgraphs = louvain_spectral_clustering(
                graph, max_size, max_louvain_clusters
            )
        else:
            raise ValueError(f"Unknown method: {method}")

        # Save the subgraph data
        for i, subgraph in enumerate(subgraphs):
            save_subgraph_data(
                subgraph,
                product_prices,
                cross_product_prices,
                output_dir=f"{output_dir}/clusters",
                prefix=f"{method}_cluster",
                subgraph_index=i + 1,
            )
        print(json.dumps({"status": "success", "message": "Clustering completed"}))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
