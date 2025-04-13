import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import json
import numpy as np


def preprocess_data(df, target, model_type='ann'):
    X = df.drop(columns=[target])
    y = df[target].copy()

    numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns
    
    numerical_transformer = StandardScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore')
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_cols),
            ('cat', categorical_transformer, categorical_cols)
        ])

    X_processed = preprocessor.fit_transform(X)
    
    if y.dtype == 'object' or pd.api.types.is_categorical_dtype(y):
        le = LabelEncoder()
        y_processed = le.fit_transform(y)
    else:
        y_processed = y.values
    
    num_classes = len(np.unique(y_processed))
    if num_classes == 2:
        loss_func = 'binary_crossentropy'
        if model_type != 'ann':
            y_processed = y_processed.ravel()
    elif num_classes > 2:
        loss_func = 'categorical_crossentropy'
        if model_type == 'ann':
            y_processed = to_categorical(y_processed)
    else:
        raise ValueError("Invalid number of classes in target variable")
    
    return X_processed, y_processed, loss_func


import pickle
from keras.models import save_model
import os

def create_model_from_json(model_type, json_config):
    model_type = model_type.lower()
    
    if model_type == 'ann':
        model = Sequential()
        if 'layers' in json_config:
            if(len(json_config['layers']) != 0):
                for i, layer in enumerate(json_config['layers']):
                    if layer['type'].lower() == 'dense':
                        kwargs = {
                            'units': int(layer['nodes']),
                            'activation': layer['activation']
                        }
                        if i == 0 and 'shape' in layer and layer['shape']:
                            kwargs['input_shape'] = (int(layer['shape']),)
                        model.add(Dense(**kwargs))
        
        if 'args' in json_config:
            model.compile(
                optimizer=json_config['args'].get('optimizer', 'adam'),
                loss=json_config['args'].get('loss', 'binary_crossentropy'),
                metrics=['accuracy']
            )
        return model
    
    elif model_type == 'logistic_reg':
        return LogisticRegression(
            C=float(json_config.get('C', 1.0)),
            max_iter=int(json_config.get('max_iter', 100))
        )
    
    elif model_type == 'rand_for':
        return RandomForestClassifier(
            n_estimators=int(json_config.get('num_trees', 100)),
            max_depth=int(json_config.get('max_depth', None)),
            random_state=42
        )
    
    else:
        raise ValueError(f"Unknown model type: {model_type}")

def save_model_to_file(model, model_name, model_type):
    """Save the trained model to a file with appropriate format based on model type"""
    os.makedirs('saved_models', exist_ok=True)
    filename = f"saved_models/{model_name}_{model_type}"
    
    if model_type.lower() == 'ann':
        # Save Keras model in HDF5 format
        model_filename = f"{filename}.h5"
        save_model(model, model_filename)
    else:
        # Save sklearn model using pickle
        model_filename = f"{filename}.pkl"
        with open(model_filename, 'wb') as f:
            pickle.dump(model, f)
    
    return model_filename

def train_and_evaluate_model(modelName, config, data, target, save_model_flag=True):
    X, y, loss_func = preprocess_data(data, target)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = create_model_from_json(modelName, config)
    results = {
        "model_type": modelName,
        "accuracy": None
    }

    if modelName.lower() == 'ann':
        history = model.fit(
            X_train, 
            y_train,
            validation_data=(X_test, y_test),
            epochs=50,
            batch_size=32,
            verbose=1
        )
        loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
        y_pred_test = model.predict(X_test)
        y_pred_train = model.predict(X_train)
        

        if loss_func == 'binary_crossentropy':
            y_pred_test_classes = (y_pred_test > 0.5).astype(int).flatten()
            y_pred_train_classes = (y_pred_train > 0.5).astype(int).flatten()
        else:
            y_pred_test_classes = np.argmax(y_pred_test, axis=1)
            y_pred_train_classes = np.argmax(y_pred_train, axis=1)
            
    else:
        model.fit(X_train, y_train)
        y_pred_test = model.predict(X_test)
        y_pred_train = model.predict(X_train)
        y_pred_test_classes = y_pred_test
        y_pred_train_classes = y_pred_train
        accuracy = accuracy_score(y_test, y_pred_test)

    results= {
        "train": {
            "predicted": y_pred_train_classes.tolist(),
            "truth": y_train.tolist() if not hasattr(y_train, 'tolist') else y_train.tolist()
        },
        "test": {
            "predicted": y_pred_test_classes.tolist(),
            "truth": y_test.tolist() if not hasattr(y_test, 'tolist') else y_test.tolist()
        },
        "accuracy": float(accuracy) if modelName.lower() != 'ann' else float(accuracy_score(y_test, y_pred_test_classes))
    }

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred_test_classes)
    print(f'\nConfusion Matrix - {modelName}')
    print(f'Accuracy: {results["accuracy"]:.2f}')
    
    # Save the model to file if requested
    model_file = None
    if save_model_flag:
        model_file = save_model_to_file(model, "trained_model", modelName)
    
    return results, model_file
