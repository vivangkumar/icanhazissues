var issueList = document.getElementsByClassName('issue-list-group');
for(var i = 0; i < issueList.length; i++) {
  var sort = Sortable.create(issueList[i], {
    group: 'issues',
    animation: 150,
    dragable: '.issue-list-item',
    ghostClass: 'sortable-ghost',
    onEnd: function(event) {
      /* Make AJAX call*/
    }
  });
}
