'use strict';

var test = require('js/test');

console.log('fffffffffffff');
test();

var $ = require('jquery');

$( document ).ready(function() {
    console.log('ready!');
});


var old= require('shimmed');
old();