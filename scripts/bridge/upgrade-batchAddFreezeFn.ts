import { upgrade as realmUpgrade } from "../realm/upgrades/upgrade-addFreezeFn";
import { upgrade as installationUpgrade } from "../installation/upgrades/upgrade-addFreezeFn";
import { upgrade as tileUpgrade } from "../tile/upgrades/upgrade-addFreezeFn";

async function upgrade() {
  await realmUpgrade();
  // await installationUpgrade();
  // await tileUpgrade();
}

if (require.main === module) {
  upgrade();
}
