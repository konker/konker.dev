/* eslint-disable fp/no-unused-expression,fp/no-nil */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      document.querySelector('.main-navigation')?.classList.toggle('expanded');
    });
  }
});
