import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Linkedin, Twitter, FileText, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { GeneratedContent } from "@shared/schema";
const normalizeStringArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return (
          item.text ??
          item.content ??
          item.post ??
          item.value ??
          JSON.stringify(item)
        );
      }
      return String(item);
    });
  }
  if (typeof value === "string") return [value];
  if (typeof value === "object") return [JSON.stringify(value)];
  return [String(value)];
};

const normalizeThreads = (value: any): string[][] => {
  if (!value) return [];

  if (Array.isArray(value) && value.every((t) => Array.isArray(t))) {
    return value.map((thread) => normalizeStringArray(thread));
  }

  if (Array.isArray(value) && value.every((t) => t && typeof t === "object")) {
    return value
      .map((t) => t.tweets ?? t.thread ?? t.posts ?? null)
      .filter(Boolean)
      .map((thread) => normalizeStringArray(thread));
  }

  if (typeof value === "string") return [[value]];
  return [];
};

const extractOutputs = (content: any) => {
  const outputs =
    content?.outputs ?? content?.outputs_json ?? content?.content ?? {};

  const linkedin = normalizeStringArray(
    outputs?.linkedin ??
      outputs?.linkedin_posts ??
      content?.linkedin_posts ??
      content?.linkedinPosts ??
      content?.linkedin,
  );

  const xThreads = normalizeThreads(
    outputs?.x_threads ??
      outputs?.x ??
      outputs?.twitter ??
      content?.x_threads ??
      content?.xThreads ??
      content?.twitter_threads ??
      content?.threads,
  );

  const blog = normalizeStringArray(
    outputs?.blog_outlines ??
      outputs?.blog ??
      content?.blog_outlines ??
      content?.blogOutlines ??
      content?.blog,
  );

  return { linkedin, xThreads, blog };
};

interface ContentOutputProps {
  content?: {
    createdAt?: string | Date;
    outputs?: {
      linkedin?: string[];
      twitter?: string[];
      blog?: string[];
      x?: string[];
      x_threads?: string[];
      blog_outlines?: string[];
    };
    linkedin_posts?: string[];
    x_threads?: string[];
    blog_outlines?: string[];
  };
}

export function ContentOutput({ content }: ContentOutputProps) {
  // "outputs" is the bucket where generated content usually lives.
  // If it doesn't exist, use an empty bucket so nothing crashes.
  const outputs = content?.outputs ?? {};

  // LinkedIn posts could be stored under different names depending on version.
  const linkedinPosts: string[] =
    (outputs as any).linkedin ??
    (outputs as any).linkedin_posts ??
    (content as any)?.linkedin_posts ??
    [];

  // X / Twitter threads could be stored under different names too.
  const xThreads: string[] =
    (outputs as any).x_threads ??
    (outputs as any).xThreads ??
    (outputs as any).twitter ??
    (outputs as any).x ??
    (content as any)?.x_threads ??
    (content as any)?.xThreads ??
    [];

  // Blog outlines (optional)
  const blogOutlines: string[] =
    (outputs as any).blog_outlines ??
    (outputs as any).blog ??
    (content as any)?.blog_outlines ??
    [];

  // Now the rest of your component can render using:
  // linkedinPosts, xThreads, blogOutlines

    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Generated Results
        </h3>
        {content?.createdAt && (
          <span className="text-sm text-slate-500">
            Created {new Date(content.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full space-y-4"
        defaultValue="linkedin"
      >
        {linkedin.length > 0 && (
          <PlatformSection
            title="LinkedIn Posts"
            icon={<Linkedin className="w-5 h-5 text-blue-600" />}
            items={linkedin}
            id="linkedin"
          />
        )}

        {xThreads.length > 0 && (
          <PlatformSection
            title="X Threads"
            icon={<Twitter className="w-5 h-5 text-sky-500" />}
            items={xThreads}
            id="twitter"
          />
        )}

        {blog.length > 0 && (
          <PlatformSection
            title="Blog Outlines"
            icon={<FileText className="w-5 h-5 text-orange-500" />}
            items={blog}
            id="blog"
          />
        
              </Accordion>
            </div>
          );
        }

      
function PlatformSection({
  title,
  icon,
  items,
  id,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[] | any;
  id: string;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const normalizedItems = Array.isArray(items)
    ? items
    : typeof items === "string"
      ? [items]
      : items
        ? [JSON.stringify(items)]
        : [];

  const handleCopyAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const separator =
      id === "twitter" ? "\n\n" + "=".repeat(20) + "\n\n" : "\n\n---\n\n";
    const allText = normalizedItems.join(separator);
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const sectionTitle =
    id === "linkedin"
      ? `LinkedIn Posts (${normalizedItems.length})`
      : id === "twitter"
        ? `X Threads (${normalizedItems.length})`
        : `${title} (${normalizedItems.length})`;

  return (
    <AccordionItem
      value={id}
      className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between pr-4 hover:bg-slate-50 transition-colors">
        <AccordionTrigger className="px-6 py-4 hover:no-underline flex-1">
          <div className="flex items-center gap-3">
            {icon}
            <span className="font-semibold text-slate-800">{sectionTitle}</span>
          </div>
        </AccordionTrigger>
        {(id === "linkedin" || id === "twitter") &&
          normalizedItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="h-8 text-xs font-medium border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Copied All
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copy All
                </>
              )}
            </Button>
          )}
      </div>
      <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50">
        {normalizedItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            No content generated yet.
          </p>
        ) : (
          <div className="space-y-3">
            {normalizedItems.map((text, index) => (
              <Textarea
                key={index}
                value={text}
                readOnly
                className="min-h-[120px]"
              />
            ))}
          </div>
        )}

        <div className="space-y-6">
          {normalizedItems.map((item: any, idx: number) => (
            <EditableCard
              key={idx}
              initialContent={item}
              index={idx}
              type={id === "twitter" ? "thread" : "default"}
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
  type = "default",
}: {
  initialContent: string;
  index: number;
  type?: "default" | "thread";
}) {
  const displayContent =
    typeof initialContent === "string"
      ? initialContent
      : JSON.stringify(initialContent, null, 2);

  const [content, setContent] = useState(displayContent);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 group hover:border-indigo-200 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {type === "thread" ? `Thread ${index + 1}` : `Option ${index + 1}`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={
            copied ? "text-green-600" : "text-slate-400 hover:text-slate-700"
          }
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
        className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 p-0 text-slate-700 resize-y whitespace-pre-wrap"
      />
    </div>
  );
}
