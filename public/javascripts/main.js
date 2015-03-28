/**
 * Main.js
 */

var issueList = document.getElementsByClassName('issue-list-group');
var from = ""
  , to = "";

for(var i = 0; i < issueList.length; i++) {
  var sort = Sortable.create(issueList[i], {
    group: 'issues',
    animation: 150,
    dragable: '.issue-list-item',
    ghostClass: 'sortable-ghost',
    onStart: function(event) {
      from = event.item.parentNode.getAttribute('data-label');
    },
    onEnd: function(event) {
      var issueNumber = event.item.getAttribute('data-issue-number');
      to = event.item.parentNode.getAttribute('data-label');
      if(from != to) {
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
