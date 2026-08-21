/**
 * Middleware that prepares form field errors, values, and error summary
 * in govuk-frontend-compatible format for direct use in templates.
 *
 * After this middleware runs, templates have access to:
 *   - fieldErrors.{fieldName}  → { text: "Error message" } (or undefined)
 *   - fieldValues.{fieldName}  → submitted value (or undefined)
 *   - errorSummary             → { titleText, errorList } ready for govukErrorSummary (or undefined)
 *   - csrf                     → CSRF token string
 */
module.exports = (req, res, next) => {
  const errors = res.locals.errors || {};
  const values = res.locals.values || {};

  // Pre-format errors into govuk-frontend errorMessage shape: { text: "..." }
  const fieldErrors = {};
  for (const [key, error] of Object.entries(errors)) {
    fieldErrors[key] = { text: error.message || error.text || error };
  }
  res.locals.fieldErrors = fieldErrors;

  // Alias values for template clarity
  res.locals.fieldValues = values;

  // Build error summary ready for govukErrorSummary macro
  const errorKeys = Object.keys(errors);
  if (errorKeys.length) {
    res.locals.errorSummary = {
      titleText: (req.translate && req.translate("error.summary.title")) || "There is a problem",
      errorList: errorKeys.map((key) => ({
        text: errors[key].message || errors[key].text || errors[key],
        href: "#" + (errors[key].id || key),
      })),
    };
  }

  // CSRF token available directly
  if (!res.locals.csrf && req.csrfToken) {
    res.locals.csrf = req.csrfToken();
  }

  next();
};
