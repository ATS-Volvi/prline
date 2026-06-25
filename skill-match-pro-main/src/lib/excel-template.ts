import * as XLSX from "xlsx";

export type SkillUploadRow = {
  employee_code: string;
  skill_code: string;
  skill_level: string;
  certified_on: string;
  expires_on: string;
  certified_by: string;
};

export function buildSkillTemplate(skillCodes: string[]): Blob {
  const wb = XLSX.utils.book_new();
  const header = ["employee_code", "skill_code", "skill_level", "certified_on", "expires_on", "certified_by"];
  const ws = XLSX.utils.aoa_to_sheet([
    header,
    ["EMP-0001", skillCodes[0] ?? "SKILL_CODE", "OPERATOR", "2024-01-01", "2027-01-01", "Plant Trainer"],
  ]);
  ws["!cols"] = header.map(() => ({ wch: 20 }));
  // Build a helper sheet with valid values for reference
  const ref = XLSX.utils.aoa_to_sheet([
    ["Valid skill_code values"],
    ...skillCodes.map((c) => [c]),
    [""],
    ["Valid skill_level values"],
    ["TRAINEE"],
    ["OPERATOR"],
    ["CERTIFIED"],
    ["EXPERT"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Skills");
  XLSX.utils.book_append_sheet(wb, ref, "Valid Values");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function parseSkillFile(file: File): Promise<SkillUploadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<SkillUploadRow>(ws, { defval: "", raw: false });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(rows: Record<string, unknown>[], sheetName: string, fileName: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}