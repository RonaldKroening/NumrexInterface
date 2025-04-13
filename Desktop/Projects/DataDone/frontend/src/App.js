import './App.css';
import React, { useState, useEffect } from 'react';
import DatasetPage from './Components/DatasetPage'; // Adjust the path if necessary
import DataConfigurer from './Components/DataConfigurer';
import ModelCreator from './Components/ModelCreator';
import AnalyticsPage from './Components/AnalyticsPage';

function App() {
  const [dataset, setDataset] = useState([]);
  const [stage, setStage] = useState(0);
  const [file_name, setFN] = useState("");
  const [results, setResults] = useState({});
  const [model, setModel] = useState({});
  const [modelFile, setModelFile] = useState(null);

  const example_dataset = {
    first: [1, 2, 3, 4, 5, 6],
    second: [9, 8, 7, 6, 5, 4],
    third: [3, 4, 9, 2, 5, 1],
    fourth: [10, 20, 62, 9, 12, 10],
  };
  const [target_column_mm, setTargetColumnMM] = useState("");

  function advance(n){
    console.log("Going to stage: ",stage+n);
    setStage(stage + n);
  }


  useEffect(() => {
    console.log("(App) new file name: " + file_name);
  }, [file_name]);

  return (
    <div className="App">

      {stage === 0 && (
        <DatasetPage setDataset={setDataset} setFN={setFN} advance={advance}/>
      )}

      {stage === 1 &&(
        <DataConfigurer
          dataset={dataset}
          setDataset={setDataset}
          advance={advance}
          name={file_name}
          setName={setFN} 
          setTargetColumnMM={setTargetColumnMM}
        />
      )}


      {stage === 2 && (
        <ModelCreator dataset={dataset} advance={advance} tgt={target_column_mm} setResults={setResults} setModel={setModel} setModelFile={setModelFile} />
      )}
      
      {stage === 3 && (
        <AnalyticsPage model={model} results={results} advance={advance} modelFile={modelFile}/>
      )}
      
    </div>
  );
}

export default App;