const { getProductDetailsCamel } = require("./scraper");

const test = async () => {
  const url =
    "https://www.amazon.com/gp/product/B0BTTVZGSQ?notRedirectToSDP=1&ref_=dbs_mng_calw_1&storeType=ebooks";
  const productDetails = await getProductDetailsCamel(url);
  console.log(productDetails);
};

test();
