import type { ReportKind } from "@/types/api";
import { requestFile } from "./apiClient";

export const reportFileService = {
  pdf: (caseId: string, kind: ReportKind) => requestFile(`/cases/${caseId}/reports/${kind}.pdf`),
};

export function saveFile(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(href), 10000);
}
