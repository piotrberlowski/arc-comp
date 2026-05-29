const QR_OPTIONS = {
    errorCorrectionLevel: "M" as const,
    margin: 1,
    width: 280,
}

function buildExternalQrImageUrl(text: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(text)}`
}

export async function generateQrDataUrl(text: string): Promise<string> {
    try {
        const QRCode = (await import("qrcode")).default
        return QRCode.toDataURL(text, QR_OPTIONS)
    } catch {
        return buildExternalQrImageUrl(text)
    }
}
