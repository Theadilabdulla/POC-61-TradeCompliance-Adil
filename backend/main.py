import json
import os
from fastapi import FastAPI, HTTPException

app = FastAPI()

# Dynamically resolve the path to data.json relative to this file
DATA_FILE_PATH = os.path.join(os.path.dirname(__file__), "data.json")

def load_network_metrics():
    """Reads and parses the data.json file."""
    if not os.path.exists(DATA_FILE_PATH):
        raise HTTPException(status_code=404, detail="Data file not found")
        
    with open(DATA_FILE_PATH, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Error decoding data file")

@app.get("/")
def read_root():
    return {"message": "Trade Compliance API is running."}

@app.get("/api/metrics")
def get_metrics():
    """
    Serves the synthetic network metrics dynamically loaded from data.json.
    """
    data = load_network_metrics()
    return data
