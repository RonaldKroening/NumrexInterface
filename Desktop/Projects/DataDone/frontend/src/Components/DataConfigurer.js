import React, { useState, useRef, useEffect } from 'react';
import '../styles/DataConfigurer.css';

class Change {
  constructor(column, row, oldVal) {
    this.column = column;
    this.row = row;
    this.oldVal = oldVal;
    this.newVal = "";
  }
  setNew(newVal) {
    this.newVal = newVal;
  }
}

const DataConfigurer = ({ dataset, setDataset, advance, name, setName, setTargetColumnMM }) => {
  const handleNameChange = (newName) => {
    setName(newName); 
  };

  const [selectedDataset, setSelectedDataset] = useState(dataset);
  const [problemType, setProblemType] = useState('classification');
  const [targetColumn, setTargetColumn] = useState('');

  const [interpolateColumns, setInterpolateColumns] = useState([]);
  const [showInterpolateColumns, setShowInterpolateColumns] = useState(false);
  const [interpolateThreshold, setInterpolateThreshold] = useState(50);
  const [interpolateMethod, setInterpolateMethod] = useState('linear');
  const [interpolateOrder, setInterpolateOrder] = useState(1);
  const [interpolateLimitDirection, setInterpolateLimitDirection] = useState('forward');
  
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [columnsToFix, setColumnsToFix] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [changes, setChanges] = useState([]);
  const [changeIndex, setChangeIndex] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [interpolateSelectAll, setInterpolateSelectAll] = useState(false);
  const [index, setIndex] = useState(0); 

  const inputRef = useRef(null);

  const validate = async () => {
    try {
      const response = await fetch('http:
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedDataset),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data = await response.json();
      console.log(data);
      console.log(data['message'], " and ",data.message);
      alert('Validation response: '+ data['message']);
      return data;
    } catch (error) {
      console.error('Error during validation:', error);
      alert('Validation failed: ' + error.message);
      return false;
    }
  };

  const toggleInter = () => {
    setShowInterpolateColumns(!showInterpolateColumns);
  };

  useEffect(() => {
    console.log("(dc) new file name: " + name);
  }, [name]);

  const validateData = () => {
    const isValid = Object.values(selectedDataset).every(
      (array) => array.length === Object.values(selectedDataset)[0].length
    );

    if (!isValid) {
      alert('Data validation failed: Arrays must be of equal length');
      return false;
    }

    console.log('Data validated successfully');
    return true;
  };

  const sortDatasetColumns = (dataset, columnsToKeep) => {
    return Object.keys(dataset).reduce((acc, column) => {
      if (columnsToKeep.includes(column)) {
        acc[column] = dataset[column];
      }
      return acc;
    }, {});
  };

  const handleFixData = () => {
    setShowCheckboxes(!showCheckboxes);
  };

  const fixData = () => {
    if (columnsToFix.length === 0) {
      alert('Please select at least one column to keep');
      return;
    }

    const newDataset = sortDatasetColumns(selectedDataset, columnsToFix);
    updateDataset(newDataset);
    setShowCheckboxes(false);
  };

  const updateDataset = (newDataset) => {
    setSelectedDataset(newDataset);
    if (setDataset) {
      setDataset(newDataset); 
    }
  };

  const handleUndo = () => {
    if (changeIndex > 0) {
      const prevChange = changes[changeIndex - 1];
      const updatedDataset = { ...selectedDataset };

      if (prevChange.cell === 'all') {
        updateDataset(prevChange.oldDataset);
      } else {
        const { column, row, oldValue } = prevChange;
        updatedDataset[column][row] = oldValue;
        updateDataset(updatedDataset);
      }

      setChangeIndex(changeIndex - 1);
    }
  };

  const handleRedo = () => {
    if (changeIndex < changes.length) {
      const nextChange = changes[changeIndex];
      const updatedDataset = { ...selectedDataset };

      if (nextChange.cell === 'all') {
        updateDataset(nextChange.newDataset);
      } else {
        const { column, row, newValue } = nextChange;
        updatedDataset[column][row] = newValue;
        updateDataset(updatedDataset);
      }

      setChangeIndex(changeIndex + 1);
    }
  };

  const addChange = (column, row, oldValue, newValue) => {
    const newChanges = [
      ...changes.slice(0, changeIndex),
      {
        column,
        row,
        oldValue,
        newValue,
        cell: row !== undefined ? `${row} ${column}` : 'all',
      },
    ];

    setChanges(newChanges);
    setChangeIndex(newChanges.length);
  };

  const handleCellDoubleClick = (columnKey, rowIndex) => {
    setEditingCell({ columnKey, rowIndex });
  };

  const handleCellChange = (columnKey, rowIndex, value) => {
    const oldValue = selectedDataset[columnKey][rowIndex];
    const newDataset = { ...selectedDataset };

    newDataset[columnKey][rowIndex] = value;

    addChange(columnKey, rowIndex, oldValue, value);
    updateDataset(newDataset);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleInterpolate = async () => {
    if (!showInterpolateColumns) {
      setShowInterpolateColumns(true);
      return;
    }

    if (interpolateColumns.length === 0) {
      alert('Please select at least one column to interpolate');
      return;
    }

    try {
      const response = await fetch('http:
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset: selectedDataset,
          columns: interpolateColumns,
          threshold: interpolateThreshold,
          method: interpolateMethod,
          order: interpolateOrder,
          limit_direction: interpolateLimitDirection,
        }),
      });

      if (!response.ok) {
        throw new Error('Interpolation failed');
      }

      const responseObj = await response.json();
      console.log("Interpolated Dataset: ", responseObj);
      const interpolatedDataset = responseObj.response;
      try {
        addChange('all', undefined, selectedDataset, interpolatedDataset);
        updateDataset(interpolatedDataset);
        setShowInterpolateColumns(false);
        setInterpolateColumns([]);
      } catch {
        console.log("No worko");
      }
    } catch (error) {
      console.error('Error during interpolation:', error);
      alert('Interpolation failed: ' + error.message);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setColumnsToFix([]);
    } else {
      setColumnsToFix([...Object.keys(selectedDataset)]);
    }
    setSelectAll(!selectAll);
  };

  const handleInterpolateSelectAll = () => {
    if (interpolateSelectAll) {
      setInterpolateColumns([]);
    } else {
      setInterpolateColumns([...Object.keys(selectedDataset)]);
    }
    setInterpolateSelectAll(!interpolateSelectAll);
  };

  const handleCheckboxChange = (column) => {
    setColumnsToFix((prev) => {
      const newColumns = prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column];
      setSelectAll(newColumns.length === Object.keys(selectedDataset).length);
      return newColumns;
    });
  };

  const handleInterpolateColumnChange = (column) => {
    setInterpolateColumns((prev) => {
      const newColumns = prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column];
      setInterpolateSelectAll(newColumns.length === Object.keys(selectedDataset).length);
      return newColumns;
    });
  };

  const columnsPerRow = 4;

  const createCheckboxRows = (columns) => {
    const rows = [];
    for (let i = 0; i < columns.length; i += columnsPerRow) {
      rows.push(columns.slice(i, i + columnsPerRow));
    }
    return rows;
  };

  const goToMakeModel = () => {
    if(targetColumn != ""){
      console.log('Navigating to model creation...');
      setTargetColumnMM(targetColumn);
      advance(1);
    }else{
      alert("Please select a target column");
    }
  };

  
  const handleIncrement = () => {
    setIndex((prevIndex) => prevIndex + 100);
  };

  
  const handleDecrement = () => {
    setIndex((prevIndex) => (prevIndex >= 100 ? prevIndex - 100 : 0));
  };

  function split_row(data, start, end) {
    if (!data || typeof data !== 'object') {
        return {};
    }

    const cols = Object.keys(data);
    const new_data = {};
    
    for (const key of cols) {
        const row = data[key];
        if (Array.isArray(row)) {
            const safeStart = Math.max(0, start);
            const safeEnd = Math.min(row.length, end + 1);
            if (safeStart < safeEnd) {
                new_data[key] = row.slice(safeStart, safeEnd);
            } else {
                new_data[key] = [];
            }
        } else {
            new_data[key] = row;
        }
    }
    
    return new_data;
  }

  console.log("dataset: ",selectedDataset);

  const rowsToShow = split_row(selectedDataset,index, index+100)
  
  console.log("rows to show: ",rowsToShow);
  return (
    <div className="dataconfigurer">
      <h2>Data Configuration</h2>

      <div className="input-container">
        <label className="dacon-lbl" htmlFor="problemType">Select Problem Type: </label>
        <select
          id="problemType"
          value={problemType}
          className='label-cl'
          onChange={(e) => setProblemType(e.target.value)}
        >
          <option value="classification">Classification</option>
          <option value="prediction">Prediction</option>
          <option value="regression">Regression</option>
        </select>
      </div>

      <div className="input-container">
        <label className="dacon-lbl" htmlFor="targetColumn">Select Target Column: </label>
        <select
          id="targetColumn"
          className='select-cl'
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
        >
          <option value="">--Select--</option>
          {Object.keys(selectedDataset).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>

      <div className="button-group">
        <button className="dacon-btn" onClick={validate}>Validate</button>
        <button className="dacon-btn" onClick={handleFixData}>Fix Data</button>
        <button className="dacon-btn" onClick={handleUndo}>Undo</button>
        <button className="dacon-btn" onClick={handleRedo}>Redo</button>
      </div>

      {showCheckboxes && (
        <div className="checkbox-container">
          <h3>Select Columns to Keep:</h3>
          <div className="checkbox-grid">
            {createCheckboxRows(Object.keys(selectedDataset)).map((row, rowIndex) => (
              <div key={rowIndex} className="checkbox-row">
                {row.map((column) => (
                  <div key={column} className="checkbox-item">
                    <label className="col-lab" htmlFor={column}>
                      {column}
                    </label>
                    <input
                      type="checkbox"
                      id={column}
                      checked={columnsToFix.includes(column)}
                      onChange={() => handleCheckboxChange(column)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button onClick={fixData}>Set Columns</button>
        </div>
      )}

      <div className="interpolate-container">
        <label className="dacon-lbl" htmlFor="interpolateThreshold">Interpolate Threshold: </label>
        <input
          type="range"
          id="interpolateThreshold"
          min="0"
          max="100"
          step="1"
          value={interpolateThreshold}
          onChange={(e) => setInterpolateThreshold(Number(e.target.value))}
        />
        <span>{interpolateThreshold}</span>
        <button className="dacon-btn" id="interButton" onClick={toggleInter}>
          Interpolate
        </button>
      </div>

      {showInterpolateColumns && (
        <div className="checkbox-container">
          <div className="inter-args">
            <div className="cols-to-inter">
              <h3>Select Columns to Interpolate:</h3>
              <button className="dacon-btn" onClick={handleInterpolateSelectAll} className="select-all-button">
                {interpolateSelectAll ? 'Deselect All' : 'Select All'}
              </button>
              <div className="checkbox-grid">
                {Object.keys(selectedDataset).map((column) => (
                  <div key={column} className="checkbox-item">
                    <button
                      className={interpolateColumns.includes(column) ? 'selected' : ''}
                      onClick={() => handleInterpolateColumnChange(column)}
                    >
                      {column}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="interpolate-options">
              <div className="arg-div">
                <label htmlFor="interpolateMethod">Method: </label>
                <select
                  id="interpolateMethod"
                  value={interpolateMethod}
                  onChange={(e) => setInterpolateMethod(e.target.value)}
                >
                  <option value="linear">Linear</option>
                  <option value="polynomial">Polynomial</option>
                  <option value="spline">Spline</option>
                </select>
              </div>
              <div className="arg-div">
                <label htmlFor="interpolateOrder">Order: </label>
                <input
                  type="number"
                  id="interpolateOrder"
                  value={interpolateOrder}
                  onChange={(e) => setInterpolateOrder(Number(e.target.value))}
                  min="1"
                  max="5"
                />
              </div>
              <div className="arg-div">
                <label htmlFor="interpolateLimitDirection">Limit Direction: </label>
                <select
                  id="interpolateLimitDirection"
                  value={interpolateLimitDirection}
                  onChange={(e) => setInterpolateLimitDirection(e.target.value)}
                >
                  <option value="forward">Forward</option>
                  <option value="backward">Backward</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>
          <button className="dacon-btn" onClick={handleInterpolate}>Apply Interpolation</button>
        </div>
      )}


      <div className="table-navigation">
        <button className="dacon-btn" onClick={handleDecrement} disabled={index === 0}>
          &lt; Previous 100
        </button>
        <button className="dacon-btn" onClick={handleIncrement}>
          Next 100 &gt;
        </button>
      </div>
      <br></br>
      <caption onChange={(e) => handleNameChange(e.target.value)} className='dacon-cap'>
            {name}
          </caption>
      <div className="scroll-view" style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto', maxWidth:'100%' }}>
        <table>
          
          <thead>
            <tr>
              {Object.keys(selectedDataset).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(rowsToShow).length > 0 && 
              Object.values(rowsToShow)[0].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(rowsToShow).map((key) => (
                    <td key={`${key}-${rowIndex}`}>
                      {editingCell && editingCell.columnKey === key && editingCell.rowIndex === rowIndex + index ? (
                        <input
                          ref={inputRef}
                          type="text"
                          className='table-input'
                          value={rowsToShow[key][rowIndex] ?? ""}
                          onChange={(e) => handleCellChange(key, rowIndex + index, e.target.value)}
                          onBlur={() => handleCellBlur(key, rowIndex + index)}
                          autoFocus
                        />
                      ) : (
                        <span onDoubleClick={() => handleCellDoubleClick(key, rowIndex + index)}>
                          {rowsToShow[key][rowIndex]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <button className="dacon-btn" onClick={goToMakeModel}>
        Make Model
      </button>
    </div>
  );
};

export default DataConfigurer;