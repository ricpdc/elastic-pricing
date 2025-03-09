import pandas as pd
import sys
import json

# Read the input files
solutions_file = sys.argv[1]
prices_file = sys.argv[2]
elasticities_file = sys.argv[3]

df_solutions = pd.read_csv(solutions_file, delimiter=";")
df_prices = pd.read_csv(prices_file, delimiter=";")
df_elasticities = pd.read_csv(elasticities_file, delimiter=";")

# Merge the solutions and prices dataframes
df_merged = df_solutions.merge(
    df_prices, how="left", left_on=["product", "price"], right_on=["product", "price"]
)

# Initialize the adjusted margin column
df_merged["adjusted_margin"] = df_merged["margin_of_sales"]

# Update the adjusted margin based on the elasticities
for _, row in df_elasticities.iterrows():
    affected_product = row["affected_product_B"]
    if affected_product in df_merged["product"].values:
        df_merged.loc[
            df_merged["product"] == affected_product, "adjusted_margin"
        ] *= 1 + (row["affected_margin_B"] / 100)

# Calculate the total expected margin
total_expected_margin = df_merged["adjusted_margin"].sum()

# Prepare the output
results = df_merged[["product", "price", "cluster", "adjusted_margin"]].to_dict(
    orient="records"
)
output = {"results": results, "total_expected_margin": total_expected_margin}

print(json.dumps(output))
