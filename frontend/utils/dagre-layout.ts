import dagre from "@dagrejs/dagre";
import { Position, type Node, type Edge } from "reactflow";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

/**
 * Apply dagre auto-layout to React Flow nodes and edges.
 * Returns repositioned nodes; edges are returned as-is (preserving animated, style, labels, markers).
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === "LR";

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
