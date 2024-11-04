
"use server";

import { openai } from "@/openai";
import { prisma } from "@/prisma";
import { ActionError, action } from "@/safe-actions";
import { Review } from "@prisma/client";
import { headers } from "next/headers";
import { z } from "zod";
import { ReviewSchema } from "./review.schema";

export const getReviewAction = action.use(async ({ clientInput, next }) => {
    // Validate input using Zod schema

    const getReviewActionSchema = z.object({
      productId: z.string(),
      id: z.string(),
    });
    const parsedInput = getReviewActionSchema.safeParse(clientInput);

    if (!parsedInput.success) {
      throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
    }
  
    const validatedInput = parsedInput.data; // Safe, validated data

  const review = await prisma.review.findUnique({
    where: {
      id: validatedInput.id,
      productId: validatedInput.productId,
    },
  });

  if (!review) {
    throw new ActionError("Review not found");
  }

 // Wrap the result in a MiddlewareResult and return it
 return next({
  ctx: {
    review, // Returning the created/updated review in the context
  },
});
});

// Define the updateReviewAction with validation using the schema
export const updateReviewAction = action.use(async ({ clientInput, next }) => {
  // Validate input using Zod schema
  const parsedInput = ReviewSchema.safeParse(clientInput);

  if (!parsedInput.success) {
    throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
  }

  const validatedInput = parsedInput.data; // Safe, validated data

  const headerList = headers();
  const userIp = headerList.get("x-real-ip") || headerList.get("x-forwarded-for");

  if (!userIp) {
    throw new ActionError("User IP not found");
  }

  let review: Review | null = null;

  // Update review if the id exists, otherwise create a new review
  if (validatedInput.id) {
    review = await prisma.review.findUnique({
      where: {
        id: validatedInput.id,
        ip: userIp,
        productId: validatedInput.productId,
      },
    });

    if (!review) {
      throw new ActionError("Review not found");
    }

    review = await prisma.review.update({
      where: {
        id: validatedInput.id,
      },
      data: {
        rating: validatedInput.rating ?? review.rating,
        audio: validatedInput.audio ?? review.audio,
        text: validatedInput.text ?? review.text,
        socialLink: validatedInput.socialLink ?? review.socialLink,
        name: validatedInput.name ?? review.name,
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        productId: validatedInput.productId,
        ip: userIp,
        rating: validatedInput.rating ?? 0,
        audio: validatedInput.audio,
        text: validatedInput.text,
        socialLink: validatedInput.socialLink,
        name: validatedInput.name,
      },
    });
  }

 // Wrap the result in a MiddlewareResult and return it
 return next({
  ctx: {
    review, // Returning the created/updated review in the context
  },
});
});

export const processAudioAction = action.use(async ({ clientInput, next }) => {
    // Validate input using Zod schema

    const processAudioActionSchema = z.object({
          formData: z.instanceof(FormData),
          reviewId: z.string(),
          productId: z.string(),
        })

    const parsedInput = processAudioActionSchema.safeParse(clientInput);

    if (!parsedInput.success) {
      throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
    }
  
    const validatedInput = parsedInput.data; // Safe, validated data

    const headerList = headers();
    const userIp =
      headerList.get("x-real-ip") || headerList.get("x-forwarded-for");

    if (!userIp) {
      throw new ActionError("User IP not found");
    }

    const review = await prisma.review.findUnique({
      where: {
        id: validatedInput.reviewId,
        ip: userIp,
        productId: validatedInput.productId,
      },
      include: {
        product: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    if (!review) {
      throw new ActionError("Review not found");
    }

    if (review.text) {
      throw new ActionError("Review already has text");
    }

    const audioFile = validatedInput.formData.get("audio");

    const result = await openai.audio.transcriptions.create({
      file: audioFile as any,
      model: "whisper-1",
    });

    if (!result.text) {
      throw new ActionError("Failed to transcribe audio");
    }

    const finalResult = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `Context:
You are a transcriptionist and you are transcribing an audio review for a product. The audio review is about the product "${review.product.name}".

Goal:
You need to return the transcript of the audio review.

Criteria:
- You CAN'T add, edit, or remove any information from the audio review.
- You JUST foramtting and regrouping the information from the audio review.
- You USE THE SAME language and tone as the customer used in the audio review.

Response format:
- Return the plain text content review, without title or any other information.
- Use THE SAME LANGUAGE as the user used in the audio review.
- USE FRENCH !`,
        },
        {
          role: "user",
          content: result.text,
        },
      ],
    });

    const resultText = finalResult.choices[0].message.content;

    await prisma.review.update({
      where: {
        id: validatedInput.reviewId,
      },
      data: {
        text: resultText,
      },
    });

    // Wrap the result in a MiddlewareResult and return it
 return next({
  ctx: {
    review, // Returning the created/updated review in the context
  },
});
})