import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient, SupportedStorage } from "@supabase/supabase-js";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import type { Database } from "./database.types";
import { 
	barangaySchema, 
	categorySchema, 
	hotlineSchema, 
	reportSchema, 
	lostAndFoundSchema, 
	type Profile
} from "./types";

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
	/**
	 * When true, certain operations (like fetching profiles with emails)
	 * will be routed through the dashboard's /api proxy to use service role.
	 */
	useProxy?: boolean;
}

/**
 * Small extension type so we can use the auth API surface with correct typing.
 * (Kept as a distinct type in case we want to extend behavior later.)
 */
class DispatchAuthClient extends SupabaseAuthClient { }

/**
 * DispatchClient is a singleton that holds a private Supabase client instance.
 * The Supabase client is NOT exported from the library — it stays private inside the singleton.
 */
export class DispatchClient {
	private static _instance: DispatchClient | null = null;
	private supabase: SupabaseClient;
	private useProxy: boolean = false;
	public auth: SupabaseAuthClient;

	private constructor({ supabaseClientConfig, useProxy }: DispatchClientOptions) {
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
		this.useProxy = !!useProxy;

		this.auth.onAuthStateChange((event, session) => {
			console.debug("DispatchClient auth state changed:", { event, session });
		});
	}

	static init(options: DispatchClientOptions) {
		if (!DispatchClient._instance) {
			DispatchClient._instance = new DispatchClient(options);
		} else {
			console.warn("DispatchClient already initialized. Returning existing instance.");
		}
		return DispatchClient._instance;
	}

	static getInstance() {
		if (!DispatchClient._instance) {
			throw new Error("DispatchClient not initialized. Call DispatchClient.init(...) first.");
		}
		return DispatchClient._instance;
	}

	get supabaseClient() {
		return this.supabase;
	}

	async getSafeSession() {
		const { data: { session } } = await this.supabase.auth.getSession();
		if (!session) return { session: null, user: null, error: "No session found" };

		const { data: { user }, error: userError } = await this.supabase.auth.getUser();
		if (userError) return { session, user: null, error: userError.message };

		return { session, user, error: null };
	}

	async login(email: string, password: string) {
		const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			console.error("Login error:", error.message);
			return { error: error.message };
		}
		return { error: undefined };
	}

	async officerLogin(badgeNumber: string, password: string) {
		const { data: emailData, error: emailError } = await this.supabase
			.rpc('get_officer_email_by_badge', { badge_number_param: badgeNumber });

		if (emailError || !emailData || emailData.length === 0) {
			return { error: "Invalid badge number" };
		}

		const email = emailData[0].email;
		const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

		if (error) return { error: error.message };

		const user = data.user;
		if (!user?.user_metadata?.role || user.user_metadata.role !== "officer") {
			await this.supabase.auth.signOut();
			return { error: "Access denied: User is not an officer" };
		}

		return { error: undefined };
	}

	fetchHotlines = async () => {
		return this.supabase.from('hotlines').select('*');
	}

	addHotline = async (payload: Database["public"]["Tables"]["hotlines"]["Insert"]) => {
		const validated = hotlineSchema.parse(payload);
		return this.supabase.from('hotlines').insert(validated).select();
	}

	updateHotline = async (id: string, payload: Partial<Database["public"]["Tables"]["hotlines"]["Update"]>) => {
		const validated = hotlineSchema.partial().parse(payload);
		return this.supabase.from('hotlines').update(validated).eq('id', id).select();
	}

	deleteHotline = async (id: string) => {
		return this.supabase.from('hotlines').delete().eq('id', id).select();
	}

	fetchProfiles = async () => {
		return this.supabase.rpc("get_profiles_with_emails")
	}

	/**
	 * Unified method to fetch detailed profiles with emails.
	 */
	fetchProfilesWithEmails = async () => {
		if (this.useProxy) {
			try {
				const res = await fetch("/api/profiles");
				const data = await res.json();
				if (res.ok) {
					return { data, error: null };
				}
				return { data: null, error: { message: (data as any).error || `API Error: ${res.status}` } };
			} catch (err: any) {
				return { data: null, error: { message: err.message } };
			}
		}
		return this.supabase.rpc("get_profiles_with_emails");
	}

	/**
	 * Unified method to update trust scores.
	 */
	updateTrustScore = async (userId: string, score: number) => {
		const validatedScore = Math.max(0, Math.min(3, score));

		if (this.useProxy) {
			try {
				const res = await fetch("/api/profiles", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId, trustScore: validatedScore })
				});
				const data = await res.json();
				if (res.ok) {
					return { data: [data], error: null };
				}
				return { data: null, error: { message: (data as any).error || `API Error: ${res.status}` } };
			} catch (err: any) {
				return { data: null, error: { message: err.message } };
			}
		}

		return this.supabase
			.from('profiles')
			.update({
				trust_score: validatedScore,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)
			.select();
	}

	incrementTrustScore = async (userId: string) => {
		const { data: profile } = await this.supabase.from('profiles').select('trust_score').eq('id', userId).single();
		if (!profile) return { error: "Profile not found" };

		const currentScore = profile.trust_score ?? 0;
		if (currentScore >= 3) return { data: profile, error: null };
		return this.updateTrustScore(userId, currentScore + 1);
	}

	decrementTrustScore = async (userId: string) => {
		const { data: profile } = await this.supabase.from('profiles').select('trust_score').eq('id', userId).single();
		if (!profile) return { error: "Profile not found" };

		const currentScore = profile.trust_score ?? 0;
		if (currentScore <= 0) return { data: profile, error: null };
		return this.updateTrustScore(userId, currentScore - 1);
	}

	getCategories = async () => {
		return this.supabase.from('categories').select('*');
	}

	fetchOfficers = async () => {
		return this.supabase.from('officers').select('*');
	}

	fetchEmergencyCalls = async () => {
		return this.supabase.from('emergency_calls').select('*');
	}

	updateEmergencyCall = async (id: string, payload: Partial<Database["public"]["Tables"]["emergency_calls"]["Update"]>) => {
		return this.supabase.from('emergency_calls').update(payload).eq('id', id).select();
	}

	deleteEmergencyCall = async (id: string) => {
		return this.supabase.from('emergency_calls').delete().eq('id', id).select();
	}

	addCategory = async (payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>) => {
		const validated = categorySchema.parse(payload);
		return this.supabase.from('categories').insert(validated).select();
	}

	updateCategory = async (id: string, payload: Partial<Database["public"]["Tables"]["categories"]["Update"]>) => {
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
				first_name,
				middle_name,
				last_name,
				rank,
				badge_number: badgeNumber,
				role: "officer"
			},
			email_confirm: true,
		})
	}

	archiveReport = async (report_id: number) => {
		return this.supabase.from('reports').update({ is_archived: true, archived_date: new Date().toISOString() }).eq('id', report_id).select();
	}

	officerArrived = async (reportId: number): Promise<{ data: Database["public"]["Tables"]["reports"]["Row"] | null; error: string | null }> => {
		const { data: report, error: fetchError } = await this.supabase.from('reports').select('arrived_at').eq('id', reportId).single();
		if (fetchError) return { data: null, error: fetchError.message };
		if (report?.arrived_at) return { data: null, error: "Arrival time already recorded for this report" };

		const { data, error } = await this.supabase.from('reports').update({ arrived_at: new Date().toISOString() }).eq('id', reportId).select().single();
		if (error) return { data: null, error: error.message };
		return { data, error: null };
	}

	fetchReports = async () => {
		return this.supabase.from('reports').select('*');
	}

	addReport = async (payload: Database["public"]["Tables"]["reports"]["Insert"]) => {
		const validated = reportSchema.parse(payload);
		return this.supabase.from('reports').insert(validated).select();
	}

	updateReport = async (id: number, payload: Partial<Database["public"]["Tables"]["reports"]["Update"]>) => {
		const validated = reportSchema.partial().parse(payload);
		return this.supabase.from('reports').update(validated).eq('id', id).select();
	}

	deleteReport = async (id: number) => {
		return this.supabase.from('reports').delete().eq('id', id).select();
	}

	getReportInfo = async (id: number) => {
		return this.supabase.from('reports').select('*').eq('id', id).single();
	}

	addWitnessToReport = async (reportId: number, userId: string, statement?: string | null) => {
		const newWitness = { user_id: userId, statement: statement ?? null };
		return this.supabase.rpc('append_witness', { report_id: reportId, new_witness: newWitness });
	}

	assignToReport = async (officerId: string, reportId: number) => {
		return this.supabase.from('officers').update({ assigned_report_id: reportId }).eq('id', officerId).select();
	}

	updateOfficer = async (id: string, payload: Partial<Database["public"]["Tables"]["officers"]["Update"]>) => {
		return this.supabase.from('officers').update(payload).eq('id', id).select();
	}

	deleteOfficer = async (id: string) => {
		const { data: deletedRows, error: deleteError } = await this.supabase.from('officers').delete().eq('id', id).select();
		if (deleteError) return { deleted: null, authDeleted: false, error: deleteError.message };

		const { error: authError } = await this.supabase.auth.admin.deleteUser(id);
		if (authError) return { deleted: deletedRows, authDeleted: false, error: authError.message };

		return { deleted: deletedRows, authDeleted: true, error: null };
	}

	fetchBarangays = async () => {
		return this.supabase.from('barangays').select('*');
	}

	addBarangay = async (payload: Database["public"]["Tables"]["barangays"]["Insert"]) => {
		const validated = barangaySchema.parse(payload);
		return this.supabase.from('barangays').insert(validated).select();
	}

	updateBarangay = async (id: string, payload: Partial<Database["public"]["Tables"]["barangays"]["Update"]>) => {
		const validated = barangaySchema.partial().parse(payload);
		return this.supabase.from('barangays').update(validated).eq('id', id).select();
	}

	deleteBarangay = async (id: string) => {
		return this.supabase.from('barangays').delete().eq('id', id).select();
	}

	notifyUser = async (userId: string, title: string | null, body: string) => {
		const notification = { user_id: userId, title, body };
		return this.supabase.from('notifications').insert(notification).select();
	}

	fetchLostAndFound = async () => {
		return this.supabase.from('lost_and_found').select('*');
	}

	addLostAndFound = async (payload: Database["public"]["Tables"]["lost_and_found"]["Insert"]) => {
		const validated = lostAndFoundSchema.parse(payload);
		return this.supabase.from('lost_and_found').insert(validated).select();
	}

	updateLostAndFound = async (id: number, payload: Partial<Database["public"]["Tables"]["lost_and_found"]["Update"]>) => {
		const validated = lostAndFoundSchema.partial().parse(payload);
		return this.supabase.from('lost_and_found').update(validated).eq('id', id).select();
	}

	deleteLostAndFound = async (id: number) => {
		return this.supabase.from('lost_and_found').delete().eq('id', id).select();
	}

	getResolvedReports = async (officerId: string) => {
		return this.supabase.rpc('get_resolved_reports', { officer_id_param: officerId });
	}

	idExists = async (idCardNumber: string): Promise<{ exists: boolean; error: string | null }> => {
		const { data, error } = await this.supabase.rpc('id_exists', { id_card_number_param: idCardNumber });
		if (error) return { exists: false, error: error.message };
		const exists = data?.[0]?.exists ?? false;
		return { exists, error: null };
	}

	emailExists = async (email: string): Promise<{ exists: boolean; error: string | null }> => {
		const { data, error } = await this.supabase.rpc('email_exists', { email_param: email });
		if (error) return { exists: false, error: error.message };
		const exists = data?.[0]?.exists ?? false;
		return { exists, error: null };
	}
}

export function initDispatchClient(options: DispatchClientOptions) {
	return DispatchClient.init(options);
}

export function getDispatchClient() {
	return DispatchClient.getInstance();
}

export async function isEmailRegistered(email: string) {
	const { exists, error } = await DispatchClient.getInstance().emailExists(email);
	if (error) throw new Error(error);
	return exists;
}

export * from "./id";
export * from "./types";
export * from "./react/providers/auth-provider";
export * from "./react/providers/officer-auth-provider";
export * from "./react/hooks/useHotlines";
export * from "./react/hooks/useCategories";
export * from "./react/hooks/useOfficers";
export * from "./react/hooks/useProfiles";
export * from "./react/hooks/useProfile";
export * from "./react/hooks/useTrustScores";
export * from "./react/hooks/useReports";
export * from "./react/hooks/useRealtimeReports";
export * from "./react/hooks/useBarangays";
export * from "./react/hooks/useLostAndFound";
export * from "./react/hooks/useNotifications";
export * from "./react/hooks/useEmergencies";
