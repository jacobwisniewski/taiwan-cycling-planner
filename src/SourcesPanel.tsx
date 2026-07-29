import { ChevronLeft, ExternalLink, ShieldCheck } from "lucide-react";

import type { Source } from "./types";

type SourcesPanelProps = {
  sources: Source[];
  onClose: () => void;
};

export function SourcesPanel({ sources, onClose }: SourcesPanelProps) {
  return (
    <section className="sources-panel" aria-label="Sources and field notes">
      <div className="editor__top">
        <button className="icon-button" onClick={onClose} aria-label="Close sources">
          <ChevronLeft size={19} />
        </button>
        <span>Sources & field notes</span>
        <span />
      </div>

      <div className="sources-panel__intro">
        <ShieldCheck size={22} />
        <div>
          <h2>Traceable by design.</h2>
          <p>
            Every route idea and sleep lead is tied to its origin. Community
            reports are useful scouting evidence, never permission or a promise
            that conditions are unchanged.
          </p>
        </div>
      </div>

      <div className="sleep-key">
        <h3>Sleep confidence</h3>
        <dl>
          <div>
            <dt><i className="key-dot key-dot--registered" /> Registered</dt>
            <dd>Formal site; still confirm opening and booking.</dd>
          </div>
          <div>
            <dt><i className="key-dot key-dot--ask" /> Ask first</dt>
            <dd>Human permission required; have a paid fallback.</dd>
          </div>
          <div>
            <dt><i className="key-dot key-dot--wild" /> Wild lead</dt>
            <dd>Anecdotal and approximate; inspect, ask, leave no trace.</dd>
          </div>
        </dl>
      </div>

      <div className="source-list">
        {sources.map((source, index) => (
          <a
            key={source.id}
            className="source-row"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>
              <em>{source.kind}</em>
              <strong>{source.title}</strong>
              <small>{source.publisher}</small>
              <p>{source.usedFor}</p>
            </span>
            <ExternalLink size={15} />
          </a>
        ))}
      </div>
    </section>
  );
}
