const axios = require("axios");
const cheerio = require("cheerio");
const { getAsinFromAmazonUrl, getAmazonUrlFromAsin } = require("./utils");

const getProductDetails = async (url) => {
  const asin = getAsinFromAmazonUrl(url);
  const cleanUrl = getAmazonUrlFromAsin(asin);

  let productDetails = {};
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  };
  const config = {
    responseType: "text",
    headers,
  };

  await axios.get(cleanUrl, { config }).then(({ data }) => {
    console.log(data);
    const $ = cheerio.load(data, null, false);
    const productTitle = $("#productTitle").text().trim();
    const kindlePriceString = $("#kindle-price").text().trim();
    const kindlePriceDecimal =
      parseFloat(kindlePriceString.replace("$", "")) || -1;

    productDetails = {
      productId: asin,
      title: productTitle,
      price: kindlePriceDecimal,
    };
  });

  return productDetails;
};

module.exports = { getProductDetails };
