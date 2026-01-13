import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Linkedin, Twitter, FileText, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { GeneratedContent } from "@shared/schema";

interface ContentOutputProps {
  content: GeneratedContent;
}

export function ContentOutput({ content }: ContentOutputProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Generated Results</h3>
        <span className="text-sm text-slate-500">
          Created {new Date(content.createdAt!).toLocaleDateString()}
        </span>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="linkedin">
        {content.outputs.linkedin && content.outputs.linkedin.length > 0 && (
          <PlatformSection 
            title="LinkedIn Posts" 
            icon={<Linkedin className="w-5 h-5 text-blue-600" />}
            items={content.outputs.linkedin}
            id="linkedin"
          />
        )}
        
        {content.outputs.twitter && content.outputs.twitter.length > 0 && (
          <PlatformSection 
            title="X Threads" 
            icon={<Twitter className="w-5 h-5 text-sky-500" />}
            items={content.outputs.twitter}
            id="twitter"
          />
        )}
        
        {content.outputs.blog && content.outputs.blog.length > 0 && (
          <PlatformSection 
            title="Blog Outlines" 
            icon={<FileText className="w-5 h-5 text-orange-500" />}
            items={content.outputs.blog}
            id="blog"
          />
        )}
      </Accordion>
    </div>
  );
}

function PlatformSection({ title, icon, items, id }: { title: string, icon: React.ReactNode, items: string[], id: string }) {
  const sectionTitle = id === 'linkedin' ? `LinkedIn Posts (${items.length})` 
    : id === 'twitter' ? `X Threads (${items.length})`
    : `${title} (${items.length})`;

  return (
    <AccordionItem value={id} className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <AccordionTrigger className="px-6 hover:bg-slate-50">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-slate-800">{sectionTitle}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6 pt-2 bg-slate-50/50">
        <div className="space-y-6">
          {items.map((item, idx) => (
            <EditableCard key={idx} initialContent={item} index={idx} type={id === 'twitter' ? 'thread' : 'default'} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function EditableCard({ initialContent, index, type = "default" }: { initialContent: string, index: number, type?: "default" | "thread" }) {
  const displayContent = typeof initialContent === 'string' 
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
          className={copied ? "text-green-600" : "text-slate-400 hover:text-slate-700"}
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
