// Client-safe helpers shared by the page and LaunchKit rendering.
// (app/security.ts is server-only, so these live separately for client use.)

export type SchemaTable = { name: string; fields: string[]; purpose: string };

// Client-side HTML escaper for the PDF builder. Model output must never reach
// innerHTML unescaped.
export function escapeHtmlC(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fallback SQL generator for older cached/saved LaunchKits that lack a ready
// sqlSchema string — builds CREATE TABLE statements from the table field lists.
export function generateSqlFallback(tables: SchemaTable[]): string {
  if (!tables || tables.length === 0) return "-- No tables defined";

  let sql = `-- PostgreSQL / Supabase Schema SQL (Generated Fallback)\n`;
  sql += `-- Created from target launch kit table requirements\n\n`;

  tables.forEach((table) => {
    sql += `-- Table: ${table.name}\n`;
    sql += `-- Purpose: ${table.purpose}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.name} (\n`;

    const parsedFields = table.fields.map((field) => {
      const cleanField = field.trim();
      const colonIndex = cleanField.indexOf(":");

      let name = "";
      let remaining = "";

      if (colonIndex !== -1) {
        name = cleanField.substring(0, colonIndex).trim();
        remaining = cleanField.substring(colonIndex + 1).trim();
      } else {
        const spaceIdx = cleanField.indexOf(" ");
        if (spaceIdx !== -1) {
          name = cleanField.substring(0, spaceIdx).trim();
          remaining = cleanField.substring(spaceIdx + 1).trim();
        } else {
          name = cleanField;
          remaining = "text";
        }
      }

      let sqlName = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!sqlName) sqlName = "column_name";

      let sqlType = "text";
      let constraints = "";
      let comment = remaining;

      const lowerRem = remaining.toLowerCase();

      if (lowerRem.startsWith("uuid")) {
        sqlType = "uuid";
        if (lowerRem.includes("primary")) {
          constraints += " PRIMARY KEY DEFAULT gen_random_uuid()";
        }
      } else if (
        lowerRem.startsWith("text") ||
        lowerRem.startsWith("varchar") ||
        lowerRem.startsWith("string")
      ) {
        sqlType = "text";
        if (lowerRem.includes("unique")) {
          constraints += " UNIQUE";
        }
        if (lowerRem.includes("not null")) {
          constraints += " NOT NULL";
        }
      } else if (
        lowerRem.startsWith("timestamp") ||
        lowerRem.startsWith("date") ||
        lowerRem.startsWith("time")
      ) {
        sqlType = "timestamp with time zone";
        if (
          lowerRem.includes("now") ||
          lowerRem.includes("created_at") ||
          lowerRem.includes("default")
        ) {
          constraints += " DEFAULT now()";
        }
      } else if (
        lowerRem.startsWith("int") ||
        lowerRem.startsWith("num") ||
        lowerRem.startsWith("float") ||
        lowerRem.startsWith("serial")
      ) {
        sqlType = lowerRem.startsWith("serial") ? "serial" : "integer";
        if (lowerRem.includes("primary")) {
          constraints += " PRIMARY KEY";
        }
      } else if (lowerRem.startsWith("bool") || lowerRem.startsWith("boolean")) {
        sqlType = "boolean";
        if (lowerRem.includes("default false")) {
          constraints += " DEFAULT false";
        } else if (lowerRem.includes("default true")) {
          constraints += " DEFAULT true";
        }
      } else {
        const firstWord = remaining.split(/[\s()]/)[0].toLowerCase();
        if (
          [
            "integer",
            "bigint",
            "numeric",
            "boolean",
            "uuid",
            "jsonb",
            "json",
            "date",
            "timestamp",
          ].includes(firstWord)
        ) {
          sqlType = firstWord;
        }
      }

      return `  ${sqlName} ${sqlType}${constraints} -- ${comment}`;
    });

    sql += parsedFields.join(",\n");
    sql += `\n);\n\n`;
  });

  return sql.trim();
}
