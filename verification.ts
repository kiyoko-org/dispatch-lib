import type {
	VerificationRequest,
} from "./types";

export const VERIFICATION_DOCS_BUCKET = "verification-docs";
export const VERIFICATION_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const VERIFICATION_ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"application/pdf",
] as const;

export type VerificationMimeType = (typeof VERIFICATION_ALLOWED_MIME_TYPES)[number];
export type VerificationDocumentSide = "front" | "back";
export type VerificationState = "verified" | "pending" | "rejected" | "unverified";
export type VerificationUploadBody =
	| ArrayBuffer
	| ArrayBufferView
	| Blob
	| File
	| FormData
	| ReadableStream<Uint8Array>
	| URLSearchParams
	| string;

export type VerificationFileValidationInput = {
	mimeType: string;
	sizeBytes: number;
};

export type VerificationFileValidationResult = {
	isValid: boolean;
	error: string | null;
};

export type BuildVerificationStoragePathOptions = {
	profileId: string;
	requestId: string;
	side: VerificationDocumentSide;
	fileExtension: string;
};

export type DeriveVerificationStateInput = {
	isVerified: boolean | null | undefined;
	requests: VerificationRequest[];
};

export type DeriveVerificationStateResult = {
	state: VerificationState;
	latestRequest: VerificationRequest | null;
};

const verificationMimeTypeToExtension: Record<VerificationMimeType, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"application/pdf": "pdf",
};

export function isAllowedVerificationMimeType(mimeType: string): mimeType is VerificationMimeType {
	return VERIFICATION_ALLOWED_MIME_TYPES.includes(mimeType as VerificationMimeType);
}

export function getVerificationFileExtension(mimeType: string): string {
	if (!isAllowedVerificationMimeType(mimeType)) {
		throw new Error(`Unsupported verification mime type: ${mimeType}`);
	}

	return verificationMimeTypeToExtension[mimeType];
}

export function validateVerificationFile({
	mimeType,
	sizeBytes,
}: VerificationFileValidationInput): VerificationFileValidationResult {
	if (!mimeType) {
		return { isValid: false, error: "mimeType is required" };
	}

	if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
		return { isValid: false, error: "sizeBytes must be greater than 0" };
	}

	if (!isAllowedVerificationMimeType(mimeType)) {
		return {
			isValid: false,
			error: `Unsupported verification mime type: ${mimeType}`,
		};
	}

	if (sizeBytes > VERIFICATION_MAX_FILE_SIZE_BYTES) {
		return {
			isValid: false,
			error: `Verification file exceeds ${VERIFICATION_MAX_FILE_SIZE_BYTES} bytes`,
		};
	}

	return { isValid: true, error: null };
}

export function buildVerificationStoragePath({
	profileId,
	requestId,
	side,
	fileExtension,
}: BuildVerificationStoragePathOptions): string {
	if (!profileId) throw new Error("profileId is required");
	if (!requestId) throw new Error("requestId is required");
	if (!fileExtension) throw new Error("fileExtension is required");

	const normalizedExtension = fileExtension.replace(/^\.+/, "").toLowerCase();
	if (!normalizedExtension) {
		throw new Error("fileExtension must contain at least one non-dot character");
	}

	return `${profileId}/${requestId}/${side}.${normalizedExtension}`;
}

export function getLatestVerificationRequest(
	requests: VerificationRequest[],
): VerificationRequest | null {
	if (requests.length === 0) return null;

	return [...requests].sort((left, right) => {
		const leftTime = Date.parse(left.created_at);
		const rightTime = Date.parse(right.created_at);
		if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0;
		return rightTime - leftTime;
	})[0] ?? null;
}

export function deriveVerificationState({
	isVerified,
	requests,
}: DeriveVerificationStateInput): DeriveVerificationStateResult {
	const latestRequest = getLatestVerificationRequest(requests);
	if (isVerified) {
		return { state: "verified", latestRequest };
	}

	if (!latestRequest) {
		return { state: "unverified", latestRequest: null };
	}

	if (latestRequest.status === "pending") {
		return { state: "pending", latestRequest };
	}

	if (latestRequest.status === "rejected") {
		return { state: "rejected", latestRequest };
	}

	return { state: "unverified", latestRequest };
}
