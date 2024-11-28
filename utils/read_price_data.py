import csv


# Read price data from CSV files
def read_price_data(prices_file, cross_elasticity_file):
    product_prices = {}
    cross_product_prices = {}
    min_margins = {}

    # Read product prices and margins
    with open(prices_file, newline="") as csvfile:
        csv_reader = csv.reader(csvfile, delimiter=";")

        # Skip header row if it exists
        next(csv_reader, None)

        for row in csv_reader:
            product, price, margin = int(row[0]), int(row[1]), float(row[2])
            product_prices[(product, price)] = margin

            if product in min_margins:
                min_margins[product] = min(min_margins[product], margin)
            else:
                min_margins[product] = margin

    # Read cross-price elasticities
    with open(cross_elasticity_file, newline="") as csvfile:
        csv_reader = csv.reader(csvfile, delimiter=";")

        # Skip header row if it exists
        next(csv_reader, None)

        for row in csv_reader:
            product_A, product_B, price_A, affected_margin_B = (
                int(row[0]),
                int(row[1]),
                int(row[2]),
                float(row[3]),
            )
            cross_product_prices[(product_A, product_B, price_A)] = affected_margin_B

    return product_prices, cross_product_prices, min_margins
