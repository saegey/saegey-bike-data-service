$(document).ready(function() {
  $('.masthead-nav li').each(function() {
    console.log(window.location.pathname);
    if ($("a", this).attr('href')  ===  window.location.pathname) {
      $(this).addClass('active');
    }
  });
})
