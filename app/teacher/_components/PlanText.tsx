import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./plan-text.css";

function normalize(text: string) {
  if (text.includes("\n")) return text;
  return text
    .replace(/\s+(#{1,6}\s)/g, "\n\n$1")
    .replace(/\s+-\s+(?=\*\*)/g, "\n- ")
    .replace(/\s+(\d+\.\s)/g, "\n$1");
}

export default function PlanText({ text }: { text: string }) {
  return (
    <div className="plan-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {normalize(text)}
      </ReactMarkdown>
    </div>
  );
}
