#!/usr/bin/env node
"use strict";

var path = require('path'),
  fs = require('fs'),
  express = require('express'),
  pkg = require(path.join(__dirname, 'package.json'));

var scan = require('./scan'),
  copyPaste = require("copy-paste"),
  Handlebars = require('handlebars'),
  colors = require('colors');

// Parse command line options

var program = require('commander');

program
  .version(pkg.version)
  .option('-p, --port <port>', 'Port on which to listen to (defaults to 3000)', parseInt)
  .option('-P, --public', 'Allow public access via ngrok')
  .option('-c, --copy', 'Copy ngrok url to clipboard')
  .parse(process.argv);


// Scan the directory in which the script was called. It will
// add the 'files/' prefix to all files and folders, so that
// download links point to our /files route

var tree = scan('.', 'files');

// Create a new express app

var app = express();

// Serve static files from the frontend folder

app.use('/', express.static(path.join(__dirname, 'frontend')));

// Serve files from the current directory under the /files route

var template = Handlebars.compile(fs.readFileSync(path.join(__dirname, '/frontend/code.hbs.html')).toString());

app.use('/files', function (req, res) {
  res.send(template({code: fs.readFileSync(path.join(process.cwd(), req.path)).toString()}))
});

app.use('/static', express.static(__dirname + '/public'));

// This endpoint is requested by our frontend JS

app.get('/scan', function (req, res) {
  res.send(tree);
});

// Share over ngrok if Public

if (program.public) {
  var ngrok = require('ngrok');
  ngrok.connect(port, function (err, url) {
    let copied = "";
    if (program.copy) {
      copied = "(copied to clipboard)";
      copyPaste.copy(url);
    }
    console.log(`Public URL: ${colors.yellow(url)} ${colors.green(copied)}`);
  });
}

// Everything is setup. Listen on the port.

const port = program.port || 3000;
app.listen(port, ()=>{
  console.log('Extraverse is running on port ' + port);
});

