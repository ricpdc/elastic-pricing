import pandas as pd
import argparse


def calcular_margen_total(ruta_solutions, ruta_elasticidades):
    solutions_df = pd.read_csv(ruta_solutions, sep=";")
    elasticidades_df = pd.read_csv(ruta_elasticidades, sep=";")

    def parse_price(price_str):
        if pd.isna(price_str) or price_str in ("", "-1", None):
            return 1
        if isinstance(price_str, str) and "," in price_str:
            return int(price_str.split(",")[0])
        try:
            return int(price_str)
        except:
            return 1

    solutions_df["price"] = solutions_df["price"].apply(parse_price)

    merged_df = pd.merge(
        solutions_df[["product", "price"]],
        elasticidades_df,
        on=["product", "price"],
        how="left",
    )

    return merged_df["margin_of_sales"].sum()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Calcula el margen total de ventas.")
    parser.add_argument(
        "ruta_solutions", type=str, help="Ruta al archivo solutions.csv"
    )
    parser.add_argument(
        "ruta_elasticidades",
        type=str,
        help="Ruta al archivo simulated_elasticity_prices.csv",
    )
    args = parser.parse_args()

    margen_total = calcular_margen_total(args.ruta_solutions, args.ruta_elasticidades)
    print(margen_total)
