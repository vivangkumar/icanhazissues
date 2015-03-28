/**
 * Main.js
 */

/** PUSHER **/
var pusher = new Pusher('d861d962297286b85253', {
 authEndpoint: '/pusher/auth'
});

var channel = pusher.subscribe('private-issues');
channel.bind('client-issue-updates', function(data) {
 console.log(data);
});

var issueGroups = document.getElementsByClassName('issue-list-group');
var from = ""
  , to = ""
  , fromMilestone = ""
  , toMilestone = "";

for(var i = 0; i < issueGroups.length; i++) {
  var issueMilestone = issueGroups[i].getAttribute('data-milestone');
  Sortable.create(issueGroups[i], {
    group: 'issue-' + issueMilestone,
    animation: 150,
    dragable: '.issue-list-item',
    ghostClass: 'sortable-ghost',
    onStart: function(event) {
      var parentNode = event.item.parentNode;
      from = parentNode.getAttribute('data-label');
      fromGroup = parentNode.getAttribute('data-milestone');
    },
    onEnd: function(event) {
      var issueNumber = event.item.getAttribute('data-issue-number');
      var parentNode = event.item.parentNode;
      to = parentNode.getAttribute('data-label');
      toGroup = parentNode.getAttribute('data-milestone');
      if(from != to && fromMilestone == toMilestone) {
        channel.trigger('client-issue-updates', 'Card was moved');
        updateIssue(issueNumber, from, to);
      }
    }
  });
}

/**
 * Update issue on Github.
 * @param issueNumber
 * @param oldLabel
 * @param newLabel
 * @returns boolean
 */
function updateIssue(issueNumber, oldLabel, newLabel) {
  var repoName = window.location.pathname.split('/')[2];
  var ISSUE_ENDPOINT = '/issues/' + repoName + '/update/' +issueNumber;
  var data = {
    "oldLabel": oldLabel,
    "newLabel": newLabel
  }

  var request = $.ajax({
    url: ISSUE_ENDPOINT,
    type: "POST",
    data: data,
    success: function(msg) {
      console.log(msg);
      return true;
    },
    error: function(error) {
      console.log('Error: ' + JSON.parse(error));
      return false;
    }
  });
}
