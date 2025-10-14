type NationalIdData = {
	data: {
		best_finger_captured: string[],
		birth_date: string,
		date_issued: string,
		first_name: string,
		last_name: string,
		middle_name: string,
		pcn: string,
		place_of_birth: string,
		sex: string,
		suffix?: string,
	},
	meta: {
		qr_type: string
	}
}

export async function verifyNationalIdQR(data: string): Promise<boolean> {

	const value = {
		value: data
	}

	const response = await fetch("https://app-ws.everify.gov.ph/api/pub/qr/check", {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9",
			"accepts": "application/json",
			"content-type": "application/json",
			"priority": "u=1, i",
			"sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
			"sec-ch-ua-mobile": "?1",
			"sec-ch-ua-platform": "\"Android\"",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-site"
		},
		"referrer": "https://everify.gov.ph/",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": JSON.stringify(value),
		"method": "POST",
		"mode": "cors",
		"credentials": "omit"
	});

	if (response.ok) {
		const json = await response.json() as NationalIdData;

		if (json.meta.qr_type && json.data.pcn) {
			return true
		}
	}

	return false
}
