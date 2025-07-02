const express = require('express');
const Blockchain = require('./blockchain');
 
const app = express();
const PORT = 3000;

app.use(express.json());