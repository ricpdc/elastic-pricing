from collections import defaultdict


# Build QUBO matrix
def build_qubo_matrix(
    product_prices,
    cross_product_prices,
    min_margins,
    lambda_rule1=1,
    lambda_rule2=5000,
    lambda_rule3=1,
    lambda_rule4=1000,
):
    Q = defaultdict(int)

    product_ids = set(key[0] for key in product_prices.keys())
    price_ids = set(key[1] for key in product_prices.keys())

    # Rule 1: Maximize margins
    for (i, p), margin in product_prices.items():
        var = f"i{i}_p{p}"
        Q[(var, var)] -= lambda_rule1 * (margin - min_margins[i])

    # Rule 2: Price uniqueness
    for i in product_ids:
        product_vars = [f"i{i}_p{p}" for p in price_ids if (i, p) in product_prices]

        for var1 in product_vars:
            for var2 in product_vars:
                if var1 != var2:
                    Q[(var1, var2)] += lambda_rule2

    # Rule 3: Elasticity is introduced
    for i1, i2, p in cross_product_prices:
        if (i1, p) in product_prices:
            margin_percentage = cross_product_prices[(i1, i2, p)]
            for p2 in price_ids:
                if (i2, p2) in product_prices:
                    var1 = f"i{i1}_p{p}"
                    var2 = f"i{i2}_p{p2}"
                    Q[(var1, var2)] -= (
                        lambda_rule3
                        * product_prices[(i2, p2)]
                        * margin_percentage
                        / 100
                    )

    # Rule 4: Force each product to have a price
    for i in product_ids:
        product_vars = [f"i{i}_p{p}" for p in price_ids if (i, p) in product_prices]

        for var1 in product_vars:
            Q[(var1, var1)] -= lambda_rule4

    return Q
