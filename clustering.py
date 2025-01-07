from utils import read_price_data
from clustering import (
    build_graph_from_cross_elasticities,
    partition_graph,
    save_subgraph_data,
    determine_graph_limits,
)


def main():
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

    # Apply the Kernighan-Lin algorithm to partition the graph
    subgraphs = partition_graph(graph, max_size)

    # Save the subgraph data
    for i, subgraph in enumerate(subgraphs):
        save_subgraph_data(
            subgraph,
            product_prices,
            cross_product_prices,
            output_dir="data/clusters",
            prefix="cluster",
            subgraph_index=i + 1,
        )


if __name__ == "__main__":
    main()
