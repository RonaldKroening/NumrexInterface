import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const computeMetrics = (y_true, y_pred) => {
  let tp = 0, tn = 0, fp = 0, fn = 0;

  y_true.forEach((trueVal, i) => {
    const predVal = y_pred[i];
    if (trueVal === 1 && predVal === 1) tp++;
    else if (trueVal === 0 && predVal === 0) tn++;
    else if (trueVal === 0 && predVal === 1) fp++;
    else if (trueVal === 1 && predVal === 0) fn++;
  });

  const accuracy = (tp + tn) / y_true.length;
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return { accuracy, precision, recall, f1 };
};

const AnalyticsPage = ({ model, results, advance, modelFile }) => {
  const trainMetrics = results?.train?.truth && results?.train?.predicted
    ? computeMetrics(results.train.truth, results.train.predicted)
    : null;

  const testMetrics = results?.test?.truth && results?.test?.predicted
    ? computeMetrics(results.test.truth, results.test.predicted)
    : null;

  const chartData = trainMetrics && testMetrics ? [
    {
      name: 'Accuracy',
      Train: trainMetrics.accuracy,
      Test: testMetrics.accuracy
    },
    {
      name: 'Precision',
      Train: trainMetrics.precision,
      Test: testMetrics.precision
    },
    {
      name: 'Recall',
      Train: trainMetrics.recall,
      Test: testMetrics.recall
    },
    {
      name: 'F1 Score',
      Train: trainMetrics.f1,
      Test: testMetrics.f1
    }
  ] : [];

  function downloadModel() {
    if (!modelFile) {
      console.error('No model file available for download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = modelFile;
    link.download = 'model_file.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <button
        onClick={() => advance(-1)}
        className="mb-6 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition self-start"
      >
        ← Back
      </button>
  
      <div className="bg-white shadow rounded-xl p-6 mb-6 w-full max-w-4xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-2 text-center">Model: {model.model}</h2>
        <p className="text-gray-700 text-center">
          <span className="font-semibold">Target Column:</span> {model.target_column}
        </p>
  
        <details className="mt-4 w-full max-w-3xl">
          <summary className="cursor-pointer font-medium text-blue-600">Show Model Arguments</summary>
          <pre className="bg-gray-50 p-4 mt-2 rounded text-sm overflow-auto whitespace-pre-wrap">
            {JSON.stringify(model.args, null, 2)}
          </pre>
        </details>
  
        <div className="mt-6 flex justify-center">
          <div className="max-w 70">
            <h3 className="text-xl font-semibold mb-3 text-center">Metric Descriptions</h3>
            <table className="w-[70%] text-left text-sm bg-gray-50 rounded shadow mx-auto">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="px-4 py-2">Metric</th>
                  <th className="px-4 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">Accuracy</td>
                  <td className="px-4 py-2">Proportion of correct predictions.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Precision</td>
                  <td className="px-4 py-2">Proportion of predicted positives that are correct.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Recall</td>
                  <td className="px-4 py-2">Proportion of actual positives that are correctly predicted.</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">F1 Score</td>
                  <td className="px-4 py-2">Harmonic mean of precision and recall.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  

      {chartData.length > 0 && (
        <div className="bg-white shadow rounded-xl p-6 mb-6 w-full max-w-4xl flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-4">Train vs Test Metrics</h3>
          <div className="w-[70%] h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Train" fill="#4F46E5" />
                <Bar dataKey="Test" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
  
      <div className="w-full flex justify-center mb-8"> 
      <button
        onClick={downloadModel}
        disabled={!modelFile}
        className={`px-5 py-2 text-white rounded-md transition ${modelFile ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        {modelFile ? 'Download Model' : 'Model Not Available'}
      </button>
    </div>
    </div>
  );
}

export default AnalyticsPage;