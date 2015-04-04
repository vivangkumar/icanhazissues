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

  var milestoneClass = '.' + data.milestone.replace(/ /g, '-') + '-' + data.toLabel + '-list-group';

  // Append to the right list
  $(milestoneClass).append(data.cardHtml);
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
      var blocked = false;

      toLabel = parentNode.getAttribute('data-label');
      toMilestone = parentNode.getAttribute('data-milestone');

      if (event.item.getAttribute('data-blocked') == 'true') {
        blocked = true;
      }

      // Card that is to me updated and synced
      var cardMoved = {
        "issueNumber": issueNumber,
        "milestone": toMilestone,
        "fromLabel": fromLabel,
        "toLabel": toLabel,
      };

      if(fromLabel != toLabel && fromMilestone == toMilestone) {
        event.item.setAttribute('id', toLabel + '-' + issueNumber);
        cardMoved['cardHtml'] = event.item.outerHTML;
        // Trigger pusher event and update issue on github
        channel.trigger('client-issue-updates', cardMoved);
        updateIssue(issueNumber, fromLabel, toLabel, blocked);
      }
    }
  });
}

/**
 * Update issue on Github.
 * @param issueNumber
 * @param oldLabel
 * @param newLabel
 * @param blocked
 * @returns boolean
 */
function updateIssue(issueNumber, oldLabel, newLabel, blocked) {
  var repoName = window.location.pathname.split('/')[3];
  var ISSUE_ENDPOINT = '/issues/' + repoName + '/update/' +issueNumber;
  var data = {
    oldLabel: oldLabel,
    newLabel: newLabel,
    blocked: blocked
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
 * Assign colour codes using border bottom
 * to each element with class `.issue-list-item`
 */
function _assignColourCode() {
  $('.issue-list-item').each(function() {
    var colourCode = _getColourCode($(this).attr('data-created'));
    $(this).css('border-bottom-width', '5px').css('border-bottom-color', colourCode);
  });
}

/**
 * Look for issues that are blocked and add a label.
 */
function _addBlockedLabel() {
  $('.issue-list-item[data-blocked="true"]').each(function() {
    var label = '<span class="label label-danger">BLOCKED</span>'
    $(this).find('.issue-text').append("  " + label);
  });
}

/**
 * Add a menu button with a dropdown
 */
function _addMenu() {
  $('.heading-column:first-child').append(
    '<a class="menu-button pull-left" data-toggle="dropdown" id="menu-dropdown">' +
      '<i class="fa fa-bars fa-sm"></i>' +
    '</a>' +
    '<ul class="dropdown-menu" role="menu" aria-labelledby="menu-dropdown">' +
      '<li role="presentation" class="dropdown-header">'+ window.location.pathname.split('/')[3] +'</li>' +
      '<li role="presentation"><a role="menuitem" tabindex="-1" href="/repos">Repository search</a></li>' +
      '<li role="presentation"><a role="menuitem" tabindex="-1" href="#">Retrospective reminders</a></li>' +
      '<li role="presentation"><a role="menuitem" tabindex="-1" href="/logout">Logout</a></li>' +
    '</ul>'
  );
}

/**
 * We want the add new issue button appended to the last child
 * of the heading columns
 */
function _addNewIssueButton() {
  $('.heading-column:last-child').append(
    '<a class="add-issue-button pull-right" target="_blank" href="'+ newIssueUrl +'">' +
      '<i class="fa fa-plus fa-sm"></i>' +
    '</a>'
  );
}


$(window).load(function() {
  _addMenu();
  _addNewIssueButton();
  _assignColourCode();
  _addBlockedLabel();
});
