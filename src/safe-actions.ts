import { createSafeActionClient } from "next-safe-action";
import { currentUser } from "./auth/current-user";
import { z } from "zod";

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

// Assuming $Enums.Plan is an enum, define it in your schema
const PlanEnum = z.enum(["FREE", "PRO", "ENTERPRISE"]); // Example values, replace with your actual Plan enum


// Zod schema for user object
const userSchema = z.object({
  name: z.string().nullable(), // name can be a string or null
  id: z.string(), // id must be a non-null string
  email: z.string().email().nullable(), // email can be a string (email format) or null
  emailVerified: z.date().nullable(), // emailVerified is a Date or null
  image: z.string().url().nullable(), // image is a URL or null
  plan: PlanEnum, // plan must match one of the PlanEnum values
  stripeCustomerId: z.string().nullable(), // stripeCustomerId can be a string or null
  createdAt: z.date(), // createdAt must be a Date
  updatedAt: z.date(), // updatedAt must be a Date
});

const handleReturnedServerError = (error: Error) => {
  if (error instanceof ActionError) {
    return error.message;
  }
  return "An unexpected error occurred";
};

export const action = createSafeActionClient({
  handleServerError: handleReturnedServerError,
});

export const userAction = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return {
        serverError: e.message
      };
    }
    return {
      serverError: 'Something went wrong'
    };
  }
}).use(async ( { next } ) => {
  const user = await currentUser();

  if (!user) {
    throw new ActionError("You must be logged in");
  }

    // Return the next middleware with `userId` value in the context
    return next({ ctx: { user } });
});

