import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Linkedin,
  Twitter,
  FileText,
  Copy,
  Check,
  Download
} from "lucide-react";
import { useMemo, useState } from "react";

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
      <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No outputs yet</h3>
        <p className="text-slate-500 max-w-sm mx-auto mt-2">
          Generate some content above to see LinkedIn posts, X posts, and blog outlines.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Generated Results</h3>

        {content?.createdAt && (
          <span className="text-sm text-slate-500">
            Created {new Date(content.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="linkedin">
        {linkedin.length > 0 && (
          <PlatformSection
            title="LinkedIn Posts"
            icon={<Linkedin className="w-5 h-5 text-blue-600" />}
            items={linkedin}
            id="linkedin"
          />
        )}

        {xPosts.length > 0 && (
          <PlatformSection
            title="X Posts"
            icon={<Twitter className="w-5 h-5 text-sky-500" />}
            items={xPosts}
            id="x"
          />
        )}

        {blog.length > 0 && (
          <PlatformSection
            title="Blog Outlines"
            icon={<FileText className="w-5 h-5 text-orange-500" />}
            items={blog}
            id="blog"
          />
        )}
      </Accordion>
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
    a.download =
      id === "linkedin"
        ? "linkedin-posts.txt"
        : id === "x"
          ? "x-posts.txt"
          : "blog-outlines.txt";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sectionTitle = `${title} (${normalizedItems.length})`;

  return (
    <AccordionItem
      value={id}
      className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between pr-4 hover:bg-slate-50 transition-colors">
        <AccordionTrigger className="px-6 py-4 flex-1 hover:no-underline">
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-semibold text-slate-800">{sectionTitle}</span>
          </div>
        </AccordionTrigger>

        {normalizedItems.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTxt}
              className="h-8 text-xs"
            >
              <Download className="w-3 h-3 mr-1.5" />
              TXT
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="h-8 text-xs"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copy All
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50">
        <div className="space-y-4">
          {normalizedItems.map((item: string, idx: number) => (
            <EditableCard
              key={idx}
              initialContent={item}
              index={idx}
              type={id === "blog" ? "blog" : "post"}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-indigo-200 transition-all">
      <div className="flex justify-between items-start gap-4 mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {type === "blog" ? `Outline ${index + 1}` : `Option ${index + 1}`}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={copied ? "text-green-600" : "text-slate-500 hover:text-slate-900"}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 p-0 resize-y whitespace-pre-wrap text-slate-700"
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