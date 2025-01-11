import networkx as nx
import community as community_louvain
from sklearn.cluster import SpectralClustering
from collections import defaultdict
import numpy as np


# Find the optimal number of clusters using Elbow Method
def optimal_louvain_clusters(graph, max_clusters):
    modularities = []
    partition_sizes = []

    for resolution in np.linspace(0.1, 2.0, max_clusters):
        partition = community_louvain.best_partition(graph, resolution=resolution)
        modularity = community_louvain.modularity(partition, graph)
        modularities.append(modularity)
        partition_sizes.append(len(set(partition.values())))

    modularity_differences = np.diff(modularities)
    elbow_point = np.argmax(modularity_differences) + 1

    return partition_sizes[elbow_point]


# Louvain clustering
def louvain_clustering(graph, num_clusters):
    partition = community_louvain.best_partition(graph, resolution=1.0)
    communities = defaultdict(list)

    for node, community in partition.items():
        communities[community].append(node)

    while len(communities) > num_clusters:
        smallest = sorted(communities.items(), key=lambda x: len(x[1]))[:2]
        combined_nodes = smallest[0][1] + smallest[1][1]
        del communities[smallest[0][0]]
        communities[smallest[1][0]] = combined_nodes

    return communities


# Spectral clustering
def spectral_clustering(graph, max_size):
    subgraphs = [graph]  # Initial subgraph to process
    refined_subgraphs = []

    while subgraphs:
        subgraph = subgraphs.pop()

        if len(subgraph.nodes) > max_size:
            # Determine the number of clusters based on the subgraph size
            num_clusters = max(2, len(subgraph.nodes) // max_size)

            # Convert to adjacency matrix and apply Spectral clustering
            adjacency_matrix = nx.to_numpy_array(subgraph)
            clustering = SpectralClustering(
                n_clusters=num_clusters, affinity="precomputed", random_state=42
            )
            labels = clustering.fit_predict(adjacency_matrix)

            # Create new subgraphs based on the clusters
            subgraph_clusters = defaultdict(list)
            for node, label in zip(subgraph.nodes(), labels):
                subgraph_clusters[label].append(node)

            # Add new subgraphs to the list for processing
            for nodes in subgraph_clusters.values():
                subgraphs.append(subgraph.subgraph(nodes))
        else:
            # If the subgraph respects the limit, add it to the final result
            refined_subgraphs.append(subgraph)

    return refined_subgraphs


# Louvain-Spectral clustering
def louvain_spectral_clustering(graph, max_size, max_louvain_clusters):
    # Determining the optimal number of clusters for Louvain
    optimal_clusters = optimal_louvain_clusters(
        graph, max_clusters=max_louvain_clusters
    )

    # Apply Louvain clustering
    louvain_communities = louvain_clustering(graph, optimal_clusters)

    # Refine communities with Spectral clustering
    final_subgraphs = []
    for nodes in louvain_communities.values():
        subgraph = graph.subgraph(nodes)

        # Refine with Spectral clustering if it exceeds maximum size
        if len(subgraph.nodes) > max_size:
            refined_subgraphs = spectral_clustering(subgraph, max_size)
            final_subgraphs.extend(refined_subgraphs)
        else:
            final_subgraphs.append(subgraph)

    return final_subgraphs
