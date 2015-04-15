'use strict';

var test = require('js/test');
var $ = require('jquery');
var old = require('shimmed');

console.log('fffttfffffffff');
test();

$(document).ready(function() {
  console.log('ready!');
});

old();
