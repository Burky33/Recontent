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

interface WorkspaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: InsertWorkspace & { id: number };
}

const defaultValues: InsertWorkspace = {
  name: "",
  brandDescription: "",
  sampleContent: "",
  toneSettings: {
    style: "professional",
    boldness: "conservative",
    intent: "educational",
  },
};

export function WorkspaceForm({ open, onOpenChange, initialData }: WorkspaceFormProps) {
  const createMutation = useCreateWorkspace();
  const updateMutation = useUpdateWorkspace();

  const form = useForm<InsertWorkspace>({
    resolver: zodResolver(insertWorkspaceSchema),
    defaultValues: initialData || defaultValues,
  });

  useEffect(() => {
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
        await createMutation.mutateAsync(data);
      }
      onOpenChange(false);
      form.reset(defaultValues);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Workspace" : "New Client Workspace"}</DialogTitle>
          <DialogDescription>
            Configure the brand voice and settings for this client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
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
                      placeholder="Describe what this company does and their audience..." 
                      className="resize-none h-24"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="toneSettings.style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toneSettings.boldness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boldness</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toneSettings.intent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intent</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      placeholder="Paste a good example of their content here to guide the AI..." 
                      className="resize-none h-32"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isPending ? "Saving..." : (initialData ? "Update Workspace" : "Create Workspace")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
