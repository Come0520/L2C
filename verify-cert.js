const fs = require('fs');
const tls = require('tls');
const crypto = require('crypto');

try {
    const pem = fs.readFileSync('./ssl/www.l2c.asia.pem', 'utf8');
    console.log("Certificate found, parsing...");

    const cert = new crypto.X509Certificate(pem);
    console.log("--- Certificate Details ---");
    console.log("Subject:", cert.subject);
    console.log("Issuer:", cert.issuer);
    console.log("Valid From:", cert.validFrom);
    console.log("Valid To:", cert.validTo);
    console.log("Subject Alt Names:", cert.subjectAltName);
    console.log("Fingerprint:", cert.fingerprint);
    console.log("---------------------------");

} catch (err) {
    console.error("Error reading or parsing certificate:", err.message);
}
