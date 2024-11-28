from itertools import product
from utils import read_price_data


def calculate_margin_with_restriction(
    solution, product_prices, cross_product_prices, lambda_force_price=500
):
    total_margin = 0

    # Add the margins for the selected products and prices
    for product, price in solution.items():
        margin = product_prices.get((product, price), 0)
        total_margin += margin

    # Penalize the solution if a product does not have a price
    if None in solution.values():
        total_margin -= lambda_force_price

    # Apply the cross-elasticity constraints
    for (prod_A, prod_B, price_A), impact in cross_product_prices.items():
        if solution.get(prod_A) == price_A and prod_B in solution:
            price_B = solution[prod_B]
            affected_margin = product_prices.get((prod_B, price_B), 0)

            total_margin += affected_margin * impact / 100

    return total_margin


def classical_solver_with_restriction(
    product_prices, cross_product_prices, price_ids, lambda_force_price=500
):
    products = {key[0] for key in product_prices.keys()}
    best_solution = None
    best_margin = float("-inf")

    # Generate all possible combinations of prices
    all_combinations = product(price_ids, repeat=len(products))

    for combination in all_combinations:
        # Create a solution dictionary with the current combination
        solution = {product: price for product, price in zip(products, combination)}

        # Calculate the margin for the current solution
        margin = calculate_margin_with_restriction(
            solution, product_prices, cross_product_prices, lambda_force_price
        )

        # Update the best solution if the current margin is better
        if margin > best_margin:
            best_margin = margin
            best_solution = solution

    return best_solution, best_margin


if __name__ == "__main__":
    prices_file = "data/elasticity_prices.csv"
    cross_elasticity_file = "data/cross_elasticity_prices.csv"

    # Read price data from CSV files
    product_prices, cross_product_prices, min_margins = read_price_data(
        prices_file, cross_elasticity_file
    )

    price_ids = list({key[1] for key in product_prices.keys()})

    solution, margin = classical_solver_with_restriction(
        product_prices, cross_product_prices, price_ids
    )

    print("Better solution:", solution)
    print("Maximum margin:", margin)
