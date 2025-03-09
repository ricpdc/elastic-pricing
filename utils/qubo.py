# Validates the size of the QUBO matrix before sending it to the quantum solver.
def validate_qubo_size(Q, max_variables, max_connections):
    num_variables = len({var for interaction in Q for var in interaction})
    num_connections = len(Q)

    if num_variables > max_variables:
        return False

    if num_connections > max_connections:
        return False

    return True
