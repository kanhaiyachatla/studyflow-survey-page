(() => {
  "use strict";

  const config = window.STUDYFLOW_CONFIG || {};
  const allowedStoreHosts = new Set([
    "chromewebstore.google.com",
    "chrome.google.com",
    "microsoftedge.microsoft.com",
    "addons.mozilla.org"
  ]);
  const form = document.getElementById("feedback-form");
  const feedbackAction = document.getElementById("feedback-action");
  const feedbackStatus = document.getElementById("feedback-status");
  const privacyNote = document.getElementById("privacy-note");
  const details = document.getElementById("feedback-details");
  const reinstallLink = document.getElementById("reinstall-link");
  const reinstallUnavailable = document.getElementById("reinstall-unavailable");
  const reviewLink = document.getElementById("review-link");
  const reviewSeparator = document.getElementById("review-separator");

  function safeHttpsUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      if (url.protocol !== "https:" || url.username || url.password) return null;
      return url;
    } catch (_error) {
      return null;
    }
  }

  function safeStoreUrl(value) {
    const url = safeHttpsUrl(value);
    if (!url || !allowedStoreHosts.has(url.hostname.toLowerCase())) return null;
    return url;
  }

  const databaseUrl = safeHttpsUrl(config.databaseUrl);
  const anonKey = typeof config.databaseAnonKey === "string" ? config.databaseAnonKey.trim() : "";
  const submissionUrl = databaseUrl && anonKey
    ? `${databaseUrl.href.replace(/\/+$/, "")}/rest/v1/uninstall_feedback`
    : null;
  privacyNote.textContent = submissionUrl
    ? "Only your selected reason and optional note are saved. Please don’t include personal or sensitive information."
    : "Feedback storage isn’t configured yet, so answers can’t be submitted. Please don’t include personal or sensitive information.";

  async function saveEvent(event) {
    if (!submissionUrl) throw new Error("The feedback database is not configured.");

    const response = await fetch(submissionUrl, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      keepalive: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(event)
    });
    if (!response.ok) throw new Error(`Feedback database returned HTTP ${response.status}.`);
  }

  function announce(message) {
    feedbackStatus.textContent = message;
  }

  function getAnswers() {
    const selected = form.querySelector('input[name="reason"]:checked');
    return {
      reason: selected ? selected.value : null,
      details: details.value.trim() || null
    };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const answers = getAnswers();
    if (!answers.reason && !answers.details) {
      announce("Choose a reason or add a note before sending.");
      return;
    }

    feedbackAction.disabled = true;
    feedbackAction.textContent = "Sending…";
    announce("");
    try {
      await saveEvent({ event_type: "survey", ...answers });
      form.reset();
      announce("Thanks for helping us improve StudyFlow.");
    } catch (error) {
      console.error("Could not save StudyFlow uninstall feedback:", error);
      announce(submissionUrl
        ? "We couldn’t save your response. Please try again in a moment."
        : "Feedback isn’t available yet because the database hasn’t been configured.");
    } finally {
      feedbackAction.disabled = false;
      feedbackAction.textContent = "Send feedback";
    }
  });

  const reinstallUrl = safeStoreUrl(config.primaryStoreUrl);
  if (reinstallUrl) {
    reinstallLink.href = reinstallUrl.href;
    reinstallLink.hidden = false;
    reinstallUnavailable.hidden = true;
    reinstallLink.addEventListener("click", () => {
      saveEvent({ event_type: "reinstall" }).catch((error) => {
        console.error("Could not record StudyFlow reinstall click:", error);
        announce("The store opened, but we couldn’t record that click.");
      });
    });
  }

  const reviewUrl = safeStoreUrl(config.reviewUrl);
  if (reviewUrl) {
    reviewLink.href = reviewUrl.href;
    reviewLink.hidden = false;
    reviewSeparator.hidden = false;
    reviewLink.addEventListener("click", () => {
      saveEvent({ event_type: "review" }).catch((error) => {
        console.error("Could not record StudyFlow review click:", error);
        announce("The review page opened, but we couldn’t record that click.");
      });
    });
  }

})();
