import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkspaceSchema, type InsertWorkspace } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCreateWorkspace, useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Sparkles, PenTool, Target } from "lucide-react";
import { trackWorkspaceCreated } from "@/lib/analytics";

const mono = "'IBM Plex Mono', monospace";
const serif = "Georgia, serif";

interface WorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: InsertWorkspace & { id: number };
}

const defaultValues: InsertWorkspace = {
  clientName: "",
  brandDescription: "",
  sampleContent: "",
  style: "professional",
  boldness: "conservative",
  intent: "educational",
};

export function WorkspaceForm({ open, onOpenChange, initialData }: WorkspaceFormProps) {
  const createMutation = useCreateWorkspace();
  const updateMutation = useUpdateWorkspace();
  const [, setLocation] = useLocation();

  const form = useForm<InsertWorkspace>({
    resolver: zodResolver(insertWorkspaceSchema),
    defaultValues: initialData || defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset(defaultValues);
    }
  }, [initialData, form, open]);

  const onSubmit = async (data: InsertWorkspace) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data });
      } else {
        const newWorkspace = await createMutation.mutateAsync(data);
        if (newWorkspace.id) {
          trackWorkspaceCreated(String(newWorkspace.id));
          setLocation(`/workspaces/${newWorkspace.id}`);
        } else {
          throw new Error("Created workspace is missing ID");
        } 
      }
      onOpenChange(false);
      form.reset(defaultValues);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto"
        style={{
          background: "#1A1A1B",
          border: "1px solid rgba(245,242,237,0.1)",
          borderRadius: 0,
          color: "#EDEAE4",
          fontFamily: mono,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: serif, color: "#EDEAE4", fontSize: 20 }}>
            {isEditing ? "Edit Workspace" : "Create Your Workspace"}
          </DialogTitle>
          <DialogDescription style={{ color: "rgba(245,242,237,0.5)", fontFamily: mono, fontSize: 12 }}>
            {isEditing
              ? "Update the brand voice settings ReContent should use for this workspace."
              : "A workspace stores one brand or client's voice, transcript inputs, and generation history."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div style={{
            border: "1px solid rgba(192,87,70,0.3)",
            background: "rgba(192,87,70,0.06)",
            padding: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                border: "1px solid rgba(192,87,70,0.4)",
                background: "rgba(192,87,70,0.1)",
                flexShrink: 0,
              }}>
                <Sparkles style={{ width: 18, height: 18, color: "#C05746" }} />
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: serif, color: "#EDEAE4", fontSize: 15, margin: 0 }}>
                  Set this up once, then generate faster
                </h3>
                <p style={{ marginTop: 6, fontSize: 12, color: "rgba(245,242,237,0.5)", lineHeight: 1.6 }}>
                  ReContent uses these settings to shape the tone and positioning of the content it generates.
                </p>

                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Client / brand", desc: "Who this workspace is for." },
                    { label: "Voice settings", desc: "Style, boldness, and intent shape the outputs." },
                    { label: "Optional sample", desc: "Add an example if you want closer voice matching." },
                  ].map((item) => (
                    <div key={item.label} style={{
                      border: "1px solid rgba(245,242,237,0.08)",
                      background: "rgba(245,242,237,0.03)",
                      padding: "12px",
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>{item.label}</p>
                      <p style={{ marginTop: 4, fontSize: 11, color: "rgba(245,242,237,0.4)", lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>
                    Workspace Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Accounting, Pembroke Digital, Dr Smith Clinic..."
                      {...field}
                      value={field.value || ""}
                      style={{
                        background: "rgba(245,242,237,0.05)",
                        border: "1px solid rgba(245,242,237,0.12)",
                        borderRadius: 0,
                        color: "#EDEAE4",
                        fontFamily: mono,
                        fontSize: 13,
                      }}
                    />
                  </FormControl>
                  <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", marginTop: 4 }}>
                    Use the client, brand, or project name. This is the name shown on your dashboard.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>
                    Brand Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this business does, who it helps, what makes it different, and how it should sound..."
                      className="resize-none min-h-[130px]"
                      {...field}
                      value={field.value || ""}
                      style={{
                        background: "rgba(245,242,237,0.05)",
                        border: "1px solid rgba(245,242,237,0.12)",
                        borderRadius: 0,
                        color: "#EDEAE4",
                        fontFamily: mono,
                        fontSize: 13,
                      }}
                    />
                  </FormControl>
                  <div style={{
                    border: "1px solid rgba(245,242,237,0.08)",
                    background: "rgba(245,242,237,0.03)",
                    padding: "16px",
                    marginTop: 8,
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>What to include</p>
                    <p style={{ marginTop: 6, fontSize: 12, color: "rgba(245,242,237,0.5)" }}>Write 2–4 sentences covering:</p>
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {["What the company does", "Who it serves", "How it should come across in content"].map((item) => (
                        <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <CheckCircle2 style={{ width: 14, height: 14, color: "#C05746", marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "rgba(245,242,237,0.6)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ marginTop: 12, fontSize: 11, color: "rgba(245,242,237,0.3)", lineHeight: 1.6 }}>
                      Example: B2B SaaS company helping accountants automate reconciliation for mid-sized firms. Tone should be clear, credible, practical, and modern.
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div style={{
              border: "1px solid rgba(245,242,237,0.1)",
              background: "rgba(245,242,237,0.02)",
              padding: "20px",
            }}>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: serif, fontSize: 15, color: "#EDEAE4", margin: 0 }}>Voice Settings</h3>
                <p style={{ marginTop: 4, fontSize: 12, color: "rgba(245,242,237,0.4)" }}>
                  These settings guide how the generated content feels.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger style={{ background: "rgba(245,242,237,0.05)", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0, color: "#EDEAE4", fontFamily: mono, fontSize: 12 }}>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ background: "#1A1A1B", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0 }}>
                          <SelectItem value="professional" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Professional</SelectItem>
                          <SelectItem value="casual" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Casual</SelectItem>
                        </SelectContent>
                      </Select>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.5 }}>
                        Professional = polished. Casual = conversational.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="boldness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>Boldness</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger style={{ background: "rgba(245,242,237,0.05)", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0, color: "#EDEAE4", fontFamily: mono, fontSize: 12 }}>
                            <SelectValue placeholder="Select boldness" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ background: "#1A1A1B", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0 }}>
                          <SelectItem value="bold" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Bold</SelectItem>
                          <SelectItem value="conservative" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Conservative</SelectItem>
                        </SelectContent>
                      </Select>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.5 }}>
                        Bold = sharper hooks. Conservative = measured.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>Intent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger style={{ background: "rgba(245,242,237,0.05)", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0, color: "#EDEAE4", fontFamily: mono, fontSize: 12 }}>
                            <SelectValue placeholder="Select intent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent style={{ background: "#1A1A1B", border: "1px solid rgba(245,242,237,0.12)", borderRadius: 0 }}>
                          <SelectItem value="educational" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Educational</SelectItem>
                          <SelectItem value="promotional" style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4" }}>Promotional</SelectItem>
                        </SelectContent>
                      </Select>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.5 }}>
                        Educational = build trust. Promotional = sell.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { icon: <PenTool style={{ width: 14, height: 14, color: "#C05746" }} />, label: "Professional", desc: "Best for consultants, agencies, B2B, finance, legal, and expert-led brands." },
                  { icon: <Sparkles style={{ width: 14, height: 14, color: "#C05746" }} />, label: "Casual", desc: "Best when the brand should feel approachable, friendly, or founder-led." },
                  { icon: <Target style={{ width: 14, height: 14, color: "#C05746" }} />, label: "Conservative vs Bold", desc: "Conservative is safer for corporate brands. Bold is stronger for thought leadership." },
                ].map((item) => (
                  <div key={item.label} style={{
                    border: "1px solid rgba(245,242,237,0.08)",
                    background: "rgba(245,242,237,0.02)",
                    padding: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.icon}
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>{item.label}</p>
                    </div>
                    <p style={{ marginTop: 6, fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="sampleContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.6)", textTransform: "uppercase" }}>
                    Sample Content <span style={{ color: "rgba(245,242,237,0.3)" }}>(Optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste a strong example of this client's content if you want ReContent to mirror the tone more closely..."
                      className="resize-none min-h-[150px]"
                      {...field}
                      value={field.value || ""}
                      style={{
                        background: "rgba(245,242,237,0.05)",
                        border: "1px solid rgba(245,242,237,0.12)",
                        borderRadius: 0,
                        color: "#EDEAE4",
                        fontFamily: mono,
                        fontSize: 13,
                      }}
                    />
                  </FormControl>
                  <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", marginTop: 4, lineHeight: 1.6 }}>
                    Optional but useful if the client already has a clear voice you want to match. A past LinkedIn post, email, blog intro, or website copy works well.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              paddingTop: 16,
              borderTop: "1px solid rgba(245,242,237,0.08)",
            }}>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "rgba(245,242,237,0.5)",
                  background: "transparent",
                  border: "1px solid rgba(245,242,237,0.15)",
                  padding: "8px 20px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "#EDEAE4",
                  background: isPending ? "rgba(192,87,70,0.5)" : "#C05746",
                  border: "none",
                  padding: "8px 24px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  textTransform: "uppercase",
                }}
              >
                {isPending ? "Saving..." : isEditing ? "Save Workspace" : "Create Workspace"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}