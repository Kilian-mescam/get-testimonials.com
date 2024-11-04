"use server";

import { EMAIL_FROM } from "@/config";
import { prisma } from "@/prisma";
import { resend } from "@/resend";
import { ActionError, userAction } from "@/safe-actions";
import { User } from "@prisma/client";
import { z } from "zod";
import FirstProductCreatedEmail from "../../../../../emails/FirstProductCreatedEmail";
import { ProductSchema } from "./product.schema";

const verifySlugUniqueness = async (slug: string, productId?: string) => {
  const slugExists = await prisma.product.count({
    where: {
      slug: slug,
      id: productId
        ? {
            not: productId,
          }
        : undefined,
    },
  });

  if (slugExists) {
    throw new ActionError("Slug already exists");
  }
};

const verifyUserPlan = async (user: User) => {
  if (user.plan === "PREMIUM") {
    return;
  }

  const userProductsCount = await prisma.product.count({
    where: {
      userId: user.id,
    },
  });

  if (userProductsCount > 0) {
    throw new ActionError(
      "You need to upgrade to premium to create more products"
    );
  }
};

const sendEmailIfUserCreatedFirstProduct = async (user: User) => {
  if (user.plan === "PREMIUM") return;

  console.log("PREMIUM PLAN");

  const userProductsCount = await prisma.product.count({
    where: {
      userId: user.id,
    },
  });

  if (userProductsCount !== 1) {
    return;
  }

  console.log("USER COUNT", userProductsCount);

  const product = await prisma.product.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      slug: true,
      name: true,
    },
  });

  console.log("product", product);
  if (!product) {
    return;
  }

  await resend.emails.send({
    to: user.email ?? "",
    subject: "You created your first product",
    from: EMAIL_FROM,
    react: FirstProductCreatedEmail({
      product: product.name,
      slug: product.slug,
    }),
  });
};

export const createProductAction = userAction.use(async ({ clientInput, next, ctx }) => {

    // Validate input using Zod schema
    const parsedInput = ProductSchema.safeParse(clientInput);

    if (!parsedInput.success) {
      throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
    }
  
    const validatedInput = parsedInput.data; // Safe, validated data
  
    await verifySlugUniqueness(validatedInput.slug);
    await verifyUserPlan(ctx.user);

    const product = await prisma.product.create({
      data: {
        ...validatedInput,
        userId: ctx.user.id,
      },
    });

    await sendEmailIfUserCreatedFirstProduct(ctx.user);

// Wrap the result in a MiddlewareResult and return it
return next({
  ctx: {
    product, // Returning the created/updated review in the context
  },
});
})

export const updateProductAction = userAction.use(async ({ clientInput, next, ctx }) => {

    // Validate input using Zod schema
    const updateProductActionSchema  = z.object({
          id: z.string(),
          data: ProductSchema,
        })
    const parsedInput = updateProductActionSchema.safeParse(clientInput);

    if (!parsedInput.success) {
      throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
    }
  
    const validatedInput = parsedInput.data; // Safe, validated data
  
    await verifySlugUniqueness(validatedInput.data.slug);

        const updatedProduct = await prisma.product.update({
          where: {
            id: validatedInput.id,
            userId: ctx.user.id
          },
          data: validatedInput.data
        })

        // Wrap the result in a MiddlewareResult and return it
    return next({
      ctx: {
        updatedProduct, // Returning the created/updated review in the context
      },
    });
})

export const deleteProductAction = userAction.use(async ({ clientInput, next, ctx }) => {

  const parsedInput = z.string().safeParse(clientInput);

  if (!parsedInput.success) {
    throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
  }

  const validatedInput = parsedInput.data; // Safe, validated data
  const deleteProduct = await prisma.product.delete({
    where: {
      id: validatedInput,
      userId: ctx.user.id,
    },
  });
    // Wrap the result in a MiddlewareResult and return it
    return next({
      ctx: {
        deleteProduct, // Returning the created/updated review in the context
      },
    });
})