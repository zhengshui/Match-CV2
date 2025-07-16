import { type NextRequest, NextResponse } from "next/server";
import { registerUser } from "~/server/auth/config";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Check if user already exists (this is a simple check for our in-memory store)
    // In a real app, you'd check the database
    try {
      const user = await registerUser(email, password, name);
      return NextResponse.json(
        { message: "User created successfully", user: { id: user.id, email: user.email, name: user.name } },
        { status: 201 }
      );
    } catch {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}