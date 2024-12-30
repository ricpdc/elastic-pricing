# Validates the size of the QUBO matrix before sending it to the quantum solver.
def validate_qubo_size(Q, max_variables, max_connections):
    num_variables = len({var for interaction in Q for var in interaction})
    num_connections = len(Q)

    print(f"QUBO size: {num_variables} variables, {num_connections} connections")

    if num_variables > max_variables:
        print(
            f"Error: Number of variables ({num_variables}) exceeds the maximum allowed ({max_variables})."
        )
        return False

    if num_connections > max_connections:
        print(
            f"Error: Number of connections ({num_connections}) exceeds the maximum allowed ({max_connections})."
        )
        return False

    return True
