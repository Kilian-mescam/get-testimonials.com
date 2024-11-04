"use client";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { GRADIENTS_CLASSES, ProductSchema, ProductType } from "./product.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { uploadImageAction } from "@/features/upload/upload.action";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createProductAction, updateProductAction } from "./product.action";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Loader2 } from "lucide-react";

export type ProductFormProps = {
    defaultValues?: ProductType;
    productId?: string;
};

export const ProductForm = (props: ProductFormProps) => {
  const form = useZodForm({
    schema: ProductSchema,
    defaultValues: props.defaultValues,
  });
  const isCreate = !Boolean(props.defaultValues);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: ProductType) => {
      const { data, serverError } = isCreate
        ? await createProductAction(values)
        : await updateProductAction({
            id: props.productId ?? "-",
            data: values,
          });

      if (serverError || !data) {
        toast.error(serverError);
        return;
      }

      router.push(`/products/${data.id}`);
      router.refresh();
    },
  });

  const submitImage = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      const { data, serverError } = await uploadImageAction(formData)  ;
      
      if (!data || serverError) {
        toast.error(serverError);
        return;
      }

      const url = data.url;
      form.setValue("image", url);
    }
  })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create product</CardTitle>
                {isCreate ? "Create product" : `Edit product ${props.defaultValues?.name}`}
            </CardHeader>
            <CardContent>
                <Form 
                    form={form}
                    onSubmit={async (values: any) => { 
                        console.log(values);
                    }}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                            <Input placeholder="BeginReact" {...field} />
                        </FormControl>
                        <FormDescription>
                            The name of the product to review
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
                          <div className="flex items-center gap-4">
                      <FormControl className="flex-1">
                        <Input
                          type="file"
                          placeholder="iPhone 15"
                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (!file) {
                              return;
                            }

                            if (file.size > 1024 * 1024) {
                              toast.error("File is too big");
                              return;
                            }

                            if (!file.type.includes("image")) {
                              toast.error("File is not an image");
                              return;
                            }

                            submitImage.mutate(file);
                          }}
                        />
                      </FormControl>
                      {submitImage.isPending ? (
                        <Loader2 className="h-6 animate-spin" />
                      ) : null}
                      {field.value ? (
                          <Avatar className="rounded-sm">
                            <AvatarFallback>{field.value[0]}</AvatarFallback>
                            <AvatarImage src={field.value} />
                          </Avatar>
                        ) : null}
                      </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                            <Input
                              placeholder="BeginReact"
                              {...field}
                              onChange={(e) => { 
                              const value = e.target.value
                                .replaceAll(" ", "-")
                                .toLocaleLowerCase();
                              
                              field.onChange(value);
                            }}/>
                        </FormControl>
                        <FormDescription>
                            The slug of the product to review
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background color</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {GRADIENTS_CLASSES.map((gradient) => (
                            <SelectItem
                              value={gradient}
                              key={gradient}
                              className="flex"
                            >
                              <div
                                className={cn(
                                  gradient,
                                  "block w-80 h-8 rounded-md flex-1"
                                )}
                              ></div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The review page background color
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </Form>
            </CardContent>
        </Card>
    )
}