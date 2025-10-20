import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient, SupportedStorage } from "@supabase/supabase-js";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import type { Database } from "./database.types";
import { barangaySchema, categorySchema, hotlineSchema, reportSchema, lostAndFoundSchema } from "./types";

interface SupabaseClientOptions {
	url: string;
	anonymousKey: string;
	detectSessionInUrl?: boolean;
	storage?: SupportedStorage;
}

/**
 * Options required to initialize the DispatchClient singleton.
 */
export interface DispatchClientOptions {
	supabaseClientConfig: SupabaseClientOptions;
}

/**
 * Small extension type so we can use the auth API surface with correct typing.
 * (Kept as a distinct type in case we want to extend behavior later.)
 */
class DispatchAuthClient extends SupabaseAuthClient { }

/**
 * DispatchClient is a singleton that holds a private Supabase client instance.
 * The Supabase client is NOT exported from the library — it stays private inside the singleton.
 *
 * Usage:
 *   - Call `initDispatchClient(...)` once during app startup.
 *   - Retrieve the singleton via `getDispatchClient()` thereafter.
 */
export class DispatchClient {
	// private singleton instance
	private static _instance: DispatchClient | null = null;

	// private supabase client (not exported)
	private supabase: SupabaseClient;
	// expose only the auth surface that the library wants to make available
	public auth: SupabaseAuthClient;

	// Make constructor private to enforce singleton usage via init/getInstance
	private constructor({ supabaseClientConfig }: DispatchClientOptions) {
		this.supabase = createSupabaseClient(
			supabaseClientConfig.url,
			supabaseClientConfig.anonymousKey,
			{
				auth: {
					storage: supabaseClientConfig.storage,
					autoRefreshToken: true,
					persistSession: true,
					detectSessionInUrl: supabaseClientConfig.detectSessionInUrl ?? false,
				},
			},
		);

		this.auth = this.supabase.auth as DispatchAuthClient;

		// Example internal listener — keeps this instance aware of auth changes.
		this.auth.onAuthStateChange((event, session) => {
			console.debug("DispatchClient auth state changed:", { event, session });
		});
	}

	/**
	 * Initialize the singleton. Must be called once by the consumer if they want
	 * the library to manage a Supabase client internally.
	 *
	 * This is idempotent: subsequent calls will return the already-initialized instance.
	 */
	static init(options: DispatchClientOptions) {
		if (!DispatchClient._instance) {
			DispatchClient._instance = new DispatchClient(options);
		} else {
			// Intentionally do not reinitialize; silently return existing instance.
			console.warn(
				"DispatchClient.init called but instance already exists. Returning existing instance.",
			);
		}
		return DispatchClient._instance;
	}

	/**
	 * Retrieve the singleton instance. Throws if `init` has not been called.
	 */
	static getInstance() {
		if (!DispatchClient._instance) {
			throw new Error(
				"DispatchClient not initialized. Call DispatchClient.init(...) first.",
			);
		}
		return DispatchClient._instance;
	}

	/**
	 * Get the internal Supabase client for realtime subscriptions.
	 * This is needed for realtime hooks that need direct access to the client.
	 */
	get supabaseClient() {
		return this.supabase;
	}

	/**
	 * Example helper that uses the private supabase client to return a safe session result.
	 * Consumers can call this via the singleton.
	 */
	async getSafeSession() {
		const {
			data: { session },
		} = await this.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null, error: "No session found" };
		}

		const {
			data: { user },
			error: userError,
		} = await this.supabase.auth.getUser();
		if (userError) {
			return { session, user: null, error: userError.message };
		}

		return { session, user, error: null };
	}

	/**
	 * Example login method that uses the private supabase client.
	 */
	async login(email: string, password: string) {
		const { data, error } = await this.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("Login error:", error.message);
			return { error: error.message };
		}

		console.info("Login successful:", data);
		return { error: undefined };
	}

	/**
	 * Officer login method that validates officer role after authentication using badge number.
	 */
	async officerLogin(badgeNumber: string, password: string) {
		// Use RPC function to get officer email by badge number
		const { data: emailData, error: emailError } = await this.supabase
			.rpc('get_officer_email_by_badge', { badge_number_param: badgeNumber });

		if (emailError || !emailData || emailData.length === 0) {
			console.error("Officer not found with badge number:", badgeNumber);
			return { error: "Invalid badge number" };
		}

		const email = emailData[0].email;

		// Now authenticate with the email
		const { data, error } = await this.supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			console.error("Officer login error:", error.message);
			return { error: error.message };
		}

		// Check if the user has officer role
		const user = data.user;
		if (!user?.user_metadata?.role || user.user_metadata.role !== "officer") {
			// Sign out the user if they don't have officer role
			await this.supabase.auth.signOut();
			console.error("Access denied: User is not an officer");
			return { error: "Access denied: User is not an officer" };
		}

		console.info("Officer login successful:", data);
		return { error: undefined };
	}

	fetchHotlines = async () => {
		return this.supabase.from('hotlines').select('*');
	}

	addHotline = async (payload: Database["public"]["Tables"]["hotlines"]["Insert"]) => {
		const validated = hotlineSchema.parse(payload);
		return this.supabase.from('hotlines').insert(validated).select();
	}

	updateHotline = async (
		id: string,
		payload: Partial<Database["public"]["Tables"]["hotlines"]["Update"]>
	) => {
		const validated = hotlineSchema.partial().parse(payload);
		return this.supabase.from('hotlines').update(validated).eq('id', id).select();
	}

	deleteHotline = async (id: string) => {
		return this.supabase.from('hotlines').delete().eq('id', id).select();
	}

	fetchProfiles = async () => {
		return this.supabase.rpc("get_profiles_with_emails")
	}

	updateProfile = async (
		id: string,
		payload: Partial<Database["public"]["Tables"]["profiles"]["Update"]>
	) => {
		return this.supabase.from('profiles').update(payload).eq('id', id).select();
	}

	getCategories = async () => {
		return this.supabase.from('categories').select('*');
	}

	fetchOfficers = async () => {
		return this.supabase.from('officers').select('*');
	}

	addCategory = async (payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>) => {
		const validated = categorySchema.parse(payload);
		return this.supabase.from('categories').insert(validated).select();
	}

	updateCategory = async (
		id: string,
		payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>
	) => {
		const validated = categorySchema.partial().parse(payload);
		return this.supabase.from('categories').update(validated).eq('id', id).select();
	}

	deleteCategory = async (id: string) => {
		return this.supabase.from('categories').delete().eq('id', id).select();
	}

	createOfficer = async (badgeNumber: string, email: string, rank: string, first_name: string, middle_name: string, last_name: string, password: string) => {
		return this.supabase.auth.admin.createUser({
			email: email,
			password: password,
			user_metadata: {
				first_name: first_name,
				middle_name: middle_name,
				last_name: last_name,
				rank: rank,
				badge_number: badgeNumber,
				role: "officer"
			},
			email_confirm: true, // Set to true to skip email confirmation
		})
	}

	archiveReport = async (report_id: number) => {
		return this.supabase.from('reports').update({ is_archived: true, archived_date: new Date().toISOString() }).eq('id', report_id).select();
	}

	fetchReports = async () => {
		return this.supabase.from('reports').select('*');
	}

	addReport = async (payload: Database["public"]["Tables"]["reports"]["Insert"]) => {
		const validated = reportSchema.parse(payload);
		return this.supabase.from('reports').insert(validated).select();
	}

	updateReport = async (
		id: number,
		payload: Partial<Database["public"]["Tables"]["reports"]["Update"]>
	) => {
		const validated = reportSchema.partial().parse(payload);
		return this.supabase.from('reports').update(validated).eq('id', id).select();
	}

	deleteReport = async (id: number) => {
		return this.supabase.from('reports').delete().eq('id', id).select();
	}

	getReportInfo = async (id: number) => {
		return this.supabase.from('reports').select('*').eq('id', id).single();
	}

	assignToReport = async (officerId: string, reportId: number) => {
		return this.supabase.from('officers').update({ assigned_report_id: reportId }).eq('id', officerId).select();
	}

	updateOfficer = async (
		id: string,
		payload: Partial<Database["public"]["Tables"]["officers"]["Update"]>
	) => {
		return this.supabase.from('officers').update(payload).eq('id', id).select();
	}

	deleteOfficer = async (id: string) => {
		const { data: deletedRows, error: deleteError } = await this.supabase
			.from('officers')
			.delete()
			.eq('id', id)
			.select();

		if (deleteError) {
			return { deleted: null, authDeleted: false, error: deleteError.message };
		}

		const { error: authError } = await this.supabase.auth.admin.deleteUser(id);

		if (authError) {
			return {
				deleted: deletedRows,
				authDeleted: false,
				error: authError.message,
			};
		}

		return { deleted: deletedRows, authDeleted: true, error: null };
	}

	fetchBarangays = async () => {
		return this.supabase.from('barangays').select('*');
	}

	addBarangay = async (payload: Database["public"]["Tables"]["barangays"]["Insert"]) => {
		const validated = barangaySchema.parse(payload);
		return this.supabase.from('barangays').insert(validated).select();
	}

	updateBarangay = async (
		id: string,
		payload: Partial<Database["public"]["Tables"]["barangays"]["Update"]>
	) => {
		const validated = barangaySchema.partial().parse(payload);
		return this.supabase.from('barangays').update(validated).eq('id', id).select();
	}

	deleteBarangay = async (id: string) => {
		return this.supabase.from('barangays').delete().eq('id', id).select();
	}

	notifyUser = async (userId: string, title: string | null, body: string) => {
		const notification = {
			user_id: userId,
			title,
			body
		};

		return this.supabase.from('notifications').insert(notification).select();
	}

	fetchLostAndFound = async () => {
		return this.supabase.from('lost_and_found').select('*');
	}

	addLostAndFound = async (payload: Database["public"]["Tables"]["lost_and_found"]["Insert"]) => {
		const validated = lostAndFoundSchema.parse(payload);
		return this.supabase.from('lost_and_found').insert(validated).select();
	}

	updateLostAndFound = async (
		id: number,
		payload: Partial<Database["public"]["Tables"]["lost_and_found"]["Update"]>
	) => {
		const validated = lostAndFoundSchema.partial().parse(payload);
		return this.supabase.from('lost_and_found').update(validated).eq('id', id).select();
	}

	deleteLostAndFound = async (id: number) => {
		return this.supabase.from('lost_and_found').delete().eq('id', id).select();
	}
}

/**
 * Convenience exported functions that wrap the DispatchClient singleton API.
 * - `initDispatchClient` initializes the singleton (must be called once if using library-managed supabase).
 * - `getDispatchClient` returns the initialized singleton or throws if not initialized.
 *
 * These helpers make it clearer in consumer code what to call.
 */
export function initDispatchClient(options: DispatchClientOptions) {
	return DispatchClient.init(options);
}

export function getDispatchClient() {
	return DispatchClient.getInstance();
}

export * from "./id.ts";
export * from "./types";
export * from "./react/providers/auth-provider.tsx";
export * from "./react/providers/officer-auth-provider.tsx";
export * from "./react/hooks/useHotlines.ts";
export * from "./react/hooks/useCategories.ts";
export * from "./react/hooks/useOfficers.ts";
export * from "./react/hooks/useProfiles.ts";
export * from "./react/hooks/useReports.ts";
export * from "./react/hooks/useRealtimeReports.ts";
export * from "./react/hooks/useBarangays.ts";
export * from "./react/hooks/useLostAndFound.ts";
export * from "./react/hooks/useNotifications.ts";
