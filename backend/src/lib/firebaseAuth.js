import jwt from "jsonwebtoken";

/**
 * Verifies a Firebase ID token by manually checking the JWT signature
 * against Google's public keys. This bypasses API key restrictions.
 */
export async function verifyFirebaseToken(idToken, projectId) {
    try {
        // Fetch Google's Public Keys
        const keysRes = await fetch(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
        );
        const publicKeys = await keysRes.json();

        // Decode token header to find 'kid' (key ID)
        const decodedWrapper = jwt.decode(idToken, { complete: true });
        if (!decodedWrapper || !decodedWrapper.header.kid) {
            throw new Error("Invalid token format - missing kid");
        }

        const kid = decodedWrapper.header.kid;
        const publicKey = publicKeys[kid];

        if (!publicKey) {
            throw new Error(`Public key not found for kid: ${kid}`);
        }

        // Verify JWT signature and claims
        const decodedClaims = jwt.verify(idToken, publicKey, {
            algorithms: ["RS256"],
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`,
        });

        return decodedClaims;
    } catch (error) {
        console.error("Firebase token verification failed:", error.message);
        throw error;
    }
}
