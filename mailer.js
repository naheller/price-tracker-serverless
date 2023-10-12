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
    logger: true,
    debug: true,
  });

  const newPrice = parseFloat(product.newPrice).toFixed(2);
  const oldPrice = parseFloat(product.oldPrice).toFixed(2);

  const mailBodyHtml = `
    <p>Price alert!</p>
    <ul>
      ${products
        .map(
          (product) =>
            `<li><b style="color:red">$${newPrice}</b> <s>$${oldPrice}</s> - <a href="${product.url}">${product.title}</a></li>`
        )
        .join("")}
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
  return true;
};

module.exports = { sendAlert };
