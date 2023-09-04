const { sendAlert } = require("./mailer");
const { getAmazonUrlFromAsin } = require("./utils");
const { getProductDetailsCamel } = require("./scraper");
const { getAllProducts, updateProduct } = require("./db");

const checkPricesAndAlert = async () => {
  let products = [];
  let alertedProducts = [];

  try {
    const { Items } = await getAllProducts();
    if (Items) {
      products = Items;
    }
  } catch (error) {
    throw error;
  }

  for (const existingProduct of products) {
    const cleanUrl = getAmazonUrlFromAsin(existingProduct.productId);
    const newProductDetails = await getProductDetailsCamel(cleanUrl);

    if (newProductDetails?.price < existingProduct.priceMax) {
      alertedProducts.push({
        title: existingProduct.title,
        url: cleanUrl,
        price: newProductDetails.price,
      });
    }

    if (newProductDetails?.price !== existingProduct.priceCurrent) {
      try {
        await updateProduct(newProductDetails);
      } catch (error) {
        throw error;
      }
    }
  }

  if (alertedProducts.length) {
    sendAlert(alertedProducts);
  }
};

module.exports = { checkPricesAndAlert };
