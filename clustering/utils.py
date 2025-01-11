import os
import csv
import networkx as nx


def determine_graph_limits(product_prices):
    # Calculate the total number of distinct products
    num_products = len(set(p[0] for p in product_prices))

    # Calculate the maximum number of prices per product
    max_prices_per_product = max(
        len([p for p in product_prices if p[0] == prod])
        for prod in set(p[0] for p in product_prices)
    )

    # Define the maximum allowable size of subgraphs based on the max prices per product
    if max_prices_per_product == 1:
        max_size = 175
    elif max_prices_per_product <= 2:
        max_size = 85
    elif max_prices_per_product <= 3:
        max_size = 55
    elif max_prices_per_product <= 4:
        max_size = 40
    elif max_prices_per_product <= 5:
        max_size = 35
    elif max_prices_per_product <= 7:
        max_size = 25
    elif max_prices_per_product <= 8:
        max_size = 20
    elif max_prices_per_product <= 11:
        max_size = 15
    elif max_prices_per_product <= 17:
        max_size = 10
    elif max_prices_per_product <= 35:
        max_size = 5
    else:
        raise ValueError(f"Too many prices per product.")

    return num_products, max_prices_per_product, max_size


# Build a NetworkX graph from the cross elasticities data
def build_graph_from_cross_elasticities(cross_product_prices):
    graph = nx.Graph()

    for (
        product_A,
        product_B,
        price_A,
    ), affected_margin_B in cross_product_prices.items():
        # Use the absolute value of the affected margin as the weight of the edge
        if graph.has_edge(product_A, product_B):
            graph[product_A][product_B]["weight"] += abs(affected_margin_B)
        else:
            graph.add_edge(product_A, product_B, weight=abs(affected_margin_B))

    return graph


# Split a graph into smaller subgraphs
def split_graph_to_subgraphs(graph, num_subgraphs):
    subgraphs = []
    nodes = list(graph.nodes())
    chunk_size = len(nodes) // num_subgraphs

    for i in range(num_subgraphs):
        chunk_nodes = nodes[i * chunk_size : (i + 1) * chunk_size]
        subgraph = graph.subgraph(chunk_nodes).copy()
        subgraphs.append(subgraph)

    return subgraphs


# Save the data of a subgraph to the corresponding files
def save_subgraph_data(
    subgraph, product_prices, cross_product_prices, output_dir, prefix, subgraph_index
):
    # Create the output directory if it does not exist
    os.makedirs(output_dir, exist_ok=True)

    # Filter the prices and cross elasticities to include only the products in the subgraph
    subgraph_nodes = set(subgraph.nodes())
    filtered_prices = [
        (product, price, int(margin))
        for (product, price), margin in product_prices.items()
        if product in subgraph_nodes
    ]
    filtered_cross_elasticities = [
        (product_A, product_B, price_A, affected_margin_B)
        for (
            product_A,
            product_B,
            price_A,
        ), affected_margin_B in cross_product_prices.items()
        if product_A in subgraph_nodes and product_B in subgraph_nodes
    ]

    # Save the filtered prices and cross elasticities to CSV files
    prices_file = os.path.join(
        output_dir, f"{prefix}_subgraph{subgraph_index}_elasticity_prices.csv"
    )
    cross_elasticity_file = os.path.join(
        output_dir, f"{prefix}_subgraph{subgraph_index}_cross_elasticity_prices.csv"
    )

    with open(prices_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["product", "price", "margin_of_sales"])
        writer.writerows(filtered_prices)

    with open(cross_elasticity_file, "w", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(
            ["product_A", "affected_product_B", "price_A", "affected_margin_B"]
        )
        writer.writerows(filtered_cross_elasticities)
