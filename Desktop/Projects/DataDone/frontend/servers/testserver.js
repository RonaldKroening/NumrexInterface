const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const filePath = 'servers/testcsv.csv';

const currentDir = process.cwd();
console.log('Current working directory:', currentDir);

if (!fs.existsSync(filePath)) {
  console.error(`Error: File '${filePath}' does not exist`);
  process.exit(1);
}

const form = new FormData();
form.append('file', fs.createReadStream(filePath));

axios.post('http://localhost:8000/upload', form, {
  headers: {
    ...form.getHeaders()
  }
})
.then(response => {
  console.log('Response:', response.data);
})
.catch(error => {
  if (error.response) {
    console.error('Server error:', error.response.status, error.response.data);
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Request error:', error.message);
  }
});