/**
 * Util.js
 *
 */

 exports.sortObject = function (obj) {
  var tempArray = [];
  var tempObj = {};

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      tempArray.push(key);
    }
  }

  tempArray.sort();

  for (var i = 0; i < tempArray.length; i++) {
    tempObj[tempArray[i]] = obj[tempArray[i]];
  }

  return tempObj;
 };
