import { useState, useRef, useCallback, useEffect } from "react";
import { FieldDiagram, FieldElement, FieldStep } from "@/hooks/useCustomExercises";
import {
  Circle, Triangle, Target, ArrowRight, Square, Trash2, Undo2,
  Plus, Play, Pause, Camera, Layers,
} from "lucide-react";

const FIELD_W = 400;
const FIELD_H = 300;

const ELEMENT_PRESETS: { type: FieldElement["type"]; label: string; icon: React.ReactNode; defaultProps: Partial<FieldElement> }[] = [
  { type: "player", label: "Player", icon: <Circle className="w-4 h-4" />, defaultProps: { color: "#3b82f6" } },
  { type: "player", label: "Opponent", icon: <Circle className="w-4 h-4" />, defaultProps: { color: "#ef4444" } },
  { type: "cone", label: "Cone", icon: <Triangle className="w-4 h-4" />, defaultProps: { color: "#f97316" } },
  { type: "ball", label: "Ball", icon: <Target className="w-4 h-4" />, defaultProps: {} },
  { type: "arrow", label: "Arrow", icon: <ArrowRight className="w-4 h-4" />, defaultProps: { endX: 250, endY: 150, arrowStyle: "solid" } },
  { type: "arrow", label: "Pass", icon: <ArrowRight className="w-4 h-4" />, defaultProps: { endX: 250, endY: 150, arrowStyle: "dashed", color: "#fbbf24" } },
  { type: "zone", label: "Zone", icon: <Square className="w-4 h-4" />, defaultProps: { width: 60, height: 40 } },
  { type: "goal", label: "Goal", icon: <Square className="w-4 h-4" />, defaultProps: { rotation: 0 } },
];

interface FieldEditorProps {
  diagram: FieldDiagram;
  onChange: (diagram: FieldDiagram) => void;
}

export function FieldEditor({ diagram, onChange }: FieldEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; isEnd?: boolean } | null>(null);
  const [history, setHistory] = useState<FieldDiagram[]>([]);
  const [playerCounter, setPlayerCounter] = useState(1);

  // Step state
  const steps = diagram.steps ?? [];
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Resolve display elements (apply overrides for currentStep)
  const overrides = steps[currentStep]?.elementOverrides ?? {};
  const displayElements = diagram.elements.map((el) =>
    overrides[el.id] ? { ...el, ...overrides[el.id] } : el
  );

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-20), JSON.parse(JSON.stringify(diagram))]);
  }, [diagram]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
  };

  const getSvgPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * FIELD_W,
      y: ((cy - rect.top) / rect.height) * FIELD_H,
    };
  };

  const addElement = (preset: typeof ELEMENT_PRESETS[0]) => {
    pushHistory();
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let label: string | undefined;
    if (preset.type === "player") {
      label = String(playerCounter);
      setPlayerCounter((c) => c + 1);
    }
    const newEl: FieldElement = {
      id, type: preset.type,
      x: 180 + Math.random() * 40,
      y: 130 + Math.random() * 40,
      label, ...preset.defaultProps,
    };
    onChange({ ...diagram, elements: [...diagram.elements, newEl] });
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory();
    onChange({
      ...diagram,
      elements: diagram.elements.filter((e) => e.id !== selectedId),
      steps: (diagram.steps ?? []).map((s) => {
        const { [selectedId]: _, ...rest } = s.elementOverrides;
        return { ...s, elementOverrides: rest };
      }),
    });
    setSelectedId(null);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: string, isEnd?: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = getSvgPoint(e);
    const el = displayElements.find((x) => x.id === id);
    if (!el) return;
    const refX = isEnd ? (el.endX || el.x + 50) : el.x;
    const refY = isEnd ? (el.endY || el.y) : el.y;
    setDragging({ id, offsetX: pt.x - refX, offsetY: pt.y - refY, isEnd });
    setSelectedId(id);
    pushHistory();
  };

  const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging || !svgRef.current) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(10, Math.min(FIELD_W - 10, ((cx - rect.left) / rect.width) * FIELD_W - dragging.offsetX));
    const y = Math.max(10, Math.min(FIELD_H - 10, ((cy - rect.top) / rect.height) * FIELD_H - dragging.offsetY));

    // If on a step, write to step override; otherwise write to base element
    const onStep = currentStep > 0 && steps[currentStep];
    if (onStep) {
      const baseEl = diagram.elements.find((e) => e.id === dragging.id);
      if (!baseEl) return;
      const newOverride: Partial<FieldElement> = dragging.isEnd
        ? { endX: x, endY: y }
        : (baseEl.type === "arrow"
            ? (() => {
                const dx = x - baseEl.x, dy = y - baseEl.y;
                return { x, y, endX: (baseEl.endX || baseEl.x + 50) + dx, endY: (baseEl.endY || baseEl.y) + dy };
              })()
            : { x, y });
      const newSteps = steps.map((s, i) => i === currentStep
        ? { ...s, elementOverrides: { ...s.elementOverrides, [dragging.id]: { ...(s.elementOverrides[dragging.id] || {}), ...newOverride } } }
        : s);
      onChange({ ...diagram, steps: newSteps });
    } else {
      onChange({
        ...diagram,
        elements: diagram.elements.map((el) => {
          if (el.id !== dragging.id) return el;
          if (dragging.isEnd) return { ...el, endX: x, endY: y };
          if (el.type === "arrow") {
            const dx = x - el.x, dy = y - el.y;
            return { ...el, x, y, endX: (el.endX || el.x + 50) + dx, endY: (el.endY || el.y) + dy };
          }
          return { ...el, x, y };
        }),
      });
    }
  }, [dragging, diagram, onChange, currentStep, steps]);

  const handlePointerUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
      return () => {
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseup", handlePointerUp);
        window.removeEventListener("touchmove", handlePointerMove);
        window.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [dragging, handlePointerMove, handlePointerUp]);

  // STEP actions
  const addStep = () => {
    pushHistory();
    const newStep: FieldStep = {
      id: `st-${Date.now()}`,
      label: `Step ${steps.length + 1}`,
      durationMs: 1200,
      elementOverrides: {},
    };
    onChange({ ...diagram, steps: [...steps, newStep] });
    setCurrentStep(steps.length); // jump to new (steps.length is current new index since not yet in state)
    setTimeout(() => setCurrentStep((steps.length) + (steps.length === 0 ? 0 : 0)), 0);
  };

  const deleteStep = (idx: number) => {
    pushHistory();
    const newSteps = steps.filter((_, i) => i !== idx);
    onChange({ ...diagram, steps: newSteps });
    setCurrentStep((c) => Math.max(0, Math.min(c, newSteps.length - 1)));
  };

  // Play animation
  useEffect(() => {
    if (!playing || steps.length === 0) return;
    const dur = steps[currentStep]?.durationMs ?? 1200;
    const t = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((c) => c + 1);
      } else {
        setPlaying(false);
      }
    }, dur);
    return () => clearTimeout(t);
  }, [playing, currentStep, steps]);

  const renderElement = (el: FieldElement) => {
    const isSelected = el.id === selectedId;
    const cursor = dragging?.id === el.id ? "grabbing" : "grab";

    switch (el.type) {
      case "cone":
        return (
          <g key={el.id} transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor, transition: "transform 0.4s ease" }}>
            <polygon points="0,-12 9,8 -9,8" fill={el.color || "#f97316"} stroke={isSelected ? "#fff" : "none"} strokeWidth="2" />
          </g>
        );
      case "player":
        return (
          <g key={el.id} transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor, transition: "transform 0.4s ease" }}>
            {isSelected && <circle r="16" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
            <circle r="12" fill={el.color || "#3b82f6"} stroke="#fff" strokeWidth="1.5" />
            {el.label && (
              <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" style={{ pointerEvents: "none" }}>
                {el.label}
              </text>
            )}
          </g>
        );
      case "ball":
        return (
          <g key={el.id} transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor, transition: "transform 0.4s ease" }}>
            {isSelected && <circle r="12" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
            <circle r="7" fill="#fff" stroke="#1a1a2e" strokeWidth="1.5" />
            <circle r="2.5" fill="#1a1a2e" />
          </g>
        );
      case "goal":
        return (
          <g key={el.id} transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}>
            {isSelected && <rect x="-24" y="-12" width="48" height="18" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
            <rect x="-22" y="-4" width="44" height="8" fill="none" stroke="#fff" strokeWidth="2.5" />
            <rect x="-22" y="-10" width="44" height="6" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          </g>
        );
      case "arrow": {
        const endX = el.endX || el.x + 50;
        const endY = el.endY || el.y;
        const dasharray = el.arrowStyle === "dashed" ? "6,4" : el.arrowStyle === "wavy" ? "2,4" : "none";
        return (
          <g key={el.id}>
            <defs>
              <marker id={`ah-${el.id}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={el.color || "#fff"} />
              </marker>
            </defs>
            <line x1={el.x} y1={el.y} x2={endX} y2={endY}
              stroke="transparent" strokeWidth="12"
              onMouseDown={(e) => handlePointerDown(e, el.id)}
              onTouchStart={(e) => handlePointerDown(e, el.id)}
              style={{ cursor }} />
            <line x1={el.x} y1={el.y} x2={endX} y2={endY}
              stroke={isSelected ? "#fff" : (el.color || "#fff")}
              strokeWidth={isSelected ? 3 : 2}
              strokeDasharray={dasharray}
              markerEnd={`url(#ah-${el.id})`}
              style={{ pointerEvents: "none", transition: "all 0.4s ease" }} />
            <circle cx={endX} cy={endY} r="6" fill={el.color || "#fff"} stroke="#fff" strokeWidth="1.5"
              onMouseDown={(e) => handlePointerDown(e, el.id, true)}
              onTouchStart={(e) => handlePointerDown(e, el.id, true)}
              style={{ cursor, opacity: isSelected ? 1 : 0.5, transition: "all 0.4s ease" }} />
          </g>
        );
      }
      case "zone": {
        const w = el.width || 60, h = el.height || 40;
        return (
          <rect key={el.id} x={el.x - w / 2} y={el.y - h / 2} width={w} height={h}
            fill={el.color || "rgba(59,130,246,0.15)"}
            stroke={isSelected ? "#fff" : (el.color || "rgba(59,130,246,0.4)")}
            strokeWidth={isSelected ? 2 : 1.5} strokeDasharray="4,3" rx="2"
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor, transition: "all 0.4s ease" }} />
        );
      }
      default: return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5">
        {ELEMENT_PRESETS.map((preset, i) => (
          <button key={i} onClick={() => addElement(preset)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-sm hover:text-foreground transition-colors">
            {preset.icon}{preset.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={undo} disabled={history.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-sm bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        {selectedId && (
          <button onClick={deleteSelected}
            className="w-8 h-8 flex items-center justify-center rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative rounded-md overflow-hidden border border-border" style={{ touchAction: "none" }}>
        <svg ref={svgRef} viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} className="w-full"
          style={{ background: "#2d6a30", aspectRatio: `${FIELD_W}/${FIELD_H}` }}
          onClick={() => setSelectedId(null)}>
          <rect x="10" y="10" width="380" height="280" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="200" y1="10" x2="200" y2="290" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="200" cy="150" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="200" cy="150" r="3" fill="rgba(255,255,255,0.3)" />
          <rect x="10" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <rect x="330" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

          {displayElements.filter((e) => e.type === "zone").map(renderElement)}
          {displayElements.filter((e) => e.type === "arrow").map(renderElement)}
          {displayElements.filter((e) => e.type !== "zone" && e.type !== "arrow").map(renderElement)}
        </svg>
      </div>

      {/* Steps timeline */}
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <Layers className="w-3.5 h-3.5" />
            Animation Steps
            <span className="text-muted-foreground font-mono">({steps.length})</span>
          </div>
          <div className="flex items-center gap-1">
            {steps.length > 0 && (
              <button
                onClick={() => { if (!playing) setCurrentStep(0); setPlaying((p) => !p); }}
                className="flex items-center gap-1 px-2 py-1 rounded-sm bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {playing ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Play</>}
              </button>
            )}
            <button onClick={addStep}
              className="flex items-center gap-1 px-2 py-1 rounded-sm bg-muted text-foreground text-xs font-medium hover:bg-muted/70 transition-colors">
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>
        </div>
        {steps.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Add a step to capture a new position. Move elements while on a step to record movement. Click Play to animate.</p>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCurrentStep(0)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-sm text-[11px] font-mono whitespace-nowrap transition-all ${currentStep === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <Camera className="w-3 h-3" /> Initial
            </button>
            {steps.map((s, idx) => (
              <div key={s.id} className="relative group">
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={`px-2.5 py-1.5 rounded-sm text-[11px] font-mono whitespace-nowrap transition-all ${currentStep === idx && currentStep > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  {s.label || `Step ${idx + 1}`}
                </button>
                <button
                  onClick={() => deleteStep(idx)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] transition-opacity"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag elements to position them. Add steps and move elements to record an animation. Tap "Play" to preview.
      </p>
    </div>
  );
}
