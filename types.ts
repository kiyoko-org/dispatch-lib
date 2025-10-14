import * as z from "zod";

export const hotlineSchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Name is required"),
	phone_number: z.string().min(1, "Phone number is required"),
	description: z.string().optional(),
	created_at: z.string().optional(),
	available: z.boolean().optional().default(true),
})

export type Hotline = z.infer<typeof hotlineSchema>;

export const categorySchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Name is required"),
	created_at: z.string().optional(),
	sub_categories: z.array(z.string()).optional().default([]),
})

export type Category = z.infer<typeof categorySchema>;
