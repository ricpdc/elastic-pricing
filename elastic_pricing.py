from utils import read_price_data, build_qubo_matrix, solve_qubo_model
from utils import check_expected_products_list, check_price_selection_constraints


def main():
    # Data files
    prices_file = "data/elasticity_prices.csv"
    cross_elasticity_file = "data/cross_elasticity_prices.csv"

    # Read price data from CSV files
    product_prices, cross_product_prices, min_margins = read_price_data(
        prices_file, cross_elasticity_file
    )

    # Build the QUBO matrix
    Q = build_qubo_matrix(product_prices, cross_product_prices, min_margins)

    # Solve the QUBO model
    result = solve_qubo_model(Q)

    # Print the result
    print(result.first)

    # Validate the result
    sample = result.first.sample

    # Check if the solution contains all the expected products
    is_valid, missing_products = check_expected_products_list(
        sample, [key[0] for key in product_prices.keys()]
    )

    if is_valid:
        print("All products are present in the solution.")
    else:
        print(f"Missing products: {missing_products}")

    # Check if the solution satisfies the price selection constraints
    is_valid, invalid_products = check_price_selection_constraints(sample)

    if is_valid:
        print("All products have exactly one price.")
    else:
        print(f"Invalid products prices: {invalid_products}")


if __name__ == "__main__":
    main()
