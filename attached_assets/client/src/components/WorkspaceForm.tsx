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
import { CheckCircle2, PenTool, Target } from "lucide-react";

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
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Workspace" : "Create Your Workspace"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the brand voice settings ReContent should use for this workspace."
              : "A workspace stores one brand or client’s voice, transcript inputs, and generation history."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && (
          <div className="rounded-2xl border p-5" style={{ borderColor: 'rgba(192,87,70,0.2)', background: 'rgba(192,87,70,0.04)' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl shrink-0" style={{ background: 'rgba(192,87,70,0.12)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" fill="#C05746"/><rect x="11" y="2" width="7" height="7" fill="#C05746" opacity=".4"/><rect x="2" y="11" width="7" height="7" fill="#C05746" opacity=".4"/><rect x="11" y="11" width="7" height="7" fill="#C05746"/></svg>
              </div>

              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">Set this up once, then generate faster</h3>
                <p className="mt-1 text-sm text-slate-600">
                  ReContent uses these settings to shape the tone and positioning of the content it generates.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">Client / brand</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Who this workspace is for.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">Voice settings</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Style, boldness, and intent shape the outputs.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-semibold text-slate-900">Optional sample</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Add an example if you want closer voice matching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Accounting, Pembroke Digital, Dr Smith Clinic..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">
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
                  <FormLabel>Brand Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this business does, who it helps, what makes it different, and how it should sound..."
                      className="resize-none min-h-[130px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">What to include</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Write 2–4 sentences covering:
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" color="#C05746" />
                        <span>What the company does</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" color="#C05746" />
                        <span>Who it serves</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" color="#C05746" />
                        <span>How it should come across in content</span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Example: B2B SaaS company helping accountants automate reconciliation for mid-sized firms.
                      Tone should be clear, credible, practical, and modern.
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-slate-900">Voice Settings</h3>
                <p className="mt-1 text-sm text-slate-500">
                  These settings guide how the generated content feels.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Professional = polished and credible. Casual = more relaxed and conversational.
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
                      <FormLabel>Boldness</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select boldness" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="conservative">Conservative</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Bold = stronger opinions and sharper hooks. Conservative = safer and more measured.
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
                      <FormLabel>Intent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select intent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="promotional">Promotional</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Educational = teach and build trust. Promotional = sell more directly.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4" color="#C05746" />
                    <p className="text-sm font-semibold text-slate-900">Professional</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Best for consultants, agencies, B2B, finance, legal, and expert-led brands.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" fill="#C05746"/><rect x="9" y="1" width="6" height="6" fill="#C05746" opacity=".4"/><rect x="1" y="9" width="6" height="6" fill="#C05746" opacity=".4"/><rect x="9" y="9" width="6" height="6" fill="#C05746"/></svg>
                    <p className="text-sm font-semibold text-slate-900">Casual</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Best when the brand should feel approachable, friendly, or founder-led.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" color="#C05746" />
                    <p className="text-sm font-semibold text-slate-900">Conservative vs Bold</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Conservative is safer for corporate brands. Bold is stronger for thought leadership.
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="sampleContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste a strong example of this client’s content if you want ReContent to mirror the tone more closely..."
                      className="resize-none min-h-[150px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    Optional but useful if the client already has a clear voice you want to match. A past LinkedIn post,
                    email, blog intro, or website copy works well.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isPending}
              className="text-white" style={{ background: '#C05746' }}
              >
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Save Workspace"
                    : "Create Workspace"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}