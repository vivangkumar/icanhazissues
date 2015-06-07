/**
 * Main.js
 */

/** PUSHER **/
var pusher = new Pusher(pusherKey, {
  authEndpoint: '/pusher/auth'
});

var repositoryName = window.location.pathname.split('/')[3];
var ownerName = window.location.pathname.split('/')[2];

var channel = pusher.subscribe('private-issues-' + repositoryName + '-' + ownerName);
channel.bind('client-issue-updates', function(data) {
  // Remove old card before appending new one
  var cardToRemove = '#'+ data.fromLabel + '-' + data.issueNumber;
  var fromLabel = data.fromLabel;
  var toLabel = data.toLabel;
  var toMilestone = data.toMilestone;
  var fromMilestone = data.fromMilestone;
  var fromCount = data.fromCount;
  var toCount = data.toCount;
  var issueLink = data.issueLink;
  var issueTitle = data.issueTitle;

  $(cardToRemove).remove();

  var milestoneClass = '.' + toMilestone + '-' + toLabel + '-list-group';

  if (toLabel == 'done') {
    $('.' + toMilestone + '-done-badge').html(toCount);
    $('.' + toMilestone + '-' + toLabel + '-list-group').attr('data-count', toCount);
  }

  if (fromLabel == 'done') {
    $('.' + fromMilestone + '-' + fromLabel + '-list-group').attr('data-count', fromCount);
    $('.' + fromMilestone + '-done-badge').html(fromCount);
  }

  // Append to the right list
  $(milestoneClass).append(data.cardHtml);
  if (toLabel == 'done') {
    var relevantCard = $('.issue-list-item[data-issue-number=' + data.issueNumber +']');
    if (localStorage.doneColumn == 'false') {
      relevantCard.css('display', 'none');
    } else {
      relevantCard.css('display', 'block');
    }
  }

  if (toLabel == 'review') {
    triggerNotification(issueTitle, issueLink, toMilestone)
  }
});

var serverChannel = pusher.subscribe(repositoryName + '-' + ownerName + '-server-updates');
serverChannel.bind('remove-done-cards', function(data) {
  setTimeout(function() {
    location.reload();
  }, 1000);
});

var issueGroups = document.getElementsByClassName('issue-list-group');
var fromLabel = "";
var toLabel = "";
var fromMilestone = "";
var toMilestone = "";

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
    filter: '.done-bucket',
    onStart: function(event) {
      var parentNode = event.item.parentNode;
      fromLabel = parentNode.getAttribute('data-label');
      fromMilestone = parentNode.getAttribute('data-milestone').replace(/ /g, '-');
    },
    onEnd: function(event) {
      var issueNumber = event.item.getAttribute('data-issue-number');
      var issueTitle = event.item.getElementsByTagName('a')[0].innerHTML;
      var issueLink = event.item.getElementsByTagName('a')[0].href;
      var parentNode = event.item.parentNode;
      var blocked = false;

      toLabel = parentNode.getAttribute('data-label');
      toMilestone = parentNode.getAttribute('data-milestone').replace(/ /g, '-');

      if (event.item.getAttribute('data-blocked') == 'true') {
        blocked = true;
      }

      // Card that is to be updated and synced
      var cardMoved = {
        issueNumber: issueNumber,
        issueTitle: issueTitle,
        fromMilestone: fromMilestone,
        toMilestone: toMilestone,
        fromLabel: fromLabel,
        toLabel: toLabel,
        issueLink: issueLink
      };

      if(fromLabel != toLabel && fromMilestone == toMilestone) {
        var toCount = parseInt(parentNode.getAttribute('data-count'));
        parentNode.setAttribute('data-count', toCount + 1);

        var fromCount = parseInt(document.getElementsByClassName(fromMilestone + "-" + fromLabel + "-list-group")[0].getAttribute('data-count'));
        document.getElementsByClassName(fromMilestone + "-" + fromLabel + "-list-group")[0].setAttribute('data-count', fromCount - 1);

        if (toLabel == 'done') {
          if (localStorage.doneColumn == 'false') {
            event.item.style.display = 'none';
          }

          $('.' + toMilestone + '-done-badge').html(toCount + 1);
          event.item.classList.add('issue-list-item-done');
          event.item.classList.remove('issue-list-item-' + fromLabel);
        }

        if (fromLabel == 'done') {
          event.item.classList.remove('issue-list-item-done');
          event.item.classList.add('issue-list-item-' + toLabel);
          $('.' + fromMilestone + '-done-badge').html(fromCount - 1);
        }

        event.item.setAttribute('id', toLabel + '-' + issueNumber);

        cardMoved['cardHtml'] = event.item.outerHTML;
        cardMoved['fromCount'] = fromCount - 1;
        cardMoved['toCount'] = toCount + 1;
        // Trigger pusher event and update issue on github
        channel.trigger('client-issue-updates', cardMoved);
        updateIssue(issueNumber, fromLabel, toLabel, blocked, issueTitle);
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
function updateIssue(issueNumber, oldLabel, newLabel, blocked, issueTitle) {
  var ISSUE_ENDPOINT = '/issues/' + ownerName + '/' + repositoryName + '/update/' +issueNumber;
  var data = {
    issueTitle: issueTitle,
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
function getColourCode(date) {
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
function assignColourCode() {
  $('.issue-list-item').each(function() {
    var colourCode = getColourCode($(this).attr('data-updated'));
    $(this).css('border-left-width', '5px').css('border-left-color', colourCode);
  });
}

/**
 * Look for issues that are blocked and add a label.
 */
function addBlockedLabel() {
  $('.issue-list-item[data-blocked="true"]').each(function() {
    var label = '<span class="label label-danger">BLOCKED</span>'
    $(this).find('.issue-text').append("  " + label);
  });
}

/**
 * Add a menu button with a dropdown
 */
function addMenu() {
  $('.heading-column:first-child').append(
    '<a class="menu-button pull-left" data-toggle="dropdown" id="menu-dropdown">' +
      '<i class="fa fa-bars fa-sm"></i>' +
    '</a>' +
    '<ul class="dropdown-menu" role="menu" aria-labelledby="menu-dropdown">' +
      '<li role="presentation" class="dropdown-header">'+ repositoryName +'</li>' +
      '<li role="presentation"><a role="menuitem" tabindex="-1" href="/repos">Repository search</a></li>' +
      '<li role="presentation"><a id="close-issues" role="menuitem" tabindex="-1" href="#">Close done issues</a></li>' +
      '<li role="presentation"><a class="toggle-done" role="menuitem" tabindex="-1" href="#">Toggle done items</a></li>' +
      '<li role="presentation"><a role="menuitem" tabindex="-1" href="/logout">Logout</a></li>' +
    '</ul>'
  );
}

function closeIssues() {
  var closeIssuesEndpoint = '/issues/' + ownerName + '/' + repositoryName + '/close';
  var issueNumbers = [];
  $('.issue-list-item-done').each(function() {
    issueNumbers.push($(this).attr("data-issue-number"));
  });

  var data = {
    issueNumbers: JSON.stringify(issueNumbers)
  };

  var notify = function(text) {
    $(".notifications").html(text).fadeOut(1000);
  }

  $("#close-issues").click(function(e) {
    var option = confirm("This will close all issues in the done columns. Are you sure?");
    if (option) {
      var request = $.ajax({
        url: closeIssuesEndpoint,
        type: "POST",
        data: data,
        beforeSend: function() {
          $(".notifications").html("Deleting issues").show();
        },
        complete: function(response) {
          if (response.status == 200) {
            notify("Issues closed..");
          } else {
            notify("Error closing some issues..");
          }
        }
      });
    }
  });
}

/**
 * We want the add new issue button appended to the last child
 * of the heading columns
 */
function addNewIssueButton() {
  var newIssueUrl = 'https://github.com/' + ownerName + '/' + repositoryName + '/issues/new';
  $('.heading-column:last-child').append(
    '<a class="add-issue-button pull-right" target="_blank" href="'+ newIssueUrl +'">' +
      '<i class="fa fa-plus fa-sm"></i>' +
    '</a>'
  );
}

function toggleDoneColumn() {
  $('.toggle-done').click(function() {
    if (localStorage.doneColumn == 'false') {
      localStorage.doneColumn = 'true';
    } else {
      localStorage.doneColumn = 'false';
    }

    $('.issue-list-item-done').toggle();
    $('.done-bucket').toggle();
    if ($(this).css('color') == 'rgb(3, 166, 120)') {
      $(this).css('color', 'white');
    } else {
      $(this).css('color', '#03A678');
    }
  });
}

function retainPreviousSetting() {
  if (localStorage.doneColumn == 'false') {
    $('.done-bucket').css('display', 'block');
    $('.issue-list-item-done').hide();
    $('.toggle-done').css('color', '#03A678');
  }
}

function setupNotification() {
  if (!Notification) {
    console.log("This browser does not support notifications")
  }

  if (Notification.permission !== "granted") Notification.requestPermission();
}

function triggerNotification(issueTitle, issueLink, issueMilestone) {
  var notification = new Notification(issueTitle + " is ready to be reviewed!", {
    tag: 'icanhazissues-review-notification',
    body: "Card has been moved to the review column for the " + issueMilestone
          + " milestone."
  });

  notification.onclick = function() {
    window.open(issueLink);
  }

  notification.onshow = function() {
    setTimeout(notification.close.bind(notification), 10000);
  }
}

$(window).load(function() {
  addMenu();
  addNewIssueButton();
  assignColourCode();
  addBlockedLabel();
  toggleDoneColumn();
  retainPreviousSetting();
  setupNotification();
  closeIssues();
  $(".notifications").hide();
});
