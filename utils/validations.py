# Check if all the expected products are present in the solution
def check_expected_products_list(sample, expected_products):
    present_products = {
        int(var.split("_")[0][1:]) for var, value in sample.items() if value == 1
    }
    missing_products = [
        product for product in expected_products if product not in present_products
    ]

    return len(missing_products) == 0, missing_products


# Check if each product has exactly one price
def check_price_selection_constraints(sample):
    product_to_prices = {}

    for var, value in sample.items():
        if value == 1:
            product, price = var.split("_")
            product_id = int(product[1:])
            price_id = int(price[1:])
            product_to_prices.setdefault(product_id, []).append(price_id)

    invalid_products = {}

    for product, prices in product_to_prices.items():
        if len(prices) != 1:
            invalid_products[product] = prices

    return len(invalid_products) == 0, invalid_products
