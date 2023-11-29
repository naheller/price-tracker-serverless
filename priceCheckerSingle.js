const { sendAlert, sendErrorAlertSingle } = require("./mailer");
const { getAmazonUrlFromAsin } = require("./utils");
const { getProductDetailsCamel } = require("./scraper");
const { getAllProducts, updateProduct } = require("./db");

const checkPriceAndAlert = async () => {
  let leastRecentlyReadProduct = null;
  let alertedProduct = null;

  try {
    const { Items } = await getAllProducts();
    if (Items) {
      const productsByReadDateAsc = Items.sort((a, b) => {
        const dateA = new Date(a.dateRead);
        const dateB = new Date(b.dateRead);
        return dateA.getTime() - dateB.getTime();
      });

      leastRecentlyReadProduct = productsByReadDateAsc[0];
    }
  } catch (error) {
    console.log(error);
    return;
  }

  if (leastRecentlyReadProduct) {
    console.log("checking product", leastRecentlyReadProduct);

    const cleanUrl = getAmazonUrlFromAsin(leastRecentlyReadProduct.productId);
    let newProductDetails = {};

    try {
      newProductDetails = await getProductDetailsCamel(cleanUrl);
    } catch (error) {
      console.log(error);
      sendErrorAlertSingle(leastRecentlyReadProduct.title);
      return;
    }

    console.log("newProductDetails", newProductDetails);

    const newPrice = newProductDetails?.price;
    const oldPrice = leastRecentlyReadProduct?.priceCurrent;
    const maxPrice = leastRecentlyReadProduct?.priceMax;

    if (newPrice < maxPrice && newPrice < oldPrice) {
      alertedProduct = {
        title: leastRecentlyReadProduct.title,
        url: cleanUrl,
        newPrice,
        oldPrice,
      };
    }

    console.log("alertedProduct", alertedProduct);
    const shouldUpdatePrice = newPrice !== oldPrice;

    try {
      await updateProduct(newProductDetails, shouldUpdatePrice);
    } catch (error) {
      console.log(error);
      return;
    }
  }

  if (alertedProduct) {
    try {
      await sendAlert([alertedProduct]);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { checkPriceAndAlert };
