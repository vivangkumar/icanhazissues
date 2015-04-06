/**
 * Eventinator.js
 */

 var request = require('request');

 var config = CONFIG;

 function Eventinator(event, params) {
   this.event = event;
   this.params = params || {};
 }

 Eventinator.prototype = {
   constructor: Eventinator,

   record: function() {
     request.post({
       url: 'eventinator.io/events',
       body: {
         event: {
           name: this.event,
           params: this.params
         },
         api_key: config.eventinatorKey
       }, function(error, response, body) {
         if (error) {
           console.log('There was an error with the HTTP request to Eventinator');
         }

         if (response.statusCode == 200) {
           console.log('Event sent to Eventinator');
         } else {
           console.log('Unexpected HTTP code from Eventinator: ' + response.statusCode);
         }
       }
    });
 };

 module.exports = Eventinator;
