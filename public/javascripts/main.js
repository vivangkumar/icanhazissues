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
  var cardToRemove = '#'+ data.fromLabel + '-' + data.issueNumber;
  $(cardToRemove).remove();

  var milestoneClass = '.' + data.milestone.replace(/ /g, '-') + '-'+ data.toLabel +'-list-group';

  // Append to list and colour code moved card
  $(milestoneClass).append(data.cardHtml);
  _assignColourCode();
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
      fromMilestone = parentNode.getAttribute('data-milestone');
    },
    onEnd: function(event) {
      var issueNumber = event.item.getAttribute('data-issue-number');
      var parentNode = event.item.parentNode;
      toLabel = parentNode.getAttribute('data-label');
      toMilestone = parentNode.getAttribute('data-milestone');

      // Card that is to me updated and synced
      var cardMoved = {
        "issueNumber": issueNumber,
        "milestone": toMilestone,
        "fromLabel": fromLabel,
        "toLabel": toLabel,
      };

      if(fromLabel != toLabel && fromMilestone == toMilestone) {
        event.item.setAttribute('id', toLabel +'-'+ issueNumber);
        cardMoved['cardHtml'] = event.item.outerHTML;
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
  var repoName = window.location.pathname.split('/')[3];
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
    },
    error: function(error) {

      console.log('Error: ' + JSON.parse(error));
    }
  });
}

/**
 * Get colours for issues based on date.
 * @param date
 */
function _getColourCode(date) {
  var date = new Date(date);
  var now = new Date();
  var diff = now - date;
  var day = 24 * 60 * 60 * 1000;
  var startOfYesterday = now - (now % day) - day;

  if (date > startOfYesterday) {
    return '#00B16A';
  } else if (diff < 7 * day) {
    return '#F7CA18';
  } else if (diff < 14 * day) {
    return '#F9690E';
  } else {
    return '#F22613';
  }
}

/**
 * Assign colour codes using border bottom.
 *
 */
function _assignColourCode() {
  $('.issue-list-item').each(function() {
    var colourCode = _getColourCode($(this).attr('data-created'));
    $(this).css('border-bottom-width', '5px').css('border-bottom-color', colourCode);
  });
}

$(window).load(function() {
  $('.heading-column:last-child').append(
    '<a class="add-issue-button pull-right" target="_blank" href="'+newIssueUrl+'"> \
      <i class="fa fa-plus fa-sm"></i> \
    </a>'
  );
  _assignColourCode();
});
