const amazonAsinRegex = /(?:[/dp/]|$)([A-Z0-9]{10})/;

const getAsinFromAmazonUrl = (amazonUrl) => {
  return amazonUrl.match(amazonAsinRegex)[1] || "";
};

const getAmazonUrlFromAsin = (asin) => `https://www.amazon.com/dp/${asin}`;

module.exports = {
  amazonAsinRegex,
  getAsinFromAmazonUrl,
  getAmazonUrlFromAsin,
};
