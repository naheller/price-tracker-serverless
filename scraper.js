const axios = require("axios");
const cheerio = require("cheerio");
const {
  getAsinFromAmazonUrl,
  getAmazonUrlFromAsin,
  getCamelUrlFromAsin,
} = require("./utils");

const getProductDetailsAmazon = async (url) => {
  const asin = getAsinFromAmazonUrl(url);
  const cleanUrl = getAmazonUrlFromAsin(asin);

  let productDetails = {};

  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
  };

  const config = {
    responseType: "text",
    headers,
  };

  await axios.get(cleanUrl, { config }).then(({ data }) => {
    const $ = cheerio.load(data, null, false);

    const productTitle = $("#productTitle").text().trim();
    const kindlePriceString = $("#kindle-price").text().trim();
    const kindlePriceDecimal =
      parseFloat(kindlePriceString.replace("$", "")) || 0;

    productDetails = {
      productId: asin,
      title: productTitle,
      price: kindlePriceDecimal,
    };
  });

  return productDetails;
};

const getProductDetailsCamel = async (url) => {
  let asin, cleanUrl;

  try {
    asin = getAsinFromAmazonUrl(url);
    cleanUrl = getCamelUrlFromAsin(asin);
  } catch (error) {
    throw Error("Unable to build Camel URL");
  }

  let productDetails = {};

  const headers = {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
  };

  const config = {
    responseType: "text",
    headers,
  };

  try {
    await axios.get(cleanUrl, { config }).then(({ data }) => {
      const $ = cheerio.load(data);

      const productTitle = $("meta[property='og:title']").attr("content");
      const productImgUrl = $("#pimg").attr("src") || "";
      const priceString = $(
        "#content span[class='stat green'] > span[class='green']"
      )
        .text()
        .trim();

      const kindlePriceDecimal = priceString?.startsWith("$")
        ? parseFloat(priceString.replace("$", ""))
        : -1;

      productDetails = {
        productId: asin,
        title: productTitle,
        price: kindlePriceDecimal,
        imageUrl: productImgUrl,
      };
    });
  } catch (error) {
    throw error;
  }

  if (productDetails.price === -1) {
    throw Error("Unable to find product price");
  }

  return productDetails;
};

module.exports = { getProductDetailsAmazon, getProductDetailsCamel };
