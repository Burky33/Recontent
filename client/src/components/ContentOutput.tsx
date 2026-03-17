import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, FileText, Copy, Check, Download, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

const mono = "'IBM Plex Mono', monospace";
const serif = "Georgia, serif";

interface ContentOutputProps {
  content?: {
    createdAt?: string | Date;
    outputs?: {
      linkedin?: string[];
      twitter?: string[];
      x?: string[];
      blog?: string[];
      x_posts?: string[];
      blog_outlines?: string[];
    };
    linkedin_posts?: string[];
    x_posts?: string[];
    x_threads?: string[];
    blog_outlines?: string[];
  };
}

export function ContentOutput({ content }: ContentOutputProps) {
  const outputs = content?.outputs ?? {};

  const linkedin =
    outputs.linkedin ??
    content?.linkedin_posts ??
    (content as any)?.linkedinPosts ??
    [];

  const xPosts =
    outputs.x ??
    outputs.x_posts ??
    outputs.twitter ??
    content?.x_posts ??
    content?.x_threads ??
    (content as any)?.xPosts ??
    (content as any)?.threads ??
    [];

  const blog =
    outputs.blog ??
    outputs.blog_outlines ??
    content?.blog_outlines ??
    (content as any)?.blogOutlines ??
    [];

  if (linkedin.length === 0 && xPosts.length === 0 && blog.length === 0) {
    return (
      <div style={{
        border: "1px dashed rgba(245,242,237,0.15)",
        padding: "48px 24px",
        textAlign: "center",
        background: "rgba(245,242,237,0.02)",
      }}>
        <FileText style={{ width: 40, height: 40, color: "rgba(245,242,237,0.15)", margin: "0 auto 16px" }} />
        <h3 style={{ fontFamily: serif, fontSize: 16, color: "#EDEAE4", margin: "0 0 8px" }}>No outputs yet</h3>
        <p style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.4)", maxWidth: 300, margin: "0 auto" }}>
          Generate some content above to see LinkedIn posts, X posts, and blog outlines.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontFamily: serif, fontSize: 16, color: "#EDEAE4", margin: 0 }}>Generated Results</h3>
        {content?.createdAt && (
          <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.35)" }}>
            {new Date(content.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {linkedin.length > 0 && (
        <PlatformSection
          title="LinkedIn Posts"
          icon={<Linkedin style={{ width: 16, height: 16, color: "#C05746" }} />}
          items={linkedin}
          id="linkedin"
        />
      )}

      {xPosts.length > 0 && (
        <PlatformSection
          title="X Posts"
          icon={
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: "rgba(245,242,237,0.6)" }}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          }
          items={xPosts}
          id="x"
        />
      )}

      {blog.length > 0 && (
        <PlatformSection
          title="Blog Outlines"
          icon={<FileText style={{ width: 16, height: 16, color: "#C05746" }} />}
          items={blog}
          id="blog"
        />
      )}
    </div>
  );
}

function PlatformSection({
  title,
  icon,
  items,
  id
}: {
  title: string;
  icon: React.ReactNode;
  items: any;
  id: string;
}) {
  const [open, setOpen] = useState(id === "linkedin");
  const [copiedAll, setCopiedAll] = useState(false);

  const normalizedItems = useMemo(() => normalizeItems(items), [items]);

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = normalizedItems.join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadTxt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = normalizedItems.join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = id === "linkedin" ? "linkedin-posts.txt" : id === "x" ? "x-posts.txt" : "blog-outlines.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ border: "1px solid rgba(245,242,237,0.1)", background: "rgba(245,242,237,0.02)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          cursor: "pointer",
          borderBottom: open ? "1px solid rgba(245,242,237,0.08)" : "none",
        }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#EDEAE4", letterSpacing: "0.06em" }}>
            {title} ({normalizedItems.length})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {normalizedItems.length > 0 && (
            <>
              <button
                onClick={handleDownloadTxt}
                style={{
                  fontFamily: mono, fontSize: 10, letterSpacing: "0.08em",
                  color: "rgba(245,242,237,0.4)", background: "transparent",
                  border: "1px solid rgba(245,242,237,0.12)", padding: "4px 10px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Download style={{ width: 10, height: 10 }} />
                TXT
              </button>

              <button
                onClick={handleCopyAll}
                style={{
                  fontFamily: mono, fontSize: 10, letterSpacing: "0.08em",
                  color: copiedAll ? "#C05746" : "rgba(245,242,237,0.4)", background: "transparent",
                  border: "1px solid rgba(245,242,237,0.12)", padding: "4px 10px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {copiedAll ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
                {copiedAll ? "Copied" : "Copy All"}
              </button>
            </>
          )}

          <ChevronDown style={{
            width: 14, height: 14, color: "rgba(245,242,237,0.3)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }} />
        </div>
      </div>

      {open && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {normalizedItems.map((item: string, idx: number) => (
            <EditableCard key={idx} initialContent={item} index={idx} type={id === "blog" ? "blog" : "post"} />
          ))}
        </div>
      )}
    </div>
  );
}

function EditableCard({
  initialContent,
  index,
  type = "post"
}: {
  initialContent: string;
  index: number;
  type?: "post" | "blog";
}) {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      border: "1px solid rgba(245,242,237,0.08)",
      background: "rgba(245,242,237,0.03)",
      padding: "14px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", color: "rgba(245,242,237,0.3)", textTransform: "uppercase" }}>
          {type === "blog" ? `Outline ${index + 1}` : `Option ${index + 1}`}
        </span>

        <button
          onClick={handleCopy}
          style={{
            fontFamily: mono, fontSize: 10, letterSpacing: "0.08em",
            color: copied ? "#C05746" : "rgba(245,242,237,0.35)",
            background: "transparent", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {copied ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%", minHeight: 120, background: "transparent",
          border: "none", outline: "none", resize: "vertical",
          fontFamily: mono, fontSize: 12, color: "#EDEAE4",
          lineHeight: 1.7, whiteSpace: "pre-wrap", boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function normalizeItems(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        return item.post || item.text || item.content || item.value || JSON.stringify(item);
      }
      return String(item);
    });
  }
  if (typeof val === "string") return [val];
  if (typeof val === "object" && val !== null) return [JSON.stringify(val)];
  return [];
}