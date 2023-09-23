module.exports["without-ext"] = function (str) {
  const step1 = str.replace(".md", "");
  const step2 = step1.replace("RealmDiamond/facets/", "");
  const step3 = step2.replace("TileDiamond/facets/", "");
  const step4 = step3.replace("InstallationDiamond/facets/", "");
};
