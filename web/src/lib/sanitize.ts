import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "p", "br", "strong", "em", "u", "s",
    "ul", "ol", "li", "blockquote", "a", "img", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https"],
  allowedSchemesAppliedToAttributes: ["href"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
  },
};

export function sanitizeArticleHtml(dirty: string): string {
  // Backward compat: if content has no HTML tags, wrap plain text in <p> tags
  if (!/<[a-z][\s\S]*>/i.test(dirty)) {
    const wrapped = dirty
      .split(/\n\n+/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
    return sanitizeHtml(wrapped, sanitizeOptions);
  }
  return sanitizeHtml(dirty, sanitizeOptions);
}
