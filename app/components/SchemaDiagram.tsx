"use client";

import {
  ReactFlow,
  Background,
  Edge,
  Node,
  Position,
  Handle,
} from "@xyflow/react";
import { Database } from "lucide-react";
import "@xyflow/react/dist/style.css";

const TableNode = ({ data }: any) => {
  return (
    <div className="bg-ms-card border border-ms-border rounded shadow-lg min-w-[200px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-ms-text-muted !w-2 !h-2 !border-none"
      />
      <div className="bg-ms-bg/80 px-3 py-2 border-b border-ms-border font-ms font-bold text-xs text-white uppercase flex items-center gap-2">
        <Database className="w-3 h-3 text-ms-green" />
        {data.name}
      </div>
      <div className="p-2 flex flex-col gap-1">
        {data.fields.map((field: string, idx: number) => {
          const isFk =
            field.toLowerCase().includes("fk") ||
            field.toLowerCase().includes("foreign key");
          const isPk =
            field.toLowerCase().includes("pk") ||
            field.toLowerCase().includes("primary key");
          return (
            <div
              key={idx}
              className="flex items-center justify-between text-[10px] font-mono"
            >
              <span
                className={`truncate ${isPk ? "text-ms-yellow font-bold" : isFk ? "text-ms-green" : "text-ms-text-muted"}`}
              >
                {field.split(" ")[0]}
              </span>
              <span className="text-ms-text-muted opacity-50 ml-2">
                {field.split(" ").slice(1).join(" ")}
              </span>
            </div>
          );
        })}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-ms-text-muted !w-2 !h-2 !border-none"
      />
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

export function VisualSchemaDiagram({ tables }: { tables: any[] }) {
  const nodes: Node[] = tables.map((table, idx) => ({
    id: table.name,
    type: "tableNode",
    position: { x: (idx % 2) * 350, y: Math.floor(idx / 2) * 250 },
    data: { name: table.name, fields: table.fields },
  }));

  const edges: Edge[] = [];
  tables.forEach((table) => {
    table.fields.forEach((field: string) => {
      const fieldLower = field.toLowerCase();
      const fieldName = fieldLower.split(" ")[0];

      if (
        fieldLower.includes("fk") ||
        fieldLower.includes("references") ||
        fieldName.endsWith("_id")
      ) {
        const targetTable = tables.find(
          (t) =>
            t.name !== table.name &&
            (fieldName === `${t.name}_id` ||
              fieldName === `${t.name.slice(0, -1)}_id` ||
              fieldName === t.name),
        );

        if (targetTable) {
          edges.push({
            id: `e-${table.name}-${targetTable.name}-${fieldName}`,
            source: table.name,
            target: targetTable.name,
            animated: true,
            style: { stroke: "#00f076", strokeWidth: 1.5, opacity: 0.6 },
          });
        }
      }
    });
  });

  return (
    <div className="h-[500px] w-full bg-[#111] border border-ms-border rounded-lg relative overflow-hidden mt-4">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Background color="#333" gap={16} />
      </ReactFlow>
    </div>
  );
}
