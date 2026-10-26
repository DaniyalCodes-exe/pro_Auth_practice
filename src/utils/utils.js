function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpHtml(otp) {
  return `
    <html>
      <body>
        <h1>Your OTP is: ${otp}</h1>
        <p>Please use this OTP to verify your account.</p>
      </body>
    </html>
  `;
}

module.exports = {
  generateOtp,
  getOtpHtml,
};
