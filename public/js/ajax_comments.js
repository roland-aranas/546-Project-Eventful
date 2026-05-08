(function ($) {
  $(function () {
    const $form = $('#commentForm');
    const $textarea = $('#commentInput');
    const $error = $('#commentError');
    const $commentsList = $('#commentsList');

    $form.on('submit', function (e) {
      e.preventDefault();
      $error.text('');

      const raw = $textarea.val();
      if (!raw || !raw.trim()) {
        $error.text('Comment cannot be empty');
        return;
      }
      $.ajax({
        url: $form.attr('action'),
        method: 'POST',
        dataType: 'json',
        data: { commentInput: raw },
        headers: { Accept: 'application/json' }
      })
        .done(function (response) {
          if (!response || response.success !== true) {
            $error.text((response && response.error) || 'Unknown server response');
            return;
          }

          const newComment = response.comment;
          // build DOM for new comment safely
          const $commentDiv = $('<div>').addClass('comment');
          const $author = $('<p>').addClass('comment-author');
          $author.append(document.createTextNode(newComment.username || ''));
          const $text = $('<p>').addClass('comment-text');
          $text.append(document.createTextNode(newComment.textContent || ''));
          $commentDiv.append($author, $text);

          $commentsList.prepend($commentDiv);

          // clear textarea and focus
          $textarea.val('');
          $textarea.focus();
        })
        .fail(function (val) {
          const resultFail = val.responseJSON;
          $error.text((resultFail && resultFail.error) || 'Error posting comment');
        })
        .always(function () {
          $form.find('button, textarea').prop('disabled', false);
        });
    });
  });
})(window.jQuery);