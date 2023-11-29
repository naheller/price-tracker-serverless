const amazonAsinRegex = /(?:[/dp/]|$)([a-zA-Z0-9]{10})/;

const getAsinFromAmazonUrl = (amazonUrl = "") => {
  const matchArray = amazonUrl.match(amazonAsinRegex);
  return matchArray.length ? matchArray[1] : "";
};

const getAmazonUrlFromAsin = (asin) => `https://www.amazon.com/dp/${asin}`;

const getCamelUrlFromAsin = (asin) =>
  `https://camelcamelcamel.com/product/${asin}`;

module.exports = {
  amazonAsinRegex,
  getAsinFromAmazonUrl,
  getAmazonUrlFromAsin,
  getCamelUrlFromAsin,
};
