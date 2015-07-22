$(function() {
  $('#filters').before('<h3>Filter By Tag</h3>');

  var tagType = function(prefix, disp) {
    return {
      tags: [],
      counts: {},
      prefix: prefix,
      disp: disp,
      tagMatches: function(t) {
        return t.indexOf(this.prefix) === 0;
      },
      tagName: function(t) {
        return t.substr(t.indexOf(':') + 1);
      }
    };
  }

  var languages = tagType('language:', 'info');
  var tools = tagType('tool:', 'success');
  var concepts = tagType('concept:', 'warning');

  [languages, tools, concepts].forEach(function(bag) {
    // Loop through the raw tags and add them to this bag if appropriate
    tags.forEach(function(t) {
      if (! bag.tagMatches(t)) {
        return
      }

      if (bag.counts.hasOwnProperty(t)) {
        bag.counts[t]++;
      } else {
        bag.counts[t] = 1;
        bag.tags.push(t);
      }
    });

    // Sort bag.tags based on bag.counts
    bag.tags.sort(function(a, b) {
      var diff = bag.counts[b] - bag.counts[a];
      if (diff !== 0) {
        return diff;
      }

      return a.localeCompare(b);
    });

    var row = '<div class="btn-group btn-group-xs" role="group">'
    bag.tags.forEach(function (t) {
      row += '<a class="btn btn-' + bag.disp + '" role="button" data-tag="' + t + '">'
      row += bag.tagName(t);
      row += ' <small><span class="badge">' + bag.counts[t] + '</span></small>';
      row += '</a>';
    });
    row += '</div>'

    $('#filters').append(row);
  });

  $('#filters').click(function(event) {
    event.preventDefault();

    var btn;
    if (event.target.tagName === 'A') {
      btn = event.target;
    } else {
      btn = $(event.target).closest('a');
    }

    var tag = $(btn).data('tag');
    if (!tag) {
      return;
    }

    if ($(btn).hasClass('active')) {
      $(".portfolio-item").show();
      $(btn).removeClass('active');
    } else {
      $("#filters a").removeClass('active');
      $(btn).addClass('active');
      $(".portfolio-item").hide();
      $("[data-tag='" + tag +"']").closest(".portfolio-item").show()
    }
  });
});
