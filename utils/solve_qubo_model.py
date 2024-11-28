from dimod import BinaryQuadraticModel
from dimod.reference.samplers import ExactSolver


# Solve the QUBO model using the specified solver
def solve_qubo_model(Q, offset=0, solver_type="exact"):
    bqm = BinaryQuadraticModel.from_qubo(Q, offset=offset)

    if solver_type == "exact":
        solver = ExactSolver()
    else:
        raise ValueError(f"Solver {solver_type} is not supported")

    result = solver.sample(bqm)
    return result
