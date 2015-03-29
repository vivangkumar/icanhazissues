/**
 * Main.js
 */

/** PUSHER **/
var pusher = new Pusher(pusherKey, {
 authEndpoint: '/pusher/auth'
});

var channel = pusher.subscribe('private-issues');
channel.bind('client-issue-updates', function(data) {
  // Remove old card before appending new one
  var cardToRemove = '#'+ data.fromLabel + '-' + data.number;
  $(cardToRemove).remove();

  var milestoneClass = '.' + data.milestone + '-'+ data.toLabel +'-list-group';
  var assignee = "";

  // Check if we have an assignee image
  if (data.avatarUrl) {
    assignee = '<span class="pull-right">
                  <img src="'+ data.avatarUrl +'" class="img img-circle avatar"></img>
                </span>';
  }

  var cardId = data.toLabel + '-' + data.number;
  var cardHtml = '<li class="list-group-item issue-list-item" data-issue-number="'+ data.number +'" id="'+ cardId +'">
                    <a href="'+ data.url +'">
                     <div class="issue-text col-xs-8">'+ data.text +'</div>
                    </a>
                    <div class="issue-assignee col-xs-4 pull-right">
                    '+ assignee +'
                    </div>
                  </li>';
  $(milestoneClass).append(cardHtml);
});

var issueGroups = document.getElementsByClassName('issue-list-group');
var fromLabel = ""
  , toLabel = ""
  , fromMilestone = ""
  , toMilestone = "";

for(var i = 0; i < issueGroups.length; i++) {
  var issueMilestone = issueGroups[i].getAttribute('data-milestone');
  /* Create sortable instance for each milestone, making them movable only
   * within each milestone
   */
  Sortable.create(issueGroups[i], {
    group: 'issue-' + issueMilestone,
    animation: 150,
    dragable: '.issue-list-item',
    ghostClass: 'sortable-ghost',
    onStart: function(event) {
      var parentNode = event.item.parentNode;
      fromLabel = parentNode.getAttribute('data-label');
      fromGroup = parentNode.getAttribute('data-milestone');
    },
    onEnd: function(event) {
      var issueNumber = event.item.getAttribute('data-issue-number');
      var parentNode = event.item.parentNode;
      toLabel = parentNode.getAttribute('data-label');
      toGroup = parentNode.getAttribute('data-milestone');
      var cardChildren = event.item.children;
      // Card that is to me updated and synced
      var cardMoved = {
        "number": issueNumber,
        "milestone": toGroup,
        "fromLabel": fromLabel,
        "toLabel": toLabel,
        "url": cardChildren[0].href,
        "text": cardChildren[0].children[0].innerText
      };

      // Append avatar url if there is one
      if(cardChildren[1].children[0]) {
        cardMoved['avatarUrl'] = cardChildren[1].children[0].children[0].currentSrc;
      }

      if(fromLabel != toLabel && fromMilestone == toMilestone) {
        event.item.setAttribute('id', toLabel +'-'+ issueNumber);
        // Trigger pusher event and update issue on github
        channel.trigger('client-issue-updates', cardMoved);
        updateIssue(issueNumber, fromLabel, toLabel);
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

$(window).load(function() {
  $('.heading-column:last-child').append(
    '<a class="add-issue-button pull-right" href="'+newIssueUrl+'">
      <i class="fa fa-plus fa-lg"></i>
    </a>'
  );
});
