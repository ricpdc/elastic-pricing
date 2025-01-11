import argparse
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
    args = parser.parse_args()

    # Data files
    prices_file = "data\generic\\20_1_80\_elasticity_prices_1.csv"
    cross_elasticity_file = "data\generic\\20_1_80\_cross_elasticity_prices_1.csv"

    # Read price data from CSV files
    product_prices, cross_product_prices, min_margins = read_price_data(
        prices_file, cross_elasticity_file
    )

    # Build the graph from cross elasticities
    graph = build_graph_from_cross_elasticities(cross_product_prices)

    # Determine the maximum size of the subgraphs
    num_products, max_prices_per_product, max_size = determine_graph_limits(
        product_prices
    )

    # Apply the selected clustering method
    if args.method == "kernighan_lin":
        # Apply the Kernighan-Lin algorithm to partition the graph
        subgraphs = kernighan_lin_clustering(graph, max_size)
    elif args.method == "louvain_spectral":
        # Apply the Louvain-Spectral clustering algorithm to partition the graph
        max_louvain_clusters = num_products // max_size
        subgraphs = louvain_spectral_clustering(graph, max_size, max_louvain_clusters)
    else:
        raise ValueError(f"Unknown method: {args.method}")

    # Save the subgraph data
    for i, subgraph in enumerate(subgraphs):
        save_subgraph_data(
            subgraph,
            product_prices,
            cross_product_prices,
            output_dir="data/clusters",
            prefix=f"{args.method}_cluster",
            subgraph_index=i + 1,
        )


if __name__ == "__main__":
    main()
