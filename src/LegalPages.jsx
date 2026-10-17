import React from "react";
import { ArrowLeft } from "lucide-react";
import termsOfService from "./content/terms-of-service.md?raw";
import privacyPolicy from "./content/privacy-policy.md?raw";

function renderInline(text, keyPrefix) {
  const tokens = text.split(/(\*\*[^*]+\*\*|https?:\/\/\S+)/g).filter(Boolean);

  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={key}>{token.slice(2, -2)}</strong>;
    }
    if (/^https?:\/\//.test(token)) {
      const url = token.replace(/[.,;:]$/, "");
      return (
        <React.Fragment key={key}>
          <a href={url} target="_blank" rel="noreferrer">{url}</a>
          {token.slice(url.length)}
        </React.Fragment>
      );
    }
    return token;
  });
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line || line === "---") {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Heading = `h${heading[1].length}`;
      blocks.push(
        <Heading key={`heading-${index}`}>
          {renderInline(heading[2], `heading-${index}`)}
        </Heading>
      );
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`list-${index}-${itemIndex}`}>
              {renderInline(item, `list-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index].trim()) && !lines[index].trim().startsWith("- ") && lines[index].trim() !== "---") {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {renderInline(paragraph.join(" "), `paragraph-${index}`)}
      </p>
    );
  }

  return blocks;
}

export default function LegalPage({ policy }) {
  const markdown = policy === "terms" ? termsOfService : privacyPolicy;
  const title = policy === "terms" ? "Terms of Service" : "Privacy Policy";

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a className="brand" href="/" aria-label="CRP home">
          <img src="/crp-logo.png" alt="CRP" className="brand-logo" />
        </a>
        <a className="membership-back" href="/join-growth">
          <ArrowLeft size={17} />
          Back to membership
        </a>
      </header>
      <main className="legal-content">
        <p className="legal-eyebrow">CRP GROWTH · MEMBERSHIP</p>
        <article className="legal-document" aria-label={title}>
          {renderMarkdown(markdown)}
        </article>
      </main>
      <footer className="legal-footer">
        <span>CRP GROWTH</span>
        <a href="/join-growth">Return to Join GROWTH</a>
      </footer>
    </div>
  );
}
