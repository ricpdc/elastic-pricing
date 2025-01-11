import networkx as nx


# Apply kernighan_lin_bisection to partition a graph into two subgraphs
def kernighan_lin_clustering(graph, max_size):
    subgraphs = []
    queue = [graph]

    while queue:
        current_graph = queue.pop(0)

        # If the current graph is smaller than the maximum size, we add it to the list of subgraphs
        if len(current_graph) <= max_size:
            subgraphs.append(current_graph)
            continue

        # Otherwise, we partition the graph into two subgraphs
        partition = nx.algorithms.community.kernighan_lin_bisection(current_graph)
        subgraph1 = current_graph.subgraph(partition[0]).copy()
        subgraph2 = current_graph.subgraph(partition[1]).copy()

        queue.extend([subgraph1, subgraph2])

    return subgraphs
