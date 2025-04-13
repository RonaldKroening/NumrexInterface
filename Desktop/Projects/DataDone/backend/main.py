from flask import Flask, request, jsonify, render_template
import pandas as pd
import numpy as np
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS  
from io import StringIO, BytesIO
import json 
import os
import math  
import pandas as pd
import data_functions as dfuncs
import traceback
import pandas as pd
from io import StringIO, BytesIO


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.WARNING)

app = Flask(__name__)
CORS(app, origins="*", supports_credentials=True)
@app.route('/upload', methods=['POST'])  
def upload():
    try:
        
        if 'file' not in request.files:
            logger.error("No file part in the request")
            return jsonify({"error": "No file part in the request"}), 400

        file = request.files['file']

        
        if file.filename == '':
            logger.error("No file selected")
            return jsonify({"error": "No file selected"}), 400

        
        if not allowed_file(file.filename):
            logger.error("File type not allowed")
            return jsonify({"error": "File type not allowed"}), 400

        logger.info("File '%s' uploaded successfully", file.filename)

        
        df = file_to_dataframe(file)
        
        df = df.where(pd.notnull(df), None)

        
        file_data = strip_df(df)

        return jsonify({
            "message": f"File '{file.filename}' processed successfully",
            "data": file_data
        }), 200

    except Exception as e:
        logger.error("File upload error: %s", str(e), exc_info=True)
        return jsonify({"error": f"File processing error: {str(e)}"}), 500

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'json'}  
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def isValid(dataset):
    return True

@app.route('/')
def home():
    logger.info("Home endpoint accessed")
    return "Welcome to the Flask app!"

@app.route('/validate', methods=['POST'])
def validate():

    try:
        data = request.json
        logger.debug("Received data for validation: %s", data)
        if not data:
            logger.error("No data provided for validation")
            return jsonify({"error": "No data provided"}), 400
        
        df = data_to_pd(data)
        if df is None:
            logger.error("Failed to convert data to DataFrame")
            return jsonify({"error": "Failed to convert data to DataFrame"}), 400

        if df.isna().any().any():
            nan_cols = df.columns[df.isna().any()].tolist()
            logger.error("NaN values found in columns: %s", nan_cols)
            return jsonify({
                "error": "NaN values found",
                "columns_with_nan": nan_cols
            }), 400

        lengths = set(len(arr) for arr in data.values())
        logger.info("Data validation successful")
        return jsonify({
            "message": "Data is valid!",
            "details": {
                "columns": list(df.columns),
                "rows": len(df),
                "dtypes": df.dtypes.astype(str).to_dict()
            }
        }), 200
        
    except Exception as e:
        logger.error("Validation error: %s", str(e), exc_info=True)
        return jsonify({"error": f"Validation error: {str(e)}"}), 400


def file_to_dataframe(file):
    """
    Convert an uploaded file into a Pandas DataFrame.

    Args:
        file (FileStorage): The file object uploaded via Flask.

    Returns:
        pd.DataFrame: The DataFrame created from the file.
    """
    try:
        
        filename = file.filename
        if not filename:
            raise ValueError("No filename provided")

        file_extension = filename.split('.')[-1].lower()

        
        if file_extension == 'csv':
            
            df = pd.read_csv(file)
        elif file_extension in ['xls', 'xlsx']:
            
            df = pd.read_excel(file)
        elif file_extension == 'json':
            
            df = pd.read_json(file)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

        return df

    except Exception as e:
        raise ValueError(f"Error processing file: {str(e)}")

@app.route('/info_file', methods=['GET'])
def get_model_info_file():
    with open("info.json", "r") as file:
        data = json.load(file)
    return data

def data_to_pd(jd):
    try:
        df = pd.DataFrame(jd)
        lengths = [len(arr) for arr in jd.values()]
        if len(set(lengths)) > 1:
            logger.error("Error converting data: Different column lengths")
            return None
        return df
    except Exception as e:
        logger.error("Error converting data to DataFrame: %s", str(e), exc_info=True)
        return None

def int_data(df, me, o, limit_dir):
    new_df = df.copy()
    new_df.interpolate(method=me, order=o, inplace=True, limit_direction=limit_dir, axis=0)
    return new_df

def format_nones(arr):
    new_arr = []
    
    
    if hasattr(arr, 'values'):  
        arr = arr.values
    
    for item in arr:
        
        if isinstance(item, (float, int)) and math.isnan(item):
            new_arr.append(None)
        
        elif pd.isna(item):
            new_arr.append(None)
        
        else:
            new_arr.append(item)
    
    return new_arr

def strip_df(df):
    cols = list(df.columns)
    ret = {}
    for col in cols:
        items = list(df[col])
        
        ret[col] = format_nones(items)

    return ret

@app.route('/interpolate', methods=['POST'])
def interpolate():
    try:
        data = request.json
        logger.debug("Interpolation input data: %s", data)
        json_data = data["dataset"]
        prepared_df = data_to_pd(json_data)
        method = data["method"]
        order = data["order"]
        limit_direction = data["limit_direction"]
        
        new_df = int_data(prepared_df, method, order, limit_direction)
        
        resp_obj = {}
        for col in new_df.columns:
            resp_obj[col] = list(new_df[col])
        
        logger.info("Interpolation successful")
        return jsonify({"response": resp_obj}), 200
    except Exception as e:
        logger.error("Interpolation error: %s", str(e), exc_info=True)
        return jsonify({"error": f"Interpolation error: {str(e)}"}), 400

def convert_to_serializable(obj):
    if hasattr(obj, 'tolist'):  
        return obj.tolist()
    elif isinstance(obj, (int, float, str, bool, type(None))):
        return obj
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(item) for item in obj]
    else:
        return str(obj)  


@app.route('/run', methods=['POST'])
def run():

    args = request.get_json()  
    if not args:
        return jsonify({"error": "Invalid JSON data"}), 400
    
    try:
        tgt = args['target_column']
        df = data_to_pd(args["dataset"])
        
        
        if tgt not in df.columns:
            return jsonify({
                "error": f"Target column '{tgt}' not found in dataset"
            }), 400
            
        if len(df) < 10:  
            return jsonify({
                "error": "Dataset too small (minimum 10 rows required)"
            }), 400

        ret_data,modelFile = dfuncs.train_and_evaluate_model(args['model'],args["args"], df, tgt)
        return jsonify({
            "message": "Model trained successfully",
            "results": ret_data,
            "modelFile": modelFile,
        }), 200


    except Exception as e:
        logger.error("Unexpected error in model run: %s", str(e), exc_info=True)
        return jsonify({
            "error": f"Model training failed: {str(e)}",
            "trace": traceback.format_exc()
        }), 500

@app.route('/compatable', methods=['POST'])
def compatable():
    model_arc = request.json
    is_compatable = True
    resp = "Model is Valid"
    if(is_compatable == False):
        resp = "Model is not Valid"
    return jsonify({"response":is_compatable}), 200

if __name__ == '__main__':
    logger.info("Starting Flask app")
    app.run(host="0.0.0.0", port=8000, debug=False, use_reloader=False)