"use server";

import { ActionError, userAction } from "@/safe-actions";
import { put } from "@vercel/blob";
import { z } from "zod";

export const uploadImageAction = userAction.use(async ({ clientInput, next, ctx }) => {


    // Validate input using Zod schema
    const parsedInput =  z.instanceof(FormData).safeParse(clientInput);

    if (!parsedInput.success) {
      throw new ActionError("Invalid input: " + parsedInput.error.issues[0].message);
    }
  
    const validatedInput = parsedInput.data; // Safe, validated data
    
    const file = validatedInput.get("file") as File;

    if (!file) {
      throw new ActionError("File not found");
    }

    const name = file.name;

    const result = await put(name, file, {
      access: "public",
    });

    // Wrap the result in a MiddlewareResult and return it
    return next({
      ctx: {
        result, // Returning the created/updated review in the context
      },
    })
});   