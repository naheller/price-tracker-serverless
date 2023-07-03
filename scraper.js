const cheerio = require("cheerio");
const { getAsinFromAmazonUrl, getAmazonUrlFromAsin } = require("./utils");

const getHtmlFromUrl = async (url) => {
  try {
    const response = await fetch(url);
    const htmlBody = await response.text();

    return htmlBody;
  } catch (error) {
    throw error;
  }
};

const getScrapedDataFromUrl = async (url) => {
  try {
    const htmlText = await getHtmlFromUrl(url);
    const $ = cheerio.load(htmlText, null, false);

    const productTitle = $("#productTitle").text().trim();
    const kindlePriceString = $("#kindle-price").text().trim();
    const kindlePriceDecimal = parseFloat(kindlePriceString.replace("$", ""));

    return {
      title: productTitle,
      price: kindlePriceDecimal,
    };
  } catch (error) {
    throw error;
  }
};

const getProductDetailsFromUrl = async (url) => {
  const asin = getAsinFromAmazonUrl(url);
  const cleanUrl = getAmazonUrlFromAsin(asin);

  try {
    const data = await getScrapedDataFromUrl(cleanUrl);
    const result = {
      productId: asin,
      ...data,
    };
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getProductDetailsFromUrl,
  getHtmlFromUrl,
  getScrapedDataFromUrl,
};
