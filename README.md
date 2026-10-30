# StudyFlow — post-uninstall survey

A responsive post-uninstall page with a two-column desktop layout and a stacked mobile layout. Visitors can choose one of six reasons, add an optional note, reinstall StudyFlow, or open its store review page. Survey answers and reinstall/review clicks are saved to Supabase.

## Files

- `index.html` — accessible survey and inline sad-face SVG.
- `styles.css` — responsive layout designed to fit typical mobile and desktop viewports.
- `app.js` — survey submission, Supabase insert, and safe store-link handling.
- `config.js` — public deployment settings; never put private keys here.
- `schema.sql` — Supabase table and insert-only row-level security policy.
- `extension-uninstall-setup.js` — example Chromium Manifest V3 uninstall URL setup.
- `assets/` — StudyFlow branding and favicon.

## Configure the database

1. Create a Supabase project.
2. In the Supabase SQL Editor, run the contents of `schema.sql`. It creates or updates `public.uninstall_feedback` and permits anonymous inserts only. Run it again if you previously created the table with the earlier three-reason version. Anonymous visitors cannot read, update, or delete collected rows; inspect/export responses from the Supabase dashboard.
3. In **Project Settings → API**, copy the project URL and the **anon/publishable** key. Never use a `service_role` or secret key in this public static site.
4. Put the values in `config.js`:

```js
window.STUDYFLOW_CONFIG = Object.freeze({
  primaryStoreUrl: "https://OFFICIAL-STORE-LISTING-URL",
  reviewUrl: "https://OFFICIAL-STORE-REVIEW-URL",
  databaseUrl: "https://YOUR-PROJECT.supabase.co",
  databaseAnonKey: "YOUR-PUBLIC-ANON-KEY"
});
```

Replace all example values with your real values. The reinstall and review links must use HTTPS and an official Chrome Web Store, Edge Add-ons, or Firefox Add-ons domain; invalid links are not displayed. The values in `config.js` are public by design.

The table records:

| `event_type` | What it means | Other fields |
| --- | --- | --- |
| `survey` | A visitor submitted the survey | `reason`, optional `details` |
| `reinstall` | A visitor clicked Reinstall | `reason` and `details` are null |
| `review` | A visitor clicked Leave a review | `reason` and `details` are null |

`created_at` is set by the database. The page does not collect names, email addresses, extension data, or browsing history. A review click is recorded, not the review itself; review content remains with the extension store.

If Supabase is unavailable or not configured, survey submission reports that it could not be saved instead of showing a false success. Action-button clicks attempt to log in the background so the store can open immediately.

## Publish with GitHub Pages

1. Upload this folder’s contents to the root of a GitHub repository.
2. Open **Settings → Pages** and choose **Deploy from a branch**, branch `main`, folder `/(root)`.
3. Wait for deployment and verify the HTTPS URL on desktop and a narrow mobile viewport.
4. Configure that complete URL in the extension’s uninstall URL setup.

GitHub Pages guide: https://docs.github.com/en/pages/quickstart

## Configure the extension’s post-uninstall page

An extension cannot intercept the browser’s uninstall confirmation. `setUninstallURL` asks the browser to open this page after removal; it cannot recover extension-local data.

For a Chromium Manifest V3 service worker, set the deployed page URL in the extension:

```js
const STUDYFLOW_UNINSTALL_URL = "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/";

chrome.runtime.setUninstallURL(STUDYFLOW_UNINSTALL_URL).catch((error) => {
  console.error("Could not configure StudyFlow uninstall URL:", error);
});
```

Use the exact HTTPS URL shown by GitHub Pages. This API does not require an extra manifest permission. Test with a development build and a browser profile that contains no data you need to keep.

References:

- Chrome: https://developer.chrome.com/docs/extensions/reference/api/runtime#method-setUninstallURL
- MDN: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/setUninstallURL

## Validation checklist

- [ ] Confirm the page fits the viewport at mobile and desktop sizes, including a short mobile viewport.
- [ ] Check light and dark appearance, keyboard focus, and reduced-motion behavior.
- [ ] With valid Supabase settings, submit a reason and a custom note; confirm exactly one `survey` row appears in `uninstall_feedback`.
- [ ] Submit a note without a reason and confirm it is saved; submit a blank survey and confirm it is not saved.
- [ ] Click Reinstall and Leave a review; confirm the correct store pages open and corresponding rows appear.
- [ ] Confirm no anonymous `SELECT`, `UPDATE`, or `DELETE` access is allowed by the table’s RLS policy.
- [ ] Test an unavailable database and confirm no success message is shown.
- [ ] Confirm unconfigured or invalid store links are not shown.
