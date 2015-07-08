/**
 * Main.js
 */

var repositoryName = window.location.pathname.split('/')[3];
var ownerName = window.location.pathname.split('/')[2];

var pusher = new Pusher(pusherKey, {
  authEndpoint: '/pusher/auth'
});

/**
 * Make cards movable and sortable
 * Also take specific actions when moving cards
 */
function setupSortableCards() {
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

        if(fromLabel != toLabel && fromMilestone == toMilestone) {
          updateIssue(issueNumber, fromLabel, toLabel, blocked, issueTitle);
          var milestone = toMilestone;

          var fromCount = getCount(milestone, fromLabel);
          var toCount = getCount(milestone, toLabel);

          if (toLabel == 'done') {
            hideOrShowDoneCard($(event.item));
          }
        }
      }
    });
  }
}

/**
 * Handle pusher events and update the board
 * to keep in sync with Github
 */
function githubSync() {
  var channelName = repositoryName + '-' + ownerName + '-githubsync';
  var githubSyncChannel = pusher.subscribe(channelName);
  githubSyncChannel.bind('labeled', function(data) {
    var checkCard = selectCard(data);
    var label = data.label.name;

    if (label == 'ready' && !checkCard.length) {
      addNewCard(data, label);
    }
  });

  githubSyncChannel.bind('unlabeled', function(data) {
    var card = selectCard(data);
    var toLabel = "";
    if (data.issue.labels.length > 0) {
      toLabel = data.issue.labels[0].name;
    }

    var fromLabel = data.label.name;
    var milestone = getMilestoneName(data);

    if (toLabel.length) {
      removeCard(fromLabel, data.issue.number);
      appendCard(milestone, toLabel, card);

      var fromCount = getCount(milestone, fromLabel);
      var toCount = getCount(milestone, toLabel);

      updateIssueCount(milestone, toLabel, (toCount + 1));
      updateIssueCount(milestone, fromLabel, (fromCount - 1));

      switchLabels(card, fromLabel, toLabel);
      updateCardId(card, toLabel, data.issue.number);

      if (toLabel == 'done') {
        updateDoneBadge(milestone, (toCount + 1));
        hideOrShowDoneCard(card);
      }

      if (fromLabel == 'done') {
        updateDoneBadge(milestone, (fromCount - 1));
        card.css('display', 'block');
      }
    } else {
      var count = getCount(milestone, fromLabel);
      updateIssueCount(milestone, fromLabel, (count - 1));
      card.remove();
    }
  });

  githubSyncChannel.bind('assigned', function(data) {
    assignIssue(data);
  });

  githubSyncChannel.bind('unassigned', function(data) {
    unassignIssue(data);
  });

  githubSyncChannel.bind('closed', function(data) {
    closeIssue(data);
  });

  githubSyncChannel.bind('reopened', function(data) {
    var label = data.issue.labels[0].name;
    addNewCard(data, label);
  });
}

/*******************************************************************************************/

/**
 * Append the assignee image to a card when updated
 * on Github.
 */
function assignIssue(data) {
  var card = selectCard(data);
  card.find(".issue-text").removeClass("col-xs-12").addClass("col-xs-8");
  var assigneeHtml = '<div class="issue-assignee col-xs-4 pull-right">' +
                        '<span class="pull-right">' +
                          '<img src="'+ data.issue.assignee.avatar_url + '&s=35' +'" class="img-circle avatar">' +
                        '</span>' +
                      '</div>';
  // Append only if the element does not already exist
  if (!card.find(".issue-assignee").length) {
    card.append(assigneeHtml);
  }
}

/**
 * Remove the assignee image to a card when updated
 * on Github.
 */
function unassignIssue(data) {
  var card = selectCard(data);
  card.find(".issue-text").removeClass("col-xs-8").addClass("col-xs-12");
  card.find(".issue-assignee").remove();
}

/**
 * Remove the card when closed on Github.
 */
function closeIssue(data) {
  var card = selectCard(data);
  card.remove();

  var milestone = getMilestoneName(data);

  var milestoneGroup = selectMilestone(data);
  var currentCardCount = milestoneGroup.attr('data-count');
  milestoneGroup.attr('data-count', (currentCardCount - 1));
  updateDoneBadge(milestone, (currentCardCount - 1));
}

/**
 * Add new card based on the column.
 */
function addNewCard(data, label) {
  var milestone = getMilestoneName(data);
  var card = $('.issue-list-item:first').clone();

  $(card).attr('data-updated', data.issue.updated_at);
  $(card).attr('data-issue-number', data.issue.number);
  $(card).attr('id', label + '-' + data.issue.number);
  $(card).removeAttr('class');
  $(card).addClass('list-group-item').addClass('issue-list-item').addClass('issue-list-item-' + label);

  var count = getCount(milestone, label);
  updateIssueCount(milestone, label, (count + 1));

  $(card).find(".issue-text").html(
    '<a href="'+ data.issue.html_url +'" target="_blank">'+ data.issue.title +'</a>'
  );

  $(card).find(".issue-assignee").remove();
  appendCard(milestone, label, card);

  if (data.issue.assignee) {
    assignIssue(data);
  }
}

/*******************************************************************************************/

/**
 * Return a card based on attributes
 */
function selectCard(data) {
  return $('.issue-list-item[data-issue-number=' + data.issue.number +']');
}

/**
 * Return the milestone group
 */
function selectMilestone(data) {
  var label = data.issue.labels[0].name;
  var milestone = data.issue.milestone || 'uncategorized';
  milestone.replace(/ /g, '-');

  return $('.' + milestone + '-' + label + '-list-group');
}

/**
 * Remove a card associated with a label
 * having an issue number
 */
function removeCard(fromLabel, issueNumber) {
  var card = '#'+ fromLabel + '-' + issueNumber;
  $(card).remove();
}

/**
 * Append a card to a new list
 */
function appendCard(milestone, label, cardHtml) {
  var listGroup = "." + milestone + '-' + label + '-list-group';
  $(listGroup).append(cardHtml);
}

/**
 * Update issue count for a milestone
 */
function updateIssueCount(milestone, label, count) {
  $('.' + milestone + '-' + label + '-list-group').attr('data-count', count);
}

/**
 * Update the issue count
 * when the done badge is shown
 */
function updateDoneBadge(milestone, count) {
  $('.' + milestone + '-done-badge').html(count);
}

/**
 * Decide whether we show or hide cards in the done column
 * based on the local storage setting
 */
function hideOrShowDoneCard(card) {
  if (localStorage.doneColumn == 'false') {
    card.css('display', 'none');
  } else {
    card.css('display', 'block');
  }
}

/**
 * Update the card `id` attribute
 */
function updateCardId(card, label, issueNumber) {
  $(card).attr('id', label + '-' + issueNumber);
}

/**
 * Hide a card in the done column if
 * localStorage option is set
 */
function hideDoneCard(card) {
  $(card).css('display', 'none');
}

/**
 * Change a card label to `done`
 */
function switchLabels(card, fromLabel, toLabel) {
  $(card).addClass('issue-list-item-' + toLabel);
  $(card).removeClass('issue-list-item-' + fromLabel);
}

/**
 * Get the `data-coount` attribute
 */
function getCount(milestone, label) {
  return parseInt($('.' + milestone + '-' + label + '-list-group').attr('data-count'));
}

/**
 * Get normalised milestone name
 */
function getMilestoneName(data) {
  var milestone = data.issue.milestone || 'uncategorized';
  milestone.replace(/ /g, '-');

  return milestone;
}

/**
 * Update issue on Github.
 * Set up as an AJAX call to the server which
 * will then update the issue
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

/**
 * Bulk close issues
 */
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

/**
 * Toggle viewing items in the done column
 */
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

/**
 * Toggle colour of the hide done column link
 * depending on the settings in localStorage
 */
function retainPreviousSetting() {
  if (localStorage.doneColumn == 'false') {
    $('.done-bucket').css('display', 'block');
    $('.issue-list-item-done').hide();
    $('.toggle-done').css('color', '#03A678');
  }
}

$(window).load(function() {
  setupSortableCards();
  addMenu();
  addNewIssueButton();
  assignColourCode();
  addBlockedLabel();
  toggleDoneColumn();
  retainPreviousSetting();
  closeIssues();
  $(".notifications").hide();
  githubSync();
});
