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

const sendAlert = async (products) => {
  const mailBodyHtml = `
  ${products
    .map((product) => {
      const newPrice = parseFloat(product.newPrice).toFixed(2);
      const oldPrice = parseFloat(product.oldPrice).toFixed(2);
      return `<p><b style="color:red">$${newPrice}</b> <s>$${oldPrice}</s> - <a href="${product.url}">${product.title}</a></p>`;
    })
    .join("")}
    <a href="https://app.serverless.com/naheller/apps/price-tracker/price-tracker/dev/us-east-1/overview">
      View serverless dashboard
    </a>
  `;

  const info = await transporter.sendMail({
    from: `"Price Tracker" <${MAILER_FROM}>`,
    to: MAILER_TO,
    subject: "Price Alert",
    text: mailBodyHtml,
    html: mailBodyHtml,
  });

  console.log("Message sent: %s", info.messageId);
  return true;
};

const sendErrorAlert = async () => {
  const mailBodyHtml = `
    <h1>Error alert!</h1>
    <p>All products errored during a cron that ran at approximately: ${new Date().toLocaleString()}</p>
    <a href="https://app.serverless.com/naheller/apps/price-tracker/price-tracker/dev/us-east-1/overview">
      View serverless dashboard
    </a>
  `;

  const info = await transporter.sendMail({
    from: `"Price Tracker" <${MAILER_FROM}>`,
    to: MAILER_TO,
    subject: "Error Alert",
    text: mailBodyHtml,
    html: mailBodyHtml,
  });

  console.log("Message sent: %s", info.messageId);
  return true;
};

module.exports = { sendAlert, sendErrorAlert };
