import { useState, useRef, useCallback, useEffect } from "react";
import { FieldDiagram, FieldElement } from "@/hooks/useCustomExercises";
import {
  Circle, Triangle, Target, ArrowRight, Square, Trash2, RotateCw, Undo2,
} from "lucide-react";
import { motion } from "framer-motion";

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

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-20), { ...diagram, elements: [...diagram.elements] }]);
  }, [diagram]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onChange(prev);
  };

  const getSvgPoint = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * FIELD_W,
      y: ((clientY - rect.top) / rect.height) * FIELD_H,
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
      id,
      type: preset.type,
      x: 180 + Math.random() * 40,
      y: 130 + Math.random() * 40,
      label,
      ...preset.defaultProps,
    };
    onChange({ ...diagram, elements: [...diagram.elements, newEl] });
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    pushHistory();
    onChange({ ...diagram, elements: diagram.elements.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: string, isEnd?: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = getSvgPoint(e);
    const el = diagram.elements.find((x) => x.id === id);
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
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(10, Math.min(FIELD_W - 10, ((clientX - rect.left) / rect.width) * FIELD_W - dragging.offsetX));
    const y = Math.max(10, Math.min(FIELD_H - 10, ((clientY - rect.top) / rect.height) * FIELD_H - dragging.offsetY));

    onChange({
      ...diagram,
      elements: diagram.elements.map((el) => {
        if (el.id !== dragging.id) return el;
        if (dragging.isEnd) return { ...el, endX: x, endY: y };
        // Move arrow endpoints relative
        if (el.type === "arrow" && !dragging.isEnd) {
          const dx = x - el.x;
          const dy = y - el.y;
          return { ...el, x, y, endX: (el.endX || el.x + 50) + dx, endY: (el.endY || el.y) + dy };
        }
        return { ...el, x, y };
      }),
    });
  }, [dragging, diagram, onChange]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

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

  const renderElement = (el: FieldElement) => {
    const isSelected = el.id === selectedId;
    const cursor = dragging?.id === el.id ? "grabbing" : "grab";

    switch (el.type) {
      case "cone":
        return (
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}
          >
            <polygon
              points="0,-12 9,8 -9,8"
              fill={el.color || "#f97316"}
              stroke={isSelected ? "#fff" : "none"}
              strokeWidth="2"
            />
          </g>
        );
      case "player":
        return (
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}
          >
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
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}
          >
            {isSelected && <circle r="12" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3,2" />}
            <circle r="7" fill="#fff" stroke="#1a1a2e" strokeWidth="1.5" />
            <circle r="2.5" fill="#1a1a2e" />
          </g>
        );
      case "goal":
        return (
          <g
            key={el.id}
            transform={`translate(${el.x}, ${el.y}) rotate(${el.rotation || 0})`}
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}
          >
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
            {/* Wider hit area */}
            <line
              x1={el.x} y1={el.y} x2={endX} y2={endY}
              stroke="transparent" strokeWidth="12"
              onMouseDown={(e) => handlePointerDown(e, el.id)}
              onTouchStart={(e) => handlePointerDown(e, el.id)}
              style={{ cursor }}
            />
            <line
              x1={el.x} y1={el.y} x2={endX} y2={endY}
              stroke={isSelected ? "#fff" : (el.color || "#fff")}
              strokeWidth={isSelected ? 3 : 2}
              strokeDasharray={dasharray}
              markerEnd={`url(#ah-${el.id})`}
              style={{ pointerEvents: "none" }}
            />
            {/* Drag handle for end */}
            <circle
              cx={endX} cy={endY} r="6"
              fill={el.color || "#fff"}
              stroke="#fff" strokeWidth="1.5"
              onMouseDown={(e) => handlePointerDown(e, el.id, true)}
              onTouchStart={(e) => handlePointerDown(e, el.id, true)}
              style={{ cursor, opacity: isSelected ? 1 : 0.5 }}
            />
          </g>
        );
      }
      case "zone": {
        const w = el.width || 60;
        const h = el.height || 40;
        return (
          <rect
            key={el.id}
            x={el.x - w / 2}
            y={el.y - h / 2}
            width={w}
            height={h}
            fill={el.color || "rgba(59,130,246,0.15)"}
            stroke={isSelected ? "#fff" : (el.color || "rgba(59,130,246,0.4)")}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeDasharray="4,3"
            rx="2"
            onMouseDown={(e) => handlePointerDown(e, el.id)}
            onTouchStart={(e) => handlePointerDown(e, el.id)}
            style={{ cursor }}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5">
        {ELEMENT_PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => addElement(preset)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-sm hover:text-foreground transition-colors"
          >
            {preset.icon}
            {preset.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="w-8 h-8 flex items-center justify-center rounded-sm bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        {selectedId && (
          <button
            onClick={deleteSelected}
            className="w-8 h-8 flex items-center justify-center rounded-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-md overflow-hidden border border-border"
        style={{ touchAction: "none" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
          className="w-full"
          style={{ background: "#2d6a30", aspectRatio: `${FIELD_W}/${FIELD_H}` }}
          onClick={() => setSelectedId(null)}
        >
          {/* Field markings */}
          <rect x="10" y="10" width="380" height="280" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1="200" y1="10" x2="200" y2="290" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="200" cy="150" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="200" cy="150" r="3" fill="rgba(255,255,255,0.3)" />
          <rect x="10" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          <rect x="330" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

          {/* Elements - zones first, then rest */}
          {diagram.elements.filter((e) => e.type === "zone").map(renderElement)}
          {diagram.elements.filter((e) => e.type === "arrow").map(renderElement)}
          {diagram.elements.filter((e) => e.type !== "zone" && e.type !== "arrow").map(renderElement)}
        </svg>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag elements to position them. Click to select, then delete.
      </p>
    </div>
  );
}
