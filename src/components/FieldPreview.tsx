import { FieldDiagram, FieldElement } from "@/hooks/useCustomExercises";

interface FieldPreviewProps {
  diagram: FieldDiagram;
  className?: string;
}

function renderElement(el: FieldElement, scale: number = 1) {
  const x = el.x * scale;
  const y = el.y * scale;

  switch (el.type) {
    case "cone":
      return (
        <g key={el.id} transform={`translate(${x}, ${y})`}>
          <polygon
            points="0,-10 7,6 -7,6"
            fill={el.color || "#f97316"}
            stroke="#fff"
            strokeWidth="1"
          />
        </g>
      );
    case "player":
      return (
        <g key={el.id} transform={`translate(${x}, ${y})`}>
          <circle r="10" fill={el.color || "#3b82f6"} stroke="#fff" strokeWidth="1.5" />
          {el.label && (
            <text y="4" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
              {el.label}
            </text>
          )}
        </g>
      );
    case "ball":
      return (
        <g key={el.id} transform={`translate(${x}, ${y})`}>
          <circle r="6" fill="#fff" stroke="#1a1a2e" strokeWidth="1.5" />
          <circle r="2" fill="#1a1a2e" />
        </g>
      );
    case "goal":
      return (
        <g key={el.id} transform={`translate(${x}, ${y}) rotate(${el.rotation || 0})`}>
          <rect x="-20" y="-3" width="40" height="6" fill="none" stroke="#fff" strokeWidth="2" />
          <rect x="-20" y="-8" width="40" height="5" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
        </g>
      );
    case "arrow": {
      const endX = (el.endX || el.x + 50) * scale;
      const endY = (el.endY || el.y) * scale;
      const dasharray = el.arrowStyle === "dashed" ? "6,4" : el.arrowStyle === "wavy" ? "2,4" : "none";
      return (
        <g key={el.id}>
          <defs>
            <marker id={`arrowhead-${el.id}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={el.color || "#fff"} />
            </marker>
          </defs>
          <line
            x1={x} y1={y} x2={endX} y2={endY}
            stroke={el.color || "#fff"}
            strokeWidth="2"
            strokeDasharray={dasharray}
            markerEnd={`url(#arrowhead-${el.id})`}
          />
        </g>
      );
    }
    case "zone": {
      const w = (el.width || 60) * scale;
      const h = (el.height || 40) * scale;
      return (
        <rect
          key={el.id}
          x={x - w / 2}
          y={y - h / 2}
          width={w}
          height={h}
          fill={el.color || "rgba(59,130,246,0.15)"}
          stroke={el.color || "rgba(59,130,246,0.4)"}
          strokeWidth="1.5"
          strokeDasharray="4,3"
          rx="2"
        />
      );
    }
    default:
      return null;
  }
}

export function FieldPreview({ diagram, className = "" }: FieldPreviewProps) {
  return (
    <svg viewBox="0 0 400 300" className={className} style={{ background: "#2d6a30" }}>
      {/* Field markings */}
      <rect x="10" y="10" width="380" height="280" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <line x1="200" y1="10" x2="200" y2="290" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <circle cx="200" cy="150" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <circle cx="200" cy="150" r="3" fill="rgba(255,255,255,0.3)" />
      {/* Penalty areas */}
      <rect x="10" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <rect x="330" y="90" width="60" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

      {/* Elements */}
      {diagram.elements.map((el) => renderElement(el, 1))}
    </svg>
  );
}
