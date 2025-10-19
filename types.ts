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

export const reportSchema = z.object({
	id: z.number().optional(),
	reporter_id: z.string().optional(),
	category_id: z.number().nullable().optional(),
	sub_category: z.number().nullable().optional(),
	incident_title: z.string().nullable().optional(),
	what_happened: z.string().nullable().optional(),
	who_was_involved: z.string().nullable().optional(),
	incident_date: z.string().nullable().optional(),
	incident_time: z.string().nullable().optional(),
	latitude: z.number(),
	longitude: z.number(),
	street_address: z.string().nullable().optional(),
	nearby_landmark: z.string().nullable().optional(),
	injuries_reported: z.string().nullable().optional(),
	property_damage: z.string().nullable().optional(),
	suspect_description: z.string().nullable().optional(),
	number_of_witnesses: z.string().nullable().optional(),
	witness_contact_info: z.string().nullable().optional(),
	attachments: z.array(z.string()).nullable().optional(),
	status: z.string().optional().default("pending"),
	is_archived: z.boolean().nullable().optional().default(false),
	resolved_at: z.string().nullable().optional(),
	created_at: z.string().optional(),
})

export type Report = z.infer<typeof reportSchema>;

export const barangaySchema = z.object({
	id: z.number().optional(),
	name: z.string().min(1, "Name is required"),
	created_at: z.string().optional(),
})

export type Barangay = z.infer<typeof barangaySchema>;

export const lostAndFoundSchema = z.object({
	id: z.number().optional(),
	item_title: z.string().min(1, "Item title is required"),
	description: z.string().nullable().optional(),
	category: z.string().min(1, "Category is required"),
	date_lost: z.string().min(1, "Date lost is required"),
	lat: z.number(),
	lon: z.number(),
	photo: z.string().nullable().optional(),
	created_at: z.string().optional(),
})

export type LostAndFound = z.infer<typeof lostAndFoundSchema>;
