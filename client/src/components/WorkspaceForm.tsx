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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Workspace" : "New Client Workspace"}</DialogTitle>
          <DialogDescription>
            Save the brand voice settings ReContent should use when generating content for this client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} value={field.value || ""} />
                  </FormControl>
                  <p className="text-xs text-slate-500">This is the workspace name shown on your dashboard.</p>
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
                      placeholder="Describe what the company does, who they serve, and how they should sound..."
                      className="resize-none min-h-[110px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    Example: B2B SaaS company helping accountants automate reconciliation for mid-sized firms.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sampleContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste a strong example of this client’s content so ReContent can better match their voice..."
                      className="resize-none min-h-[150px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    This is useful when the client already has a clear tone of voice you want to mirror.
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
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isPending ? "Saving..." : initialData ? "Save Brand Details" : "Create Workspace"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}