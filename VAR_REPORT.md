# Value At Risk (VAR) Methodology

The Value at Risk (VAR) metric tracks the total monetary volume of trade traffic currently in the network.

- **ALL TRAFFIC:** Baseline calculation of 800 active nodes.
- **Filters:** When a filter (e.g., Customs Hold) is applied, the backend API recalculates the `total_shipments` (active traces) and aggregates the total value (USD) based on the filtered node set.
- **Data Source:** Synthetic mapping of high-risk versus cleared container valuations, mimicking UN Comtrade data structures.