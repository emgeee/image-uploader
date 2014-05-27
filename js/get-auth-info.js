
/**
 * Content script for retreiving use credentials after authing with kloudless
 */

 var results = {};
 var data = document.querySelectorAll('data');
 for (var i = 0; i < data.length; i++) {
   results[data[i].id] = data[i].title;
 };
 results;
