import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Flame,
  Mountain,
  TentTree,
  Trash2,
  X,
} from "lucide-react";

import type { RouteDay } from "./types";

type DayEditorProps = {
  day: RouteDay;
  onChange: (day: RouteDay) => void;
  onClose: () => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

export function DayEditor({
  day,
  onChange,
  onClose,
  onMove,
  onDelete,
}: DayEditorProps) {
  return (
    <section className="editor" aria-label={`Edit day ${day.day}`}>
      <div className="editor__top">
        <button className="icon-button" onClick={onClose} aria-label="Close editor">
          <ChevronLeft size={19} />
        </button>
        <span>Day {day.day}</span>
        <div className="editor__actions">
          <button
            className="icon-button"
            onClick={() => onMove(-1)}
            aria-label="Move day earlier"
          >
            <ArrowUp size={17} />
          </button>
          <button
            className="icon-button"
            onClick={() => onMove(1)}
            aria-label="Move day later"
          >
            <ArrowDown size={17} />
          </button>
        </div>
      </div>

      <label className="field field--hero">
        <span>Sleep in</span>
        <input
          value={day.to}
          onChange={(event) => onChange({ ...day, to: event.target.value })}
        />
      </label>

      <div className="field-pair">
        <label className="field">
          <span>Distance</span>
          <div className="input-unit">
            <input
              type="number"
              min="1"
              value={day.distance}
              onChange={(event) =>
                onChange({ ...day, distance: Number(event.target.value) })
              }
            />
            <i>km</i>
          </div>
        </label>
        <label className="field">
          <span>Climbing</span>
          <div className="input-unit">
            <input
              type="number"
              min="0"
              value={day.climbing}
              onChange={(event) =>
                onChange({ ...day, climbing: Number(event.target.value) })
              }
            />
            <i>m</i>
          </div>
        </label>
      </div>

      <label className="field">
        <span>
          <Mountain size={15} /> Roads & paths
        </span>
        <input
          value={day.surface}
          onChange={(event) => onChange({ ...day, surface: event.target.value })}
        />
      </label>

      <label className="field">
        <span>
          <TentTree size={15} /> Camp
        </span>
        <input
          value={day.camp}
          onChange={(event) => onChange({ ...day, camp: event.target.value })}
        />
      </label>

      <label className="field">
        <span>
          <Flame size={15} /> Hot spring
        </span>
        <div className="optional-input">
          <input
            value={day.onsen ?? ""}
            placeholder="None planned"
            onChange={(event) =>
              onChange({
                ...day,
                onsen: event.target.value === "" ? null : event.target.value,
              })
            }
          />
          {day.onsen !== null && (
            <button
              onClick={() => onChange({ ...day, onsen: null })}
              aria-label="Remove hot spring"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </label>

      <label className="field">
        <span>Trail note</span>
        <textarea
          rows={4}
          value={day.note}
          onChange={(event) => onChange({ ...day, note: event.target.value })}
        />
      </label>

      <div className="difficulty">
        <span>Effort</span>
        <div>
          {(["easy", "steady", "big"] as const).map((difficulty) => (
            <button
              key={difficulty}
              className={day.difficulty === difficulty ? "is-active" : ""}
              onClick={() => onChange({ ...day, difficulty })}
            >
              {day.difficulty === difficulty && <Check size={13} />}
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      <button className="delete-day" onClick={onDelete}>
        <Trash2 size={16} /> Remove this day
      </button>
    </section>
  );
}
