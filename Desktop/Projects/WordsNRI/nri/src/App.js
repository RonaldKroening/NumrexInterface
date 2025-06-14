import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [numrex, setNumrex] = useState({});
  const [positions, setPositions] = useState({});
  const [present, setPresent] = useState([]);
  const [max_size, setMax] = useState(0);
  const [chosen_size, setChosenSize] = useState(0);
  const [chosen_word, setChosenWord] = useState([]);
  const [search_results, setSearchResults] = useState([]);

  function update_position(index, value) {
    setPositions((prev) => ({
      ...prev,
      [index]: value,
    }));
    setChosenWord((prev) => {
      const newWord = [...prev];
      newWord[index] = value.toUpperCase();
      return newWord;
    });
  }

  function all_indexes(word,char){
    var ret = [];
    let l = 0;
    let r = word.length - 1;
    while (l <= r) {
      if (word[l] === char) {
        ret.push(l);
      }
      if (word[r] === char && r !== l) {
        ret.push(r);
      }
      l++;
      r--;
    }
    return ret;
  }

  function valid_word(word) {
    for (let i = 0; i < chosen_size; i++) {
      if (positions[i] && positions[i] !== word[i]) {
        return false; 
      }
    }
    for (let char of present) {
      if (!word.includes(char)) {
        return false;
      }
    }
    return true; 
  }

  function equality_mapping(word) {
    const mapping = {};
    for (let i = 0; i < word.length; i++) {
      const char = word[i].toUpperCase();
      if (char != '*' && char != ' '){

        if (!mapping[i]){
          mapping[i] = [];
        }
    
        for (let j = 0; j < word.length; j++) {
          if (i != j){ 
            if (word[j].toUpperCase() === char) {
              mapping[i].push(j);
            }
          }
        }
      }
    }
    return mapping;
  }

  function valid_key(key) {
    const check_word = chosen_word.map(char => (char == '' ? "*" : char));

    if (key.length !== check_word.length) return false;
  
    const word_map = equality_mapping(check_word);
  
    for (const i in word_map) {
      const current_char = key[i];
      for (const j of word_map[i]) {
        if (key[j] !== current_char) {
          return false;
        }
      }
    }
  
    return true;
  }

  function search() {
    const seen = [];
    let numrex_word = "";
    var possible_numrex_keys = Object.keys(numrex).filter(key => (key.length === chosen_size) && valid_key(key));
    var results = [];
    for(let possible_key of possible_numrex_keys) {
      if (numrex[possible_key].length > 0) {
        let options = numrex[possible_key].filter(word => valid_word(word));
        if (options.length > 0) {
          results.push(...options);
        }
      }
    }
    if (results.length > 0) {
      setSearchResults(results);
    }

  }
  
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/numrex_data.txt')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        console.log("Raw file content:", text);
        const lines = text.split(/\r?\n/);
        const numrexObj = {};
        let firstKey = "";
        let localMax = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const [key, ...values] = line.split(/\s+/);
          if (!firstKey) firstKey = key;

          for (let val of values) {
            localMax = Math.max(val.length, localMax);
          }

          numrexObj[key] = values;
        }
        console.log("Found ",Object.keys(numrexObj).length, " keys in numrex data."); 
        console.log(numrexObj);

        setNumrex(numrexObj);
        setMax(localMax);
      })
      .catch((error) => {
        console.error("Failed to load numrex data:", error);
      });
  }, []);

  useEffect(() => {
    if (chosen_size > 0) {
      setChosenWord(Array(chosen_size).fill(""));
      setPositions({});
    }
  }, [chosen_size]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>NumRex Interface</h1>
      </header>

      <p>NumRex has {Object.keys(numrex).length} entries loaded.</p>

      <h2>Search for Word</h2>
      <select value={chosen_size} onChange={(e) => setChosenSize(parseInt(e.target.value))}>
        <option value="">--Select--</option>
        {[...Array(max_size)].map((_, index) => (
          <option key={index} value={index + 1}>
            {index + 1}
          </option>
        ))}
      </select>

      <h3>Enter Characters in Place</h3>
      <div className="scroll_container">
        <div className="char_list">
          {[...Array(chosen_size)].map((_, index) => (
            <div className="char_box" key={index}>
              <h3 className="char_label">{index + 1}</h3>
              <input
                className="char_inp"
                maxLength={1}
                onChange={(e) => update_position(index, e.target.value)}
                value={positions[index] || ""}
              />
            </div>
          ))}
      </div>

      </div>

      <h3>Enter Other Characters Present</h3>
        <div className="checkbox-list">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((char) => (
            <label key={char} className="checkbox-item">
              <input
                type="checkbox"
                checked={present.includes(char)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPresent([...present, char]);
                  } else {
                    setPresent(present.filter((c) => c !== char));
                  }
                }}
              />
              {char}
            </label>
          ))}
        </div>
        <button className='searchBtn' onClick={search}>Search Words</button>
        <h3>{search_results.length} Search Results Found</h3>
        {
          
          search_results.length > 0 && (
            <div className="search-results">
              
              <div className='results-list'>
                {search_results.map((word, index) => (
                  <div key={index} className="result-item">
                    {word}
                  </div>
                ))}
              </div>
            </div>
        )}

    </div>
  );
}

export default App;
