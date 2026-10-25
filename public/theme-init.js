// Sets the color theme before the page paints, so it never flashes the wrong one. A choice made with
// the header toggle is remembered in this browser; otherwise the device's light or dark setting is used.
// A separate file rather than inline code, because the Content Security Policy allows only same-origin scripts.
(function () {
  var theme = null;
  try {
    theme = window.localStorage.getItem("suno-workbench-theme");
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
