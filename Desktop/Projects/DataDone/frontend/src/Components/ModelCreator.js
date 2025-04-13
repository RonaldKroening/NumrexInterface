import React, { useState, useEffect } from 'react';
import '../styles/ModelCreator.css';

const ModelCreator = ({ dataset, advance,tgt,setResults,setModel, setModelFile }) => {
  const [selectedModel, setSelectedModel] = useState(''); //default model
  const [layers, setLayers] = useState([]);
  const [modelData, setModelData] = useState({});
  const [modelInfo, setModelInfo] = useState({});
  const [model_type, setModelType] = useState("");
  const [file_data, setFileData] = useState({});
  const model_args = {
    "log_reg" : ["reg"],
    "rand_for" : ["num_trees","max_depth"],
    "ANN" : []
  }

  const model_names = {
    "rand_for" : "Random Forest",
    "log_reg" : "Logistic Regression",
    "lin_reg" : "Linear Regression", 
    "ANN" : "Artificial Neural Network"
  }
  
  useEffect(() => {
    // Check if file_data is empty
    if (Object.keys(file_data).length === 0) {
      console.log("setting new file data");
  
      // Fetch data from the API
      fetch("http://127.0.0.1:8000/info_file")
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
          }
          return response.json();
        })
        .then(data => {
          console.log("from info file: ", data);
          setFileData(data);
          console.log("setting rand for as default");
          setModelInfo(file_data["rand_for"]);
          console.log("Model Info: ", modelInfo);
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error);
        });
    }
    
  }, []); 

  useEffect(() => {
    if(file_data){
      if (Object.keys(file_data).length > 0) {
        if(Object.keys(file_data).includes(selectedModel)){
          console.log(file_data);
          setModelInfo(file_data[selectedModel]);
        }
      }
    }
  }, [selectedModel]); 


  const handleModelChange = (event) => {
    setLayers([]);
    const stat_models = ["rand_for","log_reg","lin_reg"];
    if(event.target.value == "ANN"){
      setModelType("network");
    }else if(stat_models.includes(event.target.value)){
      setModelType("statistical");
    }
    setSelectedModel(event.target.value);
  };

  const addLayer = () => {
    setLayers([...layers, { type: 'dense', nodes: '', shape: '', activation: 'relu' }]);
  };

  const deleteLayer = (index) => {
    const updatedLayers = layers.filter((_, i) => i !== index);
    setLayers(updatedLayers);
  };

  const handleLayerChange = (index, field, value) => {
    const updatedLayers = [...layers];
    updatedLayers[index][field] = value;
    setLayers(updatedLayers);
  };

  async function handleCreateModel(event) {
    if(selectedModel.endsWith("nn") || selectedModel.endsWith("NN")){
      modelData["layers"] = layers;
    }
    const requestData = {
      dataset: dataset,
      model: selectedModel,
      args: modelData,
      target_column: tgt,
    };
    const modItems = {
      model: model_names[selectedModel],
      args: modelData,
      target_column: tgt,
    };

    setModel(modItems);
    console.log("Sending Model Data: ", requestData);
    try {
      const response = await fetch('http://127.0.0.1:8000/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData), 
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseObj = await response.json();
      const res = responseObj["results"];
      const modelFile = responseObj["modelFile"];
      setModelFile(modelFile);
      console.log("Model Results-Now: ", res);

      setResults(res);
      advance(1);
    } catch (error) {
      console.error('Error during Model Creation:', error);
      alert('Model creation failed: ' + error.message);
      throw error;
    }
  }
  function change_arg(ty, field, value){
    modelData[field] = value;
    console.log(field," ",value);
  }
  const handleComp = async () => {

    for (var key of Object.keys(modelData)) {
      if (!model_args[selectedModel].includes(key)) {
          delete modelData[key];
      }
    }
    console.log(modelData);

    var model_params = {
      "name" : selectedModel,
      "args" : modelData,
    }

    if(model_type == "network"){
      model_params["layers"] = layers;
    }
    console.log("Model Arguments: ",model_params);
    try {
      const response = await fetch('http://127.0.0.1:8000/compatable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelData,
        }),
      });

      if (!response.ok) {
        throw new Error('Compatibility check failed');
      }

      const responseObj = await response.json();
      if(responseObj.response == true){
        alert('Your model is compatable!');
      }else{
        alert('Your model is not compatable. Please check arguments and try again.');   
      }
      
    } catch (error) {
      console.error('Error during Compatibility Test:', error);
      alert('Compatibility check failed: ' + error.message);
    }
  };

  return (
    <div className="all">
      <button className="mdl-ctr-bck-btn" onClick={() => advance(-1)}>Back</button>
      <div className="main-holder">
        {modelInfo && Object.keys(modelInfo).length > 0 && (
          <div className="model-info-holder">
            <h1 id="model-name">{modelInfo?.name || ""}</h1>
            <p id="model-desc">{modelInfo?.description || ""}</p>
            <p id="model-apps">{modelInfo?.use_statement || ""}</p>
            <table>
              <thead className="th-mod">
                <tr>
                  <th>Advantages</th>
                  <th>Disadvantages</th>
                </tr>
              </thead>
              <tbody>
                {modelInfo?.advantages && modelInfo?.disadvantages &&
                  Array.from({ length: Math.max(modelInfo.advantages.length, modelInfo.disadvantages.length) }).map((_, i) => (
                    <tr key={i}>
                      <td>{modelInfo.advantages[i] || ""}</td>
                      <td>{modelInfo.disadvantages[i] || ""}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
  
        <div className="model-container">
          <h1>Model Creator</h1>
          <div className="model-arg-hdr">
            <label>Select Model:</label>
            <select value={selectedModel} onChange={handleModelChange}>
              <option value="">Select Model</option>
              <option value="rand_for">Random Forest</option>
              <option value="log_reg">Logistic Regression</option>
              <option value="lin_reg">Linear Regression</option>
              <option value="ANN">Artificial Neural Network</option>
            </select>
  
            <label>Model Arguments</label>
            <div className="model-args">
              {selectedModel === "rand_for" && (
                <>
                  <label>Number of Trees:</label>
                  <input type="number" min="1" max="100" onChange={(e) => change_arg("rand_for", "num_trees", e.target.value)} />
                  <label>Max Depth:</label>
                  <input type="number" min="1" max="100" onChange={(e) => change_arg("rand_for", "max_depth", e.target.value)} />
                </>
              )}
  
              {selectedModel === "log_reg" && (
                <>
                  <label>Regularization:</label>
                  <input type="number" min="0" max="1" onChange={(e) => change_arg("log_reg", "reg", e.target.value)} />
                </>
              )}
  
              {selectedModel === "ANN" && (
                <>
                  <label>Layers:</label>
                  <div className="nn-layers">
                    {layers.map((layer, index) => (
                      <div key={index} className="nn-layer">
                        <select value={layer.type} onChange={(e) => handleLayerChange(index, "type", e.target.value)}>
                          <option value="dense">Dense</option>
                        </select>
                        <input type="number" min="1" max="10000" value={layer.nodes} onChange={(e) => handleLayerChange(index, "nodes", e.target.value)} placeholder="Nodes" />
                        {index === 0 && (
                          <input type="text" value={layer.shape} onChange={(e) => handleLayerChange(index, "shape", e.target.value)} placeholder="Input Shape" />
                        )}
                        <select value={layer.activation} onChange={(e) => handleLayerChange(index, "activation", e.target.value)}>
                          <option value="relu">Relu</option>
                          <option value="softmax">Softmax</option>
                          <option value="tanh">Tanh</option>
                        </select>
                        <button className="nn-but" type="button" onClick={() => deleteLayer(index)}>Delete</button>
                      </div>
                    ))}
                    <button type="button" onClick={addLayer}>Add Layer</button>
                  </div>
                </>
              )}
            </div>
            <button id="mc-compat-but" onClick={handleComp}>Check Model Compatibility</button>
          </div>
        </div>
      </div>
      <button className="mdl-run-btn" onClick={handleCreateModel}>Run Model</button>
    </div>
  );
}

export default ModelCreator;