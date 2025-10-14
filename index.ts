import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient, SupportedStorage } from "@supabase/supabase-js";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import type { Database } from "./database.types";
import { categorySchema, hotlineSchema } from "./types";

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

	getCategories = async () => {
		return this.supabase.from('categories').select('*');
	}

	fetchOfficers = async () => {
		return this.supabase.from('profiles').select('*').eq('role', 'officer');
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

	createOfficer = async (badgeNumber: string, rank: string, first_name: string, last_name: string, password: string) => {
		return this.supabase.auth.admin.createUser({
			email: "stvndvmrnd@gmail.com",
			password: password,
			user_metadata: {
				badge_number: badgeNumber,
				rank: rank,
				first_name: first_name,
				last_name: last_name,
				role: "officer"
			},
			email_confirm: false
		})
	}

	archiveReport = async (report_id: number) => {
		return this.supabase.from('reports').update({ is_archived: true }).eq('id', report_id).select();
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
export * from "./react/hooks/useHotlines.ts";
export * from "./react/hooks/useCategories.ts";
export * from "./react/hooks/useOfficers.ts";
