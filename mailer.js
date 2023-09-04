require("dotenv").config();
const nodemailer = require("nodemailer");

const {
  MAILER_HOST,
  MAILER_PORT,
  MAILER_USER,
  MAILER_PASS,
  MAILER_FROM,
  MAILER_TO,
} = process.env;

const sendAlert = async (products) => {
  const transporter = nodemailer.createTransport({
    host: MAILER_HOST,
    port: parseInt(MAILER_PORT),
    secure: true,
    auth: {
      user: MAILER_USER,
      pass: MAILER_PASS,
    },
  });

  const mailBodyHtml = `
    <p>Price alert!</p>
    <ul>
      ${products.map(
        (product) =>
          `<li>$${product.price} - <a href="${product.url}">${product.title}</a></li>`
      )}
    </ul>
  `;

  const info = await transporter.sendMail({
    from: `"Price Tracker" <${MAILER_FROM}>`,
    to: MAILER_TO,
    subject: "Price Tracker Alert",
    text: mailBodyHtml,
    html: mailBodyHtml,
  });

  console.log("Message sent: %s", info.messageId);
};

module.exports = { sendAlert };
