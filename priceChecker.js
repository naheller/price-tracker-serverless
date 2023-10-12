const { sendAlert } = require("./mailer");
const { getAmazonUrlFromAsin } = require("./utils");
const { getProductDetailsCamel } = require("./scraper");
const { getAllProducts, updateProduct } = require("./db");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const checkPricesAndAlert = async () => {
  let products = [];
  let alertedProducts = [];

  try {
    const { Items } = await getAllProducts();
    if (Items) {
      products = Items;
    }
  } catch (error) {
    console.log(error);
    return;
  }

  for (const existingProduct of products) {
    const cleanUrl = getAmazonUrlFromAsin(existingProduct.productId);
    let newProductDetails = {};

    try {
      newProductDetails = await getProductDetailsCamel(cleanUrl);
    } catch (error) {
      console.log(error);
      break;
    }

    const newPrice = newProductDetails?.price;
    const oldPrice = existingProduct?.priceCurrent;
    const maxPrice = existingProduct?.priceMax;

    if (newPrice < maxPrice && newPrice < oldPrice) {
      alertedProducts.push({
        title: existingProduct.title,
        url: cleanUrl,
        newPrice,
        oldPrice,
      });
    }

    if (newPrice !== oldPrice) {
      try {
        await updateProduct(newProductDetails);
      } catch (error) {
        console.log(error);
        break;
      }
    }

    await timer(100);
  }

  if (alertedProducts.length) {
    try {
      await sendAlert(alertedProducts);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { checkPricesAndAlert };
