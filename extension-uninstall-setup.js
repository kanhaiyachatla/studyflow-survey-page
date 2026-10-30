/* Example for a Chromium Manifest V3 service worker. Replace the URL first. */
const STUDYFLOW_UNINSTALL_URL =
  "https://YOUR-GITHUB-USERNAME.github.io/studyflow-before-you-go/";

chrome.runtime.setUninstallURL(STUDYFLOW_UNINSTALL_URL).catch((error) => {
  console.error("Could not configure StudyFlow uninstall URL:", error);
});
