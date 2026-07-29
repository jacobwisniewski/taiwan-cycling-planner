import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bike,
  CalendarDays,
  ChevronRight,
  Download,
  Flame,
  Info,
  MapPinned,
  Menu,
  Mountain,
  Plus,
  RotateCcw,
  Save,
  ScrollText,
  TentTree,
  X,
} from "lucide-react";

import { initialState } from "./data";
import { DayEditor } from "./DayEditor";
import { MapView } from "./MapView";
import { SourcesPanel } from "./SourcesPanel";
import type { PlaceKind, PlannerState, RouteDay } from "./types";
import { downloadGpx, loadPlanner, savePlanner, updateDayNumbers } from "./utils";

const allKinds: PlaceKind[] = ["camp", "onsen", "supply", "caution"];

const kindLabels: Record<PlaceKind, string> = {
  camp: "Camps",
  onsen: "Hot springs",
  supply: "Supplies",
  caution: "Checks",
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-AU").format(value);

function App() {
  const [planner, setPlanner] = useState<PlannerState>(
    () => loadPlanner() ?? initialState,
  );
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [visibleKinds, setVisibleKinds] = useState<Set<PlaceKind>>(
    new Set(allKinds),
  );
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);

  const selectedDay = planner.days.find((day) => day.id === selectedDayId);
  const totals = useMemo(
    () => ({
      distance: planner.days.reduce((sum, day) => sum + day.distance, 0),
      climbing: planner.days.reduce((sum, day) => sum + day.climbing, 0),
      camps: planner.days.filter((day) => day.camp !== "Finish").length,
      onsens: planner.days.filter((day) => day.onsen !== null).length,
    }),
    [planner.days],
  );

  useEffect(() => {
    const saveTimer = window.setTimeout(() => savePlanner(planner), 300);
    return () => window.clearTimeout(saveTimer);
  }, [planner]);

  useEffect(() => {
    if (notice === null) {
      return;
    }
    const noticeTimer = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(noticeTimer);
  }, [notice]);

  const updateDay = useCallback((updatedDay: RouteDay) => {
    setPlanner((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === updatedDay.id ? updatedDay : day,
      ),
    }));
  }, []);

  const moveDayPoint = useCallback(
    (id: string, lat: number, lng: number) => {
      setPlanner((current) => ({
        ...current,
        days: current.days.map((day) =>
          day.id === id ? { ...day, lat, lng } : day,
        ),
      }));
      setNotice("Stop moved · update the road distance when checked");
    },
    [],
  );

  const selectDay = useCallback((id: string) => {
    setSelectedDayId(id);
    setMobilePanelOpen(true);
  }, []);

  const moveSelectedDay = (direction: -1 | 1): void => {
    if (selectedDay === undefined) {
      return;
    }
    const currentIndex = planner.days.findIndex(
      (day) => day.id === selectedDay.id,
    );
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= planner.days.length) {
      return;
    }
    const nextDays = [...planner.days];
    [nextDays[currentIndex], nextDays[targetIndex]] = [
      nextDays[targetIndex],
      nextDays[currentIndex],
    ];
    setPlanner({ ...planner, days: updateDayNumbers(nextDays) });
  };

  const deleteSelectedDay = (): void => {
    if (selectedDay === undefined) {
      return;
    }
    setPlanner({
      ...planner,
      days: updateDayNumbers(
        planner.days.filter((day) => day.id !== selectedDay.id),
      ),
    });
    setSelectedDayId(null);
  };

  const addDay = (): void => {
    const previous = planner.days.at(-1);
    const nextDay: RouteDay = {
      id: `day-${crypto.randomUUID()}`,
      day: planner.days.length + 1,
      from: previous?.to ?? "Taipei",
      to: "New stop",
      lat: previous?.lat ?? 23.7,
      lng: previous?.lng ?? 121,
      distance: 60,
      climbing: 600,
      surface: "Choose quiet roads or cycle paths",
      camp: "Find a legal campsite",
      onsen: null,
      note: "Drag this numbered stop on the map, then fill in the details.",
      difficulty: "steady",
    };
    setPlanner({ ...planner, days: [...planner.days, nextDay] });
    setSelectedDayId(nextDay.id);
    setMobilePanelOpen(true);
  };

  const toggleKind = (kind: PlaceKind): void => {
    setVisibleKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  };

  const resetPlan = (): void => {
    if (window.confirm("Reset every route and itinerary change?")) {
      setPlanner(initialState);
      setSelectedDayId(null);
      localStorage.removeItem("lantern-planner");
      setNotice("Starter plan restored");
    }
  };

  return (
    <main>
      <header className="masthead">
        <a className="brand" href="#" aria-label="Lantern home">
          <span className="brand__mark">
            <Bike size={20} strokeWidth={2.3} />
          </span>
          <span>
            <strong>Lantern</strong>
            <small>Taiwan on two wheels</small>
          </span>
        </a>
        <div className="masthead__route">
          <span>Clockwise · {planner.days.length} days</span>
          <strong>{planner.title}</strong>
        </div>
        <div className="masthead__actions">
          <button
            className="button button--quiet"
            onClick={() => {
              savePlanner(planner);
              setNotice("Plan saved in this browser");
            }}
          >
            <Save size={16} /> <span>Save</span>
          </button>
          <button
            className="button"
            onClick={() => downloadGpx(planner.days)}
          >
            <Download size={16} /> <span>Export GPX</span>
          </button>
          <button
            className="mobile-menu"
            onClick={() => setMobilePanelOpen((open) => !open)}
            aria-label="Open itinerary"
          >
            {mobilePanelOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside
          className={`sidebar${mobilePanelOpen ? " is-open" : ""}`}
          aria-label="Daily itinerary"
        >
          {showSources ? (
            <SourcesPanel
              sources={planner.sources}
              onClose={() => setShowSources(false)}
            />
          ) : selectedDay === undefined ? (
            <>
              <div className="sidebar__intro">
                <div>
                  <p className="eyebrow">The long way round</p>
                  <h1>Ride where the island breathes.</h1>
                </div>
                <p>
                  Pacific coast south. Hot springs often. Camp most nights.
                  Return through Taiwan’s green, high centre.
                </p>
              </div>

              <div className="totals" aria-label="Route totals">
                <span>
                  <strong>{formatNumber(totals.distance)}</strong> km
                </span>
                <span>
                  <strong>{formatNumber(totals.climbing)}</strong> m up
                </span>
                <span>
                  <strong>{totals.camps}</strong> camps
                </span>
                <span>
                  <strong>{totals.onsens}</strong> soaks
                </span>
              </div>

              <button
                className="sources-button"
                onClick={() => setShowSources(true)}
              >
                <ScrollText size={16} />
                <span>
                  <strong>{planner.sources.length} credited sources</strong>
                  <small>Official guidance + rider field reports</small>
                </span>
                <ChevronRight size={16} />
              </button>

              <div className="itinerary-heading">
                <span>
                  <CalendarDays size={17} /> Daily plan
                </span>
                <button onClick={addDay}>
                  <Plus size={16} /> Add day
                </button>
              </div>

              <div className="day-list">
                {planner.days.map((day) => (
                  <button
                    key={day.id}
                    className="day-row"
                    onClick={() => selectDay(day.id)}
                  >
                    <span className={`day-index day-index--${day.difficulty}`}>
                      {String(day.day).padStart(2, "0")}
                    </span>
                    <span className="day-main">
                      <strong>{day.to}</strong>
                      <small>
                        {day.distance} km · {formatNumber(day.climbing)} m
                      </small>
                      <em>
                        <TentTree size={13} /> {day.camp}
                      </em>
                    </span>
                    {day.onsen !== null && (
                      <span className="onsen-badge" title={day.onsen}>
                        <Flame size={14} />
                      </span>
                    )}
                    <ChevronRight className="row-arrow" size={17} />
                  </button>
                ))}
              </div>
              <button className="reset" onClick={resetPlan}>
                <RotateCcw size={14} /> Restore starter route
              </button>
            </>
          ) : (
            <DayEditor
              day={selectedDay}
              onChange={updateDay}
              onClose={() => setSelectedDayId(null)}
              onMove={moveSelectedDay}
              onDelete={deleteSelectedDay}
            />
          )}
        </aside>

        <section className="map-shell">
          <MapView
            days={planner.days}
            places={planner.places}
            sources={planner.sources}
            visibleKinds={visibleKinds}
            selectedDayId={selectedDayId}
            onSelectDay={selectDay}
            onMoveDay={moveDayPoint}
          />

          <div className="map-title">
            <span>TAIWAN · 臺灣</span>
            <strong>23.6978° N</strong>
          </div>

          <div className="map-tools" aria-label="Map filters">
            {allKinds.map((kind) => (
              <button
                key={kind}
                className={visibleKinds.has(kind) ? "is-active" : ""}
                onClick={() => toggleKind(kind)}
              >
                {kind === "camp" && <TentTree size={16} />}
                {kind === "onsen" && <Flame size={16} />}
                {kind === "supply" && <MapPinned size={16} />}
                {kind === "caution" && <AlertTriangle size={16} />}
                <span>{kindLabels[kind]}</span>
              </button>
            ))}
          </div>

          <div className="map-tip">
            <Mountain size={17} />
            <span>
              <strong>Shape the route</strong>
              Drag a numbered overnight stop. Use the cycle map to trace
              marked paths.
            </span>
            <button
              onClick={() =>
                setNotice(
                  "The line is a planning sketch, not turn-by-turn navigation",
                )
              }
              aria-label="Route information"
            >
              <Info size={17} />
            </button>
          </div>

          <div className="safety-note">
            <AlertTriangle size={17} />
            <span>
              Central mountain roads can close after storms. Check official
              road conditions before every high day.
            </span>
          </div>
        </section>
      </section>

      {notice !== null && <div className="toast">{notice}</div>}
    </main>
  );
}

export default App;
